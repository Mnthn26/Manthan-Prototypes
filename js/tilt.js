/* ==========================================================================
   tilt.js — full 3D tilt mechanics (x/y axis from cursor) + specular sheen
   Progressive enhancement: disabled on touch, low-power and reduced-motion.
   Usage: add class "tilt" to any card. Optional data-tilt-max="10".
   Dynamically injected cards: call MPTilt.bind(scope) or MPTilt.refresh().
   ========================================================================== */
(function () {
  'use strict';

  var Tilt = (window.MPTilt = window.MPTilt || {});
  var bound = new WeakSet();

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lowPower = Math.min(window.innerWidth || 999, window.innerHeight || 999) < 620;

  Tilt.enabled = !reducedMotion && !!finePointer && !lowPower;
  /* Allow late enable on resize to desktop */
  window.addEventListener('resize', function () {
    lowPower = Math.min(window.innerWidth, window.innerHeight) < 620;
    var now = !reducedMotion && !!finePointer && !lowPower;
    if (now && !Tilt.enabled) { Tilt.enabled = true; Tilt.refresh(); }
    if (!now) Tilt.enabled = false;
  });

  function attach(card) {
    if (bound.has(card) || card.getAttribute('data-tilt-off') === 'true') return;
    bound.add(card);

    var max = parseFloat(card.getAttribute('data-tilt-max') || '9');
    var raf = null, rx = 0, ry = 0, trx = 0, try_ = 0;
    var hovering = false;

    /* Inject sheen + edge layers once */
    if (!card.querySelector('.card-sheen')) {
      var sheen = document.createElement('span');
      sheen.className = 'card-sheen'; sheen.setAttribute('aria-hidden', 'true');
      card.appendChild(sheen);
    }
    if (!card.querySelector('.card-edge')) {
      var edge = document.createElement('span');
      edge.className = 'card-edge'; edge.setAttribute('aria-hidden', 'true');
      card.appendChild(edge);
    }
    /* NOTE: no bind-time transform transition — tilt drives rotation via rAF
       lerp, and an always-on transition would fight GSAP scroll reveals. */

    function render() {
      raf = null;
      rx += (trx - rx) * 0.16;
      ry += (try_ - ry) * 0.16;
      card.style.transform =
        'perspective(1100px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)' +
        (hovering ? ' translateY(-4px) translateZ(22px)' : '');
      if (Math.abs(trx - rx) > 0.02 || Math.abs(try_ - ry) > 0.02) {
        raf = requestAnimationFrame(render);
      } else if (!hovering) {
        card.style.transform = '';
      }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(render); }

    card.addEventListener('pointerenter', function () {
      if (!Tilt.enabled) return;
      hovering = true;
      card.style.transition = 'transform 0.1s ease-out, border-color 0.3s ease, box-shadow 0.3s ease';
    });
    card.addEventListener('pointermove', function (e) {
      if (!Tilt.enabled || !hovering) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      try_ = (px - 0.5) * max * 2;
      trx = (0.5 - py) * max * 2;
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      kick();
    });
    function leave() {
      hovering = false; trx = 0; try_ = 0;
      card.style.transition = 'transform 0.55s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.3s ease';
      kick();
    }
    card.addEventListener('pointerleave', leave);
    card.addEventListener('pointercancel', leave);
  }

  Tilt.bind = function (scope) {
    if (!Tilt.enabled) return;
    (scope || document).querySelectorAll('.tilt').forEach(attach);
  };
  Tilt.refresh = function () { Tilt.bind(document); };
  Tilt.init = function () { Tilt.bind(document); };

})();
