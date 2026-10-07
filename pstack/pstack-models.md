# pstack model configuration. One section per CLI, one line per role.
# Use only the section for the CLI you are running in. Tell it by your spawn tool: Agent → Claude Code, spawn_subagent → Grok CLI, spawn_agent → Codex. Ignore the other sections.
# Delete a line to fall back to the skill default. inherit means the role runs on the parent session model; inherit entries in a panel list still count toward its fan-out.
# Skills read this file on demand. It is not auto-loaded. A repo's .claude/pstack-models.md wins over ~/.claude/pstack-models.md; a repo file without sections is Claude Code lines.

## Claude Code
# Values: opus, fable, sonnet, haiku, inherit. Effort is not set here: poteto-agent pins effort: high in its frontmatter.
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

## Grok CLI
# Values: grok-4.7, grok-4.7-build-fast, grok-4.6, grok-4.5, inherit.
# Where a skill says "the Agent tool", use spawn_subagent. Always pass its model argument with the role's value: agent files such as poteto-agent name Claude models that Grok cannot run. subagent_type poteto-agent and comment-sicko work as written.
feature, refactoring: grok-4.7
bug-fix: grok-4.7
perf-issue: grok-4.7
hillclimb: grok-4.7
judgment and prose: grok-4.7
hardest tasks: grok-4.7
how explorer: grok-4.7-build-fast
how explainer: grok-4.7
why investigators: grok-4.7-build-fast
why synthesizer: grok-4.7
reflect tooling: grok-4.7-build-fast
reflect judgment, divergent, synthesizer: grok-4.7
arena runners: grok-4.7, grok-4.7-build-fast
arena cross-judge pool: grok-4.7, grok-4.7-build-fast, grok-4.6
swarm workers: grok-4.7
architect runners: grok-4.7, grok-4.7-build-fast
interrogate reviewers: grok-4.7, grok-4.7-build-fast, grok-4.6

## Codex
# Values: gpt-6-astra, gpt-6-sol, gpt-6-luna, gpt-5.6-sol, gpt-5.6-terra, inherit.
# Where a skill says "the Agent tool", use spawn_agent with the role's value as model and reasoning_effort high. Codex has no subagent_type: where a skill names one (poteto-agent, comment-sicko), start the message with "Read ~/.claude/agents/<name>.md and follow it as your instructions." Explore and general-purpose need no preamble.
feature, refactoring: gpt-6-astra
bug-fix: gpt-6-astra
perf-issue: gpt-6-astra
hillclimb: gpt-6-astra
judgment and prose: gpt-6-astra
hardest tasks: gpt-6-astra
how explorer: gpt-6-sol
how explainer: gpt-6-astra
why investigators: gpt-6-sol
why synthesizer: gpt-6-astra
reflect tooling: gpt-6-luna
reflect judgment, divergent, synthesizer: gpt-6-astra
arena runners: gpt-6-astra, gpt-6-sol
arena cross-judge pool: gpt-6-astra, gpt-6-sol, gpt-5.6-sol
swarm workers: gpt-6-astra
architect runners: gpt-6-astra, gpt-6-sol
interrogate reviewers: gpt-6-astra, gpt-6-sol, gpt-5.6-sol
