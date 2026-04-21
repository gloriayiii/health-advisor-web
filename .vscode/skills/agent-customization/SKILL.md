---
name: agent-customization
description: the code should be clean and concise
---
# Agent-Customization Skill: Create / Update SKILL.md

## Purpose
Provide a concise, reproducible template and workflow for converting a repeated conversation or engineering process into a reusable `SKILL.md` that guides agents and contributors. This skill captures step-by-step actions, decision points, quality checks, and example prompts.

## Scope
- Workspace-scoped by default (place under `.vscode/skills/agent-customization/SKILL.md`).
- Intended for developer-facing automation and agent guidance.

## When to Use
- You repeatedly follow a multi-step debugging, review, or implementation workflow and want it formalized.
- You want consistent, repeatable agent behavior for similar tasks across the repo.

## Outcome
A `SKILL.md` that includes:
- Clear intent and scope
- Step-by-step workflow with decision branches
- Completion criteria and quality checks
- Example prompts + expected outputs
- Notes for iteration and related customizations

## Step-by-step process (template)
1. Context summary: short description of what this workflow covers.
2. Inputs: required files, environment, or user decisions.
3. Goals: concrete deliverables and success criteria.
4. Steps:
   - Step A: initial exploration (what to read, what to validate).
   - Step B: primary action (code change, config, or tests).
   - Step C: verification (run tests, lint, manual checks).
   - Step D: finalize (commit message guidance, follow-ups).
5. Decision points: list conditional branches and how to choose the branch.
6. Abort/retry conditions: when to stop and escalate.
7. Post-checks: list of artefacts to produce (files, PR checklist).

## Decision logic (example patterns)
- If tests fail -> collect failing tests, run `--run` on focused tests, and open issue if flaky.
- If a runtime error occurs -> capture logs, reproduce locally, and add minimal failing repro.

## Quality criteria / Completion checks
- All tests related to the change pass locally.
- Linting and type checks pass.
- A short PR description with `Why` and `What changed` is provided.
- Small, focused commits (or one clean commit) with meaningful messages.

## Example prompts to invoke this skill
- "Summarize the debugging workflow for failing patient API requests and create a SKILL.md." 
- "Convert our review checklist into a SKILL.md focused on accessibility reviews."

## Ambiguities to clarify when drafting
- Scope: workspace-scoped vs. personal preference.
- Level of detail: quick checklist vs. verbose step-by-step.
- Automation hooks: should the skill include exact npm/test commands?

## Iteration guidance
1. Draft the `SKILL.md` using this template.
2. Run the workflow once with an agent/human using the draft.
3. Collect failure points and update decision branches.
4. Expand example prompts and edge-case handling.

## Related customizations
- Add `prompts/` examples showing concrete agent messages.
- Create `SKILL.test.md` with a minimal scenario and expected agent output.

---

Place this file at `.vscode/skills/agent-customization/SKILL.md`. After review, I can:
- Add repo-specific commands and examples.
- Convert to a shorter checklist variant.
- Add a `prompts/` folder with sample invocations.

What level of detail do you want embedded (checklist vs. full step-by-step)?
