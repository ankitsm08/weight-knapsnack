# Weight Knapsnack

A client-side web app that calculates the best bottle combination to hit your target workout weight. Perfect for home workout enthusiasts using weighted backpacks.

<img src="assets\img\showcase.webp" alt="screenshot" width="90%" style="display: block; margin-left: auto; margin-right: auto;"/>

## Features

- Flexible input (kg, g, lb) with smart conversions
- Persistent bottle data via localStorage
- Dynamic bottle table editor (add, edit, remove)
- Overshoot and penalty controls
- Clean tabular output up to 3 decimals
- **Runs entirely in-browser**, no server required
- Lightweight UI built with vanilla HTML/CSS/JS... No bulky frameworks!

## Algorithm

Uses **dynamic programming** to find the optimal bottle combination:

1. **Score-based ranking**: Each combination is scored based on weight difference from target and number of bottles used
2. **Penalty system**: More bottles = higher penalty (configurable), encouraging minimal bottle usage
3. **Overshoot control**: Can allow slight overshoot with configurable ratio threshold
4. **Two-pass evaluation**: Finds best solution under target and best over target, then picks based on your overshoot settings

The DP table tracks `(score, bottle_count)` for each achievable weight, ensuring you get the mathematically optimal combo every time.

## Usage

Open `index.html` in your browser, or serve locally:

```bash
npx serve .
```

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- No dependencies, no frameworks
- LocalStorage for persistence
- Legacy Flask backend in `/python` (deprecated)

## License

MIT
