# Character Data Schema Requirements

To ensure every character's consciousness is schema-compliant and works with the backend and frontend, each character JSON file (e.g., `alexander-kane.json`) **must include the following top-level fields**. The full schema is detailed in `docs/CONSCIOUSNESS-SCHEMA.md`.

## Required Top-Level Fields

- `id` (string): Unique identifier for the consciousness profile (e.g., "alexander-kane")
- `name` (string): Character display name (e.g., "Alexander Kane")
- `version` (string): Version string in the format `major.minor.patch` (e.g., "1.0.0")
- `baseProcesses` (array): List of core process objects (see below for structure)
- `memoryMap` (object): Memory map object with at least `totalSize`, `pageSize`, and `regions` (array)
- `emotionalStates` (object): Map of emotional state names to their properties
- `systemResources` (object): System resources object with at least `cpu`, `memory`, and `threads` subfields

## Example Minimal Schema-Compliant Character

```json
{
  "id": "alexander-kane",
  "name": "Alexander Kane",
  "version": "1.0.0",
  "baseProcesses": [],
  "memoryMap": {
    "totalSize": 8192,
    "pageSize": 4096,
    "regions": []
  },
  "emotionalStates": {},
  "systemResources": {
    "cpu": { "cores": 4, "baseFrequency": 2.4, "turboFrequency": 3.6 },
    "memory": { "total": 8192, "available": 6144 },
    "threads": { "max": 16, "reserved": 2 }
  }
}
```

## Best Practices
- Always include all required fields, even if some are empty objects or arrays.
- When adding a new character, copy the structure above and fill in the details.
- If the schema changes, update this documentation and patch all character files.

## Troubleshooting
- If you see schema validation errors in the backend logs, check that all required fields are present and correctly typed.
- The backend will attempt to patch missing fields, but for best results, keep your character files up to date.

---

**Last updated:** 2025-06-24
