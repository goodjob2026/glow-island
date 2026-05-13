## [2026-05-14] product-verify + tune workflow

### mapping-gap
- Client-side resource loader pointed to design-phase JSON instead of generated runtime assets → Always verify that loader file paths match the output directory of generation nodes, not intermediate design artifacts
- Backend endpoint called by client was missing entirely → During cross-module stitch, verify EVERY client API call has a matching backend route; absence is harder to catch than field mismatches

### Source
- Correction/Diagnosis from: code-governance
- Severity: high (both were P0 blockers — client would fall back to 3-level inline dataset in production)

### discovery-blind-spot
- Tile type format changed between design phase (tile_01) and generation phase (T01 enum string values) — the format divergence went unnoticed until code-governance
- Pattern: when a generation pipeline produces output in a different schema version than what consumers expect, add a normalization/migration step at the consumption boundary rather than changing the generator format

### Source
- Correction/Diagnosis from: compile-verify → code-governance
- Severity: medium
