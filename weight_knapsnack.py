import json
from itertools import product

def parse_weight(input_str: str) -> float:
    input_str = str(input_str).lower().strip()
    if input_str.endswith("kg"):
        return float(input_str[:-2])
    elif input_str.endswith("g"):
        return float(input_str[:-1]) / 1000
    elif input_str.endswith("lb"):
        return 0.4536 * float(input_str[:-2])
    else:
        return float(input_str)


def parse_bag_weight(input_str: str) -> int:
    input_str = str(input_str).lower().strip()
    if input_str.endswith("kg"):
        return round(float(input_str[:-2]) * 1000)
    elif input_str.endswith("g"):
        return round(float(input_str[:-1]))
    elif input_str.endswith("lb"):
        return round(453.6 * float(input_str[:-2]))
    elif input_str == "":
        return default_bag_weight
    else:
        return round(float(input_str))


# Brute-Force Method
def best_combo_bruteforce(
    bottles: dict[int, int],  # weight(g) : count
    target_weight: int,  # grams
    bag_weight: int,  # grams
    allow_overshoot: bool = True,
    overshoot_ratio: float = 0.5,
    bottle_penalty: int = 50,  # grams penalty per bottle
):
    required_bottle_weight = target_weight - bag_weight
    weights = list(bottles.keys())
    counts = list(bottles.values())

    # Store best under & over separately
    best_under = best_over = None
    best_under_rank = best_over_rank = None
    best_under_total = best_over_total = None

    for combo in product(*(range(c + 1) for c in counts)):
        total = sum(w * n for w, n in zip(weights, combo))
        diff = total - required_bottle_weight
        num_bottles = sum(combo)
        score = abs(diff) + (bottle_penalty * num_bottles)
        rank = (score, num_bottles)

        if diff <= 0:  # under
            if best_under is None or rank < best_under_rank:
                best_under = combo
                best_under_rank = rank
                best_under_total = total

        if diff >= 0:  # over
            if best_over is None or rank < best_over_rank:
                best_over = combo
                best_over_rank = rank
                best_over_total = total

    # Decide between under and over
    if (
        allow_overshoot
        and best_over
        and best_over_rank[0] < overshoot_ratio * best_under_rank[0]
    ):
        chosen_combo = best_over
        chosen_total = best_over_total
    else:
        chosen_combo = best_under
        chosen_total = best_under_total

    return {
        weights[i]: chosen_combo[i] for i in range(len(weights)) if chosen_combo[i] > 0
    }, chosen_total + bag_weight


# Dynamic-Programming Method
def best_combo_dp(
    bottles: dict[int, int],  # weight(g) : count
    target_weight: int,  # grams
    bag_weight: int,  # grams
    allow_overshoot: bool = True,
    overshoot_ratio: float = 0.5,
    bottle_penalty: int = 50,  # grams penalty per bottle
):
    required_bottle_weight = target_weight - bag_weight
    weights = sorted(bottles.keys(), reverse=True)

    # dp[w] = (score, num_bottles, combo_dict)
    dp = {0: (abs(required_bottle_weight), 0, {})}

    for w in weights:
        max_count = bottles[w]
        new_dp = dp.copy()
        for cur_weight, (score, num_bottles, combo) in dp.items():
            for cnt in range(1, max_count + 1):
                new_weight = cur_weight + w * cnt
                diff = new_weight - required_bottle_weight
                new_score = abs(diff) + bottle_penalty * (num_bottles + cnt)
                new_combo = combo.copy()
                new_combo[w] = new_combo.get(w, 0) + cnt

                if (new_weight not in new_dp) or (new_score, num_bottles + cnt) < (
                    new_dp[new_weight][0],
                    new_dp[new_weight][1],
                ):
                    new_dp[new_weight] = (new_score, num_bottles + cnt, new_combo)
        dp = new_dp

    # Find best under & over
    best_under = best_over = None
    best_under_rank = best_over_rank = None
    best_under_total = best_over_total = None

    for total_weight, (score, num_bottles, combo) in dp.items():
        diff = total_weight - required_bottle_weight
        rank = (score, num_bottles)
        if diff <= 0:
            if best_under is None or rank < best_under_rank:
                best_under = combo
                best_under_rank = rank
                best_under_total = total_weight
        if diff >= 0:
            if best_over is None or rank < best_over_rank:
                best_over = combo
                best_over_rank = rank
                best_over_total = total_weight

    # Decide between under and over
    if (
        allow_overshoot
        and best_over
        and best_over_rank[0] < overshoot_ratio * best_under_rank[0]
    ):
        return best_over, best_over_total + bag_weight
    else:
        return best_under, best_under_total + bag_weight


if __name__ == '__main__':
    
    default_bag_weight = 770  # grams
    
    # weight(g) : count
    bottles = json.load(open("bottles.json"))

    bottles = {
        int(float(k)): v
        for k, v in sorted(bottles.items(), key=lambda k: k[0], reverse=True)
    }


    print("Target  Weight [kg] (e.g. 10kg / 22lb ): ", end="")
    raw_weight = input()
    target_weight = parse_weight(raw_weight)

    print("Bag     Weight [g]  (e.g. 770g / 1.7lb): ", end="")
    raw_bag_weight = input()
    bag_weight = parse_bag_weight(raw_bag_weight)

    combo, total = best_combo_dp(
        bottles=bottles,
        target_weight=round(target_weight * 1000),
        bag_weight=bag_weight,
    )

    print()
    print(f"Target   Weight:  {target_weight:>6.3f} kg")
    print(f"Bag      Weight:  {bag_weight / 1000:>6.3f} kg")
    print(f"Bottles  Weight:  {(total - bag_weight) / 1000:>6.3f} kg")

    missing = target_weight * 1000 - total  # grams
    if abs(missing) > 9.99:
        difference_text = (
            f"{-missing / 1000:+.3f} kg"
            if abs(missing) >= 1000
            else f"{-round(missing):+} g"
        )
        print(f"Total    Weight:  {total / 1000:>6.3f} kg ({difference_text})")
    else:
        print(f"Total    Weight:  {total / 1000:>6.3f} kg")

    print()
    print(f"Total Bottles Used:  {sum(combo.values())}")
    print(f"Bottle  Combo: ")
    for wt, c in combo.items():
        weight = round(wt)
        weight = f"{weight:>4} g " if weight < 1000 else f"{weight/1000:>4.2f} kg"
        print(
            f" *  {c:>2}  bottle{'s' if c > 1 else ' '} of  {weight} =  {wt * c / 1000:>6.3f} kg"
        )
    print()
