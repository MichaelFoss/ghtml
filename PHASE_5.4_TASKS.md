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
- [ ] Promote the finalized lifecycle contract from `PHASE_5.4_TASKS.md`
      into `ARCHITECTURE.md`, reorganizing it as permanent architecture
      documentation. Once verified, remove the temporary lifecycle draft
      from `PHASE_5.4_TASKS.md`, leaving only the implementation
      checklist.
- [ ] Mark roadmap item 5.4.1 complete.

### Lifecycle Entry Point

Chrome injects `content.js` at `document_idle`, and the module invokes
`GHTML.init()`. Initialization installs the document- and window-level
selection and positioning listeners, then enters `waitForGmailReady()`.

The compose lifecycle begins only after `isGmailReady()` succeeds.
`waitForGmailReady()` then disconnects its readiness observer and calls
`observeComposeWindows()`, which installs the compose observers and
performs the initial `syncComposeButtons()` pass.

### Lifecycle Exit Point

An individual compose lifecycle ends during `syncComposeButtons()` when
`findComposeWindows()` no longer discovers its message body and owning
compose dialog. The sync pass removes the compose's launcher, stops
observing the compose with the resize observer, and deletes its launcher
and saved-selection entries from the per-compose maps.

The content-script runtime has a separate global exit point:
`GHTML.destroy()`. The script calls it before replacing an existing
`window.GHTML` instance during reinjection. Global teardown removes the
document and window listeners, disconnects all observers, cancels the
pending Gmail-readiness frame, removes all GHTML-owned DOM, clears
per-compose state, and clears active compose ownership.

### Compose Discovery

Compose discovery starts in `observeComposeWindows()` after Gmail
readiness succeeds. The function creates a document-body
`MutationObserver`, observes child-list changes plus `class` and `style`
attribute changes across the subtree, and performs an immediate
`syncComposeButtons()` pass so compose windows already present at
startup are included.

Each sync calls `findComposeWindows()`. Discovery queries the document
for Gmail message bodies matching the editable textbox selector, finds
the nearest ancestor with `role="dialog"` for each body, accepts only
`HTMLElement` ancestors, and collects them in a `Set`. The message body
is therefore the discovery anchor and the containing dialog is the
compose identity. The set prevents more than one discovery result for a
single compose dialog.

Subsequent qualifying DOM mutations trigger another complete sync.
Mutations whose targets are all GHTML launcher buttons are ignored so
GHTML's own button updates do not recursively trigger discovery. A
compose remains discovered while its matching message body and dialog
remain in the document, including when Gmail hides the message body for
a minimized compose; minimized-state handling is separate from
discovery.

### Launcher Creation

`syncComposeButtons()` creates a launcher only when a discovered compose
dialog has no entry in the `composeButtons` map. It calls
`createComposeButton()` with that dialog, then registers the dialog with
the shared `ResizeObserver`. The map check makes launcher creation
idempotent across the initial sync and later mutation-driven syncs.

`createComposeButton()` delegates the DOM construction to
`createButton()`. The launcher is a GHTML-owned, fixed-position button
appended directly to `document.body`, outside Gmail-managed toolbar DOM.
The constructor applies the launcher's accessible label, title, visual
styles, hover behavior, and interaction listeners. Its `mousedown`
listener prevents the button from taking focus before the compose
selection is preserved, and its guarded click listener invokes the
compose-specific callback.

After construction, `createComposeButton()` stores the launcher under
its compose dialog in `composeButtons` and positions it relative to that
dialog. The callback captures the same compose dialog and launcher,
assigns them as the active compose pair, and opens the shared dialog.
Window resize and scroll listeners, the compose `ResizeObserver`, and
each sync pass subsequently reposition all launchers. A minimized
compose keeps its launcher entry but `positionButton()` hides the button
until the compose is restored.

### Compose Ownership

The Gmail compose dialog element is the identity and ownership key for
each compose lifecycle. `composeButtons` maps that dialog to its
GHTML-owned launcher, and `composeSelections` uses the same dialog key
for the compose's saved range. Launcher positioning, selection
restoration, insertion targeting, and cleanup therefore resolve through
the same compose identity rather than through document-wide state.

Each launcher's click callback closes over its owning compose dialog and
the launcher created for it. Clicking the launcher copies that pair into
`activeComposeWindow` and `activeComposeButton` before opening the
shared dialog. Those active references freeze ownership for the dialog
session: selection changes are ignored while an active compose exists,
and dialog close restores only that compose's editor and saved range.

`clearActiveCompose()` ends the temporary active ownership after dialog
close by re-enabling the owning launcher and clearing both active
references. The per-compose ownership entries remain until
`syncComposeButtons()` no longer discovers the compose, at which point
the launcher and saved range for that dialog are removed together.
`GHTML.destroy()` performs the equivalent global release by removing all
launchers, clearing both per-compose maps, and clearing active
ownership.

### Selection Ownership

Selection state is owned per compose dialog in `composeSelections`. The
document-level `selectionchange` listener resolves the active element to
a Gmail message body and then to its containing compose dialog. It saves
a clone of the browser's first range under that dialog, so later browser
selection changes cannot mutate the stored range and a selection from
one compose cannot replace another compose's entry. Selection changes
outside a Gmail message body, without a range, or without a valid
compose dialog are ignored.

While the shared HTML dialog owns an active compose,
`onSelectionChange()` ignores all selection changes. This freezes the
owning compose's saved range while focus moves into the GHTML dialog and
prevents another compose from taking selection ownership during the
dialog session. The launcher's `mousedown` handler also prevents the
launcher itself from taking focus before its click callback establishes
active compose ownership.

`restoreEditor()` restores selection only for the compose dialog passed
to it, defaulting to `activeComposeWindow`. It resolves that compose's
current message body and, if the compose has no saved selection, creates
a collapsed fallback range at the end of that editor. It then focuses
the editor and delegates to `restoreSelection()`, which replaces the
browser selection with the range stored under the same compose key.
Dialog cancel and insert both use this restoration path before active
ownership is cleared; insertion therefore executes against the restored
selection belonging to the dialog's owning compose.

Selection ownership lasts for the discovered compose lifecycle.
`syncComposeButtons()` deletes the compose's saved range when discovery
no longer returns that compose dialog, and `GHTML.destroy()` clears all
saved selections during global teardown. Saved ranges are runtime-only
state and are never persisted.

### Dialog Ownership

The HTML dialog is shared across all compose windows, but each open
dialog session is owned by exactly one compose dialog. Ownership is
established by the launcher click callback in `createComposeButton()`,
which copies the clicked launcher's compose dialog into
`activeComposeWindow` and the launcher itself into `activeComposeButton`
before calling `showDialog()`.

`showDialog()` creates the shared backdrop, dialog, textarea, and action
buttons on first use, then reuses those elements for later compose
sessions. The active launcher is disabled while the dialog is open, and
all launcher z-indexes are lowered behind the modal layer so the shared
dialog remains the active interaction surface. Dialog state is restored
from extension storage before focus moves into the textarea.

While the dialog is open, ownership is enforced through the active
compose references and modal listeners. The window-level keydown handler
stops Gmail shortcuts and routes dialog keyboard actions, while the
document-level focus handler returns stray focus to the textarea. The
selectionchange handler also ignores browser selection changes whenever
`activeComposeWindow` is set, so focus movement inside the dialog cannot
overwrite the owning compose's saved range.

Dialog close always resolves through the active compose captured at the
start of `closeDialog()`. The dialog state is persisted, modal listeners
are removed, the dialog and backdrop are hidden, launcher z-indexes are
restored, and `restoreEditor()` is called for that captured compose.
Only after restoration does `clearActiveCompose()` re-enable the owning
launcher and clear the active references. Cancel, close, and insert all
use this close path; insert proceeds only if the owning compose's editor
and selection were restored successfully.

### HTML Insertion

Insertion starts from the shared dialog's Insert button. The click
handler copies the current textarea value before closing the dialog, so
the user-authored HTML for that insertion is stable even though
`closeDialog()` persists state, hides the modal, and restores Gmail
focus.

`closeDialog()` is part of the insertion path rather than a separate
post-insertion cleanup step. It restores the active compose editor and
that compose's saved selection before active ownership is cleared. If
the editor or selection cannot be restored, `closeDialog()` returns
`false` and insertion stops without sanitizing or calling
`execCommand()`.

After the owning compose is restored, insertion sanitizes the copied
HTML with the single runtime sanitizer entry point,
`globalThis.sanitizeHtml()`. The sanitized output is then inserted with
`document.execCommand('insertHTML', false, sanitizedHtml)`. This keeps
GHTML aligned with Gmail's native editing stack so insertion preserves
Gmail undo, redo, cursor placement, selection replacement, and other
editor behavior more closely than manual DOM insertion.

Insertion is always targeted through the active compose ownership that
was established when the launcher opened the dialog. Because selection
changes are frozen while the dialog is open and the owning compose's
saved range is restored before `execCommand()`, the inserted HTML
replaces or appears at the selection belonging to the compose that
opened the dialog, not any other compose window.

### Cleanup

Per-compose cleanup happens during `syncComposeButtons()`. Each sync
builds the current discovered compose set from Gmail message bodies and
their containing dialog elements, then compares that set with the
existing `composeButtons` map. A compose is considered removed when its
dialog key is still in `composeButtons` but no longer appears in the
fresh discovery result.

When a compose is removed, `syncComposeButtons()` removes its
GHTML-owned launcher from the document, unregisters the compose dialog
from the shared resize observer, deletes the compose's launcher entry,
and deletes the saved selection owned by the same compose key. This
keeps the launcher and runtime selection state tied to the discovered
compose lifecycle. The shared dialog DOM, persisted dialog state, and
state for other discovered compose windows are not removed during
per-compose cleanup.

Global cleanup happens in `GHTML.destroy()`, which is called before a
new content-script instance replaces an existing `window.GHTML` object.
Global teardown removes the document selection listener and window
resize and scroll listeners, disconnects the compose mutation observer,
compose resize observer, and Gmail readiness observer, and cancels any
scheduled readiness animation frame.

`GHTML.destroy()` then removes every GHTML-owned launcher, clears both
per-compose maps, clears active compose ownership, removes modal
keyboard and focus listeners, and removes the shared backdrop and dialog
from the document. After global teardown, no launcher, dialog, observer,
listener, saved selection, or active compose reference from that
content-script instance should remain intentionally owned by GHTML.

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
