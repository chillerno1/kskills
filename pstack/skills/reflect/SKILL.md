---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

The parent finds its own transcript file before fanning out. Claude Code writes each session to `~/.claude/projects/<slug>/<session-id>.jsonl`, where `<slug>` is the launch directory with every non-alphanumeric character turned into `-`, and exports the session id as `$CLAUDE_CODE_SESSION_ID`.

```bash
ls ~/.claude/projects/"$(pwd | sed 's/[^A-Za-z0-9]/-/g')"/"$CLAUDE_CODE_SESSION_ID".jsonl
# pwd drifted from the launch directory? This matches only this session's own file name:
ls ~/.claude/projects/*/"$CLAUDE_CODE_SESSION_ID".jsonl
```

Never list or read other `*.jsonl` files across `~/.claude/projects/*/`. That crosses workspace boundaries and reads private chats from unrelated projects. The exact-filename match above is the only cross-directory lookup allowed.

Layout: the main transcript is `<session-id>.jsonl`. Subagent transcripts sit in `<session-id>/subagents/agent-<id>.jsonl`, each with a sibling `.meta.json` (agent type, description, model). Large tool outputs spill into `<session-id>/tool-results/`.

If `$CLAUDE_CODE_SESSION_ID` is unset, take the newest `*.jsonl` in this workspace's slug directory (`ls -t`) and verify it. The opening prompt is not on line 1, since bookkeeping lines come first. Find the first `type: "user"` line without `isMeta` whose `message.content` is a string (or a list holding a `text` block), and check it matches the conversation's opening user prompt. Tool results also arrive as `type: "user"` lines with `tool_result` blocks, so skip those. A session opened with a slash command starts with `<command-...>` wrapper text. If no path resolves, write a tight digest of the session and pass that instead.

### 2. Spawn three reviewers in parallel

One message, three Agent tool calls, `subagent_type: general-purpose`, with `model` set as below. Reviewers need MCP access for context lookups (tickets, chat threads, observability traces referenced in the transcript).

Each reviewer and the synthesizer name a role line in `pstack-models.md` and a default. Read `.claude/pstack-models.md` in the repo root if it exists, else `~/.claude/pstack-models.md`; a missing file or line uses the default. Set the Agent tool's `model` to that line's value (`opus`, `fable`, `sonnet`, or `haiku`), or omit `model` when the value is `inherit`.

| Lens | Role line | Default `model` | Prompt template |
|---|---|---|---|
| Judgment | `reflect judgment, divergent, synthesizer` | `opus` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling` | `fable` | `references/tooling-reviewer.md` |
| Divergent | `reflect judgment, divergent, synthesizer` | `opus` | `references/divergent-reviewer.md` |

The tooling seat gets its divergence from a different Claude model plus a distinct lens prompt. Optional extra: if `codex` is on PATH, also run the tooling template once through `codex exec` via Bash as a non-Claude seat and hand its output to the synthesizer alongside the others. Never required.

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in the Agent response body.

### 3. Synthesize

One Agent call, `subagent_type: general-purpose`, with `model` from the `reflect judgment, divergent, synthesizer` line (default `opus`). The synthesizer's quality check includes spot-verifying citations, which can require MCP access. Use `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Backlog items file to whatever devex / backlog tracker your team uses automatically. Only the Accepted list waits for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to Anthropic's `skill-creator` skill (install it if missing) and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `skill-creator` and run its description-optimization loop.
- `new skill via skill-creator: <kebab-name>`: hand creation to `skill-creator`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done. Skip this step if it doesn't.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
