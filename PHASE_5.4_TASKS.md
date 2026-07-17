# Phase 5.4 Tasks

This file is intended to be consumed by both humans and AI assistants.
Implementation should always begin with the next unchecked
implementation step unless directed otherwise.

This file is a temporary implementation plan for Phase 5.4.

It exists only while the `phase-5.4-lifecycle-hardening` branch is
active.

The roadmap defines the official project milestones.

This file expands those milestones into smaller implementation tasks so
that development can proceed incrementally.

## Assumptions

- This file is a temporary implementation guide, not permanent
  documentation.
- The roadmap remains the authoritative record of project progress.
- Tasks in this file are expected to evolve as implementation reveals
  new information.
- Prefer updating this file before implementing newly discovered work so
  the implementation plan remains current.
- Implement the next unchecked task unless directed otherwise.
- If a task should be split into multiple smaller tasks, update this
  file before implementing them.
- If a task is no longer appropriate, remove or replace it rather than
  working around it.
- Keep tasks concrete and implementation-focused.
- When every task for a roadmap item is complete, mark the corresponding
  roadmap item complete.
- Before merging this branch into `main`, ensure every task is complete
  or intentionally removed, and delete this file.

---

## 5.4.1 Formalize compose lifecycle

### Goal

Document the current compose lifecycle as an explicit architectural
contract before making behavioral changes.

### Implementation Steps

- [x] Review the current compose lifecycle implementation.
- [x] Identify the lifecycle entry point.
- [ ] Identify the lifecycle exit point.
- [ ] Document compose discovery.
- [ ] Document launcher creation.
- [ ] Document compose ownership.
- [ ] Document selection ownership.
- [ ] Document dialog ownership.
- [ ] Document HTML insertion.
- [ ] Document cleanup.
- [ ] Update `ARCHITECTURE.md`.
- [ ] Mark roadmap item 5.4.1 complete.

### Lifecycle Entry Point

Chrome injects `content.js` at `document_idle`, and the module invokes
`GHTML.init()`. Initialization installs the document- and window-level
selection and positioning listeners, then enters `waitForGmailReady()`.

The compose lifecycle begins only after `isGmailReady()` succeeds.
`waitForGmailReady()` then disconnects its readiness observer and calls
`observeComposeWindows()`, which installs the compose observers and
performs the initial `syncComposeButtons()` pass.

---

## 5.4.2 Harden compose discovery

### Goal

Ensure compose discovery is reliable regardless of Gmail timing or UI
state.

### Implementation Steps

- [ ] Audit compose discovery.
- [ ] Audit MutationObserver behavior.
- [ ] Audit delayed compose creation.
- [ ] Audit restored drafts.
- [ ] Audit minimized compose windows.
- [ ] Audit Gmail SPA navigation.
- [ ] Remove duplicate launcher creation opportunities.
- [ ] Add regression tests.
- [ ] Mark roadmap item 5.4.2 complete.

---

## 5.4.3 Harden compose ownership

### Goal

Guarantee that launcher ownership, selection ownership, and active
dialog ownership always refer to the correct compose window.

### Implementation Steps

- [ ] Audit ownership transitions.
- [ ] Audit multi-compose scenarios.
- [ ] Verify selection ownership.
- [ ] Verify launcher ownership.
- [ ] Verify dialog ownership.
- [ ] Eliminate stale ownership references.
- [ ] Add regression tests.
- [ ] Mark roadmap item 5.4.3 complete.

---

## 5.4.4 Harden cleanup

### Goal

Ensure every lifecycle resource is released when a compose window is
destroyed.

### Implementation Steps

- [ ] Audit launcher cleanup.
- [ ] Audit dialog cleanup.
- [ ] Audit observer cleanup.
- [ ] Audit event listener cleanup.
- [ ] Audit compose state cleanup.
- [ ] Verify cleanup after Gmail removes DOM nodes.
- [ ] Add regression tests.
- [ ] Mark roadmap item 5.4.4 complete.

---

## 5.4.5 Expand lifecycle regression tests

### Goal

Increase confidence that lifecycle behavior remains stable as Gmail
changes.

### Implementation Steps

- [ ] Review current lifecycle coverage.
- [ ] Add compose discovery regression tests.
- [ ] Add ownership regression tests.
- [ ] Add cleanup regression tests.
- [ ] Add multi-compose regression tests.
- [ ] Add edge-case regression tests.
- [ ] Mark roadmap item 5.4.5 complete.

---

## 5.4.6 Update architecture documentation

### Goal

Ensure the architecture reflects the finalized lifecycle behavior after
implementation is complete.

### Implementation Steps

- [ ] Review lifecycle documentation.
- [ ] Remove outdated descriptions.
- [ ] Document finalized lifecycle.
- [ ] Document ownership model.
- [ ] Document cleanup guarantees.
- [ ] Verify documentation matches implementation.
- [ ] Mark roadmap item 5.4.6 complete.
