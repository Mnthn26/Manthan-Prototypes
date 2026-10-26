/* ==========================================================================
   github.js — live GitHub repository pipeline (content-faithful upgrade)
   Same data source + fallback copy as the original Lab Projects page:
   user mnthn26, sorted by updated. Renders 3D tilt repo cards with
   language tags, star counts and "Source Files" links.
   ========================================================================== */
(function () {
  'use strict';

  var GH = (window.MPGitHub = window.MPGitHub || {});
  var USERNAME = 'mnthn26';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function tagFor(repo) {
    if (repo.language) return repo.language;
    var n = (repo.name || '').toLowerCase();
    if (n.indexOf('arduino') !== -1 || n.indexOf('radar') !== -1) return 'Arduino / C++';
    return 'Hardware';
  }

  /* Infer searchable tags for the skill-orbit highlight system */
  function dataTags(repo) {
    var hay = ((repo.name || '') + ' ' + (repo.description || '') + ' ' + (repo.language || '')).toLowerCase();
    var tags = [];
    function has() { for (var i = 0; i < arguments.length; i++) if (hay.indexOf(arguments[i]) !== -1) return true; return false; }
    if (has('arduino', 'radar', 'sensor', 'servo', 'motor', 'esp32', 'esp8266')) tags.push('arduino', 'hardware', 'robotics', 'sensors');
    if (has('python', '.py')) tags.push('python', 'software');
    if (has('html', 'css', 'portfolio', 'web', 'site', 'dashboard', 'ui')) tags.push('web', 'ui', 'frontend', 'html', 'css');
    if (has('javascript', 'js', 'three', 'gsap')) tags.push('javascript', 'web');
    if (has('c++', 'cpp', 'firmware', 'embedded')) tags.push('c++', 'systems');
    if (has('linux', 'arch', 'shell', 'bash', 'script', 'utility', 'utilities', 'tool')) tags.push('systems', 'software', 'linux');
    if (!tags.length) tags.push('software');
    /* unique */
    return tags.filter(function (t, i) { return tags.indexOf(t) === i; }).join(' ');
  }

  function cardHTML(repo) {
    var tag = tagFor(repo);
    var desc = repo.description || 'Hardware blueprints and design resources live within this active lab repository.';
    var stars = typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0;
    return (
      '<h4><a href="' + esc(repo.html_url) + '" target="_blank" rel="noopener noreferrer">' + esc(repo.name) + '</a></h4>' +
      '<p>' + esc(desc) + '</p>' +
      '<div class="repo-meta">' +
        '<span class="repo-lang">' + esc(tag) + '</span>' +
        '<span style="display:flex;align-items:center;gap:12px;">' +
          '<span class="repo-stars" title="Stargazers"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.9 6.26 6.6.57-5 4.4 1.5 6.47L12 16.9 5.99 19.7l1.5-6.47-5-4.4 6.6-.57z"/></svg>' + stars + '</span>' +
          '<a class="proj-link" style="font-size:0.74rem;" href="' + esc(repo.html_url) + '" target="_blank" rel="noopener noreferrer">Source Files ' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></a>' +
        '</span>' +
      '</div>'
    );
  }

  function loadingHTML() {
    return '<div class="glass repo-card skeleton-card tilt"><p>Connecting to repository data nodes<span class="loader-dots"></span></p></div>';
  }

  GH.load = function (gridId, perPage) {
    var grid = document.getElementById(gridId || 'github-project-grid');
    if (!grid) return Promise.resolve();

    grid.innerHTML = loadingHTML();
    var url = 'https://api.github.com/users/' + USERNAME + '/repos?sort=updated&per_page=' + (perPage || 12);

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Data drop');
        return res.json();
      })
      .then(function (repos) {
        grid.innerHTML = '';
        var shown = 0;
        repos.forEach(function (repo) {
          if (repo.fork) return;
          var card = document.createElement('div');
          card.className = 'glass repo-card tilt';
          card.setAttribute('data-tags', dataTags(repo));
          card.innerHTML = cardHTML(repo);
          grid.appendChild(card);
          shown++;
        });
        if (!shown) {
          grid.innerHTML = '<div class="glass repo-card skeleton-card"><p>No active repositories detected.</p></div>';
        }
        if (window.MPTilt) window.MPTilt.bind(grid);
        /* Update hero stat if present */
        var stat = document.querySelector('[data-stat-repos]');
        if (stat) stat.textContent = repos.filter(function (r) { return !r.fork; }).length;
        return repos;
      })
      .catch(function (err) {
        console.error('[github]', err);
        grid.innerHTML =
          '<div class="glass repo-card skeleton-card" style="grid-column:1/-1;">' +
          '<p style="color:#ff5470;">Failed to parse active repository sets.</p>' +
          '<p style="margin-top:10px;"><a class="broadcast-link" href="https://github.com/' + USERNAME + '" target="_blank" rel="noopener noreferrer">Open GitHub profile directly ' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></a></p></div>';
      });
  };

  GH.username = USERNAME;
})();
