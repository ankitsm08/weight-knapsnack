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
};
