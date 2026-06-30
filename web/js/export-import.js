/**
 * Export/Import data manager
 * Settings + profiles only, or full export including history.
 */

const DataManager = {
  ENVELOPE_VERSION: 1,

  _buildEnvelope(type) {
    const data = {
      _meta: {
        app: "weight-knapsnack",
        version: this.ENVELOPE_VERSION,
        exportedAt: new Date().toISOString(),
        type,
      },
      settings: Storage.getSettings(),
      profiles: Storage.getProfiles(),
    };
    if (type === "full") {
      data.history = Storage.getHistory();
    }
    return data;
  },

  async _triggerDownload(data, type) {
    const date = new Date().toISOString().slice(0, 10);
    const filename = `weight-knapsnack-${type === "full" ? "full" : "settings"}-${date}.json`;
    const json = JSON.stringify(data, null, 2);

    if (window.__TAURI__) {
      const invoke = window.__TAURI__.core?.invoke || window.__TAURI__.invoke;
      const path = await invoke("export_data", { data: json, filename });
      return path;
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  _pickFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) {
          reject(new Error("No file selected"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
      input.click();
    });
  },

  _validateEnvelope(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid file: expected a JSON object");
    }
    if (!data._meta || typeof data._meta !== "object") {
      throw new Error("Invalid file: missing _meta section");
    }
    if (data._meta.app !== "weight-knapsnack") {
      throw new Error("Invalid file: not a Weight Knapsnack export");
    }
    if (data._meta.version !== this.ENVELOPE_VERSION) {
      throw new Error(`Unsupported format version: ${data._meta.version}`);
    }
    return data._meta.type || "settings-profiles";
  },

  _buildConfirmMessage(data) {
    const lines = [];
    if (data.settings) lines.push("Settings");
    if (data.profiles) {
      const count = data.profiles.items ? data.profiles.items.length : 0;
      lines.push(`${count} profile${count !== 1 ? "s" : ""}`);
    }
    if (data.history) {
      const count = data.history.length;
      lines.push(`${count} history entr${count === 1 ? "y" : "ies"}`);
    }
    return (
      "This will replace all your current data with the imported data:<br>\u2022 " +
      lines.join("<br>\u2022 ") +
      "<br><br>This action cannot be undone. Continue?"
    );
  },

  _applyImport(data) {
    if (data.settings) {
      Storage.setSettings(data.settings);
    }
    if (data.profiles) {
      Storage.saveProfiles(data.profiles);
    }
    if (data.history) {
      Storage.saveHistory(data.history);
    }
  },

  async exportSettings() {
    const data = this._buildEnvelope("settings-profiles");
    try {
      const path = await this._triggerDownload(data, "settings");
      if (path) {
        UI.showToast({
          message: "Exported to Downloads folder",
          type: "success",
        });
      } else {
        UI.showToast({ message: "Settings exported", type: "success" });
      }
    } catch (err) {
      UI.showToast({ message: `Export failed: ${err}`, type: "error" });
    }
  },

  async exportFull() {
    const data = this._buildEnvelope("full");
    try {
      const path = await this._triggerDownload(data, "full");
      if (path) {
        UI.showToast({
          message: "Exported to Downloads folder",
          type: "success",
        });
      } else {
        UI.showToast({ message: "Full data exported", type: "success" });
      }
    } catch (err) {
      UI.showToast({ message: `Export failed: ${err}`, type: "error" });
    }
  },

  async importData() {
    let text;
    try {
      text = await this._pickFile();
    } catch {
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      UI.showToast({ message: "Invalid JSON file", type: "error" });
      return;
    }

    try {
      this._validateEnvelope(data);
    } catch (err) {
      UI.showToast({ message: err.message, type: "error" });
      return;
    }

    const confirmed = await UI.showConfirm({
      title: "Import Data",
      message: this._buildConfirmMessage(data),
      confirmText: "Import",
      danger: true,
    });

    if (!confirmed) return;

    try {
      this._applyImport(data);
      UI.showToast({
        message: "Data imported successfully. Reloading\u2026",
        type: "success",
      });
      setTimeout(() => location.reload(), 1200);
    } catch {
      UI.showToast({ message: "Import failed", type: "error" });
    }
  },
};
