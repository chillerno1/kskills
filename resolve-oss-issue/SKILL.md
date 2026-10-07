---
name: resolve-oss-issue
description: Resolve a GitHub issue in an open-source repo from start to finish, whether it reports a bug or asks for a feature. Check that it is not already reported or fixed, turn the issue's asks into an acceptance list, reproduce bugs in the real app, match features to the app's existing behaviour, test first, verify on the same surface, and open a PR. Use when the user describes a bug and asks to check whether it is a known issue, fix or implement a GitHub issue, "repro and resolve", or work an issue number in any repo, even if they don't say "OSS".
---

# Resolve an OSS issue

The goal is a PR a maintainer can merge without asking anything. It names the issue it resolves, covers every ask in that issue or says which it leaves out, has a test that fails before the change, and shows evidence from the real app.

## 1. Dedupe and read the asks before writing code

Most reported bugs are already known, partly fixed, or fixed on the default branch.

1. Read the repo's agent and contributor docs (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, PR template). They override this skill.
2. Read the issue **body**, not only its title: `gh issue view N -R OWNER/REPO --json title,body,comments`. Copy every ask in it (each "Proposed solution" bullet, each expected behaviour) into an acceptance list, quoting the issue's words. A title-only read loses requirements without anyone noticing.
3. Search issues **and** PRs, open and closed, with 3 to 5 phrasings: the user's own words, the component name, and the probable mechanism. One search misses most duplicates.
   ```bash
   gh issue list -R OWNER/REPO --state all --search "QUERY in:title,body" --limit 10
   gh pr list    -R OWNER/REPO --state all --search "QUERY" --limit 10
   ```
4. For each close match, read its body and the files it changes. If a PR merged, check whether your checkout includes it: `git merge-base --is-ancestor <mergeCommit> HEAD`.
5. Classify, then act:
   - **Open duplicate issue.** Link it and work that issue. Don't open a second one.
   - **Fixed on the default branch.** Reproduce it on the latest default branch. If it no longer reproduces, find the first release tag that has the fix (`git tag --contains <mergeCommit>`) and compare it with the reporter's installed version. Report that the fix arrives with an update, and stop. To show the bug, revert the fix locally and reproduce it.
   - **Partly fixed.** A related fix landed, but this variant still fails. Narrow the scope to the gap and cite the earlier PR. Its description often names the mechanism.
   - **Open PR already fixes it.** Report that and stop. Don't compete with it.
   - **New.** Continue.

Report the classification with links before you go on. Any plan you show for approval lists the acceptance items and names the ones it leaves out. Approval of a plan that silently drops an ask is not approval to drop it.

Every brief you give a subagent carries the acceptance list word for word. Review its result against that list, not against your own summary of it.

## 2. Reproduce the bug, or find the existing behaviour to match

**Bug.** Work on a fresh branch from the default branch. Drive the real app the way a user does: the browser, the desktop app over CDP, the CLI or TUI, or the simulator. Prefer the repo's own verification skill or script. A unit test proves branch behaviour. It does not prove that the bug is gone.

- Send real input events (paste, key presses, clicks). A shortcut that sets state directly can skip the code path that has the bug.
- Record a **before** measurement you can compare later: serialized output, DOM state, a log line, a screenshot.
- If it doesn't reproduce, vary the conditions (fresh session, empty state, other entry points) before you conclude anything. If it still doesn't reproduce, report exactly what you tried.

**Feature.** The acceptance list replaces the repro. Most features add a second copy of something the app already does (a menu, a trigger, a shortcut, a list). Find every existing implementation of that behaviour that the user's build actually runs. Check it is enabled; a flag-off copy is not a reference. Compare each dimension: trigger rule, filtering, keys, empty and loading states, data that arrives late. Copy each one, or write down a verified reason to differ. Never write a rule into a brief that contradicts "same as X". The concrete rule wins and the parity is lost.

## 3. Find the root cause

For a bug, write down the candidate hypotheses. Instrument the code and read the real state as it runs. Don't guess. Choose the test that rules out the most hypotheses each time. When you find the mechanism, grep for the same pattern elsewhere. If other components share the defect, fix them all.

## 4. Test first, then change

1. **Commit 1:** a test that calls the code as users do and asserts a literal expected value. For a bug, confirm it fails on the default branch. For a feature, cover each acceptance item the code can test.
2. **Commit 2:** the smallest fix at the root cause, or the smallest code that meets the acceptance list. Don't add guards that only hide the symptom, and don't build what the issue didn't ask for.

This order lets a reviewer check out commit 1 and see the test fail.

## 5. Verify

- Repeat the step 2 repro, or walk each acceptance item, on the same surface. Compare with the before measurement.
- For UI fed by async data, also test the orderings a warm demo never hits: the user acts before the data arrives, and the data changes while the UI is open. Use a cold cache or a controllable source in a unit test. A run that "fails because of load timing" points to an ordering bug, so investigate it rather than discard it.
- Run the repo's tests, typecheck, and lint for the changed area. Report the real output, and name any check you skipped.

## 6. Open the PR

Ask the user before you post anything public: a PR, an issue comment, or a new issue.

- Before opening, build a table: each acceptance item, its status (done, partial, not done), and its evidence. Every partial or missing row goes into the PR body as out of scope.
- Use the repo's title convention (often `fix(scope): subject`) and its PR template.
- In the body, give the problem and the root cause (or the ask), then the change, then the scope. Name what it covers and what it leaves out. Then add before and after evidence from the real surface, and the test commands with their results.
- Link related work: `Fixes #N` for the issue it resolves. Name any related PR in prose ("follows #N"), because closing keywords close issues.
- No push access (`gh api repos/OWNER/REPO -q .permissions.push` is `false`)? Push to a fork remote and open with `--head <you>:<branch>`. CI on a fork PR usually waits for a maintainer to approve the workflows. Report it as "held for maintainer approval", not as passed or failed.

## Report back

The classification and its links, the acceptance table, the root cause and the evidence for it, the change, the test output failing then passing, the before and after measurements, and the PR URL. Name anything you could not verify.
