
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.querySelector("footer");
    const gradient = document.querySelector(".footer-gradient");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                gradient.classList.add("visible");
            } else {
                gradient.classList.remove("visible");
            }
        });
    }, { threshold: 0.5 });

    if (footer && gradient) {
        observer.observe(footer);
    }


    const toggle = document.querySelector(".menu-toggle");
    const links = document.querySelector(".nav-links");

    toggle.addEventListener("click", () => {
        links.classList.toggle("active");
    });
});

function toggleCollapse(el) {
    const card = el.closest(".card.collapsible");
    card.classList.toggle("closed");
}

