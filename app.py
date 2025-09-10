from flask import Flask, request, jsonify

from weight_knapsnack import best_combo_dp, parse_weight, parse_bag_weight

app = Flask(__name__)

@app.route('/')
def index():
    return "<h1>Hello, Knapsnacker!</h1>"

@app.route('/knapsnack', methods=['POST'])
def knapsnack():
    try:
        data = request.get_json()
        
        bottles = data.get('bottles')
        target_weight = data.get('target_weight')
        
        if not bottles or not target_weight:
            return jsonify({"error": "Missing required fields"}), 400
        
        bag_weight = data.get('bag_weight', 0)
        allow_overshoot = data.get('allow_overshoot', True)
        overshoot_ratio = data.get('overshoot_ratio', 0.5)
        bottle_penalty = data.get('bottle_penalty', 50)
        
        target_weight = round(parse_weight(target_weight) * 1000)  # grams
        bag_weight = parse_bag_weight(bag_weight)
        
        # Solve
        combo, total = best_combo_dp(
            bottles={int(k): v for k,v in bottles.items()},
            target_weight=target_weight,
            bag_weight=bag_weight,
            allow_overshoot=allow_overshoot,
            overshoot_ratio=overshoot_ratio,
            bottle_penalty=bottle_penalty
        )
        
        # Build response
        return jsonify({
            "target_weight_kg": target_weight / 1000,
            "bag_weight_kg": bag_weight / 1000,
            "total_weight_kg": total / 1000,
            "combo": combo,
            "bottles_used": sum(combo.values())
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)