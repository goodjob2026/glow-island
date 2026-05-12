---
node: concept-freeze
human_gate: false
hard_blocked_by: [art-spec-design]
unlocks: []  # populated by bootstrap from workflow's art-gen nodes
exit_artifacts:
  - .allforai/concept-contract.json
  - .allforai/game-design/asset-registry.json
---

# Task: 概念合约冻结（Concept Freeze）

## 执行方法

读取并执行 `${CLAUDE_PLUGIN_ROOT}/knowledge/capabilities/concept-contract.md` capability，完成 canonical_registry 构建并写入 `concept-contract.json`。

concept-contract capability 完成后，依次调用以下 game-art 子 skill（读取对应 SKILL.md 并执行）：

1. **工具能力检测：** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/00-env/production-tool-capability-registry/SKILL.md`
   - （输入/输出：参见 SKILL.md 的 Invocation Contract）
   - 将检测结果写回 `art-pipeline-config.json.toolchain.detected_capabilities`

2. **资产注册表初始化：** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/00-env/asset-registry/SKILL.md`
   - （输入/输出：参见 SKILL.md 的 Invocation Contract）
   - 输出：`.allforai/game-design/asset-registry.json`（以 canonical_registry 为权威，资产 ID → 文件前缀 → 生命周期状态的单一可信注册表）

3. **资产来源策略：** `${CLAUDE_PLUGIN_ROOT}/skills/game-art/10-design/asset-source-strategy-spec/SKILL.md`
   - （输入/输出：参见 SKILL.md 的 Invocation Contract；依赖上一步生成的 `asset-registry.json`）
   - 输出：每类资产的 `source_strategy`（`existing_asset_pack` / `existing_3d_source_asset` / `user_provided_asset` / `adapt_existing_asset` / `hybrid` / `placeholder_only`）写入 `asset-registry.json`

## 完成条件

`.allforai/concept-contract.json` 存在且 `schema_version == "1.0"` 且 `.allforai/game-design/asset-registry.json` 存在。

## 重要说明

所有后续 art-gen 节点必须从 `concept-contract.json` 读取 `canonical_registry`，使用其中的 `file_prefix` 作为生成文件的命名权威来源，不得自行命名。
