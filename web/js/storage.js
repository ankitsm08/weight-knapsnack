/**
 * localStorage abstraction layer
 * Single source of truth for all data persistence.
 * Keys kept stable for backward compatibility with existing user data.
 */

const Storage = {
  KEYS: {
    BOTTLES: "knapsnack_bottles",
    TARGET_WEIGHT: "knapsnack_target_weight",
    BAG_WEIGHT: "knapsnack_bag_weight",
    ALLOW_OVERSHOOT: "knapsnack_allow_overshoot",
    OVERSHOOT_RATIO: "knapsnack_overshoot_ratio",
    BOTTLE_PENALTY: "knapsnack_bottle_penalty",
    HISTORY: "knapsnack_history",
    SETTINGS: "knapsnack_settings",
    PROFILES: "knapsnack_profiles",
  },

  /** @returns {Object.<string, number>} */
  getBottles() {
    return JSON.parse(localStorage.getItem(this.KEYS.BOTTLES) || "{}");
  },

  /** @param {Object.<string, number>} bottles */
  setBottles(bottles) {
    localStorage.setItem(this.KEYS.BOTTLES, JSON.stringify(bottles));
  },

  /** @returns {string|null} */
  getTargetWeight() {
    return localStorage.getItem(this.KEYS.TARGET_WEIGHT);
  },

  /** @param {string} val */
  setTargetWeight(val) {
    localStorage.setItem(this.KEYS.TARGET_WEIGHT, val);
  },

  /** @returns {string|null} */
  getBagWeight() {
    return localStorage.getItem(this.KEYS.BAG_WEIGHT);
  },

  /** @param {string} val */
  setBagWeight(val) {
    localStorage.setItem(this.KEYS.BAG_WEIGHT, val);
  },

  /** @returns {string|null} */
  getAllowOvershoot() {
    return localStorage.getItem(this.KEYS.ALLOW_OVERSHOOT);
  },

  /** @param {boolean} val */
  setAllowOvershoot(val) {
    localStorage.setItem(this.KEYS.ALLOW_OVERSHOOT, String(val));
  },

  /** @returns {string|null} */
  getOvershootRatio() {
    return localStorage.getItem(this.KEYS.OVERSHOOT_RATIO);
  },

  /** @param {string} val */
  setOvershootRatio(val) {
    localStorage.setItem(this.KEYS.OVERSHOOT_RATIO, val);
  },

  /** @returns {string|null} */
  getBottlePenalty() {
    return localStorage.getItem(this.KEYS.BOTTLE_PENALTY);
  },

  /** @param {string} val */
  setBottlePenalty(val) {
    localStorage.setItem(this.KEYS.BOTTLE_PENALTY, val);
  },

  /** @returns {Object} */
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS) || "{}");
    } catch {
      return {};
    }
  },

  /** @param {Object} settings */
  setSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  // -- Profile system --

  /** @returns {string} */
  _generateId() {
    if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  },

  /**
   * Flatten a BottleMap to {weight: count} format the DP expects.
   * Excludes bottles marked as excluded.
   * @param {Object<string, {count: number, excluded?: boolean}>} bottleMap
   * @returns {Object<string, number>}
   */
  flattenBottleMap(bottleMap) {
    const flat = {};
    for (const [w, entry] of Object.entries(bottleMap)) {
      if (!entry.excluded) flat[w] = entry.count;
    }
    return flat;
  },

  /**
   * @returns {Object} ProfilesData — { currentProfileId, items[] }
   */
  getProfiles() {
    const raw = localStorage.getItem(this.KEYS.PROFILES);
    if (raw === null) {
      this.migrateFromOldStorage();
      return JSON.parse(localStorage.getItem(this.KEYS.PROFILES));
    }
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(this.KEYS.PROFILES);
      this.migrateFromOldStorage();
      return JSON.parse(localStorage.getItem(this.KEYS.PROFILES));
    }
  },

  /** @param {Object} data */
  saveProfiles(data) {
    localStorage.setItem(this.KEYS.PROFILES, JSON.stringify(data));
  },

  /**
   * @returns {Object|null} current ProfileItem, or null if not found
   */
  getCurrentProfile() {
    const profiles = this.getProfiles();
    return (
      profiles.items.find((p) => p.id === profiles.currentProfileId) || null
    );
  },

  /** @param {string} id */
  setCurrentProfileId(id) {
    const profiles = this.getProfiles();
    profiles.currentProfileId = id;
    this.saveProfiles(profiles);
  },

  /**
   * Partial merge into the current profile item.
   * @param {Object} updates
   */
  updateCurrentProfile(updates) {
    const profiles = this.getProfiles();
    const idx = profiles.items.findIndex(
      (p) => p.id === profiles.currentProfileId,
    );
    if (idx === -1) return;
    profiles.items[idx] = { ...profiles.items[idx], ...updates };
    this.saveProfiles(profiles);
  },

  // -- History --

  /** @returns {Array} */
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.HISTORY) || "[]");
    } catch {
      return [];
    }
  },

  /** @param {Array} history — max 50 entries */
  saveHistory(history) {
    const capped = history.slice(-50);
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(capped));
  },

  // -- Migration --

  /**
   * Migrate old flat localStorage keys into a Default profile.
   * Leaves old keys intact for rollback safety.
   * @returns {boolean} true if migration ran
   */
  migrateFromOldStorage() {
    if (localStorage.getItem(this.KEYS.PROFILES) !== null) return false;

    const oldBottles = JSON.parse(
      localStorage.getItem(this.KEYS.BOTTLES) || "{}",
    );

    const _migrateRatio = parseFloat(
      localStorage.getItem(this.KEYS.OVERSHOOT_RATIO),
    );
    const _migratePenalty = parseInt(
      localStorage.getItem(this.KEYS.BOTTLE_PENALTY),
      10,
    );
    const _migrateAllow = localStorage.getItem(this.KEYS.ALLOW_OVERSHOOT);

    const defaults = {
      bagWeight: localStorage.getItem(this.KEYS.BAG_WEIGHT) || "",
      overshootRatio: Number.isFinite(_migrateRatio) ? _migrateRatio : 0.5,
      bottlePenalty: Number.isFinite(_migratePenalty) ? _migratePenalty : 50,
      allowOvershoot:
        _migrateAllow === null ? true : _migrateAllow.toLowerCase() === "true",
    };

    const bottles = {};
    for (const [w, c] of Object.entries(oldBottles)) {
      if (Number(w) > 0 && Number(c) > 0) {
        bottles[w] = { count: Number(c), excluded: false };
      }
    }

    if (Object.keys(bottles).length === 0) {
      const settings = this.getSettings();
      const bwUnit = (settings.units || {}).bottleWeight || "g";
      const factor = bwUnit === "kg" ? 0.001 : bwUnit === "lb" ? 1 / 453.6 : 1;
      const defaultEntries = [
        [220, 2],
        [330, 4],
        [500, 3],
        [750, 3],
        [1000, 4],
        [2000, 3],
      ];
      for (const [w, c] of defaultEntries) {
        const stored = parseFloat((w * factor).toFixed(3));
        if (stored > 0) bottles[String(stored)] = { count: c, excluded: false };
      }
    }

    const profileId = this._generateId();
    const profilesData = {
      currentProfileId: profileId,
      items: [
        {
          id: profileId,
          name: "Default",
          bottles,
          defaults,
        },
      ],
    };

    localStorage.setItem(this.KEYS.PROFILES, JSON.stringify(profilesData));
    return true;
  },
};
