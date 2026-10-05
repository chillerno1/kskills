---
name: poteto-what
description: "Recommend which pstack skill, poteto-mode playbook or principle fits a question. Use for /poteto-what <question>."
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(grep:*), Bash(realpath:*)
---

# poteto-what

The user typed `/poteto-what` followed by a question or task. Tell them which pstack skill, playbook or principle to use. **Recommend only. Do not run it or start the task.**

## 1. Read the catalog

Read it fresh every time, so new or renamed skills count. `<skills>` is the folder holding this skill's parent (`realpath` of this skill's base directory, then `..`).

- Skills and principles: `grep -m1 -H '^description:' <skills>/*/SKILL.md`. Folders named `principle-*` are principles; the rest are skills you type as `/<folder>`.
- Playbooks: the lines matching `- **<Name>.** <use> ... playbooks/<file>.md` in `<skills>/poteto-mode/SKILL.md`. A playbook runs as `/poteto-mode <task>`; poteto-mode picks it from the task wording.

Recommend only pstack entries (the folders next to `poteto-mode`). If a non-pstack skill is clearly better, name it as an aside.

## 2. Pick

- Choose the one entry that best fits what the user wants done next, not every entry that loosely applies.
- Prefer something they can type: a skill, or `/poteto-mode <task>` for a playbook. Principles are rules agents apply themselves, so name one only as a "keep in mind" line.
- If nothing fits, say so and suggest a plain prompt.
- If the question is genuinely ambiguous between two, pick one and give the other as an alternative. Don't ask a clarifying question.

## 3. Answer in this shape

```
Use: <exact command to type, filled in from their question>
Why: <one line, tied to their wording>
Also: <one alternative or principle, one line>  (omit if none)
Not: <a tempting wrong pick and why, one line>  (omit if none)
```

Fill in real arguments, e.g. `/poteto-mode ship #1074`, not `/poteto-mode <task>`. Keep it to those lines. No preamble, no closing offer.
