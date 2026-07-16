# Unit Testing Tasks

## Purpose

Establish unit-testing infrastructure for GHTML and add automated tests
for the HTML sanitizer.

Complete each task independently, in order.

Each task must result in exactly one focused commit.

Before beginning any task, read:

- `AGENTS.md`
- `README.md`
- `ARCHITECTURE.md`
- `TESTING.md`
- this file

Do not modify behavior outside the active task.

---

## Task Status

- [x] Task 1 — Reorganize source files
- [x] Task 2 — Install and configure Vitest
- [ ] Task 3 — Add sanitizer unit tests

---

## Task 1 — Reorganize Source Files

### Goal

Move runtime JavaScript into a dedicated source directory without
changing extension behavior.

### Changes

Create this structure:

```text
src/
├── content.js
└── sanitizer.js
```

Move:

```text
content.js   → src/content.js
sanitizer.js → src/sanitizer.js
```

Update `manifest.json` to load:

```json
"js": ["src/sanitizer.js", "src/content.js"]
```

### Requirements

- Preserve all existing runtime behavior.
- Preserve script loading order.
- Do not change implementation code except where paths require it.
- Do not introduce a build step.
- Do not introduce ES modules.
- Do not add testing dependencies.
- Do not modify `TESTING.md`.
- Do not perform unrelated cleanup.

### Validation

Run:

```sh
yarn run check
git diff --check
```

Manually confirm that the unpacked extension still loads and that the
compose launcher appears.

### Commit

Create exactly one commit:

```text
Organize extension source files
```

After committing, mark Task 1 complete in this file.

Do not begin Task 2.

---

## Task 2 — Install and Configure Vitest

### Goal

Add minimal unit-testing infrastructure without adding sanitizer test
coverage yet.

### Dependencies

Install development dependencies:

- `vitest`
- `jsdom`

Use the repository's existing Yarn version and dependency conventions.

### Configuration

Create an appropriately named Vitest configuration file.

Configure Vitest to use the `jsdom` environment so browser APIs such as
`DOMParser` are available.

### Package Scripts

Add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Do not add `yarn test` to the existing `check` script yet. That will be
done after real tests exist in Task 3.

### Requirements

- Do not modify runtime source behavior.
- Do not add production dependencies.
- Do not add sanitizer tests yet.
- Do not add placeholder or meaningless tests.
- Do not introduce TypeScript.
- Do not add a build step.
- Do not modify `TESTING.md`.
- Do not perform unrelated cleanup.

### Validation

Run:

```sh
yarn vitest run --passWithNoTests
yarn run check
git diff --check
```

### Commit

Create exactly one commit:

```text
Add Vitest test infrastructure
```

After committing, mark Task 2 complete in this file.

Do not begin Task 3.

---

## Task 3 — Add Sanitizer Unit Tests

### Goal

Add focused unit tests for the production HTML sanitizer.

Tests must exercise the actual `src/sanitizer.js` implementation. Do not
copy sanitizer logic into the test suite.

The production sanitizer currently exposes:

```js
globalThis.sanitizeHtml;
```

It is acceptable for the tests to load the production script and invoke
that function through `globalThis`.

Do not convert the extension to ES modules or add a build system merely
to make the function importable.

### Test Location

Create:

```text
tests/sanitizer.test.js
```

### Required Coverage

Add tests proving that the sanitizer:

1. Preserves ordinary safe HTML.
2. Preserves nested formatting.
3. Preserves plain text.
4. Preserves inline styles.
5. Preserves classes.
6. Preserves `data-*` attributes.
7. Preserves safe `href` values.
8. Preserves safe `src` values.
9. Removes each disallowed element:
   - `script`
   - `iframe`
   - `object`
   - `embed`
   - `link`
   - `meta`
   - `base`
10. Removes event-handler attributes such as:
    - `onclick`
    - `onload`
    - mixed-case `on*` attributes
11. Removes `javascript:` values from:
    - `href`
    - `src`
12. Removes case-insensitive `javascript:` URLs.
13. Removes `javascript:` URLs obfuscated with whitespace or control
    characters.
14. Preserves the element and its text when only a dangerous attribute
    is removed.

Prefer explicit assertions over snapshots.

Keep each test focused on one sanitizer behavior.

### Check Integration

Update the existing `check` script so unit tests run as part of the
standard repository validation.

The resulting workflow should include:

```sh
yarn test
```

alongside the existing lint and formatting checks.

### Requirements

- Do not change sanitizer behavior merely to satisfy an incorrect test.
- Do not test Gmail behavior in this suite.
- Do not test dialog or compose-window behavior.
- Do not introduce mocks unless genuinely necessary.
- Do not expose private sanitizer helpers solely for testing.
- Do not modify `TESTING.md`.
- Do not perform unrelated refactoring.

### Validation

Run:

```sh
yarn test
yarn run check
git diff --check
```

All tests and repository checks must pass.

### Commit

Create exactly one commit:

```text
Add HTML sanitizer unit tests
```

After committing, mark Task 3 complete in this file.

Do not begin additional work.

---

## Completion Criteria

This plan is complete when:

- Runtime source files live under `src/`.
- Vitest runs using `jsdom`.
- Sanitizer behavior is covered by focused unit tests.
- `yarn test` passes.
- `yarn run check` includes and passes unit tests.
- All three tasks exist as separate commits.
