# Set up pstack

In this page you install pstack, pick which models pstack uses, and run your first task. Setup is one command plus a short conversation.

## Install pstack

Clone chillerno1/kskills to `~/Projects/kskills`, then either symlink the skills and agents into `~/.claude/` or load the folder as a plugin:

```bash
claude --plugin-dir ~/Projects/kskills/pstack
```

The [README install section](../../README.md#install) has both paths, including the symlink commands. As a plugin, skills are namespaced, so `/poteto-mode` becomes `/pstack:poteto-mode`. This guide writes the bare names. Start a new Claude Code session, in the terminal or the desktop app, and type `/` to confirm the pstack skills are listed.

## Pick your models

Run:

```text
/setup-pstack
```

[`/setup-pstack`](../../skills/setup-pstack/SKILL.md) shows you each role (code delegates, judgment, the review panels), and asks what you want. Answer the questions. It writes `~/.claude/pstack-models.md`, a small file every pstack skill that routes models reads. A `.claude/pstack-models.md` in a repo root wins over the user file for that repo.

Out of the box, all code work runs on `opus` at high effort: feature, refactoring, bug fix, perf, hillclimb, swarm workers, and the hardest tasks all go through the `poteto-agent` subagent. Judgment and prose use `opus` too, and every review panel mixes `fable`, `opus`, and `sonnet`. Claude Code can't set effort per subagent call, so it comes from the `effort: high` line in [`agents/poteto-agent.md`](../../agents/poteto-agent.md). Edit that one line to change it.

You only override what you care about. A role with no line in the file keeps the skill's default. To restore a default, delete that role's line. A rerun of `/setup-pstack` keeps any role whose model differs from the default. A Cursor-era `~/.cursor/rules/pstack-models.mdc` is not read, so run `/setup-pstack` once even if you used pstack in Cursor.

You might be wondering how to keep a role on whatever model you picked with `/model`. Set it to `inherit` and pstack omits the subagent `model` parameter, so the subagent inherits your session's model. For a panel role the value is a list, and one subagent runs per entry, so the list length sets the panel size. Setup also configures `swarm workers`, the default model for every `/swarm` worker unless a race names a model for each arm.

## Accept the verification offer, or don't

At the end of setup, `/setup-pstack` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes `.claude/skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers when it earns its place.

Skills read the model file each time they route a subagent, so your choices apply from the next skill run.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/poteto-mode` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. `/poteto-mode` is sticky. It stays on for the conversation until you opt out by saying so.

Next: [Route work through `/poteto-mode`](./02-poteto-mode.md).
