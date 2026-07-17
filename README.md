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

## Supported HTML

GHTML sanitizes HTML immediately before insertion. Support is based on
an explicit allowlist: unsupported elements are removed with their
contents, and unsupported attributes and inline style declarations are
removed while the owning supported element remains.

Supported elements:

```text
a, abbr, address, b, blockquote, br, caption, center, cite, code, col,
colgroup, dd, del, div, dl, dt, em, font, h1, h2, h3, h4, h5, h6, hr,
i, img, li, ol, p, pre, q, s, small, span, strike, strong, sub, sup,
table, tbody, td, tfoot, th, thead, tr, u, ul
```

The following attributes are supported on every supported element:

```text
class, dir, lang, style, title
```

Additional element-specific attributes:

| Element           | Attributes                                      |
| ----------------- | ----------------------------------------------- |
| `a`               | `href`, `name`, `target`                        |
| `blockquote`      | `cite`                                          |
| `col`, `colgroup` | `span`, `width`                                 |
| `del`             | `cite`, `datetime`                              |
| `font`            | `color`, `face`, `size`                         |
| `img`             | `alt`, `height`, `src`, `width`                 |
| `li`              | `value`                                         |
| `ol`              | `reversed`, `start`, `type`                     |
| `q`               | `cite`                                          |
| `table`           | `border`, `cellpadding`, `cellspacing`, `width` |
| `td`              | `colspan`, `headers`, `rowspan`                 |
| `th`              | `colspan`, `headers`, `rowspan`, `scope`        |

URL-bearing attributes accept only absolute URLs with these schemes:

| Attribute     | Schemes                              |
| ------------- | ------------------------------------ |
| `href`        | `http:`, `https:`, `mailto:`, `tel:` |
| `cite`, `src` | `http:`, `https:`                    |

Relative URLs, malformed URLs, and all other schemes are removed.

Supported inline CSS properties:

```text
background-color, border, border-bottom, border-bottom-color,
border-bottom-style, border-bottom-width, border-collapse, border-color,
border-left, border-left-color, border-left-style, border-left-width,
border-right, border-right-color, border-right-style, border-right-width,
border-spacing, border-style, border-top, border-top-color,
border-top-style, border-top-width, border-width, color, display, font,
font-family, font-size, font-style, font-variant, font-weight, height,
letter-spacing, line-height, list-style-position, list-style-type, margin,
margin-bottom, margin-left, margin-right, margin-top, max-height, max-width,
min-height, min-width, overflow-wrap, padding, padding-bottom, padding-left,
padding-right, padding-top, text-align, text-decoration, text-indent,
text-transform, vertical-align, white-space, width, word-break, word-spacing
```

CSS custom properties and declarations containing `url()` or
`image-set()` are removed. `<style>` elements are not supported.

Gmail may independently normalize or remove markup after GHTML inserts
it.

---

## License

MIT
