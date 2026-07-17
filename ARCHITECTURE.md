# GHTML Architecture Notes

This document captures architectural decisions, experiments, and Gmail
behavior discoveries that should not be rediscovered in future
development.

These are not theoretical designs—they are conclusions reached through
implementation and testing.

---

## Guiding principles

1. Preserve Gmail behavior above all else.
2. Prefer browser APIs over custom implementations.
3. Keep runtime architecture simple.
4. Refactor only after behavior is proven.
5. Optimize for correctness before elegance.

---

## Runtime architecture

Current architecture:

```text
Content Script
│
├── sanitizer.js
│
├── dialog-helpers.js
│
└── content.js
        │
        ├── Gmail lifecycle
        ├── compose detection
        ├── launcher management
        ├── selection ownership
        ├── dialog lifecycle
        ├── insertion
        └── persistence
```

There is intentionally:

- no framework
- no bundler
- no transpiler
- no dependency injection
- no runtime libraries

---

## Compose lifecycle

Chrome injects `content.js` at `document_idle`, and the module invokes
`GHTML.init()`. Initialization installs the document- and window-level
selection and positioning listeners, then enters `waitForGmailReady()`.

The compose lifecycle begins only after `isGmailReady()` succeeds.
`waitForGmailReady()` disconnects its readiness observer and calls
`observeComposeWindows()`, which installs the compose observers and
performs the initial `syncComposeButtons()` pass.

An individual compose lifecycle ends during `syncComposeButtons()` when
`findComposeWindows()` no longer discovers its message body and owning
compose dialog. The sync pass removes the compose's launcher, stops
observing the compose with the resize observer, and deletes its launcher
and saved-selection entries from the per-compose maps.

The content-script runtime has a separate global exit point:
`GHTML.destroy()`. The script calls it before replacing an existing
`window.GHTML` instance during reinjection. Global teardown removes
listeners, disconnects observers, cancels the pending Gmail-readiness
frame, removes GHTML-owned DOM, clears per-compose state, and clears
active compose ownership.

### Compose discovery

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
is the discovery anchor and the containing dialog is the compose
identity. The set prevents more than one discovery result for a single
compose dialog.

Subsequent qualifying DOM mutations trigger another complete sync.
Mutations whose targets are all GHTML launcher buttons are ignored so
GHTML's own button updates do not recursively trigger discovery. A
compose remains discovered while its matching message body and dialog
remain in the document, including when Gmail hides the message body for
a minimized compose; minimized-state handling is separate from
discovery.

### Launcher creation

`syncComposeButtons()` creates a launcher only when a discovered compose
dialog has no entry in the `composeButtons` map. It calls
`createComposeButton()` with that dialog, then registers the dialog with
the shared `ResizeObserver`. The map check makes launcher creation
idempotent across the initial sync and later mutation-driven syncs.

`createComposeButton()` delegates DOM construction to `createButton()`.
The launcher is a GHTML-owned, fixed-position button appended directly
to `document.body`, outside Gmail-managed toolbar DOM. The constructor
applies the launcher's accessible label, title, visual styles, hover
behavior, and interaction listeners. Its `mousedown` listener prevents
the button from taking focus before the compose selection is preserved,
and its guarded click listener invokes the compose-specific callback.

After construction, `createComposeButton()` stores the launcher under
its compose dialog in `composeButtons` and positions it relative to that
dialog. The callback captures the same compose dialog and launcher,
assigns them as the active compose pair, and opens the shared dialog.
Window resize and scroll listeners, the compose `ResizeObserver`, and
each sync pass subsequently reposition all launchers. A minimized
compose keeps its launcher entry but `positionButton()` hides the button
until the compose is restored.

### Ownership model

The Gmail compose dialog element is the identity and ownership key for
each compose lifecycle. `composeButtons` maps that dialog to its
GHTML-owned launcher, and `composeSelections` uses the same dialog key
for the compose's saved range. Launcher positioning, selection
restoration, insertion targeting, and cleanup resolve through the same
compose identity rather than through document-wide state.

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

### Selection ownership

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
ownership is cleared.

Selection ownership lasts for the discovered compose lifecycle.
`syncComposeButtons()` deletes the compose's saved range when discovery
no longer returns that compose dialog, and `GHTML.destroy()` clears all
saved selections during global teardown. Saved ranges are runtime-only
state and are never persisted.

### Dialog ownership

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

### HTML insertion

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

## Compose launcher experiments

### Floating button (v1)

Pros

- Extremely robust
- Survived minimize/restore
- Survived fullscreen
- Worked with multiple compose windows
- Independent of Gmail toolbar implementation

Cons

- Placement not ideal

---

### Toolbar child (v2)

Attempted:

- clone Bold
- clone Remove Formatting
- clone native controls

Result:

Rejected.

Reason:

Gmail rebuilds and reconciles portions of its formatting toolbar during
compose lifecycle events.

Injecting custom controls into Gmail-managed toolbar containers caused
native controls to disappear or fail to rebuild.

Conclusion:

Never insert custom controls into Gmail-managed toolbar children.

---

### Body-mounted toolbar overlay (v3)

Attempted:

- body-mounted overlay
- toolbar-relative positioning

Result:

Partially successful.

Issues:

- Toolbar geometry unavailable during portions of compose lifecycle.
- Overlay positioning inconsistent after minimize/restore.
- Gmail lazily constructs the toolbar.

Conclusion:

Position relative to the compose window instead of the toolbar.

---

## Sanitizer security model

The sanitizer exists to:

- prevent active content from being inserted into Gmail
- prevent dangerous markup from being inserted
- ensure GHTML never intentionally emits malformed HTML
- preserve valid user-authored HTML whenever possible

The security and authoring concerns are intentionally separate.

Security requires the sanitizer to prevent dangerous content, remove
unsupported content, and produce valid output.

Ordinary HTML authoring mistakes are not a security concern. Browsers
already parse and recover from malformed HTML, and that parsing
determines the DOM on which GHTML operates. GHTML accepts user mistakes
as browser input and does not attempt to become an HTML validator or
correct user-authored HTML beyond normal browser parsing.

Sanitizer correctness therefore refers to the output GHTML produces, not
to repairing arbitrary input.

---

## Supported HTML contract

Supported HTML is defined by an explicit allowlist, not inferred from
browser capabilities or inherited from a denylist of known risks.

The allowlist represents:

- an explicit collection of supported elements
- the supported attributes for each element
- a small collection of globally supported attributes that may apply to
  every supported element

Elements and attributes outside this model are removed. Support is
intentionally conservative and expands only through deliberate
architectural decisions. New elements or attributes must be explicitly
adopted rather than automatically inherited from broader platform
support.

---

## URL policy

Every URL-bearing attribute is untrusted input. Its value is evaluated
independently from the element that contains it, so accepting an element
does not imply accepting any URL associated with that element.

URL support is defined by an explicit allowlist and architectural
policy, not by browser behavior. Unsupported, malformed, unknown, and
future URL schemes are rejected rather than automatically accepted.
Browser parsing does not determine the sanitizer's security policy.

URL handling intentionally fails closed. Any URL that cannot be
confidently accepted is removed rather than preserved.

---

## CSS policy

CSS is untrusted input and is evaluated independently from the HTML
element that contains it. Supporting an element does not imply support
for its CSS.

Inline CSS may be part of the supported HTML contract, but its support
is defined by explicit architectural policy rather than browser
behavior. Unsupported constructs are removed rather than preserved, and
future CSS capabilities are not automatically accepted. CSS handling
follows the same conservative, fail-closed philosophy used for HTML
elements and URLs.

Support for inline CSS does not imply support for `<style>` elements or
any other CSS delivery mechanism.

---

## Gmail processing model

User-supplied HTML is first interpreted into a DOM. GHTML sanitizes that
parsed content before insertion and is responsible for the correctness
and safety of everything it inserts.

Gmail is an independent downstream processor and may normalize, modify,
or remove markup after insertion. GHTML must not rely on that processing
to enforce its security policy; it is defense in depth rather than the
primary security boundary.

GHTML's sanitizer must therefore remain correct even if Gmail's
processing changes.

---

## Dialog architecture

The dialog is implemented as a single reusable DOM element.

Reasons:

- simpler lifecycle
- less allocation
- easier persistence
- avoids rebuilding event listeners

The dialog maintains:

- position
- HTML contents

between openings.

---

## Dialog modality

The dialog behaves as a true modal.

Implemented behavior:

- backdrop
- focus trap
- keyboard trap
- Gmail shortcut suppression
- compose restoration

While open:

- Gmail should not receive keyboard events.
- Gmail should not receive pointer events.

Closing restores the owning compose window.

---

## Dialog dragging

Dragging is implemented manually using Pointer Events.

Reasons:

- browser-native
- no dependency
- predictable
- works with persistence

Dragging is constrained so that the dialog title bar always remains
reachable.

---

## Persistence

Persisted:

- dialog position
- HTML contents

Storage:

```javascript
chrome.storage.local;
```

Persistence intentionally excludes:

- compose ownership
- selections
- Gmail runtime state

---

## Gmail readiness

Gmail restores portions of its DOM before the application is visually
ready.

Compose windows may exist before users can see them.

Current startup flow:

```text
waitForGmailReady()
        │
Gmail UI visible
        │
loading overlay gone
        │
start compose observers
```

No timers.

No polling.

Readiness is driven by DOM mutations plus `requestAnimationFrame()`.

---

## Positioning

Launchers are positioned relative to compose windows.

Dialog position is independent.

Reasons:

- survives scrolling
- survives minimize
- survives multiple compose windows

---

## Helper extraction

Logic that can be expressed as pure functions belongs in
`dialog-helpers.js`.

Current examples:

- keyboard action classification
- indentation
- outdentation
- insertion edits
- dialog constraints
- dialog persistence model

Pure helpers should have Vitest coverage.

DOM behavior remains in `content.js`.

---

## Testing strategy

Two levels of testing exist.

### Unit tests

Pure logic only.

Current coverage includes:

- sanitizer
- dialog helpers
- keyboard classification
- indentation
- dialog persistence helpers
- positioning helpers

### Manual testing

Required for:

- Gmail lifecycle
- selection
- focus
- undo/redo
- insertion
- dialog
- launcher positioning

Browser behavior is the source of truth.

---

## Architectural rules

Prefer:

- browser APIs
- pure helper extraction
- incremental improvements
- one responsibility per function

Avoid:

- speculative abstractions
- dependency injection
- classes without clear value
- framework-like architecture
- rebuilding working Gmail interactions
