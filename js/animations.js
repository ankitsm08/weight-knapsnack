/**
 * Animation utilities for page transitions and text effects
 * Text scramble animation + page reveal (runs every time)
 */

/**
 * Generate a random character for scramble effect
 * @returns {string} - Random character
 */
function getRandomChar() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return chars.charAt(Math.floor(Math.random() * chars.length));
}

/**
 * Scramble text animation
 * @param {HTMLElement} element - Element to animate
 * @param {string} targetText - Final text to display
 * @param {number} duration - Animation duration in ms
 * @returns {Promise<void>} - Resolves when animation completes
 */
function scrambleText(element, targetText, duration = 800) {
  const chars = targetText.split(/( |<br>)/);
  const isSpecial = (s) => s === " " || s === "<br>";
  const totalChars = chars.reduce(
    (sum, c) => (isSpecial(c) ? sum : sum + c.length),
    0,
  );
  let iterations = 0;
  const maxIterations = totalChars * 3;
  const interval = duration / maxIterations;

  return new Promise((resolve) => {
    const displayText = () => {
      let result = "";
      let charIdx = 0;
      for (let i = 0; i < chars.length; i++) {
        const chunk = chars[i];
        if (isSpecial(chunk)) {
          result += chunk;
        } else {
          for (let j = 0; j < chunk.length; j++) {
            if (charIdx < iterations / 3) {
              result += chunk[j];
            } else {
              result += getRandomChar();
            }
            charIdx++;
          }
        }
      }
      element.innerHTML = result;

      iterations++;
      if (iterations < maxIterations) {
        setTimeout(displayText, interval);
      } else {
        element.innerHTML = targetText;
        resolve();
      }
    };

    displayText();
  });
}

// Run page transition overlay - called immediately from head
async function runPageTransition() {
  const isMobile = window.innerWidth < 768;
  let titleText = document.title.replace(" - Weight Knapsnack", "");
  if (isMobile) {
    titleText = titleText.replace(/ /g, "<br>");
  }

  const overlay = document.createElement("div");
  overlay.id = "animation-overlay";
  overlay.innerHTML = `
    <div class="animation-container">
      <h1 id="anim-title" class="anim-title">${titleText}</h1>
    </div>
  `;
  document.body.insertBefore(overlay, document.body.firstChild);

  const titleElement = overlay.querySelector("#anim-title");

  const chars = titleText.split(/( |<br>)/);
  let scrambled = "";
  for (const char of chars) {
    if (char === " " || char === "<br>") {
      scrambled += char;
    } else {
      for (let i = 0; i < char.length; i++) {
        scrambled += getRandomChar();
      }
    }
  }
  titleElement.innerHTML = scrambled;

  const timeFactor = Math.sqrt(titleText.length);
  await new Promise((r) => setTimeout(r, 150));
  await scrambleText(titleElement, titleText, parseInt(timeFactor * 133));
  await new Promise((r) => setTimeout(r, parseInt(timeFactor * 100)));

  overlay.classList.add("slide-out");

  await new Promise((resolve) => {
    overlay.addEventListener("transitionend", resolve, { once: true });
  });

  overlay.remove();
}

// Add scroll-triggered reveal animations to elements
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    },
    { threshold: 0.1 },
  );

  document.querySelectorAll(".card, section").forEach((el) => {
    el.classList.add("scroll-reveal");
    observer.observe(el);
  });
}

// Initialize scroll animations when DOM is ready
function initAnimations() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}

// Run page transition - use MutationObserver to catch body as soon as it's added
function startPageTransition() {
  if (document.body) {
    runPageTransition();
    return;
  }

  const observer = new MutationObserver((mutations, obs) => {
    if (document.body) {
      obs.disconnect();
      runPageTransition();
    }
  });

  observer.observe(document.documentElement, { childList: true });
}

startPageTransition();

// Initialize scroll animations on DOM ready
initAnimations();
