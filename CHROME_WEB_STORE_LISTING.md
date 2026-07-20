# Chrome Web Store Listing

This document contains draft listing copy and submission notes for the
GHTML MVP Chrome Web Store submission.

The roadmap remains the source of truth for release progress.

## Product Details

### Name

GHTML

### Short Description

Insert sanitized HTML into Gmail compose windows while preserving
Gmail's native editing behavior.

### Detailed Description

GHTML adds a small HTML insertion dialog to Gmail compose windows. Use
it to paste supported HTML into the compose window you selected while
preserving Gmail's native editing behavior as closely as possible.

GHTML is built for people who occasionally need to insert rich HTML into
Gmail without switching to a separate email editor.

Current features:

- Insert supported HTML into Gmail compose windows.
- Insert at the caret or replace the current selection.
- Preserve Gmail's native undo and redo behavior.
- Preserve Gmail focus, cursor position, and text selection.
- Use one launcher per compose window.
- Support multiple simultaneous compose windows.
- Reopen the dialog with the previous HTML and saved position.
- Sanitize user-provided HTML before insertion.

GHTML intentionally does not send your HTML, email drafts, Gmail
content, browsing activity, or extension settings to the developer or to
third parties. The extension runs only on Gmail and stores only the
dialog contents and dialog position locally in Chrome extension storage.

Gmail may still normalize or remove markup after insertion. GHTML
supports an explicit, conservative subset of HTML, attributes, URLs, and
inline CSS.

### Category

Productivity

### Language

English

### Website

[https://github.com/MichaelFoss/ghtml](https://github.com/MichaelFoss/ghtml)

### Support URL

[https://github.com/MichaelFoss/ghtml/issues](https://github.com/MichaelFoss/ghtml/issues)

### Privacy Policy URL

[https://github.com/MichaelFoss/ghtml/blob/main/PRIVACY.md](https://github.com/MichaelFoss/ghtml/blob/main/PRIVACY.md)

## Permission Justifications

### `storage`

GHTML uses Chrome extension storage to save the HTML dialog's current
contents and position locally in the browser. This lets the dialog
reopen with the user's previous draft HTML and placement.

### `https://mail.google.com/*`

GHTML runs inside Gmail so it can detect Gmail compose windows, show one
HTML launcher for each compose window, restore the selected compose
editor, and insert sanitized HTML into that compose window.

## Privacy Fields

Recommended Chrome Web Store privacy answers:

- Single purpose: Insert sanitized user-provided HTML into Gmail compose
  windows while preserving Gmail editing behavior.
- Data collection: GHTML does not collect, transmit, sell, or share user
  data.
- Locally stored data: dialog contents and dialog position.
- Remote code: none.
- Third-party services: none.

## Screenshot Plan

Chrome Web Store requires at least one screenshot and allows up to five.
Screenshots must be full-bleed PNG or JPEG files with square corners and
no padding. Accepted dimensions are 1280x800 or 640x400. Use 1280x800
when possible because it looks better on high-resolution displays.

Recommended screenshots:

1. Gmail compose window with the GHTML launcher visible.
2. GHTML dialog open with sample supported HTML.
3. Inserted formatted HTML visible in a Gmail compose draft.
4. Selected text in Gmail before insertion, if practical.
5. Multiple compose windows with one launcher per compose window.

Use a test Gmail account or sanitized sample draft. Avoid showing real
recipient addresses, subject lines, signatures, private drafts, inbox
contents, or account details.

Current screenshots:

- `docs/screenshots/1-compose-window.png`: 729x758, not Store-ready.
- `docs/screenshots/2-html-editor.png`: 737x514, not Store-ready.
- `docs/screenshots/3-insert-complete-with-undo-redo.png`: 729x761, not
  Store-ready.
- `docs/screenshots/4-multiple-windows.png`: 1488x765, not Store-ready.

The current screenshots are useful review references, but they do not
match Chrome Web Store screenshot dimensions. Recapture or prepare final
Store screenshots at 1280x800, or 640x400 if 1280x800 is impractical.

Generated 1280x800 upload candidates:

- `docs/store-assets/screenshots/1-compose-window.png`
- `docs/store-assets/screenshots/2-html-editor.png`
- `docs/store-assets/screenshots/3-insert-complete-with-undo-redo.png`
- `docs/store-assets/screenshots/4-multiple-windows.png`

These generated screenshots preserve the original screenshot content and
add transparent space with softened edges where needed. Because Chrome
recommends full-bleed screenshots with no padding, recapturing native
1280x800 screenshots is still the lower-risk option if the Developer
Dashboard rejects or poorly previews the generated files.

Screenshot content review:

- `1-compose-window.png`: clean and clearly shows the launcher.
- `2-html-editor.png`: clear, but includes `javascript:alert(...)`
  sample text. Prefer safer-looking sample HTML for public listing
  screenshots.
- `3-insert-complete-with-undo-redo.png`: strong feature shot and clean
  of private data.
- `4-multiple-windows.png`: clean and shows multi-compose support, but
  needs final Store dimensions.

## Promotional Image Plan

Chrome Web Store requires a 440x280 PNG or JPEG small promotional image.
The optional marquee image is 1400x560. Promotional images are not
screenshots; they should communicate the brand and product capability.

Recommended direction:

- Use the existing GHTML icon as the main brand signal.
- Avoid relying on screenshot text in the promo image.
- Communicate HTML insertion into Gmail compose visually.
- Keep edges clearly defined and avoid a mostly white composition.

Generated promotional image:

- `docs/store-assets/small-promo-440x280.png`

Requirements and constraints:

- Small promotional image: 440x280 pixels, required.
- Marquee promotional image: 1400x560 pixels, optional.
- Avoid relying on text, because promo images may be shown small.
- Make the image work on a light gray Chrome Web Store background.
- Fill the full image area.
- Avoid a mostly white or light gray image.
- Follow Google's branding guidelines if the image uses Google or Gmail
  marks.

## Submission Checklist

- [ ] Confirm `manifest.json` name, description, version, permissions,
      and icons.
- [ ] Upload the extension ZIP package.
- [ ] Set category to Productivity.
- [ ] Set language to English.
- [ ] Paste the short description.
- [ ] Paste the detailed description.
- [ ] Add website and support URLs.
- [ ] Add the hosted privacy policy URL.
- [ ] Upload the 128x128 store icon.
- [ ] Upload at least one 1280x800 screenshot.
- [ ] Upload the 440x280 small promotional image.
- [ ] Complete privacy fields to match `PRIVACY.md`.
- [ ] Complete permission justifications.
- [ ] Run the release smoke test before submission.
