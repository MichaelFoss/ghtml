# GHTML Agent Notes

## Purpose

GHTML is a Chrome extension that inserts user-supplied HTML into Gmail
compose windows while preserving Gmail's native editing behavior,
including selection, focus, undo, redo, and compose-window ownership.

The project is a production-quality MVP under active development.

---

## Goals

In priority order:

1. Preserve Gmail behavior.
2. Keep the code understandable.
3. Prototype first.
4. Refactor only after behavior is proven.

---

## Non-goals

At this stage, GHTML is **not** attempting to:

- become a full HTML editor or IDE
- support every email client
- replace Gmail's internal editor
- inject custom controls into Gmail-managed formatting toolbars
- introduce a framework, bundler, transpiler, or build step
- make sanitizer behavior configurable without a proven requirement

Focus on inserting sanitized HTML into Gmail compose windows reliably.

---

## Technology

- Vanilla JavaScript only
- Manifest V3
- No framework
- No bundler
- No transpiler
- No build step
- No runtime dependencies

If a dependency is proposed, justify why the browser cannot reasonably
provide the same functionality.

---

## Browser support

Primary target:

- Google Chrome (latest)

Other Chromium browsers may work but are not currently tested.

---

## Architecture

Read `ARCHITECTURE.md` before changing runtime structure or Gmail
lifecycle behavior.

Prefer browser APIs.

Avoid abstraction until repetition or testability clearly justifies it.

Keep the number of moving parts small.

Prefer multiple small functions over deep object hierarchies.

When introducing new structures, prefer composition over inheritance.

Pure helpers belong in focused runtime files and should be covered by
Vitest whenever practical.

Because this extension intentionally has no bundler or build step,
runtime modules currently communicate through narrowly scoped
`globalThis` APIs.

---

## Gmail discoveries

The following behaviors have already been researched and validated.

### HTML insertion

Use:

```js
document.execCommand('insertHTML', false, sanitizedHtml);
```

Although deprecated on the open web, `execCommand()` currently provides
the closest match to Gmail's native insertion behavior.

Do not replace it with manual DOM insertion unless Gmail behavior
changes.

---

### Selection

Maintain a cloned `Range` independently for every compose window.

Before insertion:

1. Restore focus to the owning compose editor.
2. Restore that compose window's saved selection.
3. Execute `insertHTML`.

Never reuse a selection from another compose window.

If a compose window has never received focus, create a collapsed range
at the end of its message body.

---

### Focus

Launcher buttons should not steal Gmail's focus before selection is
captured.

Use `mousedown.preventDefault()` or equivalent pointer handling where
appropriate.

While the dialog is open:

- keep focus trapped inside the dialog
- suppress Gmail keyboard shortcuts

When closing the dialog:

- restore focus
- restore selection
- restore only the owning compose window

---

### Undo / Redo

Matching Gmail behavior is more important than implementing a
theoretically cleaner solution.

Whenever Gmail behavior differs from conventional browser behavior,
prefer Gmail.

---

### Trusted Types

Never use `innerHTML` on Gmail-owned DOM.

User HTML should be sanitized separately, then inserted through
`execCommand()`.

---

### Gmail startup

Gmail restores portions of its DOM before its UI becomes visible.

Launchers must not initialize until `waitForGmailReady()` determines
that:

- Gmail's main UI is visible
- the startup loading overlay is gone

Do not replace readiness detection with arbitrary delays or continuous
polling.

---

### Gmail toolbar

Do not inject GHTML controls into Gmail-managed formatting toolbar DOM.

Previous experiments caused Gmail toolbar reconciliation to remove or
break native controls.

The supported architecture is a body-mounted launcher positioned
relative to its owning compose window.

---

### Sanitization

All user HTML must pass through `sanitizeHtml()` immediately before
insertion.

Do not duplicate sanitizer logic elsewhere.

---

## Development philosophy

Behavior first.

Architecture second.

Do not refactor speculative code.

Every refactor should remove existing duplication, improve readability,
or improve testability.

Prefer incremental improvements over rewrites.

---

## Commits

Commits should be:

- one logical change
- independently testable
- easy to revert

Avoid mixing refactors with new functionality.

### Commit policy

Unless explicitly requested, do not create Git commits.

Leave all changes unstaged for review.

The user is responsible for:

- reviewing
- staging
- committing
- squashing
- rebasing
- merging

---

## Branches

Implement larger features on feature branches.

Prefer several small reviewable commits over a single large commit.

---

## Code style

Prefer:

- early returns
- descriptive names
- browser APIs
- small functions
- pure helpers where appropriate

Avoid:

- unnecessary classes
- clever abstractions
- premature optimization

---

## Logging

Console logging is acceptable during active development.

Prefix all logs with:

```text
[GHTML 🧪]
```

Reduce or remove logging only after behavior has stabilized.

---

## Testing

Run the full validation suite after every logical change:

```sh
yarn run check
git diff --check
```

Vitest covers pure sanitizer and dialog-helper behavior.

Manual Gmail verification is still required for changes involving:

- compose lifecycle
- launcher positioning
- dialog behavior
- focus
- selection
- insertion
- undo / redo
- Gmail readiness detection

Use `TESTING.md` as the manual regression suite.

Refer to manual tests by their stable IDs.

Do not assume browser APIs behave the same inside Gmail as they do in a
standalone HTML page.

---

## AI expectations

Before making significant architectural changes:

- explain the reasoning
- preserve existing behavior
- prefer incremental improvements
- avoid rewriting working code

When uncertain, choose the simplest implementation that satisfies the
current milestone.

If a proposed change alters Gmail behavior, call it out explicitly
before implementing it.

---

## Discovery Phases

Some roadmap items begin with investigation rather than implementation.

When a task involves changing runtime behavior or architecture:

- First understand the current implementation.
- Compare it against the documented architecture.
- Record findings in the temporary task file.
- Do not implement behavioral changes until the investigation is
  complete.
- If implementation approaches are not obvious, stop and present
  findings for review before modifying production code.

---

## Current status

Completed work includes:

- per-compose launchers
- HTML sanitization
- automated sanitizer tests
- Gmail-style modal HTML dialog
- draggable and persisted dialog
- per-compose selection ownership
- Gmail readiness detection
- dialog helper extraction
- dialog helper unit tests

Before beginning a new feature, define its scope and break it into
small, independently reviewable tasks.

Do not infer future milestones from obsolete prototype notes.
