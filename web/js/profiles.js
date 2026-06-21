/**
 * Profiles page controller
 * Profile CRUD, bottle table editor, defaults management.
 */

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  initProfilesPage();
});

function initProfilesPage() {
  loadProfileList();
  document
    .getElementById("new-profile-btn")
    .addEventListener("click", handleCreateProfile);
  document
    .getElementById("duplicate-profile-btn")
    .addEventListener("click", handleDuplicateProfile);
  document.getElementById("profile-list").addEventListener("click", (e) => {
    const li = e.target.closest("[data-profile-id]");
    if (li) selectProfile(li.dataset.profileId);
  });
  document
    .getElementById("profile-mobile-select")
    .addEventListener("change", (e) => {
      if (e.target.value) selectProfile(e.target.value);
    });
}

function loadProfileList() {
  const profiles = Storage.getProfiles();
  const list = document.getElementById("profile-list");
  const select = document.getElementById("profile-mobile-select");

  list.innerHTML = "";
  select.innerHTML = "";

  for (const p of profiles.items) {
    const li = document.createElement("li");
    li.className =
      "profile-list-item" +
      (p.id === profiles.currentProfileId ? " active" : "");
    li.dataset.profileId = p.id;
    li.setAttribute("role", "tab");
    li.setAttribute("aria-selected", p.id === profiles.currentProfileId);
    li.textContent = p.name;
    list.appendChild(li);

    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    opt.selected = p.id === profiles.currentProfileId;
    select.appendChild(opt);
  }

  const current = Storage.getCurrentProfile();
  if (current) {
    renderProfileContent(current);
  } else {
    document.getElementById("profile-content").innerHTML =
      '<p class="text-muted">Select or create a profile to get started.</p>';
  }
}

function selectProfile(id) {
  Storage.setCurrentProfileId(id);
  document.querySelectorAll(".profile-list-item").forEach((li) => {
    const active = li.dataset.profileId === id;
    li.classList.toggle("active", active);
    li.setAttribute("aria-selected", active);
  });
  document.getElementById("profile-mobile-select").value = id;
  const current = Storage.getCurrentProfile();
  if (current) renderProfileContent(current);
}

function handleCreateProfile() {
  UI.showModal({
    title: "New Profile",
    body: '<label for="new-profile-name">Profile name</label><input type="text" id="new-profile-name" class="modal-input" value="" placeholder="My Profile">',
    confirmText: "Create",
    onConfirm: () => {
      const input = document.getElementById("new-profile-name");
      const name = input?.value.trim() || "New Profile";
      createProfile(name);
    },
  });

  requestAnimationFrame(() => {
    const input = document.getElementById("new-profile-name");
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function createProfile(name) {
  const profiles = Storage.getProfiles();
  if (profiles.items.some((p) => p.name === name)) {
    UI.showToast({ message: "A profile with that name already exists", type: "warning" });
    return;
  }
  const id = Storage._generateId();
  const bwUnit = (Storage.getSettings().units || {}).bottleWeight || "g";
  const factor = bwUnit === "kg" ? 0.001 : bwUnit === "lb" ? 1 / 453.6 : 1;
  const bottles = {};
  for (const [w, c] of [[220, 2], [330, 4], [500, 3], [750, 3], [1000, 4], [2000, 3]]) {
    const stored = parseFloat((w * factor).toFixed(3));
    if (stored > 0) bottles[String(stored)] = { count: c, excluded: false };
  }
  profiles.items.push({
    id,
    name,
    bottles,
    defaults: {
      bagWeight: "",
      overshootRatio: 0.5,
      bottlePenalty: 50,
      allowOvershoot: true,
      maxBottles: null,
      maxBottlesHard: true,
    },
  });
  profiles.currentProfileId = id;
  Storage.saveProfiles(profiles);
  loadProfileList();
}

function renameProfile(id, newName) {
  if (!newName.trim()) return;
  const profiles = Storage.getProfiles();
  if (profiles.items.some((p) => p.name === newName && p.id !== id)) {
    UI.showToast({ message: "A profile with that name already exists", type: "warning" });
    return;
  }
  const profile = profiles.items.find((p) => p.id === id);
  if (profile) {
    profile.name = newName.trim();
    Storage.saveProfiles(profiles);
    loadProfileList();
  }
}

async function deleteProfile(id) {
  const profiles = Storage.getProfiles();
  if (profiles.items.length <= 1) {
    UI.showToast({
      message: "Cannot delete the only profile",
      type: "warning",
    });
    return;
  }

  const confirmed = await UI.showConfirm({
    message: "Delete this profile? This cannot be undone.",
    confirmText: "Delete",
    danger: true,
  });

  if (!confirmed) return;

  profiles.items = profiles.items.filter((p) => p.id !== id);
  if (profiles.currentProfileId === id) {
    profiles.currentProfileId = profiles.items[0].id;
  }
  Storage.saveProfiles(profiles);
  loadProfileList();
}

function handleDuplicateProfile() {
  const profiles = Storage.getProfiles();

  const options = profiles.items
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join("");

  const currentId = profiles.currentProfileId;
  const currentName = profiles.items.find((p) => p.id === currentId)?.name || "";

  UI.showModal({
    title: "Duplicate Profile",
    body: `<label for="dup-source-profile">Source profile</label>
<select id="dup-source-profile" class="modal-input">${options}</select>
<label for="dup-profile-name">New name</label>
<input type="text" id="dup-profile-name" class="modal-input" value="${escapeHtml(currentName)} - Copy">`,
    confirmText: "Duplicate",
    onConfirm: () => {
      const sourceId = document.getElementById("dup-source-profile")?.value;
      const name = document.getElementById("dup-profile-name")?.value.trim();
      if (!sourceId || !name) return;
      duplicateProfile(sourceId, name);
    },
  });

  document.getElementById("dup-source-profile").value = currentId;

  requestAnimationFrame(() => {
    const input = document.getElementById("dup-profile-name");
    if (input) { input.focus(); input.select(); }
  });
}

function duplicateProfile(sourceId, newName) {
  const profiles = Storage.getProfiles();
  if (profiles.items.some((p) => p.name === newName)) {
    UI.showToast({ message: "A profile with that name already exists", type: "warning" });
    return;
  }
  const source = profiles.items.find((p) => p.id === sourceId);
  if (!source) return;
  const id = Storage._generateId();
  profiles.items.push({ ...JSON.parse(JSON.stringify(source)), id, name: newName });
  profiles.currentProfileId = id;
  Storage.saveProfiles(profiles);
  loadProfileList();
}

function renderProfileContent(profile) {
  const container = document.getElementById("profile-content");
  const bwUnit = (Storage.getSettings().units || {}).bottleWeight || "g";

  container.innerHTML = `
<div class="card">
  <div class="profile-name-row">
    <h2 id="profile-name-display">${escapeHtml(profile.name)}</h2>
    <div class="profile-actions">
      <button type="button" class="btn btn-small" id="rename-profile-btn"><i data-lucide="pencil"></i> Rename</button>
      <button type="button" class="btn btn-small btn-danger" id="delete-profile-btn"><i data-lucide="trash-2"></i> Delete</button>
    </div>
  </div>
</div>

<div class="card">
  <h3 class="h3-icon"><i data-lucide="settings"></i> Defaults </h3>
  <div class="defaults-grid">
    <div class="card card-compact">
      <label for="defaults_bag_weight"><i data-lucide="backpack"></i> Bag Weight <span class="unit-label">(${(Storage.getSettings().units || {}).bagWeight || "g"})</span><span class="info-icon" tabindex="0" data-tooltip="Weight of your empty backpack. &lt;br&gt; (optional - leave 0) &lt;br&gt; if you only want bottle weights)"><i data-lucide="info"></i></span></label>
      <input type="text" id="defaults_bag_weight" value="${escapeHtml(profile.defaults.bagWeight)}" placeholder="0g">
    </div>
    <div class="card card-compact">
      <label for="defaults_overshoot_ratio"><i data-lucide="sliders"></i> Overshoot Ratio<span class="info-icon" tabindex="0" data-tooltip="How much extra weight is okay? &lt;br&gt; Lower = stricter, &lt;br&gt; Higher = more flexible. &lt;br&gt; (range - 0 to 1.0, default - 0.5)"><i data-lucide="info"></i></span></label>
      <input type="number" step="0.1" id="defaults_overshoot_ratio" value="${profile.defaults.overshootRatio}" placeholder="0.5">
    </div>
    <div class="card card-compact">
      <label for="defaults_bottle_penalty"><i data-lucide="minus-circle"></i> Bottle Penalty<span class="info-icon" tabindex="0" data-tooltip="Prefer fewer bottles? &lt;br&gt; Higher = prefer fewer bottles &lt;br&gt; (default - 50)"><i data-lucide="info"></i></span></label>
      <input type="number" step="10" id="defaults_bottle_penalty" value="${profile.defaults.bottlePenalty}" placeholder="50">
    </div>
    <div class="card card-compact checkbox-cell">
      <label class="checkbox-label">
        <input type="checkbox" id="defaults_allow_overshoot"${profile.defaults.allowOvershoot ? " checked" : ""}>
        <i data-lucide="trending-up"></i> Allow overshoot
        <span class="info-icon" tabindex="0" data-tooltip="Allow the final weight be slightly more than your target. &lt;br&gt; (default - checked)"><i data-lucide="info"></i></span>
      </label>
    </div>
  </div>
</div>

<div class="card">
  <h3 class="h3-icon"><i data-lucide="milk"></i> Bottle Inventory</h3>
  <div class="bottle-table">
    <table id="profiles-bottles-table">
      <thead>
        <tr><th></th><th>Weight (${bwUnit})</th><th>Count</th><th></th></tr>
      </thead>
      <tbody></tbody>
    </table>
    <button type="button" class="btn btn-small center add-bottle"><i data-lucide="plus"></i> Add Bottle</button>
  </div>
</div>`;

  // Populate bottle table
  const tbody = container.querySelector("#profiles-bottles-table tbody");
  const bottleEntries = Object.entries(profile.bottles);
  if (bottleEntries.length > 0) {
    for (const [w, entry] of bottleEntries) {
      UI.addTableRow(tbody, w, entry.count, entry.excluded);
    }
  }

  // Event handlers
  container
    .querySelector("#rename-profile-btn")
    .addEventListener("click", () => {
      startInlineRename(profile.id);
    });

  container
    .querySelector("#delete-profile-btn")
    .addEventListener("click", () => {
      deleteProfile(profile.id);
    });

  // Wrap number inputs
  const bagInput = container.querySelector("#defaults_bag_weight");
  const ratioInput = container.querySelector("#defaults_overshoot_ratio");
  const penaltyInput = container.querySelector("#defaults_bottle_penalty");
  if (bagInput) UI.wrapNumberInput(bagInput);
  if (ratioInput) UI.wrapNumberInput(ratioInput);
  if (penaltyInput) UI.wrapNumberInput(penaltyInput);

  // Add bottle button
  container.querySelector(".add-bottle").addEventListener("click", () => {
    UI.addTableRow(tbody);
    saveBottleTable();
  });

  // Bottle table event delegation
  const table = container.querySelector("#profiles-bottles-table");
  let _saveTimer;
  table.addEventListener("input", () => {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => saveBottleTable(), 300);
  });
  table.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remove-row");
    if (btn) {
      UI.removeTableRow(btn, tbody);
      saveBottleTable();
    }
  });

  // Defaults form auto-save
  const defaultsFields = [
    "defaults_bag_weight",
    "defaults_overshoot_ratio",
    "defaults_bottle_penalty",
    "defaults_allow_overshoot",
  ];
  for (const id of defaultsFields) {
    const el = container.querySelector(`#${id}`);
    if (el) {
      el.addEventListener("input", () => saveDefaults());
      el.addEventListener("change", () => saveDefaults());
    }
  }

  UI.renderIcons();
  UI.initTooltips();
}

function startInlineRename(profileId) {
  const display = document.getElementById("profile-name-display");
  const currentName = display.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "rename-input";
  input.value = currentName;
  input.setAttribute("aria-label", "Profile name");

  display.replaceWith(input);
  input.focus();
  input.select();

  const finish = (save) => {
    const val = input.value.trim();
    if (save && val && val !== currentName) {
      renameProfile(profileId, val);
    } else {
      loadProfileList();
    }
  };

  input.addEventListener("blur", () => finish(true));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  });
}

function saveBottleTable() {
  const tbody = document.querySelector("#profiles-bottles-table tbody");
  if (!tbody) return;
  const bottles = UI.readTableData(tbody);
  Storage.updateCurrentProfile({ bottles });
}

function saveDefaults() {
  const bagWeight = document.getElementById("defaults_bag_weight")?.value || "";
  const _r = parseFloat(document.getElementById("defaults_overshoot_ratio")?.value);
  const overshootRatio = Number.isFinite(_r) ? _r : 0.5;
  const _p = parseInt(document.getElementById("defaults_bottle_penalty")?.value, 10);
  const bottlePenalty = Number.isFinite(_p) ? _p : 50;
  const allowOvershoot =
    document.getElementById("defaults_allow_overshoot")?.checked ?? false;

  Storage.updateCurrentProfile({
    defaults: {
      bagWeight,
      overshootRatio,
      bottlePenalty,
      allowOvershoot,
      maxBottles: null,
      maxBottlesHard: true,
    },
  });
}
