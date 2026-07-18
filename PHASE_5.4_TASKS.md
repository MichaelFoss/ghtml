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
- [x] Identify the lifecycle exit point.
- [x] Document compose discovery.
- [x] Document launcher creation.
- [x] Document compose ownership.
- [x] Document selection ownership.
- [x] Document dialog ownership.
- [x] Document HTML insertion.
- [x] Document cleanup.
- [x] Promote the finalized lifecycle contract from `PHASE_5.4_TASKS.md`
      into `ARCHITECTURE.md`, reorganizing it as permanent architecture
      documentation. Once verified, remove the temporary lifecycle draft
      from `PHASE_5.4_TASKS.md`, leaving only the implementation
      checklist.
- [x] Mark roadmap item 5.4.1 complete.

---

## 5.4.2 Harden compose discovery

### Goal

Ensure compose discovery is reliable regardless of Gmail timing or UI
state.

### Current Implementation Review

- Compose discovery starts only after `waitForGmailReady()` confirms the
  Gmail main UI is visible and the startup overlay is gone.
- `observeComposeWindows()` installs one document-body
  `MutationObserver`, one shared `ResizeObserver`, and immediately calls
  `syncComposeButtons()`.
- `findComposeWindows()` uses Gmail message bodies as discovery anchors
  and their closest `role="dialog"` ancestor as the compose identity.
- `syncComposeButtons()` creates launchers for newly discovered compose
  dialogs, removes launchers and saved selections for
  no-longer-discovered compose dialogs, and repositions all launchers
  after every sync.
- Minimized compose windows remain discovered while their message body
  still exists; `positionButton()` hides their launcher separately from
  discovery.

### Architectural Observations

- The implementation currently matches the documented lifecycle contract
  at the high level: readiness gate, message-body discovery anchor,
  compose-dialog identity, idempotent launcher map, and cleanup through
  `syncComposeButtons()`.
- Discovery is intentionally broad: any qualifying mutation outside
  GHTML launcher button targets triggers a full document resync. This is
  simple and resilient, but can do extra work during busy Gmail DOM
  changes.
- The observer ignores mutations only when every mutation target is a
  GHTML launcher button. Mutations to launcher descendants or future
  GHTML-owned DOM outside the button may still trigger discovery syncs.
- Discovery depends on the editable message body remaining in the DOM.
  If Gmail temporarily removes or swaps the body during draft
  restoration, navigation, or delayed compose hydration, the current
  cleanup path may remove launcher and selection state before the
  compose returns.
- `findComposeWindow()` returns the nearest `role="dialog"` ancestor
  without additional compose-specific validation. This is consistent
  with the current architecture, but Phase 5.4.2 should verify whether
  Gmail exposes non-compose editable textboxes inside dialogs that could
  match the selector.
- Gmail SPA navigation is covered only indirectly by the document-body
  observer. If Gmail replaces `document.body` or moves compose DOM in a
  way that disconnects the observed body, discovery may need a guarded
  observer reattachment strategy.
- Current automated tests cover sanitizer and dialog helpers only.
  Compose discovery remains manual/runtime behavior until lifecycle
  helpers are extracted or test seams are introduced in later 5.4 work.

### Implementation Steps

- [ ] Reproduce and document the current discovery baseline in Gmail:
      new compose, reply compose, pop-out compose, multiple simultaneous
      compose windows, minimized compose restore, draft restore after
      reload, delayed compose creation after startup, and Gmail
      route/navigation changes.
- [ ] Add temporary development logging, if needed, only while manually
      auditing discovery. Remove or explicitly keep any logging before
      completing the implementation.
- [ ] Verify that `waitForGmailReady()` still prevents launcher
      initialization before Gmail's restored DOM is visible.
- [ ] Verify that `observeComposeWindows()` remains attached after Gmail
      route/navigation changes and identify whether Gmail can replace
      the observed `document.body`.
- [ ] Verify that `findComposeWindows()` discovers all expected Gmail
      compose variants and does not discover non-compose editable
      textboxes inside unrelated Gmail dialogs.
- [ ] Verify that the message body is stable enough to remain the
      discovery anchor during draft restoration, delayed compose
      hydration, minimize/restore, and pop-out transitions.
- [ ] Verify that `syncComposeButtons()` is idempotent across the
      initial sync, mutation-driven syncs, resize-driven positioning,
      and multiple compose windows.
- [ ] Verify that removing a compose from discovery does not happen
      prematurely during transient Gmail DOM changes that later restore
      the same compose.
- [ ] Verify that GHTML-owned DOM mutations, including launcher child or
      style changes and shared dialog changes, do not create recursive
      or excessive compose syncs.
- [ ] Decide whether discovery needs a small implementation change. Keep
      any change limited to compose discovery and avoid altering
      launcher ownership, selection ownership, dialog behavior,
      insertion, or sanitizer behavior.
- [ ] If Gmail can replace the observed root, add a guarded observer
      reattachment path that preserves the existing readiness contract
      and avoids continuous polling.
- [ ] If transient compose DOM removal is observed, identify the
      smallest architectural change that preserves the documented
      lifecycle guarantees. Implement only after the approach has been
      reviewed or is clearly implied by the existing architecture.
- [ ] If non-compose editable dialogs are discovered, tighten discovery
      with the smallest Gmail-specific validation that still supports
      existing compose variants.
- [ ] If GHTML-owned mutations cause recursive or excessive syncs,
      expand the self-mutation filter to cover GHTML-owned
      launcher/dialog DOM without suppressing Gmail compose mutations.
- [ ] Add focused regression coverage only after a testable helper or
      seam exists. If helper extraction belongs more naturally in 5.4.5,
      document the test gap and defer broad test expansion there.
- [ ] Run the manual regression scenarios that correspond to any changed
      discovery behavior, referencing stable IDs from `TESTING.md` where
      applicable.
- [ ] Run `yarn run check`.
- [ ] Run `git diff --check`.
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
