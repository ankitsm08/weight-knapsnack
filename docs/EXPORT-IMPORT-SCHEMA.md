# Export/Import JSON Schema

---

## Envelope Format

```json
{
  "_meta": {
    "app": "weight-knapsnack",
    "version": 1,
    "exportedAt": "2026-05-29T12:00:00.000Z",
    "appVersion": "1.1.0"
  },
  "settings": { ... },
  "profiles": { ... },
  "history": [ ... ]
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_meta.app` | string | yes | Must equal `"weight-knapsnack"` — used for validation |
| `_meta.version` | number | yes | Schema version (currently `1`) — used for migration paths |
| `_meta.exportedAt` | string | yes | ISO 8601 timestamp of export |
| `_meta.appVersion` | string | yes | App version at export time |
| `settings` | object | yes | See Settings schema below |
| `profiles` | object | yes | See Profiles schema below |
| `history` | array | yes | See History schema below |

---

## Settings Schema

```json
{
  "theme": "dark",
  "oledMode": false,
  "units": {
    "targetWeight": "kg",
    "bagWeight": "g"
  }
}
```

| Field | Type | Required | Default | Valid values |
|-------|------|----------|---------|--------------|
| `theme` | string | yes | `"dark"` | `"dark"`, `"light"` |
| `oledMode` | boolean | yes | `false` | `true`, `false` |
| `units.targetWeight` | string | yes | `"kg"` | `"kg"`, `"lb"` |
| `units.bagWeight` | string | yes | `"g"` | `"g"`, `"kg"`, `"lb"` |

---

## Profiles Schema

```json
{
  "currentProfileId": "uuid-here",
  "items": [
    {
      "id": "uuid-here",
      "name": "Home Setup",
      "bottles": {
        "220": { "count": 2, "excluded": false },
        "330": { "count": 4, "excluded": false },
        "500": { "count": 3, "excluded": false }
      },
      "defaults": {
        "bagWeight": "",
        "overshootRatio": 0.5,
        "bottlePenalty": 50,
        "allowOvershoot": true,
        "maxBottles": null,
        "maxBottlesHard": true
      }
    }
  ]
}
```

**Constraints:**
- `items` must have at least 1 element
- Each `id` must be unique within the array
- `currentProfileId` must match one of the item `id` values
- If `maxBottles` is `null`, there's no limit (the field `maxBottlesHard` is ignored)

---

## History Schema

```json
[
  {
    "timestamp": 1716969600000,
    "profileId": "uuid-here",
    "inputs": {
      "targetWeight": "11.5",
      "bagWeight": "",
      "overshootRatio": 0.5,
      "bottlePenalty": 50,
      "allowOvershoot": true,
      "maxBottles": null,
      "maxBottlesHard": true
    },
    "result": {
      "combo": { "1000": 4, "500": 3, "200": 1 },
      "total": 5700
    }
  }
]
```

- Array of entries, max 50 on export
- On import: if more than 50, truncate to newest 50
- `total` is in grams (bottles + bag)
- `combo` keys are weight-in-grams as strings

---

## Validation on Import

```js
function validateImport(data) {
  // 1. Ensure _meta.app === 'weight-knapsnack'
  // 2. Ensure _meta.version is supported (currently only 1)
  // 3. Ensure settings has required fields with correct types
  // 4. Ensure profiles.items is array with at least 1 item
  // 5. Ensure currentProfileId matches an item id
  // 6. Ensure each profile has id, name, bottles, defaults
  // 7. Ensure history is array (can be empty)
  //
  // On failure: throw descriptive error message
  // On success: return sanitized data object
}
```

**Sanitization on import:**
- Unknown fields are stripped
- Missing fields are filled with defaults
- Profile IDs that collide with existing data are overwritten (import wins)
- If `_meta.version` is higher than current, reject with "This file was exported by a newer version of the app"
