document.addEventListener('DOMContentLoaded', function () {
  var isHomepage = !!document.querySelector('.nsu-hero-search-target');

  // ── Copy link button + read time (article pages only) ───────
  if (!isHomepage) {
    var h1 = document.querySelector('.md-content__inner > h1');
    if (h1) {
      // Copy link button
      var btn = document.createElement('button');
      btn.className = 'nsu-copy-link';
      btn.title = 'Copy link to this page';
      btn.textContent = 'Copy link';
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(window.location.href).then(function () {
          btn.textContent = '✓ Copied!';
          btn.classList.add('nsu-copy-link--copied');
          setTimeout(function () {
            btn.textContent = 'Copy link';
            btn.classList.remove('nsu-copy-link--copied');
          }, 2000);
        });
      });
      h1.appendChild(btn);

      // Read time
      var articleEl = document.querySelector('.md-content__inner');
      if (articleEl) {
        var words = (articleEl.innerText || '').trim().split(/\s+/).length;
        var mins  = Math.max(1, Math.ceil(words / 200));
        var meta  = document.createElement('p');
        meta.className = 'nsu-read-time';
        meta.textContent = mins + ' min read';
        h1.insertAdjacentElement('afterend', meta);
      }
    }
  }

  // ── Related articles (article pages only, not section landings) ──
  if (!isHomepage) {
    var isSection = !!document.querySelector('.nsu-cards');
    if (!isSection) {
      // Build a list of all nav links from the sidebar, grouped by section
      var allNavLinks = Array.from(document.querySelectorAll('.md-nav--primary .md-nav__link'));
      var currentPath = window.location.pathname;

      // Find the section that contains the current page
      var siblings = [];
      var inSection = false;
      var sectionLinks = [];

      // Walk nav items to find siblings (articles in the same section)
      var navItems = Array.from(document.querySelectorAll('.md-nav--primary .md-nav__item'));
      navItems.forEach(function (item) {
        var link = item.querySelector(':scope > .md-nav__link');
        if (!link) return;
        var href = link.getAttribute('href') || '';
        // Resolve relative href to full path
        var abs = new URL(href, window.location.href).pathname;
        if (abs === currentPath) {
          inSection = true;
        }
      });

      // Simpler approach: use the nav links that share the same parent nav section
      // Find the active nav item's parent section
      var activeLink = document.querySelector('.md-nav__link--active, .md-nav__item--active > .md-nav__link');
      if (activeLink) {
        // Go up to find the parent nav list
        var parentNav = activeLink.closest('.md-nav:not(.md-nav--primary)');
        if (parentNav) {
          var links = Array.from(parentNav.querySelectorAll('.md-nav__link'));
          links.forEach(function (l) {
            var href = l.getAttribute('href');
            if (!href || href === '#') return;
            var abs = new URL(href, window.location.href).pathname;
            if (abs !== currentPath && l.textContent.trim()) {
              siblings.push({ title: l.textContent.trim(), href: href });
            }
          });
        }
      }

      // Pick up to 3 siblings (shuffle-ish: take from end to vary the selection)
      if (siblings.length > 0) {
        var picks = siblings.slice(0, 3);
        var content = document.querySelector('.md-content__inner');
        if (content) {
          var rel = document.createElement('div');
          rel.className = 'nsu-related';
          rel.innerHTML = '<h3>Related articles</h3>' +
            '<ul>' +
            picks.map(function (p) {
              return '<li><a href="' + p.href + '"><span>' + p.title + '</span><span class="nsu-related__arrow" aria-hidden="true"></span></a></li>';
            }).join('') +
            '</ul>';
          content.appendChild(rel);
        }
      }
    }
  }

  // ── Floating "Was this helpful?" feedback ────────────────────
  if (!isHomepage) {
    var isSection = !!document.querySelector('.nsu-cards');
    if (!isSection) {
      var title  = document.title.replace(' - NSU Help Centre', '').trim();
      var url    = window.location.href;
      var email  = 'su.marketing@northumbria.ac.uk';

      var yesHref = 'mailto:' + email
        + '?subject=' + encodeURIComponent('✓ Helpful: ' + title)
        + '&body=' + encodeURIComponent('Article: ' + url + '\n\nThis article was helpful.');

      var noHref  = 'mailto:' + email
        + '?subject=' + encodeURIComponent('✗ Not helpful: ' + title)
        + '&body=' + encodeURIComponent('Article: ' + url + '\n\nThis article was not helpful.\n\nWhat could be improved?\n');

      var widget = document.createElement('aside');
      widget.className = 'nsu-feedback';
      widget.setAttribute('aria-label', 'Article feedback');
      widget.innerHTML =
        '<span class="nsu-feedback__question">Was this helpful?</span>' +
        '<div class="nsu-feedback__buttons">' +
          '<a class="nsu-feedback__btn" href="' + yesHref + '">👍 Yes</a>' +
          '<a class="nsu-feedback__btn" href="' + noHref  + '">👎 No</a>' +
        '</div>' +
        '<button class="nsu-feedback__close" aria-label="Dismiss">×</button>';

      document.body.appendChild(widget);

      widget.querySelector('.nsu-feedback__close').addEventListener('click', function () {
        widget.style.display = 'none';
      });
    }
  }

  // ── Homepage: custom search ────────────────────────────────
  if (!isHomepage) return;

  document.body.classList.add('nsu-homepage');

  var heroTarget = document.querySelector('.nsu-hero-search-target');

  heroTarget.innerHTML =
    '<div class="nsu-search-wrapper">' +
      '<div class="nsu-search-form">' +
        '<svg class="nsu-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>' +
        '</svg>' +
        '<input type="search" class="nsu-search-input" placeholder="Search help articles..." autocomplete="off">' +
      '</div>' +
      '<div class="nsu-search-results" hidden></div>' +
    '</div>';

  var input    = heroTarget.querySelector('.nsu-search-input');
  var dropdown = heroTarget.querySelector('.nsu-search-results');
  var docs     = null;

  function stripHtml(s) { return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

  fetch('search/search_index.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { docs = data.docs || []; })
    .catch(function () {});

  input.addEventListener('input', function () {
    var query = this.value.trim();
    if (!query || !docs) { dropdown.hidden = true; return; }

    var terms = query.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) { dropdown.hidden = true; return; }

    var seen = new Set();
    var hits = docs.filter(function (doc) {
      var base = (doc.location || '').split('#')[0];
      if (!base || !doc.title || seen.has(base)) return false;
      var hay = (doc.title + ' ' + stripHtml(doc.text)).toLowerCase();
      if (!terms.every(function (t) { return hay.includes(t); })) return false;
      seen.add(base);
      return true;
    }).slice(0, 8);

    if (!hits.length) {
      dropdown.innerHTML = '<p class="nsu-search-empty">No results for <strong>' + query + '</strong></p>';
    } else {
      dropdown.innerHTML = hits.map(function (doc) {
        var base    = (doc.location || '').split('#')[0];
        var excerpt = stripHtml(doc.text).substring(0, 120);
        return '<a class="nsu-search-result" href="' + base + '">' +
          '<span class="nsu-result-title">' + doc.title + '</span>' +
          (excerpt ? '<span class="nsu-result-excerpt">' + excerpt + '…</span>' : '') +
          '</a>';
      }).join('');
    }
    dropdown.hidden = false;
  });

  document.addEventListener('click', function (e) {
    if (!heroTarget.contains(e.target)) dropdown.hidden = true;
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { dropdown.hidden = true; input.blur(); }
  });
});
