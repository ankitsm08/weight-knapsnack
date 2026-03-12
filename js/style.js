/**
 * Style utilities and UI interactions
 * Handles mobile menu and collapsible sections
 */

document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
});

/**
 * Initialize mobile navigation menu toggle
 * @returns {void}
 */
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
        links.classList.add("active");
        backdrop.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeMenu() {
        toggle.classList.remove("active");
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

/**
 * Toggle collapsible card section
 * @param {HTMLElement} el - The element that was clicked (usually the header)
 * @returns {void}
 */
function toggleCollapse(el) {
    if (!el) return;
    
    const card = el.closest(".card.collapsible");
    if (card) {
        card.classList.toggle("closed");
    }
}
