var ChessTrainer = window.ChessTrainer || {};

(function (ns) {
  "use strict";

  var STORAGE_KEY = 'chess_trainer_theme';

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}
    updateButton(mode);
  }

  function toggle() {
    var current = getTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
    return getTheme();
  }

  function updateButton(mode) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.textContent = mode === 'dark' ? '🌙' : '☀️';
  }

  function init() {
    var saved = 'light';
    try {
      saved = localStorage.getItem(STORAGE_KEY) || 'light';
    } catch (e) {}
    setTheme(saved);
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggle);
    }
  }

  ns.Theme = {
    get: getTheme,
    set: setTheme,
    toggle: toggle,
    init: init
  };

})(ChessTrainer);
