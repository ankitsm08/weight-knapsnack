/**
 * Shared UI components
 * Number input wrappers, tooltip system, icon rendering.
 */

const UI = {
  _tooltipsInit: false,

  /**
   * @param {number} value
   * @returns {number}
   */
  getStepForPlus(value) {
    if (value < 360) return 10;
    if (value < 800) return 20;
    if (value < 2000) return 50;
    return 100;
  },

  /**
   * @param {number} value
   * @returns {number}
   */
  getStepForMinus(value) {
    if (value <= 360) return 10;
    if (value <= 800) return 20;
    if (value <= 2000) return 50;
    return 100;
  },

  /**
   * @param {HTMLInputElement} input
   * @param {number} [delta=0]
   * @returns {number}
   */
  getStepForInput(input, delta = 0) {
    if (input.classList.contains("bottle-weight")) {
      const val = parseFloat(input.value) || 0;
      return delta < 0 ? this.getStepForMinus(val) : this.getStepForPlus(val);
    }
    if (input.id === "target_weight") return 0.5;
    if (input.id === "bag_weight" || input.id === "defaults_bag_weight") return 50;
    if (input.id === "defaults_overshoot_ratio") return 0.1;
    if (input.id === "defaults_bottle_penalty") return 10;
    if (input.classList.contains("bottle-count")) return 1;
    return parseFloat(input.step) || 1;
  },

  /**
   * Wrap an input in a number-input-wrapper with +/- buttons
   * @param {HTMLInputElement} input
   */
  wrapNumberInput(input) {
    if (input.dataset.wrapped === "true") return;

    const wrapper = document.createElement("div");
    wrapper.className = "number-input-wrapper";

    const buttons = document.createElement("div");
    buttons.className = "number-input-buttons";

    const minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "number-input-btn minus";
    minusBtn.innerHTML = '<i data-lucide="minus"></i>';

    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "number-input-btn plus";
    plusBtn.innerHTML = '<i data-lucide="plus"></i>';

    buttons.appendChild(minusBtn);
    buttons.appendChild(plusBtn);

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    wrapper.appendChild(buttons);

    input.dataset.wrapped = "true";

    const updateValue = (delta) => {
      const step = this.getStepForInput(input, delta);
      const min = input.classList.contains("bottle-count") ? 1 : 0;
      let val = parseFloat(input.value) || 0;
      val += delta * step;
      val = Math.max(min, val);

      if (input.id === "overshoot_ratio" || input.id === "target_weight") {
        val = Math.round(val * 100) / 100;
      }

      input.value = val;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };

    const makeHandler = (delta) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (input.dataset.clicking) return;
      input.dataset.clicking = "true";
      updateValue(delta);
      setTimeout(() => delete input.dataset.clicking, 50);
    };

    plusBtn.addEventListener("click", makeHandler(1));
    minusBtn.addEventListener("click", makeHandler(-1));

    input.addEventListener("input", () => {
      if (input.classList.contains("bottle-weight")) {
        input.step = this.getStepForInput(input);
      }
    });

    if (input.classList.contains("bottle-weight")) {
      input.step = this.getStepForInput(input);
    }

    this.renderIcons();
  },

  /**
   * Safe lucide icon render
   * @param {Object} [options]
   */
  renderIcons(options) {
    if (window.lucide) {
      lucide.createIcons(options);
    }
  },

  /**
   * Initialize tooltip system
   * Creates tooltip DOM and attaches events to .info-icon elements.
   * Idempotent — safe to call multiple times.
   */
  initTooltips() {
    if (this._tooltipsInit) return;
    this._tooltipsInit = true;

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerHTML =
      '<button class="tooltip-close" aria-label="Close"><i data-lucide="x"></i></button><span class="tooltip-text"></span>';
    document.body.appendChild(tooltip);

    const tooltipOverlay = document.createElement("div");
    tooltipOverlay.className = "tooltip-overlay";
    document.body.appendChild(tooltipOverlay);

    const tooltipText = tooltip.querySelector(".tooltip-text");
    const tooltipClose = tooltip.querySelector(".tooltip-close");

    let currentIcon = null;
    const isMobile = () => window.innerWidth <= 768;

    const showTooltip = (icon) => {
      const text = icon.getAttribute("data-tooltip");
      if (!text) return;

      tooltipText.textContent = text.replace(/<br\s*\/?>/gi, "\n");
      currentIcon = icon;

      if (isMobile()) {
        tooltip.style.position = "fixed";
        tooltip.style.left = "50%";
        tooltip.style.top = "50%";
        tooltip.style.transform = "translate(-50%, -50%)";
        tooltip.style.width = "calc(100vw - 48px)";
        tooltip.style.maxWidth = "400px";
        tooltipClose.style.display = "block";
        tooltipOverlay.classList.add("visible");
        this.renderIcons({ rootEl: tooltipClose });
      } else {
        const rect = icon.getBoundingClientRect();
        let left = rect.left + rect.width / 2;
        let top = rect.top - 16;

        const estimatedWidth = Math.min(
          320,
          parseInt(getComputedStyle(tooltip).maxWidth) || 320,
        );
        const estimatedHeight = 80;
        const halfWidth = estimatedWidth / 2;

        if (left - halfWidth < 16) {
          left = halfWidth + 16;
        } else if (left + halfWidth > window.innerWidth - 16) {
          left = window.innerWidth - halfWidth - 16;
        }

        const showBelow = top - estimatedHeight < 16;
        if (showBelow) {
          top = rect.bottom + 16;
        }

        tooltip.style.position = "fixed";
        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
        tooltip.style.transform = showBelow
          ? "translate(-50%, 0)"
          : "translate(-50%, -100%)";
        tooltip.style.width = "max-content";
        tooltip.style.maxWidth = "320px";
        tooltipClose.style.display = "none";
      }

      tooltip.classList.add("visible");
    };

    const hideTooltip = () => {
      tooltip.classList.remove("visible");
      tooltipOverlay.classList.remove("visible");
      currentIcon = null;
    };

    document.querySelectorAll(".info-icon").forEach((icon) => {
      if (isMobile()) {
        icon.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentIcon === icon) {
            hideTooltip();
          } else {
            showTooltip(icon);
          }
        });
      } else {
        icon.addEventListener("click", (e) => e.preventDefault());
        icon.addEventListener("mouseenter", () => showTooltip(icon));
        icon.addEventListener("mouseleave", () => hideTooltip());
        icon.addEventListener("focus", () => showTooltip(icon));
        icon.addEventListener("blur", () => hideTooltip());
      }
    });

    tooltipClose.addEventListener("click", (e) => {
      e.stopPropagation();
      hideTooltip();
    });

    tooltipOverlay.addEventListener("click", hideTooltip);

    window.addEventListener("resize", () => {
      if (currentIcon && isMobile()) {
        showTooltip(currentIcon);
      }
    });
  },

  // -- Modal system --

  _modalOverlay: null,

  /**
   * @param {Object} opts
   * @param {string} opts.title
   * @param {string} opts.body
   * @param {string} [opts.confirmText]
   * @param {string} [opts.cancelText]
   * @param {boolean} [opts.danger]
   * @param {function} [opts.onConfirm]
   * @param {function} [opts.onCancel]
   */
  showModal(opts) {
    this.closeModal();

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "modal-overlay";

    overlay.innerHTML = `
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h3 id="modal-title">${opts.title}</h3>
  <div class="modal-body">${opts.body}</div>
  <div class="modal-actions">
    <button type="button" class="btn" data-modal-cancel>${opts.cancelText || "Cancel"}</button>
    <button type="button" class="btn ${opts.danger ? "btn-danger" : "btn-primary"}" data-modal-confirm>${opts.confirmText || "Confirm"}</button>
  </div>
</div>`;

    document.body.appendChild(overlay);
    this._modalOverlay = overlay;

    requestAnimationFrame(() => overlay.classList.add("visible"));

    const close = () => {
      this.closeModal();
      if (opts.onCancel) opts.onCancel();
    };

    overlay.querySelector("[data-modal-cancel]").addEventListener("click", close);
    overlay.querySelector("[data-modal-confirm]").addEventListener("click", () => {
      try {
        if (opts.onConfirm) opts.onConfirm();
      } finally {
        this.closeModal();
      }
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", this._modalKeyHandler = (e) => {
      if (e.key === "Escape") close();
    });

    const firstBtn = overlay.querySelector("[data-modal-confirm], [data-modal-cancel]");
    if (firstBtn) firstBtn.focus();
  },

  /** Close the current modal */
  closeModal() {
    if (this._modalOverlay) {
      this._modalOverlay.remove();
      this._modalOverlay = null;
    }
    if (this._modalKeyHandler) {
      document.removeEventListener("keydown", this._modalKeyHandler);
      this._modalKeyHandler = null;
    }
  },

  /**
   * Promise-based confirm dialog
   * @param {Object} opts
   * @param {string} opts.message
   * @param {string} [opts.confirmText]
   * @param {string} [opts.cancelText]
   * @param {boolean} [opts.danger]
   * @returns {Promise<boolean>}
   */
  showConfirm(opts) {
    return new Promise((resolve) => {
      this.showModal({
        title: opts.title || "Confirm",
        body: `<p>${opts.message}</p>`,
        confirmText: opts.confirmText,
        cancelText: opts.cancelText,
        danger: opts.danger,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  },

  // -- Toast --

  _toastContainer: null,

  /**
   * @param {Object} opts
   * @param {string} opts.message
   * @param {'success'|'error'|'info'|'warning'} [opts.type]
   * @param {number} [opts.duration]
   */
  showToast(opts) {
    if (!this._toastContainer) {
      this._toastContainer = document.createElement("div");
      this._toastContainer.className = "toast-container";
      document.body.appendChild(this._toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${opts.type || "info"}`;
    toast.textContent = opts.message;
    this._toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("visible"));

    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 300);
    }, opts.duration || 3000);
  },

  // -- Bottle table helpers --

  /**
   * Add a row to a bottle table
   * @param {HTMLTableElement} tbody
   * @param {number|string} [weight]
   * @param {number|string} [count]
   * @returns {HTMLTableRowElement}
   */
  addTableRow(tbody, weight, count) {
    const row = document.createElement("tr");
    row.innerHTML = `
<td><input type="number" step="1" value="${weight ?? ""}" class="bottle-weight" inputmode="numeric"></td>
<td><input type="number" step="1" value="${count ?? ""}" class="bottle-count" inputmode="numeric"></td>
<td><button type="button" class="btn-icon btn-remove-row" aria-label="Remove"><i data-lucide="x"></i></button></td>`;
    tbody.appendChild(row);
    this.wrapNumberInput(row.querySelector(".bottle-weight"));
    this.wrapNumberInput(row.querySelector(".bottle-count"));
    this.renderIcons();
    return row;
  },

  /**
   * Remove a row from a bottle table
   * @param {HTMLElement} btn
   * @param {HTMLTableElement} tbody
   */
  removeTableRow(btn, tbody) {
    if (tbody.rows.length <= 1) {
      this.showToast({ message: "At least one bottle entry is required", type: "warning" });
      return;
    }
    const row = btn.closest("tr");
    if (row) row.remove();
  },

  /**
   * Read bottle table data into BottleMap format
   * @param {HTMLTableElement} tbody
   * @returns {Object<string, {count: number, excluded: boolean}>}
   */
  readTableData(tbody) {
    const bottles = {};
    tbody.querySelectorAll("tr").forEach((row) => {
      const cells = row.querySelectorAll("input");
      const w = parseInt(cells[0]?.value, 10);
      const c = parseInt(cells[1]?.value, 10);
      if (w > 0 && c > 0) {
        if (bottles[w]) bottles[w].count += c;
        else bottles[w] = { count: c, excluded: false };
      }
    });
    return bottles;
  },
};
