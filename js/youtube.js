/* ==========================================================================
   youtube.js — DeskTech broadcast feed pipeline (content-faithful upgrade)
   Same source as the original feed page (YouTube RSS via rss2json).
   Renders glass video cards with click-to-play embeds (thumbnail first for
   performance — iframes only load on user intent).
   ========================================================================== */
(function () {
  'use strict';

  var YT = (window.MPYouTube = window.MPYouTube || {});
  var CHANNEL_ID = 'UCJ097-h2m6bMtl9oHYCZjIQ';
  var CHANNEL_URL = 'https://www.youtube.com/channel/' + CHANNEL_ID;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function videoIdOf(item) {
    if (item.link && item.link.indexOf('v=') !== -1) return item.link.split('v=')[1].split('&')[0];
    if (item.guid && item.guid.indexOf('video:') !== -1) return item.guid.split('video:')[1];
    return null;
  }

  function thumbOf(item, id) {
    if (item.thumbnail) return item.thumbnail;
    if (item.enclosure && item.enclosure.link) return item.enclosure.link;
    return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
  }

  function makeCard(item, id) {
    var card = document.createElement('div');
    card.className = 'glass video-card tilt';

    var thumb = document.createElement('div');
    thumb.className = 'video-thumb';
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('tabindex', '0');
    thumb.setAttribute('aria-label', 'Play video: ' + item.title);

    var img = document.createElement('img');
    img.src = thumbOf(item, id);
    img.alt = item.title;
    img.loading = 'lazy';
    thumb.appendChild(img);

    var badge = document.createElement('span');
    badge.className = 'video-live';
    badge.textContent = 'DESKTECH';
    thumb.appendChild(badge);

    var play = document.createElement('span');
    play.className = 'play-btn';
    play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    thumb.appendChild(play);

    function embed() {
      if (thumb.querySelector('iframe')) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = item.title;
      f.setAttribute('frameborder', '0');
      f.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      f.setAttribute('allowfullscreen', '');
      thumb.innerHTML = '';
      thumb.appendChild(f);
      thumb.removeAttribute('role');
      thumb.removeAttribute('tabindex');
    }
    thumb.addEventListener('click', embed);
    thumb.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); embed(); }
    });

    var meta = document.createElement('div');
    meta.className = 'video-meta';
    meta.innerHTML =
      '<h4>' + esc(item.title) + '</h4>' +
      '<a class="broadcast-link" href="' + esc(item.link) + '" target="_blank" rel="noopener noreferrer">Watch on YouTube ' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></a>';

    card.appendChild(thumb);
    card.appendChild(meta);
    return card;
  }

  YT.load = function (gridId, maxItems) {
    var grid = document.getElementById(gridId || 'youtube-feed-grid');
    if (!grid) return Promise.resolve();
    maxItems = maxItems || 9;

    grid.innerHTML =
      '<div class="glass repo-card skeleton-card" style="grid-column:1/-1;min-height:200px;">' +
      '<p>Connecting to feed stream<span class="loader-dots"></span></p></div>';

    var rss = encodeURIComponent('https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID);
    return fetch('https://api.rss2json.com/v1/api.json?rss_url=' + rss)
      .then(function (res) {
        if (!res.ok) throw new Error('Data drop');
        return res.json();
      })
      .then(function (data) {
        grid.innerHTML = '';
        if (!data.items || !data.items.length) {
          grid.innerHTML = '<div class="glass repo-card skeleton-card" style="grid-column:1/-1;"><p>No feed broadcasts detected.</p></div>';
          return [];
        }
        data.items.slice(0, maxItems).forEach(function (item) {
          var id = videoIdOf(item);
          if (!id) return;
          grid.appendChild(makeCard(item, id));
        });
        if (window.MPTilt) window.MPTilt.bind(grid);
        return data.items;
      })
      .catch(function (err) {
        console.error('[youtube]', err);
        grid.innerHTML =
          '<div class="glass repo-card skeleton-card" style="grid-column:1/-1;">' +
          '<p style="color:#ff5470;">Failed to parse streaming feed items.</p>' +
          '<p style="margin-top:10px;"><a class="broadcast-link" href="' + CHANNEL_URL + '" target="_blank" rel="noopener noreferrer">Open DeskTech channel directly ' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></a></p></div>';
      });
  };

  YT.channelId = CHANNEL_ID;
  YT.channelUrl = CHANNEL_URL;
})();
