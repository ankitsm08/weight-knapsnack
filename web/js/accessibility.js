/**
 * Accessibility helpers
 * Focus management, screen reader announcements.
 */

/**
 * Announce a message to screen readers
 * @param {string} message
 */
function announce(message) {
  let live = document.getElementById("a11y-live");
  if (!live) {
    live = document.createElement("div");
    live.id = "a11y-live";
    live.className = "sr-only";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    document.body.appendChild(live);
  }
  live.textContent = "";
  requestAnimationFrame(() => {
    live.textContent = message;
  });
}

/**
 * Trap focus within a container
 * @param {HTMLElement} container
 * @returns {function} cleanup
 */
function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return () => {};

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handler = (e) => {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  container.addEventListener("keydown", handler);
  return () => container.removeEventListener("keydown", handler);
}
