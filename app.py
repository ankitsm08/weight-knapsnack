from flask import Flask, request, jsonify, render_template

from weight_knapsnack import best_combo_dp, parse_weight, parse_bag_weight

app = Flask(__name__, template_folder="templates")


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/about", methods=["GET"])
def about():
    return render_template("about.html")


@app.route("/knapsnack", methods=["GET", "POST"])
def knapsnack():
    """
    Calculate the best combination of bottles to reach a target weight.

    Args:
        bottles (dict): Dictionary of bottle weights and counts.
        target_weight (int): Target weight in kg.
        bag_weight (int): Weight of the bag in kg (default: 0).
        allow_overshoot (bool): Allow the combination to exceed the target weight (default: True).
        overshoot_ratio (float): Multiplier to score combinations that exceed the target weight (default: 0.5).
        bottle_penalty (int): Penalty in grams per bottle used (default: 50).

    Returns:
        JSON:
        target_weight_kg (float): The target weight in kg.
        bag_weight_kg (float): The weight of the bag in kg.
        total_weight_kg (float): The total weight of the combination in kg.
        combo (dict): The combination of bottles as a dictionary.
        bottles_used (int): The number of bottles used.

    """
    if request.method == "GET":
        # Serve the form
        return render_template("form.html")

    # POST: calculate combo
    try:
        data: dict = request.get_json()

        bottles = data.get("bottles")
        target_weight = data.get("target_weight")

        if not bottles or not target_weight:
            return jsonify({"error": "Missing required fields"}), 400

        bag_weight = data.get("bag_weight", 0)
        allow_overshoot = bool(data.get("allow_overshoot", True))
        overshoot_ratio = float(data.get("overshoot_ratio", 0.5))
        bottle_penalty = int(data.get("bottle_penalty", 50))

        target_weight = round(parse_weight(target_weight) * 1000)  # grams
        bag_weight = round(parse_bag_weight(bag_weight))  # grams

        # Solve
        combo, total = best_combo_dp(
            bottles={int(k): int(v) for k, v in bottles.items()},
            target_weight=target_weight,
            bag_weight=bag_weight,
            allow_overshoot=allow_overshoot,
            overshoot_ratio=overshoot_ratio,
            bottle_penalty=bottle_penalty,
        )

        # Build response
        return jsonify(
            {
                "target_weight_kg": target_weight / 1000,
                "bag_weight_kg": bag_weight / 1000,
                "total_weight_kg": total / 1000,
                "combo": combo,
                "bottles_used": sum(combo.values()),
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
