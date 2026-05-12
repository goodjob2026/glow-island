---
name: run
description: Execute the Glow Island workflow. Specify a goal.
arguments:
  - name: goal
    description: What you want to achieve (natural language)
    required: true
---

# Workflow Orchestrator

You are the workflow orchestrator. Execute nodes to achieve the goal.

## Ground Truth

Read `.allforai/bootstrap/workflow.json` at every iteration. Trust it over conversation history.

## Core Loop

```
每轮：
  1. Read workflow.json (nodes + transition_log)
  2. Run: python3 .allforai/bootstrap/scripts/check_artifacts.py .allforai/bootstrap/workflow.json --json
  3. Review which nodes are done (exit_artifacts exist) and which are pending
  4. Decide next node:
     - What's done? What's pending? What makes sense next?
     - Can run multiple nodes in parallel if their exit_artifacts don't overlap
     - Can skip a node if its goal is already satisfied
     - Can re-run a failed node after fixing the issue
     - **Game-design nodes with `human_gate: true`:** do NOT advance based on exit_artifact existence alone. Check `.allforai/game-design/approval-records.json` by `node_id`:
       - `gate_status == "pending"` AND all exit_artifacts exist → auto-set `gate_status` to `"in-review"`. Then:
         1. Regenerate dashboard: `python3 .allforai/bootstrap/scripts/render_approval_dashboard.py --approval .allforai/game-design/approval-records.json --workflow .allforai/bootstrap/workflow.json --output .allforai/game-design/review-dashboard.html`
         2. Start server if not running (`lsof -i :43871` to check): `python3 .allforai/bootstrap/scripts/serve_approval.py --approval .allforai/game-design/approval-records.json --directory .allforai --port 43871`
         3. Tell user: **"请在 Chrome 中打开 http://127.0.0.1:43871/game-design/review-dashboard.html 进行审批"**
         4. Poll approval-records.json every 30s until `gate_status` changes. Do NOT advance yet.
       - `gate_status == "in-review"` → remind user of URL, continue polling. Do NOT advance.
       - `gate_status == "approved"` → advance to unlocked nodes.
       - `gate_status == "revision-requested"` → re-run the node with `revision_notes`; after completion reset `gate_status` to `"in-review"`.
  5. Read the node-spec: .allforai/bootstrap/node-specs/<node-id>.md
  6. Dispatch subagent with node-spec as prompt. Per §D of cross-phase-protocols.md: execution-phase subagents are FORBIDDEN from using AskUserQuestion or any user interaction — all decisions must already be written to .allforai/ files from the Discussion Phase (bootstrap). If a subagent reports UPSTREAM_DEFECT (missing decision information), pause execution and return to Discussion Phase to supplement decisions, then resume.
  7. On success: record transition (status=completed, artifacts_created)
  8. On failure: record transition (status=failed, error=<one line>),
     then read .allforai/bootstrap/protocols/diagnosis.md and diagnose.
     After diagnosis + repair: append to workflow.json `corrections_applied[]`:
     `{"node": "<id>", "what_was_wrong": "<root_cause>", "fix_applied": "<action>", "timestamp": "<ISO>"}`
  9. Back to 1
```

## Recording Transitions

After each node completes or fails, append to workflow.json transition_log:

```json
{
  "node": "<id>",
  "status": "completed | failed",
  "started_at": "<ISO timestamp>",
  "completed_at": "<ISO timestamp>",
  "artifacts_created": ["<file paths>"],
  "error": "<one line, only if failed>"
}
```

## Session Resume

On first iteration if transition_log is non-empty:
1. Run check_artifacts.py to see current state
2. Trust artifact existence over transition_log (files may have been deleted)
3. Continue from where things stand

## Safety (warnings, not blockers)

- Same node fails 3 times → **before warning**, check `workflow.json.diagnosis_history` for that node:
  - If any entry has `"out_of_scope": true` → mark workflow halted, output TODO list, do NOT retry or ask user
  - If 2+ entries share the same `root_cause.node` → convergence cap reached, mark UNRESOLVED, output TODO list, halt
  - Otherwise → warn user, ask if they want to continue
- 5 iterations with no new artifacts → output current state + TODO list
- Single node running > 10 minutes → warn but don't kill

## Termination

- All nodes' exit_artifacts exist → success report
- concept-acceptance verdict = needs_iteration → output acceptance-report.md, present iteration options (fix/re-bootstrap/accept), stop
- User interrupts → transition_log is already saved, resume with /run
- Safety warning acknowledged → continue or stop per user choice

## Post-Completion

**Run regardless of success or early stop:**

1. **Mark concept drift resolved (if applicable):**
   If `.allforai/product-concept/concept-drift.json` exists AND `resolved = false`
   AND all nodes completed successfully: set `"resolved": true` and write back.
   If /run stopped early or failed: leave `resolved = false` (drift still pending for next /bootstrap).

2. **Learning extraction:**
   Read `.allforai/bootstrap/protocols/learning-protocol.md`.
   Check `workflow.json.corrections_applied[]` and `diagnosis_history[]`:
   - If both empty: no learning to extract, skip.
   - For each entry in `corrections_applied[]`:
     * Extract: node, what_was_wrong (root_cause), fix_applied
     * Classify per learning-protocol.md type (mapping-gap / discovery-blind-spot / convergence / safety / other)
     * Write to `.allforai/bootstrap/learned/<category>.md` per learning-protocol.md File Naming Convention
   - For each entry in `diagnosis_history[]`:
     * Extract root_cause pattern and gaps_found domains
     * If the gap was not caught by the expected capability node → classify as "blind-spot"
     * Write to `.allforai/bootstrap/learned/blind-spots.md` (append, do not overwrite)

3. **Feedback proposal:**
   Read `.allforai/bootstrap/protocols/feedback-protocol.md` — propose feedback
