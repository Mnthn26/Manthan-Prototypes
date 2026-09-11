/* ==========================================================================
   script.js — boot orchestrator for the Neon Lab theme
   Wires together: preloader, three-scene, tilt, animations, skills orbit,
   GitHub + YouTube live pipelines. Every module is optional — the page is
   fully readable even if all of them fail.
   ========================================================================== */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ */
  /* PRELOADER — tech boot sequence                                      */
  /* ------------------------------------------------------------------ */
  var BOOT_LINES = [
    'INITIALIZING CORE SYSTEMS',
    'LINKING HARDWARE NODES',
    'CALIBRATING HOLOGRID',
    'ACCESS GRANTED'
  ];

  function bootPreloader(done) {
    var pre = document.getElementById('preloader');
    if (!pre) { done(); return; }
    var bar = pre.querySelector('.loader-bar i');
    var status = pre.querySelector('.loader-status');
    var progress = 0, lineIdx = 0;

    if (reducedMotion) {
      pre.classList.add('done');
      setTimeout(function () { pre.style.display = 'none'; done(); }, 60);
      return;
    }

    var lineTimer = setInterval(function () {
      lineIdx = Math.min(lineIdx + 1, BOOT_LINES.length - 1);
      if (status) status.textContent = BOOT_LINES[lineIdx];
    }, 320);

    var loaded = false;
    function finish() {
      if (loaded) return;
      loaded = true;
      clearInterval(lineTimer);
      if (status) status.textContent = BOOT_LINES[BOOT_LINES.length - 1];
      if (bar) bar.style.width = '100%';
      setTimeout(function () {
        pre.classList.add('done');
        setTimeout(function () { pre.style.display = 'none'; }, 700);
        done();
      }, 350);
    }

    /* Ease the bar toward 90% until window load fires */
    var tick = setInterval(function () {
      progress += (90 - progress) * 0.08 + 0.4;
      if (progress >= 90) { progress = 90; clearInterval(tick); }
      if (bar) bar.style.width = progress + '%';
    }, 50);

    window.addEventListener('load', finish);
    setTimeout(finish, 4500); /* failsafe: never trap the user */
  }

  /* ------------------------------------------------------------------ */
  /* MODULE BOOT                                                         */
  /* ------------------------------------------------------------------ */
  function bootModules() {
    /* 1. Background universe (every page) */
    try {
      if (window.MP3D) {
        window.MP3D.initBackground(document.getElementById('bg-canvas'));
      }
    } catch (e) { console.warn('[bg]', e); }

    /* 2. Hero tech core (pages with a hero stage) */
    try {
      if (window.MP3D) {
        var heroCanvas = document.getElementById('hero-canvas');
        if (heroCanvas) {
          window.MP3D.initHero(heroCanvas, {
            telemetryRot: document.querySelector('[data-tel-rot]'),
            telemetryTmp: document.querySelector('[data-tel-tmp]')
          });
        }
      }
    } catch (e) {
      console.warn('[hero]', e);
      var stage = document.querySelector('.hero-stage');
      if (stage) stage.classList.add('no-webgl');
    }

    /* 3. Motion + scroll systems */
    try { if (window.MPAnim) window.MPAnim.init(); }
    catch (e) { console.warn('[anim]', e); }

    /* 4. 3D tilt cards */
    try { if (window.MPTilt) window.MPTilt.init(); }
    catch (e) { console.warn('[tilt]', e); }

    /* 5. Skill orbit cloud */
    try {
      if (window.MPSkills && document.getElementById('skills-canvas')) {
        window.MPSkills.init('skills-canvas', 'skill-detail', 'skill-pills');
      }
    } catch (e) { console.warn('[skills]', e); }

    /* 6. Live pipelines (only where their grids exist) */
    try {
      if (window.MPGitHub) {
        if (document.getElementById('github-project-grid')) {
          var perPage = document.getElementById('github-project-grid').getAttribute('data-per-page') || 12;
          window.MPGitHub.load('github-project-grid', parseInt(perPage, 10));
        }
        if (document.getElementById('github-preview-grid')) {
          window.MPGitHub.load('github-preview-grid', 6);
        }
      }
    } catch (e) { console.warn('[github-boot]', e); }

    try {
      if (window.MPYouTube) {
        if (document.getElementById('youtube-feed-grid')) {
          var max = document.getElementById('youtube-feed-grid').getAttribute('data-max') || 9;
          window.MPYouTube.load('youtube-feed-grid', parseInt(max, 10));
        }
        if (document.getElementById('youtube-preview-grid')) {
          window.MPYouTube.load('youtube-preview-grid', 3);
        }
      }
    } catch (e) { console.warn('[youtube-boot]', e); }

    /* Signal dashboard controller (veil settle, entrance, metrics, avatar) */
    try { window.dispatchEvent(new Event('mp:ready')); } catch (e) { /* legacy */ }
  }

  /* ------------------------------------------------------------------ */
  /* GO                                                                  */
  /* ------------------------------------------------------------------ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { bootPreloader(bootModules); });
  } else {
    bootPreloader(bootModules);
  }

})();
