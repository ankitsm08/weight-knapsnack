const form = document.getElementById("knapsnack-form");
const resultDiv = document.getElementById("result");
const bagWeightInput = document.getElementById("bag_weight");

function addRow(weight = "", count = "") {
    const tbody = document.querySelector("#bottles-table tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
    <td><input type="number" step="1" value="${weight}" oninput="save_bottles()"></td>
    <td><input type="number" step="1" value="${count}" oninput="save_bottles()"></td>
    <td><button type="button" onclick="removeRow(this)">❌</button></td>
    `;
    tbody.appendChild(row);
    save_bottles();
}

function removeRow(btn) {
    const tbody = document.getElementById("bottles-table").querySelector("tbody");
    if (tbody.rows.length > 1) {
        btn.closest("tr").remove();
        save_bottles();
    } else {
        alert("At least one bottle entry is required!");
    }
}

function save_bottles() {
    const bottles = {};
    document.querySelectorAll("#bottles-table tbody tr").forEach((row) => {
        const w = parseInt(row.cells[0].querySelector("input").value);
        const c = parseInt(row.cells[1].querySelector("input").value);
        if (w && c) bottles[w] = c;
    });

    localStorage.setItem("bottles", JSON.stringify(bottles));
    return bottles;
}

bagWeightInput.addEventListener("input", () => {
    localStorage.setItem("bag_weight", bagWeightInput.value);
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const bottles = save_bottles();

    collapseIfTooManyBottles();

    const formData = new FormData(form);
    const payload = {
        bottles: bottles,
        target_weight: formData.get("target_weight"),
        bag_weight: formData.get("bag_weight") || 0,
        allow_overshoot: formData.get("allow_overshoot") === "on",
        overshoot_ratio: parseFloat(formData.get("overshoot_ratio") || 0.5),
        bottle_penalty: parseInt(formData.get("bottle_penalty") || 50),
    };

    const response = await fetch(KNAPS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.error) {
        resultDiv.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
    } else {
        let comboRows = Object.entries(data.combo)
            .map(
                ([weight, count]) =>
                    `<tr><td>${weight} g</td><td>${count}</td><td>${(
                        (weight * count) /
                        1000
                    ).toFixed(3)} kg</td></tr>`
            );

        comboRows.unshift(
            `<tr><td>Bag</td><td>-</td><td>${data.bag_weight_kg.toFixed(3)} kg</td></tr>`
        );
        comboRows.push(
            `<tr style="font-size: 1.1rem; font-weight: bold;"><td>All Total</td><td>${data.bottles_used
            }</td><td>${data.total_weight_kg.toFixed(3)} kg</td></tr>`
        );

        comboRows = comboRows.join("");
        resultDiv.innerHTML = `
<h2 class="center">Results</h2>
<div class="result-cards">
    <div class="card result-card">
        <h4>Target</h4>
        <p>${data.target_weight_kg.toFixed(3)} kg</p>
    </div>
    <div class="card result-card">
        <h4>Bag Weight</h4>
        <p>${data.bag_weight_kg.toFixed(3)} kg</p>
    </div>
    <div class="card result-card">
        <h4>Total Weight</h4>
        <p><span>${data.total_weight_kg.toFixed(3)} kg</span>
        ${(Math.round((data.total_weight_kg - data.target_weight_kg) * 1000) === 0)
                ? "(=)"
                : `(${(data.total_weight_kg - data.target_weight_kg > 0 ? "+" : "")}${Math.round((data.total_weight_kg - data.target_weight_kg) * 1000)} g)`
            }
        </p>
    </div>
    <div class="card result-card">
        <h4>Bottles Used</h4>
        <p>${data.bottles_used}</p>
    </div>
</div>

<div class="combo-table card">
    <h3 class="center">Combo Details</h4>
    <table>
        <thead style="font-size: 1.2rem; font-weight: bold;">
            <tr><th>Weight (g)</th><th>Count</th><th>Total Weight (kg)</th></tr>
        </thead>
        <tbody>${comboRows}</tbody>
    </table>
</div>
    `;

        // Trigger animation
        const resultCards = resultDiv.querySelector(".result-cards");
        const comboTable = resultDiv.querySelector(".combo-table");
        setTimeout(() => {
            resultCards.classList.add("show");
            comboTable.classList.add("show");
        }, 100);

        // Auto-scroll smoothly
        setTimeout(() => {
            resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    }
});

// Restore on page load
window.addEventListener("DOMContentLoaded", () => {
    const saved = JSON.parse(localStorage.getItem("bottles") || "{}");
    const savedBagWeight = localStorage.getItem("bag_weight");

    const tbody = document.querySelector("#bottles-table tbody");
    tbody.innerHTML = "";
    if (Object.keys(saved).length > 0) {
        for (const [w, c] of Object.entries(saved)) {
            addRow(w, c);
        }
        collapseIfTooManyBottles();
    } else {
        addRow(220, 2);
        addRow(330, 4);
        addRow(500, 3);
        addRow(750, 3);
        addRow(1000, 4);
        addRow(2000, 3);
    }

    // restore bag weight
    if (savedBagWeight !== null) {
        bagWeightInput.value = savedBagWeight;
    }
});

function collapseIfTooManyBottles() {
    const table = document.getElementById("bottles-table");
    const collapsible = table.closest(".collapsible");

    if (table.rows.length > 6) {
        // 1 header row + 5 entries = 6
        collapsible.classList.add("closed");
    }
}
