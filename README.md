# GHTML

GHTML is a Chrome extension that inserts arbitrary HTML into Gmail
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

## Status

🚧 Prototype

Current milestone:

- Compose window integration

Core HTML insertion has been proven.

Current work is focused on integrating with Gmail compose windows while
preserving native Gmail behavior.

---

## Features

Current prototype:

- Insert arbitrary HTML into Gmail compose windows
- Preserve Gmail undo/redo behavior
- Preserve Gmail selection behavior
- Custom HTML dialog
- Zero dependencies

Planned:

- One HTML button per compose window
- Gmail toolbar integration
- HTML sanitization
- Improved dialog
- Chrome Web Store release

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
├── LICENSE
├── README.md
├── eslint.config.js
├── manifest.json
├── package.json
├── content.js
├── icons/
└── yarn.lock
```

---

## Design principles

- Preserve Gmail behavior.
- Prefer browser APIs.
- Prototype before refactoring.
- Keep dependencies at zero.
- Make small, reviewable commits.

---

## Browser support

Currently supported:

- Google Chrome (latest)

Other Chromium browsers may work but are not officially tested.

---

## License

MIT
