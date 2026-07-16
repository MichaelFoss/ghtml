# HTML Dialog Tasks

## Purpose

Improve the HTML insertion dialog while preserving all existing editor,
selection, sanitization, and compose-window behavior.

Complete each task independently, in order.

Each task must result in exactly one focused commit.

Before beginning any task, read:

- AGENTS.md
- README.md
- ARCHITECTURE.md
- TESTING.md
- this file

Do not modify behavior outside the active task.

---

## Task Status

- [x] Task 1 — Improve dialog layout
- [x] Task 2 — Add dialog keyboard controls
- [x] Task 3 — Improve textarea editing
- [x] Task 4 — Add dialog dragging and persistence
- [ ] Task 4.5 - Polish dialog chrome
- [ ] Task 5 — Make dialog modal
- [ ] Task 5.5 — Preserve compose ownership
- [ ] Task 5.6 — Delay launcher activation until Gmail UI is ready
- [ ] Task 6 — Add dialog unit tests

---

## Task 1 — Improve Dialog Layout

### Goal

Modernize the dialog appearance without changing behavior.

### Improve

- Title bar styling
- Visual hierarchy
- Padding and spacing
- Button alignment
- Textarea dimensions
- Gmail-compatible colors
- Responsive sizing for smaller viewports

### Requirements

- Preserve all existing behavior.
- Keep the existing textarea.
- No syntax highlighting.
- No persistence.
- No keyboard shortcuts.
- No launcher changes.
- No new dependencies.
- Do not modify TESTING.md.

### Validation

Run:

```sh
yarn run check
git diff --check
```

Manually verify:

- Dialog opens.
- Dialog closes.
- Insert still works.
- Cancel still works.

### Commit

```text
Improve HTML dialog layout
```

Mark Task 1 complete before committing.

---

## Task 2 — Add Dialog Keyboard Controls

### Goal

Improve keyboard usability with familiar, cross-platform shortcuts.

### Add

- Escape closes the dialog.
- Cmd+Enter inserts HTML.
- Ctrl+Enter also inserts HTML for cross-platform consistency.
- Normal Enter inserts a newline.
- Tab remains usable inside the textarea.
- Initial focus remains on the textarea.

### Requirements

Do not change insertion behavior.

Do not add persistence.

Do not modify TESTING.md.

### Validation

Run:

```sh
yarn run check
git diff --check
```

Verify keyboard behavior manually.

### Commit

```text
Add dialog keyboard controls
```

Mark Task 2 complete before committing.

---

## Task 3 — Improve Textarea Editing

### Goal

Make editing HTML more pleasant without introducing a code editor.

### Add

- Preserve indentation when pressing Enter.
- Insert spaces when pressing Tab.
- Maintain selection correctly.
- Improve textarea resizing.

### Requirements

Do not add CodeMirror, Monaco, Ace, or any editor library.

Keep a plain textarea.

### Validation

Run:

```sh
yarn run check
git diff --check
```

Verify indentation manually.

### Commit

```text
Improve HTML textarea editing
```

Mark Task 3 complete before committing.

---

## Task 4 — Add Dialog Dragging and Persistence

### Goal

Make the dialog movable and preserve the user's work between openings.

### Add

- Drag the dialog by its title bar.
- Remember the dialog position.
- Remember the most recent HTML entered.
- Restore both when the dialog is opened again.
- Use the existing default position the first time the dialog is opened.
- Keep the title bar reachable after dragging (prevent it from ending up
  completely off-screen).

### Requirements

Use `chrome.storage.local`.

Store a single dialog state object containing only the minimum required
state.

Restore state only when the dialog is reopened.

Do not automatically insert saved HTML.

Do not persist width or height.

Do not add resize behavior.

Keep the implementation lightweight.

### Validation

Run:

```sh
yarn run check
git diff --check
```

Verify:

- Dragging works smoothly.
- Reopening restores dialog position.
- Reopening restores HTML.
- Browser refresh preserves both.
- First launch still opens in the default position.
- Insert and Cancel continue to work.

### Commit

```text
Persist HTML dialog state
```

Mark Task 4 complete before committing.

---

## Task 4.5 — Polish Dialog Chrome

### Goal

Improve the dialog's title bar so it behaves more like a native Gmail
dialog.

### Add

- Full-width title bar.
- Distinct title-bar background.
- Make the entire title bar draggable.
- Reduce padding above the title.
- Add a Close (×) button in the upper-right corner.
- Clicking the Close button behaves exactly like Cancel.
- Preserve existing dragging behavior.

### Requirements

Do not change persistence.

Do not change keyboard shortcuts.

Do not change dialog sizing.

Do not modify TESTING.md.

### Validation

Run:

```sh
yarn run check
git diff --check
```

Verify:

- Entire title bar drags the dialog.
- Close button closes the dialog.
- Escape and Close behave identically.
- Dialog appearance feels native beside Gmail.

### Commit

```text
Polish HTML dialog title bar
```

---

## Task 5 — Make Dialog Modal

### Goal

Prevent interaction with Gmail while the dialog is open.

### Add

- Trap keyboard focus within the dialog.
- Prevent mouse interaction outside the dialog.
- Add a full-page backdrop behind the dialog.
- Restore focus to the editor when the dialog closes.
- Prevent Gmail keyboard shortcuts from firing while the dialog is open.
- Add appropriate hover and focus-visible states for interactive
  controls (for example, Close, Cancel, and Insert) consistent with
  Gmail's visual language.

### Requirements

Do not change insertion behavior.

Do not change sanitization.

Do not change persistence.

Keep implementation lightweight.

Do not add third-party libraries.

### Validation

Run:

```sh
yarn run check
git diff --check
```

Verify:

- Clicking outside the dialog does not interact with Gmail.
- Tab cycles only within the dialog.
- Gmail keyboard shortcuts do not fire.
- Interactive controls provide clear hover and keyboard focus feedback.
- Escape still closes the dialog.
- Insert and Cancel continue to work.
- Focus returns to the editor after closing.

### Commit

```text
Make HTML dialog modal
```

Mark Task 5 complete before committing.

---

## Task 5.5 — Preserve Compose Ownership

### Goal

Ensure HTML is always inserted into the compose window that opened the
dialog.

### Add

- Maintain dialog ownership of its originating compose window.
- Before restoring the saved selection, ensure the owning compose window
  regains editor focus.
- Ignore focus changes that occur in other compose windows while the
  dialog is open.

### Requirements

Do not change dialog behavior.

Do not change launcher behavior.

Do not change persistence.

Do not change sanitization.

Do not modify TESTING.md.

### Validation

- Open two compose windows.
- Open the dialog from Compose A.
- Click inside Compose B.
- Press Insert.
- HTML is inserted into Compose A.
- Compose B is unchanged.
- Existing tests continue to pass.

### Commit

```text
Preserve compose ownership
```

---

## Task 5.6 — Delay Launcher Activation Until Gmail UI Is Ready

### Goal

Prevent HTML launchers from appearing before Gmail has finished
rendering its compose UI.

### Add

- Wait until Gmail's startup overlay is gone and its main application UI
  is visible.
- Initialize launchers exactly once after Gmail is ready.
- Resume the existing compose-window observation lifecycle after
  initialization.

### Requirements

Do not introduce arbitrary timeouts.

Use MutationObserver and requestAnimationFrame, or similar browser
lifecycles, to detect application readiness without continuous polling.

Do not change launcher positioning.

Do not change compose ownership.

Do not change dialog behavior.

Do not modify TESTING.md.

### Validation

Run:

```sh
yarn run check
git diff --check
```

Verify:

- Refresh Gmail with one or more compose windows already open.
- No launcher appears over Gmail's loading screen.
- Launchers appear only after Gmail reveals its main application UI.
- Newly opened compose windows still receive launchers normally.
- Existing launcher behavior remains unchanged.

### Commit

```text
Prevent launcher flash during Gmail startup
```

Mark Task 5.6 complete before committing.

---

## Task 6 — Add Dialog Unit Tests

### Goal

Increase automated coverage for dialog behavior where practical.

### Add tests for

- dialog creation
- open
- close
- enable/disable button
- keyboard shortcuts
- persistence helpers

Prefer testing pure functions.

Avoid brittle DOM implementation tests.

Do not duplicate manual integration tests.

### Validation

Run:

```sh
yarn test
yarn run check
git diff --check
```

### Commit

```text
Add HTML dialog unit tests
```

Mark Task 6 complete before committing.

---

## Completion Criteria

Phase 4 is complete when:

- Dialog has polished layout.
- Keyboard workflow is improved.
- Textarea editing is pleasant.
- User input persists between openings.
- Dialog behaves modally while open.
- Appropriate unit tests are added.
- Every task exists as its own commit.
