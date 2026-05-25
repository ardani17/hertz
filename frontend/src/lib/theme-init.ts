/**
 * Inline script string for theme initialization.
 *
 * Injected into <head> via dangerouslySetInnerHTML to run synchronously
 * before React hydration, preventing flash of wrong theme (FOWT).
 *
 * - Reads the user's stored preference from localStorage ("hertz-theme")
 * - Validates the value is "dark" or "light"
 * - Falls back to "dark" if no valid value or localStorage is unavailable
 * - Sets data-theme and the matching class on <html> accordingly
 */
export const themeInitScript = `(function() {
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.classList.toggle('light', t === 'light');
  }
  try {
    var t = localStorage.getItem('hertz-theme') || localStorage.getItem('horizon-theme');
    if (t === 'light' || t === 'dark') {
      localStorage.setItem('hertz-theme', t);
      localStorage.removeItem('horizon-theme');
      applyTheme(t);
    } else {
      applyTheme('dark');
    }
  } catch(e) {
    applyTheme('dark');
  }
})();`;
