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

Result: Rejected.

Reason: Gmail rebuilds and/or reconciles the formatting toolbar during
compose lifecycle events. Injecting custom children into Gmail-managed
toolbar containers causes native controls to disappear or fail to
rebuild.

Conclusion: Do not insert custom DOM into Gmail-managed toolbar
children.

---

### Body-mounted toolbar overlay (v3)

Attempted:

- body-mounted
- toolbar-relative positioning

Result: Partially successful.

Issues:

- Toolbar geometry unavailable during portions of compose lifecycle.
- Overlay positioning inconsistent after minimize/restore.
- Gmail lazily constructs toolbar.

Conclusion: A positioning abstraction is required.
