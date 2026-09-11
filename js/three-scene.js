/* ==========================================================================
   three-scene.js — Three.js background universe + interactive hero tech core
   Vanilla, CDN-global THREE (r128). Progressive enhancement: if WebGL or the
   CDN is unavailable the site falls back to pure CSS visuals.
   Modules: MP3D.initBackground(canvas) + MP3D.initHero(canvas, telemetry)
   ========================================================================== */
(function () {
  'use strict';

  var MP3D = (window.MP3D = window.MP3D || {});

  /* ---------- Environment detection ---------- */
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function isLowPower() {
    var small = Math.min(window.innerWidth, window.innerHeight) < 620;
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    var saveData = navigator.connection && navigator.connection.saveData;
    return small || cores <= 2 || mem <= 2 || !!saveData;
  }
  function webglAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  MP3D.env = {
    reducedMotion: prefersReducedMotion(),
    lowPower: isLowPower(),
    webgl: webglAvailable(),
    hasTHREE: typeof window.THREE !== 'undefined'
  };
  if (MP3D.env.lowPower) document.body.classList.add('low-power');

  function capDPR() {
    var dpr = window.devicePixelRatio || 1;
    return Math.min(dpr, MP3D.env.lowPower ? 1.25 : 2);
  }

  /* Shared pointer state with damping */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', function (e) {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  function dampPointer(factor) {
    pointer.x += (pointer.tx - pointer.x) * factor;
    pointer.y += (pointer.ty - pointer.y) * factor;
  }

  /* ========================================================================
     BACKGROUND — particle universe + perspective grid floor
     ======================================================================== */
  MP3D.bgPalette = function (t) {
    if (t === 'light') {
      return { clear: 0xe9eff6, fogDensity: 0.03, gridTint: 0x87a0bb, gridOp: 0.5,
               grid2Tint: 0x9d8bd2, grid2Op: 0.3, dust: 0x0a8fa8, motes: 0x7c3aed };
    }
    return { clear: 0x05070a, fogDensity: 0.028, gridTint: 0xffffff, gridOp: 0.32,
             grid2Tint: 0xffffff, grid2Op: 0.1, dust: 0x00d5ff, motes: 0x9a55ff };
  };

  /* Live theme switch for the background universe (safe before init). */
  MP3D.setTheme = function (t) {
    MP3D._theme = (t === 'light') ? 'light' : 'dark';
    var bg = MP3D._bg;
    if (!bg) return;
    var pal = MP3D.bgPalette(MP3D._theme);
    bg.renderer.setClearColor(pal.clear, 1);
    bg.scene.fog.color.set(pal.clear);
    bg.scene.fog.density = pal.fogDensity;
    bg.grid.material.color.set(pal.gridTint);
    bg.grid.material.opacity = pal.gridOp;
    bg.grid2.material.color.set(pal.grid2Tint);
    bg.grid2.material.opacity = pal.grid2Op;
    bg.dust.material.color.set(pal.dust);
    bg.motes.material.color.set(pal.motes);
  };

  MP3D.initBackground = function (canvas) {
    if (!canvas) return null;
    if (!MP3D.env.hasTHREE || !MP3D.env.webgl) { canvas.style.display = 'none'; return null; }

    var THREE = window.THREE;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: !MP3D.env.lowPower, powerPreference: 'low-power' });
    } catch (e) { canvas.style.display = 'none'; return null; }
    renderer.setPixelRatio(capDPR());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x05070a, 1);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070a, 0.028);

    var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 220);
    camera.position.set(0, 2.4, 15);

    /* -- Grid floor (single draw call) -- */
    var grid = new THREE.GridHelper(160, 64, 0x00f0ff, 0x2b1a5e);
    grid.position.y = -3.4;
    grid.material.transparent = true;
    grid.material.opacity = 0.32;
    scene.add(grid);

    var grid2 = new THREE.GridHelper(160, 16, 0x8a2be2, 0x8a2be2);
    grid2.position.y = -3.38;
    grid2.material.transparent = true;
    grid2.material.opacity = 0.1;
    scene.add(grid2);

    /* -- Particle layers (two draw calls) -- */
    function makeParticles(count, spread, color, size, opacity) {
      var geo = new THREE.BufferGeometry();
      var pos = new Float32Array(count * 3);
      var spd = new Float32Array(count);
      for (var i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread.x;
        pos[i * 3 + 1] = Math.random() * spread.y - 3;
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
        spd[i] = 0.15 + Math.random() * 0.85;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var mat = new THREE.PointsMaterial({
        color: color, size: size, transparent: true, opacity: opacity,
        sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      var pts = new THREE.Points(geo, mat);
      pts.userData.speeds = spd;
      return pts;
    }

    var COUNT = MP3D.env.lowPower ? 320 : 850;
    var dust = makeParticles(COUNT, { x: 90, y: 26, z: 70 }, pal.dust, 0.09, 0.75);
    var motes = makeParticles(MP3D.env.lowPower ? 90 : 220, { x: 70, y: 20, z: 55 }, pal.motes, 0.16, 0.6);
    MP3D._bg = { renderer: renderer, scene: scene, grid: grid, grid2: grid2, dust: dust, motes: motes };
    scene.add(dust);
    scene.add(motes);

    /* -- Distant glow sprites (cheap planes, additive) -- */
    function glowPlane(color, x, y, z, s) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 128;
      var ctx = cv.getContext('2d');
      var g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      var tex = new THREE.CanvasTexture(cv);
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(s, s),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      m.position.set(x, y, z);
      return m;
    }
    scene.add(glowPlane('rgba(0,240,255,0.55)', -16, 3, -28, 26));
    scene.add(glowPlane('rgba(138,43,226,0.55)', 17, 5, -34, 32));
    scene.add(glowPlane('rgba(0,255,135,0.30)', 2, -1, -42, 40));

    /* -- Scroll linkage -- */
    var scrollY = 0, scrollTarget = 0;
    window.addEventListener('scroll', function () {
      scrollTarget = window.scrollY || document.documentElement.scrollTop || 0;
    }, { passive: true });

    /* -- Resize -- */
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(capDPR());
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    /* -- Animate -- */
    var clock = new THREE.Clock();
    var running = true;
    var cell = 160 / 64;

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) { clock.getDelta(); requestAnimationFrame(tick); }
    });

    function drift(points, t, amp, speed) {
      var p = points.geometry.attributes.position;
      var arr = p.array, sp = points.userData.speeds;
      var n = sp.length;
      /* Move only Y to keep it cheap; wrap within band */
      for (var i = 0; i < n; i++) {
        arr[i * 3 + 1] += Math.sin(t * speed + i) * 0.0012 * sp[i] + 0.0022 * sp[i];
        if (arr[i * 3 + 1] > 22) arr[i * 3 + 1] = -3;
      }
      p.needsUpdate = true;
      points.rotation.y = Math.sin(t * 0.02) * 0.06;
    }

    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);
      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;

      dampPointer(0.04);
      scrollY += (scrollTarget - scrollY) * 0.06;

      /* Grid crawl + scroll-reactive glide */
      var crawl = (t * 0.55 + scrollY * 0.012) % cell;
      grid.position.z = crawl;
      grid2.position.z = (t * 0.22 + scrollY * 0.006) % (160 / 16);

      if (!MP3D.env.lowPower || (t * 60 | 0) % 2 === 0) {
        drift(dust, t, 1, 0.6);
        drift(motes, t, 1, 0.35);
      }

      /* Camera: gentle mouse parallax + scroll descent */
      camera.position.x = pointer.x * 1.1;
      camera.position.y = 2.4 - scrollY * 0.0016 + pointer.y * 0.55;
      camera.lookAt(0, 0.4 - scrollY * 0.0009, -10);

      renderer.render(scene, camera);
    }

    if (MP3D.env.reducedMotion) {
      renderer.render(scene, camera); /* single static frame */
      window.addEventListener('scroll', function () {
        grid.position.z = (window.scrollY * 0.012) % cell;
        renderer.render(scene, camera);
      }, { passive: true });
    } else {
      tick();
    }

    return { renderer: renderer, scene: scene, camera: camera };
  };

  /* ========================================================================
     HERO CORE — floating tech core: chip body, wire shells, orbit rings
     ======================================================================== */
  MP3D.initHero = function (canvas, opts) {
    opts = opts || {};
    var stage = canvas ? canvas.parentElement : null;
    function fallback() { if (stage) stage.classList.add('no-webgl'); }

    if (!canvas || !MP3D.env.hasTHREE || !MP3D.env.webgl) { fallback(); return null; }

    var THREE = window.THREE;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: !MP3D.env.lowPower, powerPreference: 'high-performance' });
    } catch (e) { fallback(); return null; }

    var W = 0, H = 0, visible = true, inView = true;
    function size() {
      var r = stage.getBoundingClientRect();
      W = Math.max(280, r.width); H = Math.max(280, r.height);
      renderer.setPixelRatio(capDPR());
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0.4, 8.2);

    /* Lights */
    scene.add(new THREE.AmbientLight(0x8fb8ff, 0.55));
    var keyCyan = new THREE.PointLight(0x00f0ff, 1.6, 30); keyCyan.position.set(4, 3, 5); scene.add(keyCyan);
    var rimViolet = new THREE.PointLight(0x8a2be2, 1.8, 30); rimViolet.position.set(-5, -2, 3); scene.add(rimViolet);
    var underGlow = new THREE.PointLight(0x00ff87, 0.7, 20); underGlow.position.set(0, -4, 2); scene.add(underGlow);

    var rig = new THREE.Group();   /* mouse-reactive rig */
    var core = new THREE.Group();  /* self-spinning core */
    rig.add(core); scene.add(rig);

    /* -- Chip body: central octahedron die + PCB slab -- */
    var die = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.85, 0),
      new THREE.MeshStandardMaterial({ color: 0x0a2530, metalness: 0.85, roughness: 0.3, emissive: 0x00e5ff, emissiveIntensity: 0.55, flatShading: true })
    );
    core.add(die);

    var pcb = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.1, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x0d1b2a, metalness: 0.6, roughness: 0.5, emissive: 0x062a33, emissiveIntensity: 0.5 })
    );
    core.add(pcb);

    /* PCB traces: thin emissive strips */
    var traceMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (var ti = 0; ti < 8; ti++) {
      var trace = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.115, 0.62), traceMat);
      var ang = (ti / 8) * Math.PI * 2;
      trace.position.set(Math.cos(ang) * 0.62, 0, Math.sin(ang) * 0.62);
      trace.rotation.y = -ang;
      core.add(trace);
    }
    /* Pins around the slab */
    var pinGeo = new THREE.BoxGeometry(0.09, 0.09, 0.28);
    var pinMat = new THREE.MeshStandardMaterial({ color: 0xbfe9ff, metalness: 1, roughness: 0.25, emissive: 0x1a4a5a, emissiveIntensity: 0.4 });
    for (var pi = 0; pi < 16; pi++) {
      var side = Math.floor(pi / 4), k = (pi % 4 - 1.5) * 0.34;
      var pin = new THREE.Mesh(pinGeo, pinMat);
      if (side === 0) { pin.position.set(k, -0.02, 0.98); }
      else if (side === 1) { pin.position.set(k, -0.02, -0.98); }
      else if (side === 2) { pin.position.set(0.98, -0.02, k); pin.rotation.y = Math.PI / 2; }
      else { pin.position.set(-0.98, -0.02, k); pin.rotation.y = Math.PI / 2; }
      core.add(pin);
    }

    /* -- Wire shells -- */
    var shell1 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.85, 1),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.22 })
    );
    core.add(shell1);
    var shell2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.25, 0),
      new THREE.MeshBasicMaterial({ color: 0x8a2be2, wireframe: true, transparent: true, opacity: 0.16 })
    );
    core.add(shell2);

    /* -- Orbit rings -- */
    function ring(r, tube, color, opacity) {
      var m = new THREE.Mesh(
        new THREE.TorusGeometry(r, tube, 10, 110),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity })
      );
      core.add(m); return m;
    }
    var ring1 = ring(2.65, 0.018, 0x00f0ff, 0.8);
    var ring2 = ring(3.0, 0.014, 0x8a2be2, 0.7);
    var ring3 = ring(3.35, 0.010, 0x00ff87, 0.55);
    ring1.rotation.x = Math.PI / 2.35; ring2.rotation.x = Math.PI / 1.8; ring2.rotation.y = 0.5; ring3.rotation.x = Math.PI / 2.9; ring3.rotation.y = -0.4;

    /* -- Orbiting node satellites -- */
    var satGeo = new THREE.SphereGeometry(0.07, 12, 12);
    var satellites = [];
    [[2.65, 0x00f0ff, 0.9], [3.0, 0xc9a6ff, -0.6], [3.35, 0x00ff87, 0.45]].forEach(function (cfg, idx) {
      var s = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: cfg[1] }));
      s.userData = { r: cfg[0], speed: cfg[2], phase: idx * 2.1 };
      scene.add(s); satellites.push(s);
    });

    /* -- Rising sparks around the core -- */
    var SPARKS = MP3D.env.lowPower ? 70 : 160;
    var sGeo = new THREE.BufferGeometry();
    var sPos = new Float32Array(SPARKS * 3);
    var sSeed = new Float32Array(SPARKS);
    for (var si = 0; si < SPARKS; si++) {
      var rr = 1.6 + Math.random() * 2.4, aa = Math.random() * Math.PI * 2;
      sPos[si * 3] = Math.cos(aa) * rr;
      sPos[si * 3 + 1] = (Math.random() - 0.5) * 5;
      sPos[si * 3 + 2] = Math.sin(aa) * rr;
      sSeed[si] = Math.random() * 100;
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    var sparks = new THREE.Points(sGeo, new THREE.PointsMaterial({
      color: 0x9df3ff, size: 0.05, transparent: true, opacity: 0.8,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(sparks);

    /* -- Base platform: hex pad + glow disc -- */
    var pad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.45, 0.12, 6),
      new THREE.MeshStandardMaterial({ color: 0x0b1526, metalness: 0.7, roughness: 0.4, emissive: 0x0a1a2a, emissiveIntensity: 0.6, transparent: true, opacity: 0.92 })
    );
    pad.position.y = -3.1; scene.add(pad);
    var padEdge = new THREE.Mesh(
      new THREE.TorusGeometry(2.28, 0.02, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.65 })
    );
    padEdge.rotation.x = Math.PI / 2; padEdge.rotation.z = Math.PI / 6; padEdge.position.y = -3.03; scene.add(padEdge);

    size();
    window.addEventListener('resize', size);

    /* Pause when hero is off-screen */
    if ('IntersectionObserver' in window && stage) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView && visible && !MP3D.env.reducedMotion) { clock.getDelta(); requestAnimationFrame(tick); }
      }, { threshold: 0.02 }).observe(stage);
    }
    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      if (visible && inView && !MP3D.env.reducedMotion) { clock.getDelta(); requestAnimationFrame(tick); }
    });

    /* Local pointer for stronger hero response */
    var hero = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', function (e) {
      if (!stage) return;
      var r = stage.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      var ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      hero.tx = Math.max(-1.4, Math.min(1.4, nx));
      hero.ty = Math.max(-1.4, Math.min(1.4, ny));
    }, { passive: true });

    /* Telemetry DOM */
    var telRot = opts.telemetryRot || null;
    var telTmp = opts.telemetryTmp || null;
    var frame = 0;

    var clock = new THREE.Clock();

    function renderFrame() {
      var t = clock.elapsedTime;
      /* Damped mouse */
      hero.x += (hero.tx - hero.x) * 0.055;
      hero.y += (hero.ty - hero.y) * 0.055;

      /* Core self-motion */
      core.rotation.y = t * 0.35;
      core.rotation.z = Math.sin(t * 0.25) * 0.08;
      shell1.rotation.x = t * 0.12; shell1.rotation.y = -t * 0.09;
      shell2.rotation.y = t * 0.07; shell2.rotation.z = t * 0.05;
      ring1.rotation.z = t * 0.4; ring2.rotation.z = -t * 0.28; ring3.rotation.z = t * 0.18;
      die.rotation.y = -t * 0.8; die.rotation.x = t * 0.3;
      pad.rotation.y = t * 0.06;

      /* Rig follows the pointer with inertia */
      rig.rotation.y = hero.x * 0.42;
      rig.rotation.x = -hero.y * 0.3;
      rig.position.y = Math.sin(t * 0.9) * 0.14;
      rig.position.x = hero.x * 0.22;
      camera.position.x += ((hero.x * 0.5) - camera.position.x) * 0.04;
      camera.lookAt(0, -0.2, 0);

      /* Satellites ride their rings */
      for (var i = 0; i < satellites.length; i++) {
        var s = satellites[i], u = s.userData;
        var a = t * u.speed + u.phase;
        s.position.set(Math.cos(a) * u.r, Math.sin(a * 0.9) * 0.9 + Math.sin(t * 0.9) * 0.14, Math.sin(a) * u.r * 0.62);
      }

      /* Sparks rise + wrap */
      var arr = sGeo.attributes.position.array;
      var rise = MP3D.env.lowPower ? 0.008 : 0.012;
      for (var j = 0; j < SPARKS; j++) {
        arr[j * 3 + 1] += rise;
        arr[j * 3] += Math.sin(t * 1.4 + sSeed[j]) * 0.0022;
        if (arr[j * 3 + 1] > 3.4) arr[j * 3 + 1] = -3.2;
      }
      sGeo.attributes.position.needsUpdate = true;

      /* Telemetry @ ~10fps */
      if ((frame++ % 6 === 0)) {
        if (telRot) telRot.textContent = ('000' + Math.round(((t * 20) % 360))).slice(-3) + '°';
        if (telTmp) telTmp.textContent = (36.4 + Math.sin(t * 0.7) * 1.8).toFixed(1) + '°C';
      }

      renderer.render(scene, camera);
    }

    function tick() {
      if (!visible || !inView) return;
      requestAnimationFrame(tick);
      clock.getDelta();
      renderFrame();
    }

    if (MP3D.env.reducedMotion) {
      renderFrame();
    } else {
      tick();
    }

    return { renderer: renderer, scene: scene, camera: camera, size: size };
  };

  /* ========================================================================
     AVATAR CORE — compact holographic circuit core for the dashboard
     avatar module: glowing die, wire shells, matrix rings, particle shell
     and a travelling scan ring. Cursor-reactive with damped inertia.
     ======================================================================== */
  MP3D.initAvatarCore = function (canvas, opts) {
    opts = opts || {};
    var stage = canvas ? canvas.parentElement : null;
    function fallback() { if (stage) stage.classList.add('no-webgl'); }

    if (!canvas || !MP3D.env.hasTHREE || !MP3D.env.webgl) { fallback(); return null; }

    var THREE = window.THREE;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: !MP3D.env.lowPower, powerPreference: 'high-performance' });
    } catch (e) { fallback(); return null; }

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.2, 6.4);

    function size() {
      var r = stage.getBoundingClientRect();
      renderer.setPixelRatio(capDPR());
      renderer.setSize(Math.max(200, r.width), Math.max(200, r.height), false);
      camera.aspect = Math.max(200, r.width) / Math.max(200, r.height);
      camera.updateProjectionMatrix();
    }

    scene.add(new THREE.AmbientLight(0x8fb8ff, 0.6));
    var pCyan = new THREE.PointLight(0x00f0ff, 1.5, 25); pCyan.position.set(3, 2, 4); scene.add(pCyan);
    var pGreen = new THREE.PointLight(0x00ff87, 1.0, 25); pGreen.position.set(-3, -1, 3); scene.add(pGreen);
    var pViolet = new THREE.PointLight(0x8b5cf6, 1.2, 25); pViolet.position.set(0, 3, -3); scene.add(pViolet);

    var rig = new THREE.Group();
    var spin = new THREE.Group();
    rig.add(spin); scene.add(rig);

    /* Holographic die */
    var die = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.72, 0),
      new THREE.MeshStandardMaterial({ color: 0x062025, metalness: 0.9, roughness: 0.25, emissive: 0x00e5ff, emissiveIntensity: 0.7, flatShading: true, transparent: true, opacity: 0.96 })
    );
    spin.add(die);

    /* Wire shells */
    spin.add(new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.25, 1),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.3 })
    ));
    var shell2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 0),
      new THREE.MeshBasicMaterial({ color: 0x00ff87, wireframe: true, transparent: true, opacity: 0.16 })
    );
    spin.add(shell2);

    /* Matrix rings */
    function ring(r, tube, color, opacity) {
      var m = new THREE.Mesh(
        new THREE.TorusGeometry(r, tube, 8, 90),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity })
      );
      spin.add(m); return m;
    }
    var r1 = ring(1.95, 0.016, 0x00ff87, 0.85);
    var r2 = ring(2.2, 0.012, 0x00f0ff, 0.7);
    r1.rotation.x = Math.PI / 2.3; r2.rotation.x = Math.PI / 1.75; r2.rotation.y = 0.45;

    /* Particle shell (cyan/emerald mix) */
    var COUNT = MP3D.env.lowPower ? 120 : 240;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3);
    var cA = new THREE.Color(0x00f0ff), cB = new THREE.Color(0x00ff87), tmpC = new THREE.Color();
    for (var i = 0; i < COUNT; i++) {
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      var rr = 1.85 + Math.random() * 0.7;
      pos[i * 3] = rr * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = rr * Math.cos(ph);
      pos[i * 3 + 2] = rr * Math.sin(ph) * Math.sin(th);
      tmpC.copy(cA).lerp(cB, Math.random());
      col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    var shell = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.045, vertexColors: true, transparent: true, opacity: 0.9,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    spin.add(shell);

    /* Travelling scan ring */
    var scan = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.014, 8, 80),
      new THREE.MeshBasicMaterial({ color: 0x9df3ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    scan.rotation.x = Math.PI / 2;
    scene.add(scan);

    /* Backdrop glow sprite */
    (function () {
      var cv = document.createElement('canvas'); cv.width = cv.height = 128;
      var cx2 = cv.getContext('2d');
      var g = cx2.createRadialGradient(64, 64, 2, 64, 64, 64);
      g.addColorStop(0, 'rgba(0,240,255,0.5)'); g.addColorStop(0.5, 'rgba(0,255,135,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      cx2.fillStyle = g; cx2.fillRect(0, 0, 128, 128);
      var spr = new THREE.Mesh(
        new THREE.PlaneGeometry(7, 7),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      spr.position.z = -2.5;
      scene.add(spr);
    })();

    size();
    window.addEventListener('resize', size);

    var visible = true, inView = true;
    if ('IntersectionObserver' in window && stage) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView && visible && !MP3D.env.reducedMotion) { clock.getDelta(); requestAnimationFrame(tick); }
      }, { threshold: 0.02 }).observe(stage);
    }
    document.addEventListener('visibilitychange', function () {
      visible = !document.hidden;
      if (visible && inView && !MP3D.env.reducedMotion) { clock.getDelta(); requestAnimationFrame(tick); }
    });

    /* Local pointer tracking with strong response + damping */
    var mx = 0, my = 0, tx = 0, ty = 0;
    (stage || window).addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      tx = Math.max(-1.3, Math.min(1.3, ((e.clientX - r.left) / r.width) * 2 - 1));
      ty = Math.max(-1.3, Math.min(1.3, -(((e.clientY - r.top) / r.height) * 2 - 1)));
    }, { passive: true });
    stage.addEventListener('pointerleave', function () { tx = 0; ty = 0; });

    var telSync = opts.telemetrySync || null;
    var clock = new THREE.Clock();
    var frame = 0;

    function renderFrame() {
      var t = clock.elapsedTime;
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;

      spin.rotation.y = t * 0.45;
      spin.rotation.z = Math.sin(t * 0.3) * 0.1;
      shell2.rotation.x = -t * 0.15;
      r1.rotation.z = t * 0.5;
      r2.rotation.z = -t * 0.35;
      die.rotation.y = -t * 0.9;
      shell.rotation.y = -t * 0.08;

      rig.rotation.y = mx * 0.45;
      rig.rotation.x = -my * 0.35;
      rig.position.y = Math.sin(t * 1.1) * 0.12;
      camera.position.x += ((mx * 0.4) - camera.position.x) * 0.05;
      camera.lookAt(0, 0, 0);

      /* Scan ring sweep */
      var sy = ((t * 0.7) % 5.4) - 2.7;
      scan.position.y = sy;
      var edge = Math.abs(sy) / 2.7;
      scan.material.opacity = 0.65 * (1 - edge * edge);
      var sr = 1.35 + edge * 0.75;
      scan.scale.set(sr / 1.9, sr / 1.9, 1);

      if (telSync && (frame++ % 8 === 0)) {
        telSync.textContent = (97.5 + Math.sin(t * 0.9) * 2.2).toFixed(1) + '%';
      }
      renderer.render(scene, camera);
    }

    function tick() {
      if (!visible || !inView) return;
      requestAnimationFrame(tick);
      clock.getDelta();
      renderFrame();
    }

    if (MP3D.env.reducedMotion) { renderFrame(); } else { tick(); }
    return { renderer: renderer, scene: scene, camera: camera, size: size };
  };

  /* Auto-size helper for DPR changes (zoom) */
  window.addEventListener('resize', function () {
    MP3D.env.lowPower = isLowPower();
  });

})();
