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

## [2026-05-15] Scene deserialization: non-standard UUID format

### Classification: mapping-gap

**Pattern**: Cocos Creator 3.x scene files require `_id` fields on all nodes and components to be valid hex UUIDs (16 lowercase hex chars, no hyphens). When manually editing scene JSON files, using descriptive text IDs like `proto-board-node-0001` causes CC3 to silently skip deserializing the entire node at `loadScene()` time — no error is thrown, the node simply does not exist in the runtime scene tree.

**Symptoms**:
- Component `start()` never called
- Node children absent from scene tree
- `director.getScene().getChildByName('Board')` returns null

**Fix**:
- Generate proper 16-char hex IDs (e.g., `bd4a7c3e8f219d05`)
- Verify with `python3 -c "import json; d=json.load(open('scene.scene')); [print(i,e.get('_id')) for i,e in enumerate(d) if isinstance(e,dict) and e.get('_id')]"`

**Robustness pattern**:
- Components that bootstrap HUD/background via `this.node.parent` should fall back to `find('Canvas') ?? director.getScene()?.getChildByName('Canvas')` in case the component is externally instantiated for testing

### Source
- Discovered during: visual-qa-game (CG-01, CG-02, CG-03)
- Severity: high (entire game component tree invisible at runtime)

## [2026-05-16] CC3 preview: stale compiled cache, UIOpacity null guard

### Classification: discovery-blind-spot

**Pattern**: Cocos Creator 3.x editor preview serves compiled JS bundles from `library/` and `temp/programming/` — NOT live TypeScript source. When TypeScript source is edited outside the editor (e.g., by an AI agent), the editor may not detect changes and recompile. The preview keeps running the OLD compiled code.

**Symptoms**:
- Code changes verified to be correct in `.ts` source but produce no visible effect in browser
- `console.log` added to `.ts` file never appears in browser console
- Screenshots show the same behavior before and after source edits

**Fix**:
- After editing `.ts` files, must either: (a) trigger editor rebuild from within Cocos Creator IDE, or (b) directly patch the compiled JS chunk in `temp/programming/chunks/` and the `library/` scene cache
- Verify the compiled output actually changed before calling a fix verified

**Source**: Repair loop (2026-05-16) — UIOpacity fix in `.ts` was correct but had no effect until compiled cache was also patched

---

**Pattern**: `addComponent(UIOpacity)` in CC3 throws "Type must be non-nil" when UIOpacity class is not pre-registered in the CC runtime module system.

**Guard pattern**:
```typescript
// addComponent
const op = UIOpacity ? tile.addComponent(UIOpacity) : null;
if (op) op.opacity = 255;

// getComponent (vanish animation)
const op = UIOpacity ? node.getComponent(UIOpacity) : null;
if (op) { tween(op)... } else { node.destroy(); }
```

**Why it fails**: CC3 uses a component registry that may not have UIOpacity loaded at the moment `start()` runs in preview mode. `addComponent(undefined)` throws immediately, killing the rest of `start()`.

**Source**: visual-qa-game (VQ-01), repaired in code-repair-loop (2026-05-16)
- Severity: critical (kills entire component start(), making board invisible)

## [2026-05-16] CC3 preview: Board node never appears from scene file despite correct UUIDs

### Classification: mapping-gap

**Pattern**: Even with correct hex UUIDs, a `PrototypeBoard` component's `__type__` string must match the registered class name at CC3 module registration time, AND the compiled `library/` cache must include the Board node in its serialized scene graph. If the `.scene` file is edited directly (not via editor), the `library/` cache will not be regenerated to include the new node.

**Symptoms**:
- `director.getScene().getChildByName('Board')` returns null
- `getComponent: Type must be non-nil` errors at startup (for @property(Label) references)
- Camera `clearColor` reads as black despite scene file having teal value

**Fix**:
- Must update both the `.scene` source file AND the corresponding `library/` compiled JSON
- Or: move the component to an existing always-loaded node (Canvas) and skip scene deserialization altogether
- Recommended: mount PrototypeBoard on Canvas node (guaranteed to load) with class UUID, not string class name

**Source**: Repair loop (2026-05-16) — CG-01, E2E-01

## [2026-05-16] CC3 resource bundle: texture vs spriteFrame sub-assets

### Classification: mapping-gap

**Pattern**: `cc.resources.load(path, SpriteFrame, cb)` requires the asset at `path` to have a `/spriteFrame` sub-asset registered in the bundle config. PNG files imported with `"type": "texture"` (the default in CC3 editor for plain PNGs) only register a `/texture` sub-asset (`cc.Texture2D`), not a `/spriteFrame` sub-asset.

**Symptoms**:
- `resources.load('sprites/tiles/tile_01/spriteFrame', SpriteFrame, cb)` — callback called with error: "Bundle resources doesn't contain sprites/tiles/tile_01/spriteFrame"
- Same for background PNGs: only `sprites/backgrounds/ch01_harbor_before/texture` is registered, not `/spriteFrame`

**Fix pattern**:
```typescript
// Wrong — fails if PNG was imported as "type: texture"
resources.load(path + '/spriteFrame', SpriteFrame, (err, sf) => { ... });

// Correct — load Texture2D and construct SpriteFrame programmatically
resources.load(path + '/texture', Texture2D, (err: Error|null, tex: Texture2D) => {
  if (!err && tex) {
    const sf = new SpriteFrame();
    sf.texture = tex;
    // use sf normally
  }
});
```

**Verification**: Check `cc.resources._config.paths._map` in browser console to see which sub-asset keys (`/texture`, `/spriteFrame`, `/image`) are registered for a given path.

**Source**: Repair loop (2026-05-16) — tile sprite and background loading fix

## [2026-05-16] CC3 preview: scene deserialization timing vs chunk loading

### Classification: discovery-blind-spot

**Pattern**: In CC3 3.x preview mode, the scene library cache (`.json` in `library/`) is deserialized at ~300-400ms after page load. Custom component chunks (TypeScript compiled JS) are loaded asynchronously and may not be executed yet at deserialization time. Result: "Can not find class 'X'" error, component silently removed from the node.

**Symptoms**:
- Console error: "Can not find class 'MyClass'" at ~300ms
- `canvas.getChildByName('NodeWithMyClass')` → node exists but `getComponent(MyClass)` returns null
- `js.getClassByName('MyClass')` returns the class correctly 2+ seconds later

**Fix pattern**:
1. Verify class is registered: wait 2s then call `js.getClassByName('MyClass')`
2. If class found but component missing: programmatically add it via `node.addComponent(MyClass)` — the CC3 lifecycle will call `start()` automatically
3. For durable fix: ensure chunk is loaded before scene via the CC3 project's pack dependency graph, or use library cache editing to defer component to a known-loaded node

**Source**: PROD-SCENE-01 gap resolution (2026-05-16)

## [2026-05-16] CC3 library cache: scene.scene vs library JSON divergence

### Classification: mapping-gap

**Pattern**: When nodes are added to a `.scene` file directly (not via CC3 Editor UI), the corresponding `library/{prefix}/{uuid}.json` cache is NOT automatically updated. The preview runtime loads from `library/`, not from `.scene`. New nodes in `.scene` are invisible at runtime until the library JSON is also updated.

**Fix**:
```python
# Append missing scene entries to library JSON
with open(SCENE) as f: scene_data = json.load(f)
with open(LIB) as f: lib_data = json.load(f)
# Append entries from scene that are missing in library
lib_data.extend(scene_data[len(lib_data):])
# Update Canvas._children to include new node references
lib_data[canvas_idx]['_children'].append({'__id__': new_node_idx})
with open(LIB, 'w') as f: json.dump(lib_data, f, indent=2)
```

**Source**: PROD-SCENE-01 — GameController node absent from runtime despite being in .scene file
