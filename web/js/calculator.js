/**
 * Calculator page controller
 * Form handling, profile integration, DP invocation, result display, history.
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("knapsnack-form");
  const resultDiv = document.getElementById("result");
  const historySection = document.getElementById("history-section");
  const profileSelect = document.getElementById("profile-select");
  const targetWeightInput = document.getElementById("target_weight");
  const bagWeightInput = document.getElementById("bag_weight");
  const allowOvershootInput = document.getElementById("allow_overshoot");
  const overshootRatioInput = document.getElementById("overshoot_ratio");
  const bottlePenaltyInput = document.getElementById("bottle_penalty");

  let isCalculating = false;
  let currentBottles = {};

  function enableSubmitButton() {
    isCalculating = false;
    const btn = form?.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false;
  }

  function disableSubmitButton() {
    isCalculating = true;
    const btn = form?.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
  }

  function showError(message) {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
<h2 class="center h2-icon"><i data-lucide="circle-x" class="text-error"></i> &nbsp; Error</h2>
<div class="card result-card" style="text-align: left;">
    <p class="text-error" style="margin: 0;">${message}</p>
</div>`;
    UI.renderIcons();
    resultDiv.classList.add("show");
    setTimeout(() => {
      resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function showLoading() {
    if (!resultDiv) return;
    resultDiv.innerHTML = `
<h2 class="center h2-icon"><i data-lucide="loader" class="text-info spin"></i> &nbsp; Calculating...</h2>`;
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
</div>`;
  }

  function initProfileSelector() {
    const profiles = Storage.getProfiles();
    profileSelect.innerHTML = "";

    for (const p of profiles.items) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      opt.selected = p.id === profiles.currentProfileId;
      profileSelect.appendChild(opt);
    }

    // Preserve manual target/bag when switching profiles
    let savedTarget = "";
    let savedBag = "";

    profileSelect.addEventListener("change", () => {
      savedTarget = targetWeightInput?.value || "";
      savedBag = bagWeightInput?.value || "";
      loadProfile(profileSelect.value, savedTarget, savedBag);
    });
  }

  function loadProfile(profileId, preserveTarget, preserveBag) {
    Storage.setCurrentProfileId(profileId);
    const profile = Storage.getCurrentProfile();
    if (!profile) return;

    currentBottles = Storage.flattenBottleMap(profile.bottles);

    if (targetWeightInput)
      targetWeightInput.value = preserveTarget ?? targetWeightInput.value ?? "";
    if (allowOvershootInput)
      allowOvershootInput.checked = profile.defaults.allowOvershoot;
    if (bagWeightInput)
      bagWeightInput.placeholder = profile.defaults.bagWeight
        ? `${profile.defaults.bagWeight}`
        : "0g";
    if (bagWeightInput)
      bagWeightInput.value = preserveBag ?? bagWeightInput.value ?? "";
    if (overshootRatioInput)
      overshootRatioInput.placeholder = `${profile.defaults.overshootRatio ?? 0.5}`;
    if (bottlePenaltyInput)
      bottlePenaltyInput.placeholder = `${profile.defaults.bottlePenalty ?? 50}`;

    // Update profile-select to match
    if (profileSelect) profileSelect.value = profileId;
  }

  function renderHistory() {
    if (!historySection) return;
    const history = Storage.getHistory();
    const header = historySection.querySelector(".collapse-header");
    let label = header?.querySelector("label");
    if (label) label.textContent = `Calculation History (${history.length})`;

    // Clear history button
    let clearBtn = header?.querySelector(".history-clear-btn");
    if (history.length > 0) {
      if (!clearBtn) {
        clearBtn = document.createElement("button");
        clearBtn.className = "history-clear-btn";
        clearBtn.textContent = "Clear";
        clearBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          Storage.saveHistory([]);
          renderHistory();
        });
        const arrow = header?.querySelector(".collapse-arrow");
        header?.insertBefore(clearBtn, arrow);
      }
    } else if (clearBtn) {
      clearBtn.remove();
    }

    const body = historySection.querySelector(".collapse-body");
    if (!body) return;

    if (history.length === 0) {
      body.innerHTML = '<p class="history-empty">No calculations yet</p>';
      return;
    }

    body.innerHTML = history
      .slice()
      .reverse()
      .slice(0, 20)
      .map((entry) => {
        const diff = entry.result.total - entry.inputs.targetWeight * 1000;
        const diffG = Math.round(diff);
        const diffClass = diffG === 0 ? "match" : diffG > 0 ? "over" : "under";
        const diffText =
          diffG === 0 ? "0 g" : `${diffG > 0 ? "+" : ""}${diffG} g`;

        return `<div class="history-entry" data-index="${history.indexOf(entry)}">
  <span class="history-time">${formatRelativeTime(entry.timestamp)}</span>
  <span class="history-target">${entry.inputs.targetWeight} kg</span>
  <span class="history-diff ${diffClass}">${diffText}</span>
</div>`;
      })
      .join("");

    // Click handler to re-load an entry
    body.querySelectorAll(".history-entry").forEach((el) => {
      el.addEventListener("click", () => {
        const entry = history[el.dataset.index];
        if (!entry) return;

        if (profileSelect) profileSelect.value = entry.profileId;
        loadProfile(
          entry.profileId,
          entry.inputs.targetWeight,
          entry.inputs.bagWeight,
        );

        // Override non-default fields from the entry
        if (overshootRatioInput)
          overshootRatioInput.value = entry.inputs.overshootRatio;
        if (bottlePenaltyInput)
          bottlePenaltyInput.value = entry.inputs.bottlePenalty;
        if (allowOvershootInput)
          allowOvershootInput.checked = entry.inputs.allowOvershoot;

        form?.requestSubmit();
      });
    });
  }

  function addHistoryEntry(targetWeight, bagWeight, result, options) {
    const profile = Storage.getCurrentProfile();
    const history = Storage.getHistory();
    history.push({
      timestamp: Date.now(),
      profileId: profile?.id || "",
      inputs: {
        targetWeight,
        bagWeight,
        overshootRatio: options.overshoot_ratio,
        bottlePenalty: options.bottle_penalty,
        allowOvershoot: options.allow_overshoot,
        maxBottles: null,
        maxBottlesHard: true,
      },
      result: {
        combo: result.combo,
        total: result.total,
      },
    });
    Storage.saveHistory(history);
    renderHistory();
  }

  // -- Profile selector --
  if (profileSelect) initProfileSelector();

  // -- Form submission --
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isCalculating) return;
      isCalculating = true;
      disableSubmitButton();

      const formData = new FormData(form);
      const targetWeight = parseWeight(formData.get("target_weight"));
      const targetWeightGrams = targetWeight * 1000;

      const profile = Storage.getCurrentProfile();
      const rawBag = formData.get("bag_weight");
      const bagWeight = parseBagWeight(
        rawBag && rawBag.trim() ? rawBag : profile?.defaults?.bagWeight || "0",
      );

      if (isNaN(targetWeight) || targetWeight <= 0) {
        enableSubmitButton();
        showError(
          "Please enter a valid target weight (e.g., 10, 10.5, or 20lb)",
        );
        return;
      }
      if (isNaN(bagWeight) || bagWeight < 0) {
        enableSubmitButton();
        showError("Please enter a valid bag weight (e.g., 500 or 1kg)");
        return;
      }
      if (!profile) {
        enableSubmitButton();
        showError("No profile selected. Select or create a profile first.");
        return;
      }
      if (Object.keys(currentBottles).length === 0) {
        enableSubmitButton();
        showError("No bottles available. Add bottles in your profile.");
        return;
      }

      const allowOvershoot = formData.get("allow_overshoot") === "on";
      const rawRatio = formData.get("overshoot_ratio");
      const overshootRatio = parseFloat(
        rawRatio && rawRatio.trim()
          ? rawRatio
          : (profile.defaults.overshootRatio ?? 0.5),
      );
      const rawPenalty = formData.get("bottle_penalty");
      const bottlePenalty = parseInt(
        rawPenalty && rawPenalty.trim()
          ? rawPenalty
          : (profile.defaults.bottlePenalty ?? 50),
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
              currentBottles,
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

            resultDiv.innerHTML = renderResult(data);
            UI.renderIcons();

            addHistoryEntry(targetWeight, bagWeight, result, {
              allow_overshoot: allowOvershoot,
              overshoot_ratio: overshootRatio,
              bottle_penalty: bottlePenalty,
            });

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

  // -- Load current profile on init --
  const profile = Storage.getCurrentProfile();
  if (profile) {
    loadProfile(profile.id);
  } else {
    showError("No profile found. Create one on the Profiles page.");
    if (profileSelect) {
      profileSelect.innerHTML = '<option value="">No profiles</option>';
    }
  }

  // -- Wrap number inputs --
  if (targetWeightInput) UI.wrapNumberInput(targetWeightInput);
  if (bagWeightInput) UI.wrapNumberInput(bagWeightInput);
  if (overshootRatioInput) UI.wrapNumberInput(overshootRatioInput);
  if (bottlePenaltyInput) UI.wrapNumberInput(bottlePenaltyInput);

  // -- Render history --
  renderHistory();

  UI.initTooltips();
  function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }
});
