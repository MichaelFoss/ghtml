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

## Compose ownership

Early versions tracked a single saved Selection.

This failed when multiple compose windows were open.

Current design:

```text
Compose Window
        │
        ▼
Saved Range
```

Each compose window owns:

- its launcher
- its saved Range
- insertion target

Opening a dialog freezes ownership until the dialog closes.

Selection changes from other compose windows are ignored while the
dialog is open.

This prevents HTML from being inserted into the wrong compose.

---

## HTML insertion

Current implementation:

```text
restore editor
        │
restore selection
        │
execCommand("insertHTML")
```

This preserves:

- Gmail undo
- Gmail redo
- cursor placement
- Gmail editing behavior

Manual DOM insertion was intentionally rejected.

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
