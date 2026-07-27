// Copyright © 2026 ApiSpi
// Docs behaviours: collapsible sidebar sections + click-to-copy for code
// blocks and key inline values.

// Collapsible sidebar nav groups. State persists per section title; the
// section containing the current page always starts expanded.
(function () {
  var KEY = 'apispi-docs-nav-collapsed';
  var collapsed = {};
  try { collapsed = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}

  document.querySelectorAll('.sidebar .nav-group').forEach(function (group) {
    var title = group.querySelector('.nav-group-title');
    if (!title) return;
    var name = title.textContent.trim();
    var hasActive = !!group.querySelector('.nav-link.active');

    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.setAttribute('aria-expanded', 'true');

    function setCollapsed(on, persist) {
      group.classList.toggle('collapsed', on);
      title.setAttribute('aria-expanded', on ? 'false' : 'true');
      if (persist) {
        collapsed[name] = on;
        try { localStorage.setItem(KEY, JSON.stringify(collapsed)); } catch (e) {}
      }
    }

    if (collapsed[name] && !hasActive) setCollapsed(true, false);

    function toggle() { setCollapsed(!group.classList.contains('collapsed'), true); }
    title.addEventListener('click', toggle);
    title.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
})();

(function () {
  var COPY_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  var CHECK_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="20 6 9 17 4 12"></polyline></svg>';

  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text); done(); });
    } else {
      legacyCopy(text);
      done();
    }
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* best effort */ }
    document.body.removeChild(ta);
  }

  function flash(btn, label) {
    var original = btn.innerHTML;
    btn.innerHTML = CHECK_ICON + (label ? '<span>Copied</span>' : '');
    btn.classList.add('copied');
    setTimeout(function () {
      btn.innerHTML = original;
      btn.classList.remove('copied');
    }, 1600);
  }

  // 1. Copy button on every code block.
  document.querySelectorAll('pre').forEach(function (pre) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.title = 'Copy to clipboard';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.innerHTML = COPY_ICON + '<span>Copy</span>';
    btn.addEventListener('click', function () {
      var code = pre.querySelector('code');
      copyText((code || pre).innerText.replace(/\n$/, ''), function () { flash(btn, true); });
    });
    pre.appendChild(btn);
  });

  // 2. Copy icon on key inline values users must transcribe: URLs, env-var
  //    names, and endpoint paths shown in table cells.
  document.querySelectorAll('td code, li code').forEach(function (code) {
    var text = code.textContent.trim();
    var copyable =
      /^https?:\/\//.test(text) ||                      // URLs
      /^\/(api|oauth|\.well-known|dashboard|openapi|models|clients|llm-gateway|pricing)\b/.test(text) || // endpoint paths
      /^[A-Z][A-Z0-9_]{4,}=?$/.test(text) ||            // env-var names
      /^~\/[^ ]+$/.test(text);                          // config file paths
    if (!copyable || text.length < 6) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-chip';
    btn.title = 'Copy “' + text + '”';
    btn.setAttribute('aria-label', 'Copy ' + text + ' to clipboard');
    btn.innerHTML = COPY_ICON;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      copyText(text, function () { flash(btn, false); });
    });
    code.insertAdjacentElement('afterend', btn);
  });
})();
