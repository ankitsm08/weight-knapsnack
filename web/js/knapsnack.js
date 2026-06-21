/**
 * Parse weight string to kg (float)
 * Supports kg, g, lb suffixes with optional space before unit.
 * Naked number assumed kg.
 * @param {string} inputStr - The string to parse
 * @returns {number} weight in kg
 */
function parseWeight(inputStr, defaultUnit) {
  inputStr = inputStr.toString().toLowerCase().trim();
  var m = inputStr.match(/^([\d]+(?:\.[\d]+)?)\s*(kg|g|lb)?$/);
  if (!m) return NaN;
  var val = parseFloat(m[1]);
  var unit = m[2] || (defaultUnit || "").toLowerCase() || "kg";
  if (unit === "kg") return val;
  if (unit === "g") return val / 1000;
  if (unit === "lb") return val * 0.4536;
  return val;
}

/**
 * Parse bag weight string to grams (integer)
 * Supports kg, g, lb suffixes with optional space before unit.
 * Empty string returns 0.
 * @param {string} inputStr - The string to parse
 * @returns {number} weight in grams
 */
function parseBagWeight(inputStr, defaultUnit) {
  inputStr = inputStr.toString().toLowerCase().trim();
  if (inputStr === "") return 0;
  var m = inputStr.match(/^([\d]+(?:\.[\d]+)?)\s*(kg|g|lb)?$/);
  if (!m) return NaN;
  var val = parseFloat(m[1]);
  var unit = m[2] || (defaultUnit || "").toLowerCase() || "g";
  if (unit === "kg") return Math.round(val * 1000);
  if (unit === "g") return Math.round(val);
  if (unit === "lb") return Math.round(453.6 * val);
  return Math.round(val);
}

/**
 * Dynamic programming solution for knapsack
 * @param {Object.<string, number>} bottles - {weightInGrams: count}
 * @param {number} target_weight - target weight in GRAMS
 * @param {number} bag_weight - bag weight in GRAMS
 * @param {Object} options - {allow_overshoot, overshoot_ratio, bottle_penalty}
 * @returns {{combo: Object.<number, number>, total: number}}
 */
function best_combo_dp(bottles, target_weight, bag_weight, options = {}) {
  const allow_overshoot = options.allow_overshoot !== false;
  const overshoot_ratio = parseFloat(options.overshoot_ratio ?? 0.5);
  const bottle_penalty = parseInt(options.bottle_penalty ?? 50, 10);
  const max_bottles = parseInt(options.max_bottles ?? 0, 10);

  const required_bottle_weight = target_weight - bag_weight;
  const weights = Object.keys(bottles)
    .map(Number)
    .sort((a, b) => b - a);

  // Helper function
  const isLess = (rankA, rankB) =>
    rankA[0] < rankB[0] || (rankA[0] === rankB[0] && rankA[1] < rankB[1]);

  // dp table
  let dp = {
    0: { score: Math.abs(required_bottle_weight), numBottles: 0, combo: {} },
  };

  for (const w of weights) {
    const max_count = bottles[String(w)];
    let new_dp = { ...dp };

    for (const cur_weight_str of Object.keys(dp)) {
      const cur_weight = parseInt(cur_weight_str, 10);
      const { score, numBottles, combo } = dp[cur_weight];

      // For each possible number of bottles for a given weight
      for (let count = 1; count <= max_count; count++) {
        if (max_bottles > 0 && numBottles + count > max_bottles) continue;
        const new_weight = cur_weight + w * count;
        const diff = new_weight - required_bottle_weight;

        const new_score =
          Math.abs(diff) + bottle_penalty * (numBottles + count);
        let new_combo = { ...combo };
        new_combo[w] = (new_combo[w] || 0) + count;

        const currentRank = [new_score, numBottles + count];

        if (!(new_weight in new_dp)) {
          new_dp[new_weight] = {
            score: new_score,
            numBottles: numBottles + count,
            combo: new_combo,
          };
        } else {
          const existingRank = [
            new_dp[new_weight].score,
            new_dp[new_weight].numBottles,
          ];
          if (isLess(currentRank, existingRank)) {
            new_dp[new_weight] = {
              score: new_score,
              numBottles: numBottles + count,
              combo: new_combo,
            };
          }
        }
      }
    }
    dp = new_dp;
  }

  // Find best under & over
  let bestUnder = null;
  let bestOver = null;
  let bestUnderRank = [Infinity, Infinity];
  let bestOverRank = [Infinity, Infinity];
  let bestUnderTotal = 0;
  let bestOverTotal = 0;

  for (const total_weight_str of Object.keys(dp)) {
    const total_weight = parseInt(total_weight_str, 10);
    const { score, numBottles, combo } = dp[total_weight];

    const diff = total_weight - required_bottle_weight;
    const rank = [score, numBottles];

    // Update best under & over
    if (diff <= 0) {
      if (!bestUnder || isLess(rank, bestUnderRank)) {
        bestUnder = combo;
        bestUnderRank = rank;
        bestUnderTotal = total_weight;
      }
    }
    if (diff >= 0) {
      if (!bestOver || isLess(rank, bestOverRank)) {
        bestOver = combo;
        bestOverRank = rank;
        bestOverTotal = total_weight;
      }
    }
  }

  // Decide between under and over
  if (
    allow_overshoot &&
    bestOver &&
    bestOverRank[0] < overshoot_ratio * bestUnderRank[0]
  )
    return { combo: bestOver, total: bestOverTotal + bag_weight };
  else return { combo: bestUnder, total: bestUnderTotal + bag_weight };
}
