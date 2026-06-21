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
      btn.setAttribute("aria-checked", "true");
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
      themeButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
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

  // -- Unit toggles --
  const unitCycles = {
    targetWeight: ["kg", "lb"],
    bagWeight: ["g", "kg", "lb"],
    bottleWeight: ["g", "kg", "lb"],
  };
  settings.units = settings.units || {};
  document.querySelectorAll(".unit-toggle").forEach((btn) => {
    const field = btn.dataset.field;
    btn.textContent = settings.units[field] || unitCycles[field][0];
    btn.addEventListener("click", () => {
      const cycle = unitCycles[field];
      const idx = cycle.indexOf(btn.textContent);
      const next = cycle[(idx + 1) % cycle.length];
      btn.textContent = next;
      settings.units[field] = next;
      Storage.setSettings(settings);
    });
  });

  // -- Data management --
  document.querySelectorAll(".data-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      switch (btn.dataset.action) {
        case "export":
          DataManager.exportSettings();
          break;
        case "export-all":
          DataManager.exportFull();
          break;
        case "import":
          DataManager.importData();
          break;
      }
    });
  });
});
