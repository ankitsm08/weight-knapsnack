# Data Model

All data is stored in `localStorage` under four keys. No backend, no cookies.

---

## Key: `knapsnack_settings`

```typescript
interface Settings {
  /** @default 'dark' */
  theme: 'dark' | 'light';

  /** @default false — only applies when theme === 'dark' */
  oledMode: boolean;

  /**
   * Per-field unit preferences.
   * Each field remembers its own unit independently.
   * On toggle, the current value is converted in-place.
   */
  units: {
    /** @default 'kg' */
    targetWeight: 'kg' | 'lb';

    /** @default 'g' */
    bagWeight: 'g' | 'kg' | 'lb';

    /** @default 'g' — bottle weights stay in grams */
    bottleWeight: 'g';
  };
}
```

---

## Key: `knapsnack_profiles`

```typescript
interface ProfilesData {
  /** UUID v4 of the currently selected profile */
  currentProfileId: string;

  /** @default [] */
  items: ProfileItem[];
}

interface ProfileItem {
  /** UUID v4 — stable identifier, allows renaming without breaking references */
  id: string;

  /** Human-readable name, e.g. "Home Setup" */
  name: string;

  /** Bottle inventory mapped by weight-in-grams → count */
  bottles: BottleMap;

  /** Per-profile default values for the calculator form */
  defaults: ProfileDefaults;
}

interface BottleMap {
  /** weight-in-grams → count */
  [weightGrams: number]: BottleEntry;
}

interface BottleEntry {
  /** Number of bottles of this weight */
  count: number;
  /** Whether this bottle type is excluded from calculation */
  excluded: boolean;
}

interface ProfileDefaults {
  /** Raw string — parsed by parseBagWeight() at use time */
  bagWeight: string;
  /** @default 0.5 */
  overshootRatio: number;
  /** @default 50 */
  bottlePenalty: number;
  /** @default true */
  allowOvershoot: boolean;
  /** Max bottles constraint. null = no limit */
  maxBottles: number | null;
  /** @default true — true = hard limit, false = soft penalty */
  maxBottlesHard: boolean;
}
```

---

## Key: `knapsnack_history`

```typescript
interface HistoryEntry {
  /** Unix timestamp ms */
  timestamp: number;

  /** Profile ID that was active when calculation ran */
  profileId: string;

  /** Input values at calculation time */
  inputs: {
    targetWeight: string; // raw user input
    bagWeight: string;
    overshootRatio: number;
    bottlePenalty: number;
    allowOvershoot: boolean;
    maxBottles: number | null;
    maxBottlesHard: boolean;
  };

  /** Result from best_combo_dp() */
  result: {
    combo: { [weightGrams: number]: number };
    total: number; // total weight in grams (bottles + bag)
  };
}

type History = HistoryEntry[]; // max 50 entries, oldest dropped first
```

---

## Key: `knapsnack_bottles` (DEPRECATED)

This key will be migrated into `knapsnack_profiles` during Phase 2. After migration, the old key is no longer read or written.

---

## Default Profile (created on first visit if none exist)

```json
{
  "id": "<uuid>",
  "name": "Default",
  "bottles": {
    "220":  { "count": 2, "excluded": false },
    "330":  { "count": 4, "excluded": false },
    "500":  { "count": 3, "excluded": false },
    "750":  { "count": 3, "excluded": false },
    "1000": { "count": 4, "excluded": false },
    "2000": { "count": 3, "excluded": false }
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
```

---

## Migration Strategy

1. On first load after Phase 2 deploy, check if `knapsnack_profiles` exists.
2. If not, read `knapsnack_bottles`, `knapsnack_bag_weight`, `knapsnack_overshoot_ratio`, `knapsnack_bottle_penalty`, `knapsnack_allow_overshoot` from old keys.
3. Create a single "Default" profile with migrated data.
4. Set `currentProfileId` to this profile's ID.
5. Leave old keys intact (don't delete them) for rollback safety.
