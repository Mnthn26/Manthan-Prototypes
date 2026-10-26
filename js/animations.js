/* ==========================================================================
   animations.js — scroll experience, reveals, pinning, HUD micro-interactions
   Stack: Lenis (smooth inertia scroll) + GSAP + ScrollTrigger, all optional.
   Every effect degrades gracefully when a CDN is blocked or the user prefers
   reduced motion — content is always readable.
   ========================================================================== */
(function () {
  'use strict';

  var Anim = (window.MPAnim = window.MPAnim || {});
  document.documentElement.classList.add('js');

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

  if (hasST) { window.gsap.registerPlugin(window.ScrollTrigger); }

  /* ------------------------------------------------------------------ */
  /* 1. LENIS SMOOTH SCROLL (inertia, lock-step with canvas)              */
  /* ------------------------------------------------------------------ */
  var lenis = null;
  function initSmoothScroll() {
    if (reducedMotion || typeof window.Lenis === 'undefined') return;
    try {
      lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
      if (hasGSAP && hasST) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      /* Anchor links through Lenis */
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (id.length > 1 && document.querySelector(id)) {
            e.preventDefault();
            lenis.scrollTo(id, { offset: -70, duration: 1.4 });
            closeMobileNav();
          }
        });
      });
    } catch (e) { lenis = null; }
  }

  /* ------------------------------------------------------------------ */
  /* 2. NAV — blur, progress, scroll-spy, mobile toggle                   */
  /* ------------------------------------------------------------------ */
  var nav = null;
  function closeMobileNav() { if (nav) { nav.classList.remove('open'); var t = nav.querySelector('.nav-toggle'); if (t) t.setAttribute('aria-expanded', 'false'); } }

  function initNav() {
    nav = document.querySelector('.site-nav');
    var progress = document.getElementById('scroll-progress');
    var toggle = nav ? nav.querySelector('.nav-toggle') : null;

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    /* Close on link click + on resize to desktop */
    if (nav) {
      nav.querySelectorAll('.nav-links a').forEach(function (a) {
        a.addEventListener('click', closeMobileNav);
      });
    }
    window.addEventListener('resize', function () { if (window.innerWidth > 760) closeMobileNav(); });

    var spyLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('.nav-links a[href^="#"]')) : [];
    var spySections = spyLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      if (nav) nav.classList.toggle('scrolled', y > 24);
      if (progress) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
      /* Scroll-spy */
      if (spySections.length) {
        var current = null;
        for (var i = 0; i < spySections.length; i++) {
          if (spySections[i].getBoundingClientRect().top <= 140) current = spySections[i].id;
        }
        spyLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------ */
  /* 3. REVEALS — GSAP ScrollTrigger w/ IntersectionObserver fallback    */
  /* ------------------------------------------------------------------ */
  function initRevealsFallback() {
    document.documentElement.classList.add('anim-armed');
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var delay = parseFloat(el.getAttribute('data-delay') || '0');
          setTimeout(function () { el.classList.add('in'); }, delay * 1000);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  function initRevealsGSAP() {
    var gsap = window.gsap;
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      var delay = parseFloat(el.getAttribute('data-delay') || '0');
      gsap.fromTo(el,
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 1, delay: delay, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
    });
    /* Stagger groups */
    gsap.utils.toArray('[data-reveal-group]').forEach(function (group) {
      gsap.fromTo(group.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 85%', once: true }
        });
    });
    /* Hero parallax drift */
    var heroCopy = document.querySelector('.hero-copy');
    var heroStage = document.querySelector('.hero-stage');
    if (heroCopy) {
      gsap.to(heroCopy, {
        yPercent: -8, opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }
    if (heroStage) {
      gsap.to(heroStage, {
        yPercent: 10, scale: 0.96, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }
    /* Level bars + stage lines scrub */
    gsap.utils.toArray('.stage-card .stage-line i').forEach(function (bar) {
      gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, transformOrigin: 'left center', ease: 'none',
        scrollTrigger: { trigger: bar, start: 'top 92%', end: 'top 55%', scrub: 0.5 }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. PINNED HORIZONTAL PIPELINE (desktop only)                         */
  /* ------------------------------------------------------------------ */
  function initPinnedPipeline() {
    if (!hasGSAP || !hasST || reducedMotion) return;
    var mm = window.gsap.matchMedia();
    mm.add('(min-width: 1080px)', function () {
      var section = document.getElementById('pipeline');
      var track = section ? section.querySelector('.stages') : null;
      if (!section || !track || track.children.length < 2) return;

      /* Switch grid -> horizontal rail */
      track.style.display = 'flex';
      track.style.width = 'max-content';
      track.style.gap = '22px';
      Array.prototype.forEach.call(track.children, function (card) {
        card.style.width = '330px';
        card.style.flexShrink = '0';
      });

      var getDist = function () {
        return Math.max(0, track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).fontSize) * 4);
      };
      window.gsap.to(track, {
        x: function () { return -getDist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top+=72',
          end: function () { return '+=' + (getDist() + 300); },
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      return function () {
        track.style.display = ''; track.style.width = ''; track.style.gap = '';
        Array.prototype.forEach.call(track.children, function (card) { card.style.width = ''; card.style.flexShrink = ''; });
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5. HERO INTRO TIMELINE                                               */
  /* ------------------------------------------------------------------ */
  function initHeroIntro() {
    var hero = document.querySelector('.hero-copy');
    if (!hero || reducedMotion || !hasGSAP) return;
    var tl = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.site-nav', { y: -70, opacity: 0, duration: 0.9 })
      .from('.hero-copy .greeting', { y: 24, opacity: 0, duration: 0.7 }, '-=0.5')
      .from('.hero-copy .glitch', { y: 44, opacity: 0, duration: 1 }, '-=0.45')
      .from('.hero-copy .hero-name', { y: 20, opacity: 0, duration: 0.7 }, '-=0.6')
      .from('.hero-copy .hero-tagline', { y: 24, opacity: 0, duration: 0.8 }, '-=0.55')
      .from('.hero-ctas .btn', { y: 22, opacity: 0, duration: 0.7, stagger: 0.12 }, '-=0.5')
      .from('.hero-stats .stat', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.5')
      .from('.hero-stage', { scale: 0.92, opacity: 0, duration: 1.2 }, '-=1.1')
      .from('.telemetry', { opacity: 0, y: 10, duration: 0.5, stagger: 0.12 }, '-=0.6');
  }

  /* ------------------------------------------------------------------ */
  /* 6. CYBERPUNK GLITCH PULSES                                           */
  /* ------------------------------------------------------------------ */
  function initGlitch() {
    var glitch = document.querySelector('.glitch');
    if (!glitch || reducedMotion) return;
    function pulse() {
      glitch.classList.add('glitching');
      setTimeout(function () { glitch.classList.remove('glitching'); }, 220 + Math.random() * 260);
      setTimeout(pulse, 2600 + Math.random() * 3400);
    }
    setTimeout(pulse, 1800);
  }

  /* ------------------------------------------------------------------ */
  /* 7. ANIMATED COUNTERS                                                 */
  /* ------------------------------------------------------------------ */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    function animate(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dur = 1400, t0 = null;
      function frame(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      if (reducedMotion) { el.textContent = target; } else { requestAnimationFrame(frame); }
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { io.observe(c); });
    } else {
      counters.forEach(animate);
    }
  }

  /* ------------------------------------------------------------------ */
  /* 8. CURSOR GLOW + MAGNETIC BUTTONS (fine pointers only)               */
  /* ------------------------------------------------------------------ */
  function initCursorGlow() {
    if (!finePointer || reducedMotion) return;
    var glow = document.getElementById('cursor-glow');
    if (!glow) return;
    var x = -500, y = -500, tx = x, ty = y, active = false;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!active) { active = true; glow.classList.add('on'); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { active = false; glow.classList.remove('on'); });
    (function loop() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      glow.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  function initMagnetic() {
    if (!finePointer || reducedMotion) return;
    document.querySelectorAll('.btn, .nav-cta, .tac-btn, .link-node').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.translate = (dx * 8) + 'px ' + (dy * 6) + 'px';
      });
      btn.addEventListener('pointerleave', function () { btn.style.translate = '0px 0px'; });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 9. SKILL LEVEL BAR FILL                                              */
  /* ------------------------------------------------------------------ */
  function initLevelBars() {
    document.querySelectorAll('.level-bar i').forEach(function (bar) {
      var fill = function () { bar.style.width = (bar.getAttribute('data-level') || '80') + '%'; };
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { fill(); io.disconnect(); } });
        }, { threshold: 0.4 });
        io.observe(bar);
      } else { fill(); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* BOOT                                                                 */
  /* ------------------------------------------------------------------ */
  Anim.init = function () {
    initNav();
    initSmoothScroll();
    if (hasGSAP && hasST && !reducedMotion) { initRevealsGSAP(); }
    else { initRevealsFallback(); }
    initPinnedPipeline();
    initHeroIntro();
    initGlitch();
    initCounters();
    initCursorGlow();
    initMagnetic();
    initLevelBars();
    if (hasST) { window.addEventListener('load', function () { window.ScrollTrigger.refresh(); }); }
  };

})();
