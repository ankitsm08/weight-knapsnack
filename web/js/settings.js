/**
 * Settings page controller
 * Theme toggle, OLED mode.
 */

document.addEventListener("DOMContentLoaded", () => {
  const themeButtons = document.querySelectorAll("[data-theme-value]");
  const oledBtn = document.getElementById("oled-mode-btn");
  const settings = Storage.getSettings();

  const currentTheme = settings.theme || "dark";
  themeButtons.forEach((btn) => {
    if (btn.dataset.themeValue === currentTheme) {
      btn.classList.add("active");
    }
  });

  if (oledBtn) {
    oledBtn.setAttribute("aria-pressed", settings.oledMode === true);
  }

  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.themeValue;
      document.documentElement.setAttribute("data-theme", theme);
      if (window.SafeAreaBridge)
        SafeAreaBridge.setStatusBarStyle(theme === "light");
      settings.theme = theme;
      Storage.setSettings(settings);
      themeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  if (oledBtn) {
    oledBtn.addEventListener("click", () => {
      const pressed = oledBtn.getAttribute("aria-pressed") === "true";
      const next = !pressed;
      oledBtn.setAttribute("aria-pressed", next);
      if (next) {
        document.documentElement.setAttribute("data-oled", "true");
      } else {
        document.documentElement.removeAttribute("data-oled");
      }
      settings.oledMode = next;
      Storage.setSettings(settings);
    });
  }
});
