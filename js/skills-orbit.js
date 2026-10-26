/* ==========================================================================
   skills-orbit.js — interactive 3D-orbit skill cloud (2D canvas projection)
   Nodes float in a rotating 3D orbit, projected to 2D with depth scaling.
   Hover / tap / keyboard-pill select expands details + highlights related
   project tags across the page (data-tags matching).
   Zero dependencies. Fully keyboard accessible via the pills list.
   ========================================================================== */
(function () {
  'use strict';

  var Orbit = (window.MPSkills = window.MPSkills || {});

  /* -- Skill data (Bench Stack + focus areas, content-faithful) -- */
  var SKILLS = [
    { id: 'arduino', label: 'Arduino', short: 'Ar', color: '#00f0ff',
      level: 92, blurb: 'Direct micro-controller scripts, sensor wiring and real-time hardware control loops.',
      detail: 'UNO / Nano firmware, Ultrasonic HC-SR04 radar sweeps, servo + DC motor drivers, serial telemetry and bench prototyping workflows.',
      tags: ['arduino', 'hardware', 'robotics', 'sensors', 'c++'] },
    { id: 'cpp', label: 'C++', short: 'C+', color: '#7df9ff',
      level: 84, blurb: 'Embedded logic, firmware structure and performance-minded system code.',
      detail: 'Arduino-flavoured C++, radar signal processing, motor control state machines and memory-conscious embedded patterns.',
      tags: ['arduino', 'c++', 'hardware', 'systems'] },
    { id: 'python', label: 'Python', short: 'Py', color: '#00ff87',
      level: 86, blurb: 'Automation scripts, local-AI experiments and hardware bridge tooling.',
      detail: 'Serial bridges to Arduino, data logging, Raspberry-Pi style automation and local AI / scripting utilities.',
      tags: ['python', 'software', 'systems', 'ai'] },
    { id: 'web', label: 'HTML / CSS', short: '</>', color: '#8a2be2',
      level: 90, blurb: 'Clean, responsive frontend interface panels and tracking dashboards.',
      detail: 'Semantic HTML5, modern CSS (Grid, Flexbox, custom properties), mobile-first responsive builds and glassmorphic HUD styling.',
      tags: ['web', 'ui', 'frontend', 'css', 'html'] },
    { id: 'js', label: 'JavaScript', short: 'JS', color: '#ffb454',
      level: 82, blurb: 'Interactive UI logic, 3D scenes and live data pipelines.',
      detail: 'Three.js scenes, GSAP motion, GitHub + YouTube API feeds, tilt physics and orbit simulations like this one.',
      tags: ['web', 'ui', 'frontend', 'javascript'] },
    { id: 'arch', label: 'Arch Linux', short: 'Ax', color: '#c9a6ff',
      level: 78, blurb: 'Daily-driver systems environment for dev, scripting and tooling.',
      detail: 'Terminal-first workflow, system utilities, dev environment tuning and open-source toolchaining on Arch.',
      tags: ['systems', 'software', 'linux'] },
    { id: 'circuit', label: 'Circuit Design', short: 'Ω', color: '#00f0ff',
      level: 88, blurb: 'Schematic layouts, sensor modules and bench wiring blueprints.',
      detail: 'Circuit schematic layouts, ultrasonic + radar module integration, breadboard-to-perfboard builds and DeskTech video documentation.',
      tags: ['hardware', 'robotics', 'sensors', 'arduino'] },
    { id: 'vsc', label: 'VS Code', short: 'VS', color: '#5aa9ff',
      level: 89, blurb: 'Primary bench editor for firmware and frontend work.',
      detail: 'Multi-root workspaces, Arduino + PlatformIO style flows, snippets and debugging across hardware/software projects.',
      tags: ['systems', 'software', 'web'] }
  ];

  Orbit.data = SKILLS;

  Orbit.init = function (canvasId, panelId, pillsId) {
    var canvas = document.getElementById(canvasId || 'skills-canvas');
    var panel = document.getElementById(panelId || 'skill-detail');
    var pillsBox = document.getElementById(pillsId || 'skill-pills');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = 1, cx = 0, cy = 0, R = 100;
    var nodes = [];
    var angle = 0, angleV = 0.0016, targetV = 0.0016;
    var selected = 0, hovered = -1;
    var tiltX = 0.42, tiltTarget = 0.42;
    var pointer = { x: -9999, y: -9999, inside: false };
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Distribute nodes on a tilted 3D ring w/ varied radii + heights */
    SKILLS.forEach(function (s, i) {
      var frac = i / SKILLS.length;
      nodes.push({
        skill: s, a: frac * Math.PI * 2,
        radius: 0.78 + (i % 3) * 0.14,
        height: (i % 2 === 0 ? 1 : -1) * (0.18 + (i % 4) * 0.09),
        speed: 0.85 + (i % 5) * 0.08,
        x: 0, y: 0, z: 0, r: 10
      });
    });

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(260, rect.width); H = Math.max(320, rect.height);
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2; cy = H / 2;
      R = Math.min(W, H) * 0.36;
    }
    window.addEventListener('resize', resize);
    resize();

    /* ---- Detail panel ---- */
    var dKicker, dTitle, dBlurb, dDetail, dBar, dNum, dTags;
    if (panel) {
      dKicker = panel.querySelector('[data-skill-kicker]');
      dTitle = panel.querySelector('[data-skill-title]');
      dBlurb = panel.querySelector('[data-skill-blurb]');
      dDetail = panel.querySelector('[data-skill-detail]');
      dBar = panel.querySelector('.level-bar i');
      dNum = panel.querySelector('.level-num');
      dTags = panel.querySelector('[data-skill-tags]');
    }

    function highlightProjectTags(skill) {
      document.querySelectorAll('.proj-card, .repo-card').forEach(function (card) {
        card.classList.remove('highlight');
      });
      document.querySelectorAll('.tag').forEach(function (t) { t.classList.remove('match-on'); });
      if (!skill) return;
      var wanted = skill.tags;
      document.querySelectorAll('[data-tags]').forEach(function (card) {
        var cardTags = (card.getAttribute('data-tags') || '').toLowerCase().split(/\s+/);
        var hit = wanted.some(function (w) { return cardTags.indexOf(w) !== -1; });
        if (hit) {
          card.classList.add('highlight');
          card.querySelectorAll('.tag').forEach(function (t) {
            var txt = t.textContent.toLowerCase();
            if (wanted.some(function (w) { return txt.indexOf(w) !== -1; })) t.classList.add('match-on');
          });
        }
      });
    }

    function select(i, fromUser) {
      selected = (i + SKILLS.length) % SKILLS.length;
      var s = SKILLS[selected];
      if (panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(8px)';
        setTimeout(function () {
          if (dKicker) dKicker.textContent = 'NODE ' + ('0' + (selected + 1)).slice(-2) + ' // ' + s.label.toUpperCase();
          if (dTitle) dTitle.textContent = s.label;
          if (dBlurb) dBlurb.textContent = s.blurb;
          if (dDetail) dDetail.textContent = s.detail;
          if (dBar) { dBar.style.width = '0%'; requestAnimationFrame(function () { dBar.style.width = s.level + '%'; }); }
          if (dNum) dNum.textContent = s.level + '%';
          if (dTags) {
            dTags.innerHTML = '';
            s.tags.forEach(function (t) {
              var el = document.createElement('span');
              el.className = 'tag match-on'; el.textContent = t;
              dTags.appendChild(el);
            });
          }
          panel.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
          panel.style.opacity = '1';
          panel.style.transform = 'translateY(0)';
        }, fromUser ? 130 : 0);
      }
      if (pillsBox) {
        pillsBox.querySelectorAll('button').forEach(function (b, bi) {
          b.classList.toggle('on', bi === selected);
          b.setAttribute('aria-pressed', bi === selected ? 'true' : 'false');
        });
      }
      highlightProjectTags(s);
    if (reducedMotion) draw(); /* static mode: repaint selection on demand */
  }
    /* ---- Pills (keyboard accessible control) ---- */
    if (pillsBox) {
      pillsBox.innerHTML = '';
      SKILLS.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = s.label;
        b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        b.addEventListener('click', function () { select(i, true); });
        pillsBox.appendChild(b);
      });
    }
    var prevBtn = document.querySelector('[data-skill-prev]');
    var nextBtn = document.querySelector('[data-skill-next]');
    if (prevBtn) prevBtn.addEventListener('click', function () { select(selected - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { select(selected + 1, true); });

    /* ---- Pointer ---- */
    function canvasPos(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener('pointermove', function (e) {
      var p = canvasPos(e);
      pointer.x = p.x; pointer.y = p.y; pointer.inside = true;
    });
    canvas.addEventListener('pointerleave', function () { pointer.inside = false; hovered = -1; targetV = 0.0016; });
    canvas.addEventListener('click', function (e) {
      var p = canvasPos(e);
      var best = -1, bestD = 1e9;
      nodes.forEach(function (n, i) {
        var d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d < n.r + 14 && d < bestD) { bestD = d; best = i; }
      });
      if (best !== -1) select(best, true);
    });
    canvas.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { select(selected + 1, true); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { select(selected - 1, true); e.preventDefault(); }
    });
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-label', 'Interactive 3D skill orbit. Use left and right arrows to explore skills.');

    /* ---- Render loop ---- */
    var t = 0, running = true, inView = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView && running) { requestAnimationFrame(frame); }
      }, { threshold: 0.05 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running && inView) requestAnimationFrame(frame);
    });

    function project(n) {
      /* 3D ring point -> tilt -> 2D */
      var x3 = Math.cos(n.a) * n.radius;
      var z3 = Math.sin(n.a) * n.radius;
      var y3 = n.height + Math.sin(t * 0.0011 + n.a * 2) * 0.06;
      /* tilt around X axis */
      var cosT = Math.cos(tiltX), sinT = Math.sin(tiltX);
      var y2 = y3 * cosT - z3 * sinT;
      var z2 = y3 * sinT + z3 * cosT;
      var depth = (z2 + 1.4) / 2.8; /* 0..1 */
      return { x: cx + x3 * R, y: cy + y2 * R * 0.9, depth: Math.max(0, Math.min(1, depth)) };
    }

    function draw() {
      t += 16;
      ctx.clearRect(0, 0, W, H);

      /* Orbit rails */
      ctx.save();
      ctx.strokeStyle = 'rgba(0,240,255,0.14)'; ctx.lineWidth = 1;
      [0.78, 0.92, 1.06].forEach(function (rr) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * rr, R * rr * 0.9 * Math.cos(tiltX), 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();

      /* Core nucleus */
      var pulse = 1 + Math.sin(t * 0.0022) * 0.06;
      var coreR = 30 * pulse;
      var grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreR * 2.4);
      grad.addColorStop(0, 'rgba(0,240,255,0.85)');
      grad.addColorStop(0.35, 'rgba(0,240,255,0.25)');
      grad.addColorStop(1, 'rgba(0,240,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, coreR * 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#04121a';
      ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#00f0ff';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('M26', cx, cy + 1);

      /* Links: back nodes first */
      var ordered = nodes.map(function (n, i) { return { n: n, i: i }; })
        .sort(function (a, b) { return a.n.z - b.n.z; });

      ordered.forEach(function (o) {
        var n = o.n, active = (o.i === selected || o.i === hovered);
        ctx.strokeStyle = active ? n.skill.color : 'rgba(148,178,255,0.16)';
        ctx.lineWidth = active ? 1.6 : 1;
        if (active) { ctx.shadowColor = n.skill.color; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
        ctx.shadowBlur = 0;
      });

      /* Nodes */
      hovered = -1;
      ordered.forEach(function (o) {
        var n = o.n, i = o.i, s = n.skill;
        var active = (i === selected);
        var isHover = pointer.inside && Math.hypot(n.x - pointer.x, n.y - pointer.y) < n.r + 12;
        if (isHover) hovered = i;

        var rr = n.r * (active ? 1.35 : 1) * (isHover ? 1.18 : 1);
        ctx.save();
        ctx.globalAlpha = 0.45 + n.z * 0.55;
        ctx.shadowColor = s.color; ctx.shadowBlur = active || isHover ? 26 : 12;
        ctx.fillStyle = '#070d18';
        ctx.strokeStyle = s.color; ctx.lineWidth = active ? 2.4 : 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = s.color;
        ctx.font = '700 ' + Math.max(10, rr * 0.52) + 'px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.short, n.x, n.y + 1);
        /* label under node */
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillStyle = active ? '#fff' : 'rgba(159,176,201,0.9)';
        ctx.fillText(s.label.toUpperCase(), n.x, n.y + rr + 15);
        ctx.restore();
      });

      canvas.style.cursor = hovered !== -1 ? 'pointer' : 'default';
      if (hovered !== -1) targetV = 0.0004; else if (pointer.inside) targetV = 0.0011; else targetV = 0.0016;
    }

    function frame() {
      if (!running || !inView) return;
      if (!reducedMotion) {
        angleV += (targetV - angleV) * 0.05;
        angle += angleV * 16;
        nodes.forEach(function (n) {
          n.a += angleV * 16 * n.speed * 0.28;
          var p = project(n);
          n.x = p.x; n.y = p.y; n.z = p.depth;
          n.r = 13 + p.depth * 13;
        });
        tiltX += (tiltTarget - tiltX) * 0.03;
        draw();
        requestAnimationFrame(frame);
      }
    }

    /* Pointer tilt influence */
    canvas.parentElement.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      var ny = ((e.clientY - r.top) / r.height - 0.5);
      tiltTarget = 0.42 + ny * 0.35;
    });

    /* First paint (also the reduced-motion static frame) */
    nodes.forEach(function (n) { var p = project(n); n.x = p.x; n.y = p.y; n.z = p.depth; n.r = 13 + p.depth * 13; });
    draw();
    select(0, false);
    if (!reducedMotion) requestAnimationFrame(frame);
    /* Reduced motion: single static frame, repainted only on selection. */
  };

})();
