---
name: setup-pstack
description: Configure which models pstack uses per role. Detects the models your Agent tool accepts and writes `~/.claude/pstack-models.md`, which overrides the skill defaults. Use for /setup-pstack, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack

Write `~/.claude/pstack-models.md`, a plain markdown file that sets pstack's model per role. When the user asks for a per-repo override, write `.claude/pstack-models.md` at the repo root instead. A project file wins over the user file.

Reasoning effort is not part of this file. Claude Code cannot set effort per Agent call. It comes from the agent definition, and `poteto-agent` pins `effort: high` in its frontmatter. To change effort for code work, edit that one line in `agents/poteto-agent.md`. Explorers and investigators that run as `Explore` or `general-purpose` follow the session's effort.

## Steps

### 1. Detect available models

Read the `model` parameter's enum on your `Agent` tool. That enum is the detected set. Do not call any API or CLI to list models. Today it is `opus`, `fable`, `sonnet`, `haiku`. The value `inherit` is always valid even though it is not in the enum. It means the role runs on the parent session model. Never write a model you have not confirmed is in the enum.

### 2. Load current state

The default role-to-model mapping is the file shape shown in step 5 below. If the target file already exists, read it and treat its role values as the current choices. Otherwise start from those defaults. A line whose role is not in step 5, such as `how critics`, is from a retired role. Drop it. A `# budget` line is retired too. Drop it. A value of `inherit-parent` or `auto` is the old spelling of `inherit`. Rewrite it as `inherit`.

### 3. Show the roles and confirm

Build the working table from the skill defaults, and on a re-run keep any role whose value differs from the default (a different model, a different list, or `inherit`). Show every role with its model as a table in your reply, marking any value not in the detected set as needing a choice. Also list each line step 2 dropped.

Then use AskUserQuestion: accept as-is, or change specific roles. For each role the user wants to change, ask again with the detected models as the options. `inherit` and panel lists come in through the free-text answer. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, `inherit` entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it that differs from the parent session's model when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

Every value is a Claude model, so panels no longer mix model families. Their diversity comes from different Claude models plus distinct reviewer personas and prompts. If `codex` is on PATH, a panel may add one `codex exec` run via Bash as an optional non-Claude seat. It is never required and never written to this file.

### 4. Validate

Every model written must be in the detected set. `inherit` always passes. If a chosen model is not available, stop and ask again.

### 5. Write the file

Write the target file with no frontmatter and one line per role, using the same labels poteto-mode uses. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# Values: opus, fable, sonnet, haiku, or inherit (the role runs on the parent session model). inherit entries in a panel list still count toward its fan-out.
# Skills read this file on demand. It is not auto-loaded. A repo's .claude/pstack-models.md wins over ~/.claude/pstack-models.md.
# Effort is not set here. poteto-agent pins effort: high in its frontmatter.
feature, refactoring: opus
bug-fix: opus
perf-issue: opus
hillclimb: opus
judgment and prose: opus
hardest tasks: opus
how explorer: opus
how explainer: opus
why investigators: opus
why synthesizer: opus
reflect tooling: fable
reflect judgment, divergent, synthesizer: opus
arena runners: fable, opus
arena cross-judge pool: fable, opus, sonnet
swarm workers: opus
architect runners: fable, opus
interrogate reviewers: fable, opus, sonnet
```

### 6. Confirm

Tell the user where the file was written. Say that pstack skills read it on demand each time they route a model, and that it is not auto-loaded into context, so it takes effect on the next skill run, this session included. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed: project, user, or plugin). On no, move on without pushing.
