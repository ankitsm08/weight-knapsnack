/**
 * Parse weight string to kg (float)
 * @param {string} inputStr - The string to parse
 * @returns {number} weight in kg
 */
function parseWeight(inputStr) {
  inputStr = inputStr.toString().toUpperCase().trim();
  if (inputStr.endsWith("kg")) return parseFloat(inputStr.slice(0, -2));
  else if (inputStr.endsWith("g"))
    return parseFloat(inputStr.slice(0, -1)) / 1000;
  else if (inputStr.endsWith("lb"))
    return 0.4536 * parseFloat(inputStr.slice(0, -2));
  else return parseFloat(inputStr);
}

/**
 * Parse bag weight string to grams (integer)
 * @param {string} inputStr - The string to parse
 * @returns {number} weight in grams
 */
function parseBagWeight(inputStr) {
  inputStr = inputStr.toString().toUpperCase().trim();
  if (inputStr.endsWith("kg"))
    return Math.round(parseFloat(inputStr.slice(0, -2)) * 1000);
  else if (inputStr.endsWith("g"))
    return Math.round(parseFloat(inputStr.slice(0, -1)));
  else if (inputStr.endsWith("lb"))
    return Math.round(453.6 * parseFloat(inputStr.slice(0, -2)));
  else if (inputStr === "") return 0;
  else return Math.round(parseFloat(inputStr));
}

/**
 * Dynamic programming solution for knapsack
 * @param {Object.<string, number>} bottles - {weightInGrams: count}
 * @param {number} targetWeight - target weight in GRAMS
 * @param {number} bagWeight - bag weight in GRAMS
 * @param {Object} options - {allow_overshoot, overshoot_ratio, bottle_penalty}
 * @returns {{combo: Object.<number, number>, total: number}}
 */
function best_combo_dp(bottles, target_weight, bag_weight, options = {}) {
  const allow_overshoot = options.allow_overshoot !== false;
  const overshoot_ratio = parseFloat(options.overshoot_ratio || 0.5);
  const bottle_penalty = parseInt(options.bottle_penalty || 50);

  const required_bottle_weight = target_weight - bag_weight;
  const weights = Object.keys(bottles)
    .map(Number)
    .sort((a, b) => b - a);

  // dp[w] = (score, numBottles, combo_dict)
  var dp = {
    0: { score: Math.abs(required_bottle_weight), numBottles: 0, combo: {} },
  };

  for (const w of weights) {
    const max_count = bottles[String(w)];
    let new_dp = { ...dp };

    for (const cur_weight_str in dp) {
      const cur_weight = parseInt(cur_weight_str);
      const { score, numBottles, combo } = dp[cur_weight];

      for (let cnt = 1; cnt <= max_count; cnt++) {
        const new_weight = cur_weight + w * cnt;
        const diff = new_weight - required_bottle_weight;
        const new_score = Math.abs(diff) + bottle_penalty * (numBottles + cnt);
        let new_combo = { ...combo };
        new_combo[w] = (new_combo[w] || 0) + cnt;

        if (
          !(new_weight in new_dp) ||
          [new_score, numBottles + cnt] <
            [new_dp[new_weight].score, new_dp[new_weight].numBottles]
        ) {
          new_dp[new_weight] = {
            score: new_score,
            numBottles: numBottles + cnt,
            combo: new_combo,
          };
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

  for (const total_weight_str in dp) {
    const total_weight = parseInt(total_weight_str);
    const { score, numBottles, combo } = dp[total_weight];

    const diff = total_weight - required_bottle_weight;
    const rank = [score, numBottles];

    if (diff <= 0) {
      if (!bestUnder || rank < bestUnderRank) {
        bestUnder = combo;
        bestUnderRank = rank;
        bestUnderTotal = total_weight;
      }
    }
    if (diff >= 0) {
      if (!bestOver || rank < bestOverRank) {
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
