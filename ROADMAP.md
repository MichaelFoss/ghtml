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

## Phase 5 — MVP Release

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
- 5.4 Store readiness (In Progress)
  - 5.4.1 Add required Chrome Web Store manifest metadata (Complete) Add
    the extension description and icon declarations required for store
    submission.
  - 5.4.2 Add privacy policy (Complete) Document what GHTML stores, what
    it does not collect, and how user-provided HTML is handled.
  - 5.4.3 Prepare Chrome Web Store listing copy Write the short
    description, detailed description, category, screenshots, and
    promotional copy for submission.
  - 5.4.4 Package extension zip Create a release package that excludes
    development-only files and includes only the extension files needed
    by Chrome.
- 5.5 Release smoke test (Planned)
  - 5.5.1 Run automated checks.
  - 5.5.2 Run the critical Gmail manual tests from `TESTING.md`.
  - 5.5.3 Fix only release-blocking bugs found during smoke testing.
- 5.6 Chrome Web Store submission (Planned)
  - 5.6.1 Fill out privacy fields and permission justifications in the
    Chrome Web Store Developer Dashboard.
  - 5.6.2 Submit the MVP for Chrome Web Store review.

---

## Future enhancements

- HTML template management
- Snippet library
- Keyboard shortcut customization
- Lifecycle hardening beyond the MVP smoke test
- Expanded lifecycle regression tests
