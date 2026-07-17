# Roadmap

This document tracks completed milestones, the current development
phase, and planned future work.

---

## Phase 1 — Foundation

✓ Complete

## Phase 2 — Compose Integration

✓ Complete

## Phase 3 — UX Improvements

✓ Complete

## Phase 4 — Production Polish

✓ Complete

## Phase 5 — Hardening & Release Readiness

▶ In Progress

- 5.1 Documentation alignment (Complete)
- 5.2 Sanitizer contract (Complete)
- 5.3 Sanitizer implementation (Complete)
  - 5.3.1 Replace denylist with allowlist (Complete) Replace the
    denylist model with the documented allowlist model so sanitizer
    support is explicit and conservative.
  - 5.3.2 Implement supported HTML contract (Complete) Implement the
    supported HTML contract through explicit element and attribute
    support, with unsupported markup removed.
  - 5.3.3 Implement URL policy (Complete) Implement the documented URL
    policy with a conservative, fail-closed outcome for URLs that cannot
    be confidently accepted.
  - 5.3.4 Implement CSS policy (Complete) Implement the documented CSS
    policy so supported inline styling is explicit and unsupported CSS
    is removed.
  - 5.3.5 Expand sanitizer unit tests (Complete) Expand unit tests to
    validate the documented sanitizer behavior and its supported HTML,
    URL, and CSS outcomes.
  - 5.3.6 Update README supported HTML section (Complete) Update the
    README to describe the supported HTML contract once the
    implementation reflects the documented architecture.
- 5.4 Lifecycle hardening (In Progress)
  - 5.4.1 Formalize compose lifecycle Document the complete compose
    lifecycle from discovery through destruction and define ownership
    transitions.
  - 5.4.2 Harden compose discovery Ensure compose discovery remains
    reliable during Gmail navigation, draft restoration, and delayed
    compose creation.
  - 5.4.3 Harden compose ownership Ensure launcher ownership, selection
    ownership, and active dialog ownership remain consistent across
    multiple compose windows.
  - 5.4.4 Harden cleanup Verify launchers, listeners, observers, and
    stored state are consistently removed when compose windows close or
    Gmail removes DOM nodes.
  - 5.4.5 Expand lifecycle regression tests Add unit tests covering
    compose lifecycle helpers and regression scenarios introduced during
    lifecycle hardening.
  - 5.4.6 Update architecture documentation Document the finalized
    compose lifecycle and ownership model.
- 5.5 Testing expansion (Planned)
- 5.6 Release polish (Planned)

---

## Future enhancements

- HTML template management
- Snippet library
- Keyboard shortcut customization
- Chrome Web Store release
