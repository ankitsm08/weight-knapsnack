/**
 * Knapsnack form handling
 * Manages bottle table, form submission, and result display
 */

/**
 * Display error message in the result section
 * @param {string} message - The error message to display
 * @returns {void}
 */
function showError(message) {
  if (!resultDiv) return;

  resultDiv.innerHTML = `
<h2 class="center h2-icon"><i data-lucide="circle-x" class="text-error"></i> &nbsp; Error</h2>
<div class="card result-card" style="text-align: left;">
    <p class="text-error" style="margin: 0;">${message}</p>
</div>
  `;

  if (window.lucide) lucide.createIcons();

  resultDiv.classList.add("show");
  setTimeout(() => {
    resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

function showLoading() {
  if (!resultDiv) return;

  resultDiv.innerHTML = `
<h2 class="center h2-icon"><i data-lucide="loader" class="text-info" style="animation: spin 1s linear infinite;"></i> &nbsp; Calculating...</h2>
<style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
  `;

  if (window.lucide) lucide.createIcons();

  resultDiv.classList.add("show");
}

/**
 * Render the result HTML template
 * @param {Object} data - Result data object
 * @returns {string} HTML string for the result
 */
function renderResult(data) {
  const sortedEntries = Object.entries(data.combo).sort(
    (a, b) => Number(b[0]) - Number(a[0]),
  );

  const comboRows = [
    `<tr><td>Bag</td><td>-</td><td>${data.bag_weight_kg.toFixed(3)} kg</td></tr>`,
    ...sortedEntries.map(
      ([weight, count]) =>
        `<tr><td>${weight} g</td><td>${count}</td><td>${((weight * count) / 1000).toFixed(3)} kg</td></tr>`,
    ),
    `<tr class="total-row"><td>Total</td><td>${data.bottles_used}</td><td>${data.total_weight_kg.toFixed(3)} kg</td></tr>`,
  ].join("");

  const weightDiff = Math.round(
    (data.total_weight_kg - data.target_weight_kg) * 1000,
  );
  const diffText =
    weightDiff === 0 ? "(=)" : `${weightDiff > 0 ? "+" : ""}${weightDiff} g`;

  const totalCardClass =
    weightDiff === 0 ? "success" : weightDiff > 0 ? "more" : "less";

  return `
<h2 class="center h2-icon"><i data-lucide="check-circle" class="text-success"></i> &nbsp; Results</h2>
<div class="result-cards">
    <div class="card result-card">
        <h4><i data-lucide="target"></i> Target</h4>
        <p>${data.target_weight_kg.toFixed(3)} kg</p>
    </div>
    <div class="card result-card">
        <h4><i data-lucide="backpack"></i> Bag</h4>
        <p>${data.bag_weight_kg.toFixed(3)} kg</p>
    </div>
    <div class="card result-card ${totalCardClass}">
        <h4><i data-lucide="scale"></i> Total</h4>
        <p>${data.total_weight_kg.toFixed(3)} kg <span class="text-muted">${diffText}</span></p>
    </div>
    <div class="card result-card">
        <h4><i data-lucide="milk"></i> Bottles</h4>
        <p>${data.bottles_used}</p>
    </div>
</div>

<div class="combo-table card">
    <h3 class="center"><i data-lucide="list"></i> Combo Details</h3>
    <table>
        <thead>
            <tr><th>Weight (g)</th><th>Count</th><th>Total (kg)</th></tr>
        </thead>
        <tbody>${comboRows}</tbody>
    </table>
</div>
  `;
}

/** @type {HTMLFormElement|null} */
const form = document.getElementById("knapsnack-form");

/** @type {HTMLElement|null} */
const resultDiv = document.getElementById("result");

/** @type {HTMLInputElement|null} */
const targetWeightInput = document.getElementById("target_weight");

/** @type {HTMLInputElement|null} */
const bagWeightInput = document.getElementById("bag_weight");

/** @type {HTMLInputElement|null} */
const allowOvershootInput = document.getElementById("allow_overshoot");

/** @type {HTMLInputElement|null} */
const overshootRatioInput = document.getElementById("overshoot_ratio");

/** @type {HTMLInputElement|null} */
const bottlePenaltyInput = document.getElementById("bottle_penalty");

/** @type {boolean} */
let isCalculating = false;

function enableSubmitButton() {
  isCalculating = false;
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = false;
}

function disableSubmitButton() {
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
}

function updateCollapsibleHeight() {
  const table = document.getElementById("bottles-table");
  if (!table) return;

  const collapsible = table.closest(".card.collapsible");
  if (!collapsible) return;

  const collapseBody = collapsible.querySelector(".collapse-body");
  if (!collapseBody) return;

  // Only update if not closed (open)
  if (!collapsible.classList.contains("closed")) {
    collapseBody.style.maxHeight = collapseBody.scrollHeight + "px";
  }
}

function updateCollapsibleHeight() {
  const table = document.getElementById("bottles-table");
  if (!table) return;

  const collapsible = table.closest(".card.collapsible");
  if (!collapsible) return;

  const collapseBody = collapsible.querySelector(".collapse-body");
  if (!collapseBody) return;

  if (!collapsible.classList.contains("closed")) {
    collapseBody.style.maxHeight = collapseBody.scrollHeight + "px";
  }
}

function addRow(weight = "", count = "") {
  const tbody = document.querySelector("#bottles-table tbody");
  if (!tbody) return;

  const row = document.createElement("tr");
  row.innerHTML = `
        <td><input type="number" step="1" value="${weight}" class="bottle-weight"></td>
        <td><input type="number" step="1" value="${count}" class="bottle-count"></td>
        <td><button type="button" class="btn-icon btn-remove-row"><i data-lucide="x"></i></button></td>
    `;
  tbody.appendChild(row);
  save_bottles();
  updateCollapsibleHeight();

  if (window.lucide) lucide.createIcons();
}

function removeRow(btn) {
  const table = document.getElementById("bottles-table");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  if (!tbody || tbody.rows.length <= 1) {
    alert("At least one bottle entry is required!");
    return;
  }

  const row = btn.closest("tr");
  if (row) {
    row.remove();
    save_bottles();
    updateCollapsibleHeight();
  }
}

/**
 * Save bottles from table to localStorage
 * @returns {{[weight: string]: number}} Bottles object {weight: count}
 */
function save_bottles() {
  const bottles = {};
  document.querySelectorAll("#bottles-table tbody tr").forEach((row) => {
    const w = parseInt(row.cells[0]?.querySelector("input")?.value);
    const c = parseInt(row.cells[1]?.querySelector("input")?.value);
    if (w && c) {
      bottles[w] = c;
    }
  });

  localStorage.setItem("knapsnack_bottles", JSON.stringify(bottles));
  return bottles;
}

function collapseIfTooManyBottles() {
  const table = document.getElementById("bottles-table");
  if (!table) return;

  const collapsible = table.closest(".collapsible");
  if (table.rows.length > 6 && collapsible) {
    collapsible.classList.add("closed");
  }
}

// Initialize persistence for inputs
if (targetWeightInput) {
  targetWeightInput.addEventListener("input", () => {
    localStorage.setItem("knapsnack_target_weight", targetWeightInput.value);
  });
}
if (bagWeightInput) {
  bagWeightInput.addEventListener("input", () => {
    localStorage.setItem("knapsnack_bag_weight", bagWeightInput.value);
  });
}
if (allowOvershootInput) {
  allowOvershootInput.addEventListener("input", () => {
    localStorage.setItem(
      "knapsnack_allow_overshoot",
      allowOvershootInput.checked,
    );
  });
}
if (overshootRatioInput) {
  overshootRatioInput.addEventListener("input", () => {
    localStorage.setItem(
      "knapsnack_overshoot_ratio",
      overshootRatioInput.value,
    );
  });
}
if (bottlePenaltyInput) {
  bottlePenaltyInput.addEventListener("input", () => {
    localStorage.setItem("knapsnack_bottle_penalty", bottlePenaltyInput.value);
  });
}

// Event delegation for bottle table
const bottlesTable = document.getElementById("bottles-table");
const addBottleBtn = document.getElementById("add-bottle-btn");

if (bottlesTable) {
  bottlesTable.addEventListener("input", (e) => {
    if (
      e.target.classList.contains("bottle-weight") ||
      e.target.classList.contains("bottle-count")
    ) {
      save_bottles();
      updateCollapsibleHeight();
    }
  });

  bottlesTable.addEventListener("click", (e) => {
    if (e.target.closest(".btn-remove-row")) {
      const btn = e.target.closest(".btn-remove-row");
      removeRow(btn);
    }
  });
}

if (addBottleBtn) {
  addBottleBtn.addEventListener("click", () => addRow());
}

// Form submission handler
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (isCalculating) return;
    isCalculating = true;
    disableSubmitButton();

    const bottles = save_bottles();
    collapseIfTooManyBottles();

    const formData = new FormData(form);

    const target_weight = parseWeight(formData.get("target_weight"));
    const target_weight_grams = target_weight * 1000;
    const bag_weight = parseBagWeight(formData.get("bag_weight") || "0");

    // Validate inputs
    if (isNaN(target_weight) || target_weight <= 0) {
      enableSubmitButton();
      showError("Please enter a valid target weight (e.g., 10, 10.5, or 20lb)");
      return;
    }
    if (isNaN(bag_weight) || bag_weight < 0) {
      enableSubmitButton();
      showError("Please enter a valid bag weight (e.g., 500 or 1kg)");
      return;
    }
    if (Object.keys(bottles).length === 0) {
      enableSubmitButton();
      showError("Please add at least one bottle to the table");
      return;
    }

    const allow_overshoot = formData.get("allow_overshoot") === "on";
    const overshoot_ratio = parseFloat(formData.get("overshoot_ratio") || 0.5);
    const bottle_penalty = parseInt(formData.get("bottle_penalty") || 50);

    // Validate overshoot ratio and penalty
    if (isNaN(overshoot_ratio) || overshoot_ratio < 0 || overshoot_ratio > 1) {
      enableSubmitButton();
      showError("Overshoot ratio must be a number between 0 and 1");
      return;
    }
    if (isNaN(bottle_penalty) || bottle_penalty < 0) {
      enableSubmitButton();
      showError("Bottle penalty must be a non-negative number");
      return;
    }

    showLoading();

    requestAnimationFrame(() => {
      setTimeout(() => {
        const result = best_combo_dp(bottles, target_weight_grams, bag_weight, {
          allow_overshoot,
          overshoot_ratio,
          bottle_penalty,
        });

        const data = {
          target_weight_kg: target_weight,
          bag_weight_kg: bag_weight / 1000,
          total_weight_kg: result.total / 1000,
          combo: result.combo,
          bottles_used: Object.values(result.combo).reduce((a, b) => a + b, 0),
        };

        if (data.error) {
          resultDiv.innerHTML = `<p class="text-error"><i data-lucide="circle-x"></i> Error: ${data.error}</p>`;
          enableSubmitButton();
        } else {
          resultDiv.innerHTML = renderResult(data);

          if (window.lucide) lucide.createIcons();

          requestAnimationFrame(() => {
            const resultCards = resultDiv.querySelector(".result-cards");
            const comboTable = resultDiv.querySelector(".combo-table");

            if (resultCards) resultCards.classList.add("show");
            if (comboTable) comboTable.classList.add("show");

            // Scroll after animation completes to show results at top
            setTimeout(() => {
              resultDiv.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
              enableSubmitButton();
            }, 400);
          });
        }
      }, 50);
    });
  });
}

// Restore saved data on page load
window.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem("knapsnack_bottles") || "{}");
  const savedTargetWeight = localStorage.getItem("knapsnack_target_weight");
  const savedBagWeight = localStorage.getItem("knapsnack_bag_weight");
  const savedAllowOvershoot = localStorage.getItem("knapsnack_allow_overshoot");
  const savedOvershootRatio = localStorage.getItem("knapsnack_overshoot_ratio");
  const savedBottlePenalty = localStorage.getItem("knapsnack_bottle_penalty");

  const tbody = document.querySelector("#bottles-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (Object.keys(saved).length > 0) {
    for (const [w, c] of Object.entries(saved)) {
      addRow(w, c);
    }
    collapseIfTooManyBottles();
  } else {
    // Add default rows without triggering persistence
    const defaults = [
      [220, 2],
      [330, 4],
      [500, 3],
      [750, 3],
      [1000, 4],
      [2000, 3],
    ];
    defaults.forEach(([w, c]) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="number" step="1" value="${w}" class="bottle-weight"></td>
        <td><input type="number" step="1" value="${c}" class="bottle-count"></td>
        <td><button type="button" class="btn-icon btn-remove-row"><i data-lucide="x"></i></button></td>
      `;
      tbody.appendChild(row);
    });
    if (window.lucide) lucide.createIcons();
  }

  if (savedTargetWeight && targetWeightInput) {
    targetWeightInput.value = savedTargetWeight;
  }
  if (savedBagWeight && bagWeightInput) {
    bagWeightInput.value = savedBagWeight;
  }
  if (savedAllowOvershoot && allowOvershootInput) {
    allowOvershootInput.checked = savedAllowOvershoot.toLowerCase() === "true";
  }
  if (savedOvershootRatio && overshootRatioInput) {
    overshootRatioInput.value = savedOvershootRatio;
  }
  if (savedBottlePenalty && bottlePenaltyInput) {
    bottlePenaltyInput.value = savedBottlePenalty;
  }
  collapseIfTooManyBottles();
});
