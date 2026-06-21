/**
 * Calculator page controller
 * Form handling, profile integration, DP invocation, result display, history.
 */

const KG_TO_LB = 0.4536;

function fmtNum(num, decimals) {
  const n = Number(num);
  if (isNaN(n)) return String(num);
  return parseFloat(n.toFixed(decimals === undefined ? 3 : decimals)).toString();
}

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
  const maxBottlesInput = document.getElementById("max_bottles");

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

  function renderResult(data, unitPrefs) {
    unitPrefs = unitPrefs || {};
    const tUnit = unitPrefs.targetWeight || "kg";
    const bUnit = unitPrefs.bagWeight || "g";
    const bwUnit = unitPrefs.bottleWeight || "g";

    const _fmt = (kg, unit) =>
      unit === "lb" ? `${fmtNum(kg / KG_TO_LB)} lb` : `${fmtNum(kg)} kg`;
    const _fmtBag = (kg) =>
      bUnit === "lb" ? `${fmtNum(kg / KG_TO_LB)} lb`
        : bUnit === "kg" ? `${fmtNum(kg)} kg`
          : `${(kg * 1000).toFixed(0)} g`;
    const _diffText = (diffG) =>
      diffG === 0 ? "(=)"
        : tUnit === "lb"
          ? `${diffG > 0 ? "+" : ""}${fmtNum(diffG / (KG_TO_LB * 1000))} lb`
          : `${diffG > 0 ? "+" : ""}${Math.round(diffG)} g`;

    const sortedEntries = Object.entries(data.combo).sort(
      (a, b) => Number(b[0]) - Number(a[0]),
    );

    const comboRows = [
      `<tr><td>Bag</td><td>-</td><td>${_fmtBag(data.bag_weight_kg)}</td></tr>`,
      ...sortedEntries.map(
        ([weight, count]) =>
          `<tr><td>${weight} ${bwUnit}</td><td>${count}</td><td>${_fmt(Number(weight) * count * data.kgPerBw, tUnit)}</td></tr>`,
      ),
      `<tr class="total-row"><td>Total</td><td>${data.bottles_used}</td><td>${_fmt(data.total_weight_kg, tUnit)}</td></tr>`,
    ].join("");

    const weightDiff = Math.round(
      (data.total_weight_kg - data.target_weight_kg) * 1000,
    );

    const totalCardClass =
      weightDiff === 0 ? "success" : weightDiff > 0 ? "more" : "less";

    return `
<h2 class="center h2-icon" tabindex="-1"><i data-lucide="check-circle" class="text-success"></i> Results</h2>
<div class="result-cards">
    <div class="card result-card">
        <h4><i data-lucide="target"></i> Target</h4>
        <p>${_fmt(data.target_weight_kg, tUnit)}</p>
    </div>
    <div class="card result-card">
        <h4><i data-lucide="backpack"></i> Bag</h4>
        <p>${_fmtBag(data.bag_weight_kg)}</p>
    </div>
    <div class="card result-card ${totalCardClass}">
        <h4><i data-lucide="scale"></i> Total</h4>
        <p>${_fmt(data.total_weight_kg, tUnit)} <span class="text-muted">${_diffText(weightDiff)}</span></p>
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
            <tr><th>Weight (${bwUnit})</th><th>Count</th><th>${tUnit === "lb" ? "Total (lb)" : "Total (kg)"}</th></tr>
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
    const label = header?.querySelector("label");
    if (label) label.textContent = `Calculation History (${history.length})`;

    _setupClearBtn(header, history.length);
    const body = historySection.querySelector(".collapse-body");
    if (!body) return;

    if (history.length === 0) {
      body.innerHTML = '<p class="history-empty">No calculations yet</p>';
      return;
    }

    body.innerHTML = _renderHistoryItems(history);
    body.querySelectorAll(".history-entry").forEach((el) => {
      el.addEventListener("click", () => {
        const entry = history[el.dataset.index];
        if (!entry) return;

        const cUnit = (Storage.getSettings().units || {}).targetWeight || "kg";
        const value = _convertTargetForReplay(entry, cUnit);

        if (profileSelect) profileSelect.value = entry.profileId;
        loadProfile(entry.profileId, value, entry.inputs.bagWeight);

        if (overshootRatioInput)
          overshootRatioInput.value = entry.inputs.overshootRatio;
        if (bottlePenaltyInput)
          bottlePenaltyInput.value = entry.inputs.bottlePenalty;
        if (allowOvershootInput)
          allowOvershootInput.checked = entry.inputs.allowOvershoot;
        if (maxBottlesInput)
          maxBottlesInput.value = entry.inputs.maxBottles ?? "";

        form?.requestSubmit();
      });
    });
  }

  function _setupClearBtn(header, count) {
    let clearBtn = header?.querySelector(".history-clear-btn");
    if (count > 0) {
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
  }

  function _renderHistoryItems(history) {
    return history
      .slice()
      .reverse()
      .slice(0, 20)
      .map((entry) => {
        const raw = entry.inputs.rawTargetWeight;
        const eUnit = entry.inputs.targetUnit || "kg";
        const hasExplicit = raw && /(?:kg|g|lb)$/i.test(raw.trim());
        const displayTarget = hasExplicit
          ? raw
          : fmtNum(raw || entry.inputs.targetWeight) + " " + (eUnit === "lb" ? "lb" : "kg");

        const diff = entry.result.total - entry.inputs.targetWeight * 1000;
        const diffClass = diff === 0 ? "match" : diff > 0 ? "over" : "under";
        const diffText = diff === 0
          ? "0"
          : eUnit === "lb"
            ? `${diff > 0 ? "+" : ""}${fmtNum(diff / (KG_TO_LB * 1000))}`
            : `${diff > 0 ? "+" : ""}${Math.round(diff)}`;
        const diffLabel = eUnit === "lb" ? "lb" : "g";

        return `<div class="history-entry" data-index="${history.indexOf(entry)}">
  <span class="history-time">${formatRelativeTime(entry.timestamp)}</span>
  <span class="history-target">${displayTarget}</span>
  <span class="history-diff ${diffClass}">${diffText} ${diffLabel}</span>
</div>`;
      })
      .join("");
  }

  function _convertTargetForReplay(entry, currentUnit) {
    const raw = entry.inputs.rawTargetWeight;
    const eUnit = entry.inputs.targetUnit || "kg";
    const parts = raw && raw.match(/^([\d.]+)\s*(kg|g|lb)?$/i);

    let num = parts ? parseFloat(parts[1]) : parseFloat(raw || entry.inputs.targetWeight);
    if (isNaN(num)) return String(entry.inputs.targetWeight);

    // Convert from stored unit to kg
    if (parts && parts[2]) {
      const pu = parts[2].toLowerCase();
      if (pu === "lb") num = num * KG_TO_LB;
      else if (pu === "g") num = num / 1000;
    } else if (eUnit === "lb") {
      num = num * KG_TO_LB;
    }
    if (currentUnit === "lb") num = num / KG_TO_LB;

    return fmtNum(num);
  }

  function addHistoryEntry(targetWeight, bagWeight, result, options, targetUnit, rawTargetWeight, kgPerBw) {
    const profile = Storage.getCurrentProfile();
    const history = Storage.getHistory();
    history.push({
      timestamp: Date.now(),
      profileId: profile?.id || "",
      inputs: {
        targetWeight,
        bagWeight,
        targetUnit: targetUnit || "kg",
        rawTargetWeight: rawTargetWeight || String(targetWeight),
        overshootRatio: options.overshoot_ratio,
        bottlePenalty: options.bottle_penalty,
        allowOvershoot: options.allow_overshoot,
        maxBottles: options.max_bottles || null,
      },
      result: {
        combo: result.combo,
        total: Math.round(result.total * (kgPerBw || 1) * 1000),
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
      const units = (Storage.getSettings().units) || {};
      const targetWeight = parseWeight(formData.get("target_weight"), units.targetWeight);

      const profile = Storage.getCurrentProfile();
      const rawBag = formData.get("bag_weight");
      const bagWeight = parseBagWeight(
        rawBag && rawBag.trim() ? rawBag : profile?.defaults?.bagWeight || "0",
        units.bagWeight,
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

      const rawMax = formData.get("max_bottles");
      const maxBottles = parseInt(rawMax && rawMax.trim() ? rawMax : 0, 10,
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
            const bwU = units.bottleWeight || "g";
            const kgToBw = bwU === "g" ? 1000 : bwU === "lb" ? 1 / KG_TO_LB : 1;
            const gToBw = bwU === "g" ? 1 : bwU === "lb" ? 1 / (KG_TO_LB * 1000) : 0.001;
            const kgPerBw = bwU === "g" ? 0.001 : bwU === "lb" ? KG_TO_LB : 1;

            const result = best_combo_dp(
              currentBottles,
              Math.round(targetWeight * kgToBw),
              Math.round(bagWeight * gToBw),
              {
                allow_overshoot: allowOvershoot,
                overshoot_ratio: overshootRatio,
                bottle_penalty: bottlePenalty,
                max_bottles: maxBottles,
              },
            );

            const data = {
              target_weight_kg: targetWeight,
              bag_weight_kg: bagWeight / 1000,
              total_weight_kg: result.total * kgPerBw,
              combo: result.combo,
              bottles_used: Object.values(result.combo).reduce(
                (a, b) => a + b,
                0,
              ),
              kgPerBw,
            };

            resultDiv.innerHTML = renderResult(data, units);
            UI.renderIcons();

            addHistoryEntry(targetWeight, bagWeight, result, {
              allow_overshoot: allowOvershoot,
              overshoot_ratio: overshootRatio,
              bottle_penalty: bottlePenalty,
              max_bottles: maxBottles,
            }, units.targetWeight, formData.get("target_weight"), kgPerBw);

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
                const resultHeading = resultDiv.querySelector("h2");
                if (resultHeading) resultHeading.focus();
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

  // -- Update unit labels --
  const unitPrefs = (Storage.getSettings().units) || {};
  const targetLabel = document.getElementById("target-unit-label");
  const bagLabel = document.getElementById("bag-unit-label");
  if (targetLabel) targetLabel.textContent = `(${unitPrefs.targetWeight || "kg"})`;
  if (bagLabel) bagLabel.textContent = `(${unitPrefs.bagWeight || "g"})`;

  // -- Wrap number inputs --
  if (targetWeightInput) UI.wrapNumberInput(targetWeightInput);
  if (bagWeightInput) UI.wrapNumberInput(bagWeightInput);
  if (overshootRatioInput) UI.wrapNumberInput(overshootRatioInput);
  if (bottlePenaltyInput) UI.wrapNumberInput(bottlePenaltyInput);
  if (maxBottlesInput) UI.wrapNumberInput(maxBottlesInput);

  // -- Clear overrides button --
  const clearBtn = document.getElementById("clear-overrides-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (targetWeightInput) targetWeightInput.value = "";
      if (bagWeightInput) bagWeightInput.value = "";
      if (overshootRatioInput) overshootRatioInput.value = "";
      if (bottlePenaltyInput) bottlePenaltyInput.value = "";
      if (maxBottlesInput) maxBottlesInput.value = "";
    });
  }

  // -- Render history --
  renderHistory();

  UI.initTooltips();
});
