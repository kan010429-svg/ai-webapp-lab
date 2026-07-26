/* Browser Toys — cyber / lab theme switcher (zero deps) */
(function () {
  'use strict';
  var KEY = 'bt-theme';
  var DEFAULT = 'cyber';
  var VALID = { cyber: 1, lab: 1 };

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v && VALID[v]) return v;
    } catch (e) {}
    return DEFAULT;
  }

  function syncButtons(theme) {
    var nodes = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < nodes.length; i++) {
      var btn = nodes[i];
      var on = btn.getAttribute('data-theme-toggle') === theme;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function apply(theme, persist) {
    if (!VALID[theme]) theme = DEFAULT;
    document.documentElement.setAttribute('data-theme', theme);
    if (persist !== false) {
      try { localStorage.setItem(KEY, theme); } catch (e) {}
    }
    syncButtons(theme);
    try {
      document.dispatchEvent(new CustomEvent('bt:theme', { detail: { theme: theme } }));
    } catch (e) {}
  }

  // Early apply (also safe if called again after DOM ready)
  apply(read(), false);

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    syncButtons(read());
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
      if (!btn) return;
      e.preventDefault();
      apply(btn.getAttribute('data-theme-toggle'), true);
    });
  });

  window.BTTheme = {
    get: read,
    set: function (theme) { apply(theme, true); },
    toggle: function () {
      apply(read() === 'lab' ? 'cyber' : 'lab', true);
    }
  };
})();
