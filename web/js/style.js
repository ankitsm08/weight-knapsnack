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
  if (!collapseBody) return;

  const isClosed = card.classList.contains("closed");

  if (isClosed) {
    card.classList.remove("closed");
    collapseBody.style.height = "0";
    void collapseBody.offsetHeight;
    collapseBody.style.height = collapseBody.scrollHeight + "px";

    const onEnd = () => {
      collapseBody.style.height = "auto";
      collapseBody.removeEventListener("transitionend", onEnd);
    };
    collapseBody.addEventListener("transitionend", onEnd);
    el.setAttribute("aria-expanded", "true");
  } else {
    collapseBody.style.height = collapseBody.scrollHeight + "px";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        collapseBody.style.height = "0px";
        card.classList.add("closed");
        el.setAttribute("aria-expanded", "false");
      });
    });
  }
}
