# GHTML

GHTML is a Chrome extension that inserts user-supplied HTML into Gmail
compose windows while preserving Gmail's native editing behavior.

The primary goal is to make it possible to paste or generate rich HTML
while retaining Gmail's built-in handling of:

- cursor placement
- text selection
- undo
- redo
- focus
- compose window behavior

The project intentionally uses **vanilla JavaScript** with **no build
step** and **no runtime dependencies**.

---

## Features

Current capabilities:

- Insert supported HTML into Gmail compose windows
- Preserve Gmail's native undo/redo behavior
- Preserve Gmail's native selection and cursor behavior
- Replace the current selection or insert at the caret
- One floating launcher per compose window
- Multiple simultaneous compose windows
- Keyboard shortcuts for inserting and dismissing the dialog
- Draggable dialog with persisted position
- Persisted dialog contents across Gmail reloads
- HTML sanitization before insertion
- Gmail startup synchronization
- Zero runtime dependencies

---

## Installation

1. Clone the repository.

   ```sh
   git clone <repository-url>
   cd GHTML
   ```

2. Open Chrome.

3. Navigate to:

   ```text
   chrome://extensions
   ```

4. Enable **Developer Mode**.

5. Choose **Load unpacked**.

6. Select the project directory.

7. Open Gmail.

---

## Development

1. Edit the source files.

2. Reload the extension.

3. Refresh Gmail.

4. Test manually.

No build step is required.

---

## Repository structure

```text
.
├── .editorconfig
├── .gitignore
├── .markdownlint-cli2.jsonc
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── .vscode/
├── AGENTS.md
├── ARCHITECTURE.md
├── LICENSE
├── README.md
├── ROADMAP.md
├── TESTING.md
├── eslint.config.js
├── manifest.json
├── package.json
├── src/
│   ├── content.js
│   ├── dialog-helpers.js
│   └── sanitizer.js
├── test/
├── icons/
└── yarn.lock
```

---

## Design principles

- Preserve Gmail's native behavior.
- Prefer browser APIs over additional dependencies.
- Keep browser- and Gmail-specific behavior in `content.js`.
- Extract only pure, testable logic into helper modules.
- Keep runtime dependencies at zero.
- Make small, reviewable, easily reversible commits.

---

## Project roadmap

Project milestones and future plans are documented in
[ROADMAP.md](ROADMAP.md).

---

## Browser support

Currently supported:

- Google Chrome (latest)

Other Chromium browsers may work but are not officially tested.

---

## License

MIT
