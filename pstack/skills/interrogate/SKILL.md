---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Multiple LLM reviewers challenge changes from independent angles."
disable-model-invocation: true
---

# Interrogate

Spawn one reviewer per configured model to adversarially review code changes. Each model gets the same prompt and rubric. The adversarial signal comes from model diversity, not assigned personas. Every default seat is a Claude model, so the spread is narrower than the original cross-family panel. The three models still diverge, and the optional `codex` seat in Step 3 brings back a non-Claude family.

The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Determine Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset
- If the user's message references recent work, gather the relevant files

Package the diff (or file contents) plus any surrounding context files the reviewers need to understand the code.

## Step 2, State the Intent

Before spawning reviewers, state the intent explicitly. Derive this from:

- The user's message
- Commit messages
- PR description if one exists
- The code itself

Write one clear paragraph. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch all reviewers in a single message using the Agent tool. Use the `interrogate reviewers` line in `~/.claude/pstack-models.md` (a `.claude/pstack-models.md` in the repo root wins over it), one reviewer per entry, extending or shrinking the Reviewer A/B/C labels below to the configured entry count. Read the file if it exists. If the file or that line is missing, use the table defaults.

| Subagent | Default model |
|----------|---------------|
| Reviewer A | `fable` |
| Reviewer B | `opus` |
| Reviewer C | `sonnet` |

For each reviewer:
- `subagent_type`: `general-purpose`
- `model`: the configured `interrogate reviewers` entry, or the table default with no configured line. For an `inherit` entry (or the older `auto` / `inherit-parent`), omit `model` so that reviewer runs on the parent model.
- Tell it not to edit any file. Reviewers read and report.

The Agent tool's `model` accepts only `fable`, `opus`, `sonnet`, and `haiku`. Any other entry (a Cursor slug, a full model ID) runs that reviewer on its label's table default (Reviewer A's default past C), and say so. Do not block the review on a bad entry. Never treat an alias entry as a rejected entry or apply the fallback to it.

Optional extra seat: if `codex` is on PATH, add one more reviewer as a `codex exec` run via Bash (Bash `run_in_background: true`), fed the same filled template, and label it by its model like the others. Never require it.

Read `references/reviewer-prompt.md` and fill in the template with:
1. The stated intent
2. The diff or file contents
3. The review rubric from `references/rubric.md`
4. The code-quality lens from `references/code-quality-review.md`

The same filled template goes to all reviewers, so every model applies the code-quality lens.

## Step 4, Synthesize

As results come back, build a unified picture:

1. **Parse all findings** from the reviewers
2. **Identify consensus**. Findings raised by 2+ models independently are highest signal.
3. **Identify lone-model findings**. Still worth reading, but weight accordingly.
4. **Deduplicate**. Different models may describe the same issue differently. Merge these and note which models raised it.
5. **Note disagreements**. If one model flags something and another explicitly says the opposite, that's useful context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator.

Read `references/lead-judgment.md` for the full framework.

Categorize every finding using these buckets:

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. These would block a real PR.
- **Consider**. Legitimate points, but you're not sure they outweigh the cost of addressing them right now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact given the current stage.
- **Dismissed**. Wrong, nitpicky, or missing context. Brief explanation why.

For each finding, include:
- Which model(s) raised it
- The category (act on / consider / noted / dismissed)
- A one-line rationale for the categorization

## Output Format

Present the verdict in this structure:

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [model name], [N findings] (one bullet per reviewer)

### Act On
[Findings that should be addressed. For each: description, which models raised it, why it matters.]

### Consider
[Findings worth thinking about. For each: description, which models raised it, tradeoff involved.]

### Noted
[Valid but low-priority. Brief list.]

### Dismissed
[Rejected findings with brief rationale.]

### Agreement Map
[Where did models agree, where did they diverge, and what does the pattern of agreement/disagreement tell us?]
