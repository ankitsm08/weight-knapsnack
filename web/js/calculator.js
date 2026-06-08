/**
 * Calculator page controller
 * Form handling, bottle table CRUD, DP invocation, result display.
 * Depends on: Storage, UI, parseWeight, parseBagWeight, best_combo_dp
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("knapsnack-form");
  const resultDiv = document.getElementById("result");
  const targetWeightInput = document.getElementById("target_weight");
  const bagWeightInput = document.getElementById("bag_weight");
  const allowOvershootInput = document.getElementById("allow_overshoot");
  const overshootRatioInput = document.getElementById("overshoot_ratio");
  const bottlePenaltyInput = document.getElementById("bottle_penalty");
  const bottlesTable = document.getElementById("bottles-table");
  const addBottleBtn = document.getElementById("add-bottle-btn");

  let isCalculating = false;

  function enableSubmitButton() {
    isCalculating = false;
    const btn = form?.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false;
  }

  function disableSubmitButton() {
    const btn = form?.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
  }

  function showError(message) {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
<h2 class="center h2-icon"><i data-lucide="circle-x" class="text-error"></i> &nbsp; Error</h2>
<div class="card result-card" style="text-align: left;">
    <p class="text-error" style="margin: 0;">${message}</p>
</div>
    `;
    UI.renderIcons();
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
    UI.renderIcons();
    resultDiv.classList.add("show");
  }

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
<h2 class="center h2-icon"><i data-lucide="check-circle" class="text-success"></i> Results</h2>
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
    saveTableToStorage();

    const weightInput = row.querySelector(".bottle-weight");
    const countInput = row.querySelector(".bottle-count");
    if (weightInput) UI.wrapNumberInput(weightInput);
    if (countInput) UI.wrapNumberInput(countInput);

    UI.renderIcons();
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
      saveTableToStorage();
    }
  }

  function saveTableToStorage() {
    const bottles = {};
    document.querySelectorAll("#bottles-table tbody tr").forEach((row) => {
      const w = parseInt(row.cells[0]?.querySelector("input")?.value, 10);
      const c = parseInt(row.cells[1]?.querySelector("input")?.value, 10);
      if (w > 0 && c > 0) {
        bottles[w] = c;
      }
    });
    Storage.setBottles(bottles);
    return bottles;
  }

  function collapseIfTooManyBottles() {
    const table = document.getElementById("bottles-table");
    if (!table) return;
    const collapsible = table.closest(".card.collapsible");
    if (!collapsible) return;
    const collapseBody = collapsible.querySelector(".collapse-body");
    const collapseHeader = collapsible.querySelector(".collapse-header");
    if (!collapseBody || !collapseHeader) return;

    if (table.rows.length > 3 && !collapsible.classList.contains("closed")) {
      collapseBody.style.height = collapseBody.scrollHeight + "px";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          collapseBody.style.height = "0px";
          collapsible.classList.add("closed");
          collapseHeader.ariaExpanded = "false";
        });
      });
    }
  }

  // -- Persistence: save form fields on input --
  if (targetWeightInput) {
    targetWeightInput.addEventListener("input", () => {
      Storage.setTargetWeight(targetWeightInput.value);
    });
  }
  if (bagWeightInput) {
    bagWeightInput.addEventListener("input", () => {
      Storage.setBagWeight(bagWeightInput.value);
    });
  }
  if (allowOvershootInput) {
    allowOvershootInput.addEventListener("input", () => {
      Storage.setAllowOvershoot(allowOvershootInput.checked);
    });
  }
  if (overshootRatioInput) {
    overshootRatioInput.addEventListener("input", () => {
      Storage.setOvershootRatio(overshootRatioInput.value);
    });
  }
  if (bottlePenaltyInput) {
    bottlePenaltyInput.addEventListener("input", () => {
      Storage.setBottlePenalty(bottlePenaltyInput.value);
    });
  }

  // -- Bottle table event delegation --
  if (bottlesTable) {
    bottlesTable.addEventListener("input", (e) => {
      if (
        e.target.classList.contains("bottle-weight") ||
        e.target.classList.contains("bottle-count")
      ) {
        saveTableToStorage();
      }
    });

    bottlesTable.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-remove-row");
      if (btn) removeRow(btn);
    });
  }

  if (addBottleBtn) {
    addBottleBtn.addEventListener("click", () => addRow());
  }

  // -- Form submission --
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isCalculating) return;
      isCalculating = true;
      disableSubmitButton();

      const bottles = saveTableToStorage();
      const formData = new FormData(form);
      const targetWeight = parseWeight(formData.get("target_weight"));
      const targetWeightGrams = targetWeight * 1000;
      const bagWeight = parseBagWeight(formData.get("bag_weight") || "0");

      if (isNaN(targetWeight) || targetWeight <= 0) {
        enableSubmitButton();
        showError("Please enter a valid target weight (e.g., 10, 10.5, or 20lb)");
        return;
      }
      if (isNaN(bagWeight) || bagWeight < 0) {
        enableSubmitButton();
        showError("Please enter a valid bag weight (e.g., 500 or 1kg)");
        return;
      }
      if (Object.keys(bottles).length === 0) {
        enableSubmitButton();
        showError("Please add at least one bottle to the table");
        return;
      }

      const allowOvershoot = formData.get("allow_overshoot") === "on";
      const overshootRatio = parseFloat(formData.get("overshoot_ratio") || 0.5);
      const bottlePenalty = parseInt(
        formData.get("bottle_penalty") || 50,
        10,
      );

      if (isNaN(overshootRatio) || overshootRatio < 0 || overshootRatio > 1) {
        enableSubmitButton();
        showError("Overshoot ratio must be a number between 0 and 1");
        return;
      }
      if (isNaN(bottlePenalty) || bottlePenalty < 0) {
        enableSubmitButton();
        showError("Bottle penalty must be a non-negative number");
        return;
      }

      showLoading();

      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            const result = best_combo_dp(
              bottles,
              targetWeightGrams,
              bagWeight,
              {
                allow_overshoot: allowOvershoot,
                overshoot_ratio: overshootRatio,
                bottle_penalty: bottlePenalty,
              },
            );

            const data = {
              target_weight_kg: targetWeight,
              bag_weight_kg: bagWeight / 1000,
              total_weight_kg: result.total / 1000,
              combo: result.combo,
              bottles_used: Object.values(result.combo).reduce(
                (a, b) => a + b,
                0,
              ),
            };

            collapseIfTooManyBottles();
            resultDiv.innerHTML = renderResult(data);
            UI.renderIcons();

            requestAnimationFrame(() => {
              setTimeout(() => {
                const resultCards = resultDiv.querySelector(".result-cards");
                const comboTable = resultDiv.querySelector(".combo-table");
                if (resultCards) resultCards.classList.add("show");
                if (comboTable) comboTable.classList.add("show");

                resultDiv.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                enableSubmitButton();
              }, 300);
            });
          } catch (err) {
            enableSubmitButton();
            showError("Calculation failed. Please check your inputs.");
          }
        }, 50);
      });
    });
  }

  // -- Restore saved data --
  const saved = Storage.getBottles();
  const tbody = document.querySelector("#bottles-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (Object.keys(saved).length > 0) {
    for (const [w, c] of Object.entries(saved)) {
      addRow(w, c);
    }
    collapseIfTooManyBottles();
  } else {
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
      const weightInput = row.querySelector(".bottle-weight");
      const countInput = row.querySelector(".bottle-count");
      if (weightInput) UI.wrapNumberInput(weightInput);
      if (countInput) UI.wrapNumberInput(countInput);
    });
    UI.renderIcons();
  }

  const savedTargetWeight = Storage.getTargetWeight();
  const savedBagWeight = Storage.getBagWeight();
  const savedAllowOvershoot = Storage.getAllowOvershoot();
  const savedOvershootRatio = Storage.getOvershootRatio();
  const savedBottlePenalty = Storage.getBottlePenalty();

  if (savedTargetWeight && targetWeightInput) {
    targetWeightInput.value = savedTargetWeight;
  }
  if (savedBagWeight && bagWeightInput) {
    bagWeightInput.value = savedBagWeight;
  }
  if (savedAllowOvershoot && allowOvershootInput) {
    allowOvershootInput.checked =
      savedAllowOvershoot.toLowerCase() === "true";
  }
  if (savedOvershootRatio && overshootRatioInput) {
    overshootRatioInput.value = savedOvershootRatio;
  }
  if (savedBottlePenalty && bottlePenaltyInput) {
    bottlePenaltyInput.value = savedBottlePenalty;
  }

  collapseIfTooManyBottles();

  if (targetWeightInput) UI.wrapNumberInput(targetWeightInput);
  if (bagWeightInput) UI.wrapNumberInput(bagWeightInput);
  if (overshootRatioInput) UI.wrapNumberInput(overshootRatioInput);
  if (bottlePenaltyInput) UI.wrapNumberInput(bottlePenaltyInput);

  UI.initTooltips();
});
