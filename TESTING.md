# Manual Testing

## Purpose

This document provides a repeatable manual regression suite for GHTML.

Run these tests before merging significant changes or after any
refactoring that should preserve behavior.

---

## Test Environment

Verify the following before beginning:

- Chrome (latest stable)
- Gmail loaded
- Extension loaded via **Load unpacked**
- Browser console open
- Console shows the GHTML startup message

---

## Selection

### Caret restoration

1. Open a new compose window.

2. Type:

   ```text
   asdf
   ```

3. Place the caret:

   ```text
   as|df
   ```

4. Click **HTML**.

5. Click **Cancel**.

**Expected:**

- Dialog closes.
- Gmail editor regains focus.
- Caret returns to the original position.

### Selection restoration

1. Type:

   ```text
   abcdef
   ```

2. Select:

   ```text
   ab[cde]f
   ```

3. Click **HTML**.

4. Click **Cancel**.

**Expected:**

- Dialog closes.
- Gmail editor regains focus.
- Original selection is restored.

---

## HTML Insertion

### Insert at caret

1. Place the caret:

   ```text
   as|df
   ```

2. Insert sample HTML.

**Expected:**

```text
as<inserted HTML>df
```

### Replace selection

1. Select:

   ```text
   ab[cde]f
   ```

2. Insert sample HTML.

**Expected:**

```text
ab<inserted HTML>f
```

---

## HTML Sanitization

### Safe HTML

1. Insert:

   ```html
   <strong>Bold</strong>
   <em>Italic</em>
   <span style="color:red">Red</span>
   ```

**Expected:**

- Formatting is preserved.
- No content is removed.

### Remove script tags

1. Insert:

   ```html
   <script>
     alert('hello');
   </script>
   <strong>Visible</strong>
   ```

**Expected:**

- `<script>` is removed.
- "Visible" remains.

### Remove event handlers

1. Insert:

   ```html
   <div onclick="alert('hi')">Click me</div>
   ```

**Expected:**

- `onclick` is removed.
- The element is still inserted.

### Remove javascript: URLs

1. Insert:

   ```html
   <a href="javascript:alert('hi')"> Test </a>
   ```

**Expected:**

- The dangerous URL is removed.
- The link text remains.

### Preserve inline styles

1. Insert:

   ```html
   <span style="color:red;font-weight:bold"> Styled </span>
   ```

**Expected:**

- Inline styles are preserved.

### Preserve classes

1. Insert:

   ```html
   <div class="example">Test</div>
   ```

**Expected:**

- Class attribute is preserved.

### Preserve data attributes

1. Insert:

   ```html
   <div data-id="123">Test</div>
   ```

**Expected:**

- `data-id` remains.

---

## Undo / Redo

### Undo

1. Insert HTML.
2. Press **Cmd/Ctrl+Z**.

**Expected:**

- Entire insertion is removed.
- Caret or selection returns to its original location.

### Redo

1. Immediately press **Shift+Cmd/Ctrl+Z**.

**Expected:**

- HTML insertion is restored.

---

## Dialog

### Cancel

1. Click **HTML**.
2. Click **Cancel**.

**Expected:**

- Dialog closes.
- HTML button is re-enabled.
- Editor regains focus.

### Insert

1. Click **HTML**.
2. Enter HTML.
3. Click **Insert**.

**Expected:**

- Dialog closes.
- HTML button is re-enabled.
- HTML is inserted.

---

## Multiple Compose Windows

1. Open two compose windows.

**Expected:**

- Each compose window has exactly one HTML button.

2. Insert HTML into the first compose.

**Expected:**

- Only the first compose changes.

3. Insert HTML into the second compose.

**Expected:**

- Only the second compose changes.

4. Close one compose window.

**Expected:**

- Its HTML button is removed.
- Remaining compose windows continue working.

---

## Launcher

### New compose

1. Open a new compose window.

**Expected:**

- Exactly one launcher appears.

### Multiple compose windows

1. Open multiple compose windows.

**Expected:**

- Each compose window owns exactly one launcher.

### Minimize

1. Minimize a compose window.

**Expected:**

- Launcher follows the minimized compose window.

### Restore

1. Restore a minimized compose window.

**Expected:**

- Launcher returns to the restored compose window.

### Maximize

1. Maximize a compose window.

**Expected:**

- Launcher remains correctly positioned.

### Restore from maximize

1. Restore a maximized compose window.

**Expected:**

- Launcher remains correctly positioned.

### Browser resize

1. Open a compose window.
2. Resize the browser window.

**Expected:**

- Launcher remains visible.
- Launcher stays attached to the same compose window.
- Launcher repositions correctly.

### Browser scroll

1. Open a compose window.
2. Scroll the page.

**Expected:**

- Launcher remains visible.
- Launcher stays attached to the same compose window.
- Launcher repositions correctly.

### Close compose

1. Close a compose window.

**Expected:**

- Launcher is removed.

## Extension Reload

1. Reload the extension.
2. Refresh Gmail.

**Expected:**

- Exactly one HTML button appears per compose window.
- No duplicate buttons.
- No duplicate behavior.

---

## Console

**Expected:**

- No uncaught exceptions.
- No unexpected warnings.
- No stack traces.

---

## Regression

Run every test in this document.

**Expected:**

- All tests pass without behavioral regressions.

---
