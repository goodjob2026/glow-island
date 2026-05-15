# Skill Update Impact

- meta-skill version: `0.6.29`
- state: `completed`
- change source: `explicit`
- changed files: 4
- matched nodes: 25

## Global Recommendations
- `game-2d-production` high: rerun /bootstrap or run expand_game_2d_production.py, then rerun 2D production closure nodes (2D game production closure or workflow expansion contract changed)
- `game-frontend` medium: rerun game frontend binding, smoke, and visual runtime QA nodes (game frontend runtime contract changed)
- `visual-qa` high: rerun visual acceptance, screenshot review, and art-qa nodes (visual QA/review contract changed)
- `game-2d-production` high: rerun /bootstrap or run expand_game_2d_production.py, then rerun 2D production closure nodes (2D game production closure or workflow expansion contract changed)

## Node Recommendations
- `code-repair-loop` high: rerun node and downstream consumers if its output changed (visual QA/review contract changed)
- `compile-verify` high: rerun node and downstream consumers if its output changed (game frontend runtime contract changed; visual QA/review contract changed)
- `concept-acceptance` high: rerun node and downstream consumers if its output changed (game frontend runtime contract changed; visual QA/review contract changed)
- `e2e-gameplay` high: rerun node and downstream consumers if its output changed (game frontend runtime contract changed; visual QA/review contract changed)
- `fix-code-gaps` high: rerun node and downstream consumers if its output changed (game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-asset-binding-visual-qa` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-asset-runtime-binding-contract` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-code-repair-loop` high: rerun node and downstream consumers if its output changed (node-spec references changed skill game-2d-production/40-qa/code-repair-loop; 2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-core-loop-playability-qa` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-core-loop-playable-contract` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-input-feedback-contract` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-playable-slice-assembly` high: rerun node and downstream consumers if its output changed (node-spec references changed skill game-2d-production/30-generate/playable-slice-assembly; 2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-production-closure-qa` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-runtime-profile` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-session-completion-qa` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-session-flow-contract` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `game-2d-view-mode-runtime-contract` high: rerun node and downstream consumers if its output changed (2D game production closure or workflow expansion contract changed; game frontend runtime contract changed; visual QA/review contract changed)
- `ios-simulator-acceptance` high: rerun node and downstream consumers if its output changed (game frontend runtime contract changed; visual QA/review contract changed)
- `launch-checklist` high: rerun node and downstream consumers if its output changed (game frontend runtime contract changed; visual QA/review contract changed)
- `ui-forge-game` high: rerun node and downstream consumers if its output changed (game frontend runtime contract changed; visual QA/review contract changed)
- `visual-qa-game` high: rerun node and downstream consumers if its output changed (visual QA/review contract changed)
- `generate-missing-assets` medium: rerun node and downstream consumers if its output changed (game frontend runtime contract changed)
- `generate-real-audio` medium: rerun node and downstream consumers if its output changed (game frontend runtime contract changed)
- `quality-checks` medium: rerun node and downstream consumers if its output changed (game frontend runtime contract changed)
- `runtime-smoke-verify` medium: rerun node and downstream consumers if its output changed (game frontend runtime contract changed)
