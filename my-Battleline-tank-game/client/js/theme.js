/* ============================================================
   theme.js — Dark / Light mode toggle with localStorage persistence
   Must be loaded in <head> to avoid flash of wrong theme.
   ============================================================ */

(function () {
  // Apply theme immediately (before paint) to avoid flash
  const saved = localStorage.getItem('tf_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('tf_theme', theme);
  // Update all toggle buttons on the page
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

// Bind all .theme-toggle buttons once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});
