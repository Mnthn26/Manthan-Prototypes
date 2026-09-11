/* ==========================================================================
   theme.js — light / dark (white / black) mode command
   - The inline <head> snippet sets data-theme before first paint (no flash).
   - This module wires every [data-theme-toggle] button, persists the choice
     to localStorage, updates meta theme-color, and re-tints the Three.js
     universe live via MP3D.setTheme().
   - Default follows the OS (prefers-color-scheme); stored choice wins.
   ========================================================================== */
(function () {
  'use strict';

  var Theme = (window.MPTheme = window.MPTheme || {});
  var KEY = 'mp-theme';

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function paintToggleButtons(t) {
    var pressed = t === 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      b.setAttribute('aria-label', pressed ? 'Switch to dark mode' : 'Switch to light mode');
      b.setAttribute('title', pressed ? 'Switch to dark mode' : 'Switch to light mode');
    });
  }

  function apply(t, save) {
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
    if (save !== false) {
      try { localStorage.setItem(KEY, t); } catch (e) { /* private mode */ }
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#e9eff6' : '#05070a');
    paintToggleButtons(t);
    if (window.MP3D && typeof window.MP3D.setTheme === 'function') {
      try { window.MP3D.setTheme(t); } catch (e) { console.warn('[theme-3d]', e); }
    }
  }

  /* Toggle on click (delegated — works even before DOMContentLoaded). */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
    if (!b) return;
    apply(current() === 'light' ? 'dark' : 'light');
  });

  /* Keyboard shortcut: press "t" to flip themes (outside inputs). */
  document.addEventListener('keydown', function (e) {
    if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && !e.altKey) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      apply(current() === 'light' ? 'dark' : 'light');
    }
  });

  /* Sync button labels + 3D scene once everything is booted. */
  function sync() { apply(current(), false); }
  document.addEventListener('DOMContentLoaded', sync);
  window.addEventListener('mp:ready', sync);
  window.addEventListener('load', sync);

  Theme.apply = apply;
  Theme.current = current;
})();
