/**
 * Knapsnack form handling
 * Manages bottle table, form submission, and result display
 */

/** @type {HTMLFormElement|null} */
const form = document.getElementById("knapsnack-form");

/** @type {HTMLElement|null} */
const resultDiv = document.getElementById("result");

/** @type {HTMLInputElement|null} */
const bagWeightInput = document.getElementById("bag_weight");

/**
 * Add a new bottle row to the table
 * @param {string} weight - Bottle weight in grams
 * @param {string} count - Number of bottles
 * @returns {void}
 */
function addRow(weight = "", count = "") {
  const tbody = document.querySelector("#bottles-table tbody");
  if (!tbody) return;

  const row = document.createElement("tr");
  row.innerHTML = `
        <td><input type="number" step="1" value="${weight}" oninput="save_bottles()"></td>
        <td><input type="number" step="1" value="${count}" oninput="save_bottles()"></td>
        <td><button type="button" onclick="removeRow(this)" class="btn-icon"><i data-lucide="x"></i></button></td>
    `;
  tbody.appendChild(row);
  save_bottles();

  if (window.lucide) lucide.createIcons();
}

/**
 * Remove a bottle row from the table
 * @param {HTMLButtonElement} btn - The delete button that was clicked
 * @returns {void}
 */
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
  }
}

/**
 * Save bottles from table to localStorage
 * @returns {Object.<string, number>} Bottles object {weight: count}
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

/**
 * Collapse bottle table if too many entries
 * @returns {void}
 */
function collapseIfTooManyBottles() {
  const table = document.getElementById("bottles-table");
  if (!table) return;

  const collapsible = table.closest(".collapsible");
  if (table.rows.length > 6 && collapsible) {
    collapsible.classList.add("closed");
  }
}

// Initialize bag weight persistence
if (bagWeightInput) {
  bagWeightInput.addEventListener("input", () => {
    localStorage.setItem("knapsnack_bag_weight", bagWeightInput.value);
  });
}

// Form submission handler
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const bottles = save_bottles();
    collapseIfTooManyBottles();

    const formData = new FormData(form);

    const target_weight = parseWeight(formData.get("target_weight"));
    const target_weight_grams = target_weight * 1000;
    const bag_weight = parseBagWeight(formData.get("bag_weight") || "0");

    const allow_overshoot = formData.get("allow_overshoot") === "on";
    const overshoot_ratio = parseFloat(formData.get("overshoot_ratio") || 0.5);
    const bottle_penalty = parseInt(formData.get("bottle_penalty") || 50);

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
    } else {
      // Sort combo by weight (descending)
      const sortedEntries = Object.entries(data.combo).sort(
        (a, b) => Number(b[0]) - Number(a[0]),
      );

      let comboRows = sortedEntries.map(
        ([weight, count]) =>
          `<tr><td>${weight} g</td><td>${count}</td><td>${((weight * count) / 1000).toFixed(3)} kg</td></tr>`,
      );

      comboRows.unshift(
        `<tr><td>Bag</td><td>-</td><td>${data.bag_weight_kg.toFixed(3)} kg</td></tr>`,
      );

      comboRows.push(
        `<tr class="total-row"><td>Total</td><td>${data.bottles_used}</td><td>${data.total_weight_kg.toFixed(3)} kg</td></tr>`,
      );

      comboRows = comboRows.join("");

      const weightDiff = Math.round(
        (data.total_weight_kg - data.target_weight_kg) * 1000,
      );
      const diffText =
        weightDiff === 0
          ? "(=)"
          : `${weightDiff > 0 ? "+" : ""}${weightDiff} g`;

      const totalCardClass =
        weightDiff === 0 ? "success" : weightDiff > 0 ? "more" : "less";

      resultDiv.innerHTML = `
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
      if (window.lucide) lucide.createIcons();

      const resultCards = resultDiv.querySelector(".result-cards");
      const comboTable = resultDiv.querySelector(".combo-table");

      if (resultCards) resultCards.classList.add("show");
      if (comboTable) comboTable.classList.add("show");

      // Auto-scroll to results
      setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  });
}

// Restore saved data on page load
window.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem("knapsnack_bottles") || "{}");
  const savedBagWeight = localStorage.getItem("knapsnack_bag_weight");

  const tbody = document.querySelector("#bottles-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (Object.keys(saved).length > 0) {
    for (const [w, c] of Object.entries(saved)) {
      addRow(w, c);
    }
    collapseIfTooManyBottles();
  } else {
    // Default bottles
    addRow(220, 2);
    addRow(330, 4);
    addRow(500, 3);
    addRow(750, 3);
    addRow(1000, 4);
    addRow(2000, 3);
  }

  if (savedBagWeight && bagWeightInput) {
    bagWeightInput.value = savedBagWeight;
  }
  collapseIfTooManyBottles();
});
