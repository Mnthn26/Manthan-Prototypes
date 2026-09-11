/* ==========================================================================
   dashboard.js — Spatial Command Dashboard controller
   1. Page-veil transitions: smooth GSAP wipes between console tabs
      (Dashboard / About / DeskTech / Lab) on every page.
   2. Sidebar drawer (mobile), live command clock.
   3. Dashboard entrance choreography (GSAP, guarded).
   4. Live metrics: GitHub repo count, DeskTech uplink count + latest title.
   Boots on `mp:ready` (fired by script.js once the preloader lifts),
   with a DOMContentLoaded + timeout fallback so it can never strand the UI.
   ========================================================================== */
(function () {
  'use strict';

  var Dash = (window.MPDash = window.MPDash || {});
  var booted = false;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = function () { return typeof window.gsap !== 'undefined'; };

  /* ------------------------------------------------------------------ */
  /* 1. PAGE-VEIL TRANSITIONS                                             */
  /* ------------------------------------------------------------------ */
  var VEIL_KEY = 'mp-veil';

  function veilEl() { return document.querySelector('.page-veil'); }

  /* Outgoing: intercept same-origin page navigations, wipe in, then go. */
  function armTransitions() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || a.target === '_blank') return;
      if (/^(mailto|tel|sms|javascript):/i.test(href)) return;

      var url;
      try { url = new URL(href, window.location.href); } catch (err) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return; /* same-page anchor */
      if (url.pathname === window.location.pathname && !url.hash) {
        e.preventDefault(); /* active tab: re-center console instead of reloading */
        if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      /* If GSAP is missing just navigate (CSS fallback would flash otherwise). */
      if (reducedMotion || !hasGSAP()) return;

      e.preventDefault();
      try { sessionStorage.setItem(VEIL_KEY, '1'); } catch (err) { /* private mode */ }
      var veil = veilEl();
      var go = function () { window.location.href = url.href; };
      if (!veil) { go(); return; }

      veil.classList.add('covering');
      var bar = veil.querySelector('.veil-bar i');
      var tl = window.gsap.timeline({ onComplete: go });
      tl.set(veil, { display: 'flex' })
        .fromTo(veil, { yPercent: -100 }, { yPercent: 0, duration: 0.45, ease: 'power3.inOut' })
        .fromTo(bar, { width: '0%' }, { width: '100%', duration: 0.4, ease: 'power2.in' }, '-=0.15');
      setTimeout(go, 1200); /* failsafe: never trap navigation */
    });
  }

  /* Incoming: if the previous page wiped in, wipe out. */
  function settleVeil() {
    var veil = veilEl();
    var flagged = false;
    try { flagged = sessionStorage.getItem(VEIL_KEY) === '1'; sessionStorage.removeItem(VEIL_KEY); }
    catch (err) { /* private mode */ }
    if (!veil || !flagged) return;
    veil.classList.add('covering');
    if (!hasGSAP() || reducedMotion) {
      veil.classList.remove('covering');
      veil.style.display = 'none';
      return;
    }
    window.gsap.set(veil, { display: 'flex', yPercent: 0 });
    var bar = veil.querySelector('.veil-bar i');
    if (bar) window.gsap.set(bar, { width: '100%' });
    window.gsap.to(veil, {
      yPercent: 100, duration: 0.7, ease: 'power3.inOut', delay: 0.25,
      onComplete: function () {
        veil.classList.remove('covering');
        window.gsap.set(veil, { clearProps: 'all', display: 'none' });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 2. SIDEBAR DRAWER + COMMAND CLOCK                                    */
  /* ------------------------------------------------------------------ */
  function initSidebar() {
    var sidebar = document.querySelector('.command-sidebar');
    if (!sidebar) return;
    var toggle = document.querySelector('[data-drawer-toggle]');
    var scrim = document.querySelector('.command-scrim');
    function close() {
      sidebar.classList.remove('open');
      if (scrim) scrim.classList.remove('on');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    function open() {
      sidebar.classList.add('open');
      if (scrim) scrim.classList.add('on');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    if (toggle) {
      toggle.addEventListener('click', function () {
        sidebar.classList.contains('open') ? close() : open();
      });
    }
    if (scrim) scrim.addEventListener('click', close);
    window.addEventListener('resize', function () { if (window.innerWidth > 1020) close(); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function initClock() {
    var clock = document.querySelector('[data-clock]');
    var date = document.querySelector('[data-date]');
    if (!clock && !date) return;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tickClock() {
      var d = new Date();
      if (clock) clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      if (date) date.textContent = d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
    }
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ------------------------------------------------------------------ */
  /* 3. DASHBOARD ENTRANCE CHOREOGRAPHY                                   */
  /* ------------------------------------------------------------------ */
  function initEntrance() {
    if (!document.querySelector('.command-shell')) return;
    if (reducedMotion || !hasGSAP()) return;

    /* Safety sweep: entrance tweens must NEVER strand content invisible.
       Animated props are cleared on completion AND via a failsafe timer,
       so even a stalled GSAP ticker cannot trap opacity:0 inline styles. */
    var ENTRANCE_TARGETS = '.command-sidebar, .side-nav a, .console-head, ' +
      '.bento-console > *, .metrics-strip .metric, .command-foot';
    function sweep() {
      try { window.gsap.set(ENTRANCE_TARGETS, { clearProps: 'opacity,transform,visibility' }); }
      catch (e) { /* noop */ }
    }

    var tl = window.gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: sweep });
    /* NOTE: nav links intentionally have no from-tween — primary navigation
       must never depend on JS animation to be visible. The links ride along
       with the sidebar slide instead. */
    tl.from('.command-sidebar', { x: -60, opacity: 0, duration: 0.8 })
      .from('.console-head', { y: -30, opacity: 0, duration: 0.7 }, '-=0.55')
      .from('.bento-console > *', {
        y: 46, opacity: 0, rotationX: 7, transformPerspective: 1200,
        duration: 0.9, stagger: 0.12
      }, '-=0.5')
      .from('.metrics-strip .metric', { y: 26, opacity: 0, duration: 0.6, stagger: 0.09 }, '-=0.55')
      .from('.command-foot', { opacity: 0, duration: 0.6 }, '-=0.4');
    setTimeout(sweep, 6000); /* failsafe: never trap content if the ticker stalls */
  }

  /* ------------------------------------------------------------------ */
  /* 4. LIVE METRICS                                                      */
  /* ------------------------------------------------------------------ */
  function countUp(el, target, decimals, suffix) {
    if (!el) return;
    decimals = decimals || 0;
    if (reducedMotion) { el.textContent = Number(target).toFixed(decimals) + (suffix || ''); return; }
    var dur = 1200, t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + (suffix || '');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initMetrics() {
    var reposEl = document.querySelector('[data-metric-repos]');
    var videosEl = document.querySelector('[data-metric-videos]');
    var uplinkEl = document.querySelector('[data-latest-uplink]');
    if (!reposEl && !videosEl && !uplinkEl) return;

    /* GitHub: public repo count */
    fetch('https://api.github.com/users/mnthn26')
      .then(function (r) { if (!r.ok) throw new Error('gh'); return r.json(); })
      .then(function (u) { if (reposEl && u.public_repos != null) countUp(reposEl, u.public_repos, 0); })
      .catch(function () { /* keep static default */ });

    /* DeskTech: uplink count + latest title */
    var rss = encodeURIComponent('https://www.youtube.com/feeds/videos.xml?channel_id=UCJ097-h2m6bMtl9oHYCZjIQ');
    fetch('https://api.rss2json.com/v1/api.json?rss_url=' + rss)
      .then(function (r) { if (!r.ok) throw new Error('yt'); return r.json(); })
      .then(function (d) {
        if (d.items && d.items.length) {
          if (videosEl) countUp(videosEl, d.items.length, 0);
          if (uplinkEl) uplinkEl.textContent = d.items[0].title;
        }
      })
      .catch(function () { /* keep static default */ });
  }

  /* ------------------------------------------------------------------ */
  /* BOOT                                                                 */
  /* ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ */
  /* 5. AVATAR HOLO-CORE (dashboard only)                                 */
  /* ------------------------------------------------------------------ */
  function initAvatar() {
    try {
      var canvas = document.getElementById('avatar-canvas');
      if (canvas && window.MP3D) {
        window.MP3D.initAvatarCore(canvas, {
          telemetrySync: document.querySelector('[data-tel-sync]')
        });
      }
    } catch (e) {
      console.warn('[avatar]', e);
      var stage = document.querySelector('.avatar-stage');
      if (stage) stage.classList.add('no-webgl');
    }
  }

  Dash.init = function () {
    if (booted) return;
    booted = true;
    settleVeil();
    initSidebar();
    initClock();
    initEntrance();
    initMetrics();
    initAvatar();
  };

  armTransitions(); /* arm immediately — safe pre-DOMContentLoaded via delegation */

  window.addEventListener('mp:ready', Dash.init);
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () { Dash.init(); }, 4000); /* fallback if script.js fails */
  });
  setTimeout(function () { Dash.init(); }, 7000); /* absolute failsafe */

})();
