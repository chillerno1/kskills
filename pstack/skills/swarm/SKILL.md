---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# Swarm

Fan out N parallel workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not how many run at once.
4. Pick the worker model from the `swarm workers` line in `~/.claude/pstack-models.md` (a `.claude/pstack-models.md` in the repo root wins over it). Read the file if it exists. If the file or that line is missing, use `opus`. For `inherit` (or the older `auto` / `inherit-parent`), pass the parent's own model name, since omitting `model` falls back to `poteto-agent`'s `opus`. The Agent tool's `model` accepts only `fable`, `opus`, `sonnet`, and `haiku`. For any other entry, use `opus` and say so. For a model race, name each arm's model up front.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result. Workers share this machine's CPU, so parallel timing runs skew each other. Spawn measurement arms one after another (an exception to Phase B's single message), or have each worker record the contention, and say which in the report.

## Phase B: Fan out

Spawn all N workers in one message with `subagent_type: "poteto-agent"` (its agent file fixes effort at `high`), `isolation: "worktree"`, and the step 4 model.

Each worktree starts at the current `HEAD`. When a worker must start from another branch, its brief says to start a new branch from it first (`git checkout -b <worker-branch> <base>`), fetching the base if it only exists on the remote. A plain checkout fails when that branch is already checked out elsewhere. For a truly remote run off this machine, use `/schedule` (cloud routines) instead. It is the closest equivalent to cloud workers.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
