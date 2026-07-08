# GHTML Agent Notes

## Purpose

GHTML is a Chrome extension that inserts arbitrary HTML into Gmail
compose windows while preserving Gmail's native editing behavior
(selection, undo, redo, focus, etc.).

This project is currently a prototype evolving into a production-quality
extension.

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

- become a full HTML editor
- sanitize HTML
- support every email client
- modify Gmail's internal editor
- replace Gmail's formatting toolbar

Focus on Gmail compose only.

---

## Technology

- Vanilla JavaScript only.
- Manifest V3.
- No framework.
- No bundler.
- No transpiler.
- No build step.
- No runtime dependencies.

If a dependency is proposed, justify why the browser cannot reasonably
provide the same functionality.

---

## Browser support

Primary target:

- Google Chrome (latest)

Other Chromium browsers may work but are not currently tested.

---

## Architecture

Prefer browser APIs.

Avoid abstraction until repetition clearly exists.

Keep the number of moving parts small.

Multiple small functions are preferred over deep object hierarchies.

When introducing new structures, prefer composition over inheritance.

---

## Gmail discoveries

These behaviors have already been researched.

### HTML insertion

Use:

document.execCommand("insertHTML")

Do not replace this with manual DOM insertion unless Gmail behavior
changes.

---

### Selection

Save the browser Selection before opening any UI.

Restore the Selection before executing insertHTML.

---

### Focus

Buttons should not steal focus.

Use:

mousedown.preventDefault()

where appropriate.

---

### Undo / Redo

Matching Gmail behavior is more important than implementing
theoretically better behavior.

If Gmail behaves a certain way, prefer matching Gmail.

---

### Trusted Types

Do not use innerHTML on Gmail DOM.

Use execCommand("insertHTML") instead.

---

## Development philosophy

Behavior first.

Architecture second.

Do not refactor speculative code.

Every refactor should remove existing duplication or simplify proven
behavior.

---

## Commits

Commits should be:

- one logical change
- independently testable
- easy to revert

Avoid mixing refactors with new functionality.

### Commit policy

Unless explicitly requested, do not create Git commits.

Leave all changes unstaged in the working tree for review.

The user is responsible for reviewing, staging, committing, squashing,
rebasing, and merging changes.

---

## Branches

Large features should be implemented on feature branches.

Each branch should contain several small, reviewable commits.

---

## Code style

Prefer:

- early returns
- descriptive names
- browser APIs
- small functions

Avoid:

- unnecessary classes
- clever abstractions
- premature optimization

---

## Logging

Console logging is acceptable during prototype development.

Prefix all logs with:

[GHTML 🧪]

Remove or reduce logging only when behavior has stabilized.

---

## Testing

Behavior should be verified manually inside Gmail after every logical
change.

Do not assume browser APIs behave the same inside Gmail as they do in
standalone HTML pages.

---

## AI expectations

Before making significant architectural changes:

- explain the reasoning
- prefer incremental changes
- preserve existing behavior
- avoid rewriting working code

When uncertain, choose the simplest implementation that satisfies the
current milestone.

---

## Current milestone

Implement per-compose-window UI.

Goals:

- detect compose windows
- attach one HTML button to each compose window
- support multiple compose windows simultaneously
- preserve existing insertion behavior
- do not integrate with Gmail's toolbar yet

The current floating HTML button may be removed once per-compose buttons
are working.
