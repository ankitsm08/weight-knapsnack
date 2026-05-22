/**
 * Style utilities and UI interactions
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initCollapsibles();
  initDynamicYear();
  initScrollMargin();
});

function initDynamicYear() {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

function initScrollMargin() {
  const nav = document.querySelector("nav");
  if (nav) {
    const navHeight = nav.offsetHeight;
    document.documentElement.style.setProperty(
      "--nav-height",
      navHeight + "px",
    );
  }
}

function initCollapsibles() {
  document.querySelectorAll(".collapse-header").forEach((header) => {
    header.addEventListener("click", () => {
      toggleCollapse(header);
    });
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleCollapse(header);
      }
    });
  });
}

function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  const nav = document.querySelector("nav");

  if (!toggle || !links || !nav) return;

  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  nav.parentNode.insertBefore(backdrop, nav.nextSibling);

  function openMenu() {
    toggle.classList.add("active");
    toggle.setAttribute("aria-expanded", "true");
    links.classList.add("active");
    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    toggle.classList.remove("active");
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("active");
    backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    if (links.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  toggle.addEventListener("click", toggleMenu);
  backdrop.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("active")) {
      closeMenu();
    }
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

function toggleCollapse(el) {
  if (!el) return;

  const card = el.closest(".card.collapsible");
  if (!card) return;

  const collapseBody = card.querySelector(".collapse-body");
  const isClosed = card.classList.contains("closed");

  if (isClosed) {
    // Opening: set max-height to actual content height
    card.classList.remove("closed");
    if (collapseBody) {
      collapseBody.style.maxHeight = collapseBody.scrollHeight + "px";
    }
    el.setAttribute("aria-expanded", "true");
  } else {
    // Closing: set max-height to 0
    card.classList.add("closed");
    if (collapseBody) {
      collapseBody.style.maxHeight = "0";
    }
    el.setAttribute("aria-expanded", "false");
  }
}
