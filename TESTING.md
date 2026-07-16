# Manual Testing

## Purpose

This document provides a repeatable manual regression suite for GHTML.

Run these tests before merging significant changes or after any
refactoring that should preserve behavior.

---

## Test Environment

### ENV-001 Verify test environment

Verify the following before beginning:

- Chrome (latest stable)
- Gmail loaded
- Extension loaded via **Load unpacked**
- Browser console open
- Console shows the GHTML startup message

---

## Selection

### SEL-001 Caret restoration

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

### SEL-002 Selection restoration

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

### INS-001 Insert at caret

1. Place the caret:

   ```text
   as|df
   ```

2. Insert sample HTML.

**Expected:**

```text
as<inserted HTML>df
```

### INS-002 Replace selection

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

### SAN-001 Safe HTML

1. Insert:

   ```html
   <strong>Bold</strong>
   <em>Italic</em>
   <span style="color:red">Red</span>
   ```

**Expected:**

- Formatting is preserved.
- No content is removed.

### SAN-002 Remove script tags

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

### SAN-003 Remove event handlers

1. Insert:

   ```html
   <div onclick="alert('hi')">Click me</div>
   ```

**Expected:**

- `onclick` is removed.
- The element is still inserted.

### SAN-004 Remove javascript: URLs

1. Insert:

   ```html
   <a href="javascript:alert('hi')"> Test </a>
   ```

**Expected:**

- The dangerous URL is removed.
- The link text remains.

### SAN-005 Preserve inline styles

1. Insert:

   ```html
   <span style="color:red;font-weight:bold"> Styled </span>
   ```

**Expected:**

- Inline styles are preserved.

### SAN-006 Preserve classes

1. Insert:

   ```html
   <div class="example">Test</div>
   ```

**Expected:**

- Class attribute is preserved.

### SAN-007 Preserve data attributes

1. Insert:

   ```html
   <div data-id="123">Test</div>
   ```

**Expected:**

- `data-id` remains.

---

## Undo / Redo

### UND-001 Undo

1. Insert HTML.
2. Press **Cmd/Ctrl+Z**.

**Expected:**

- Entire insertion is removed.
- Caret or selection returns to its original location.

### UND-002 Redo

1. Immediately press **Shift+Cmd/Ctrl+Z**.

**Expected:**

- HTML insertion is restored.

---

## Dialog

### DLG-001 Cancel

1. Click **HTML**.
2. Click **Cancel**.

**Expected:**

- Dialog closes.
- HTML button is re-enabled.
- Editor regains focus.

### DLG-002 Insert

1. Click **HTML**.
2. Enter HTML.
3. Click **Insert**.

**Expected:**

- Dialog closes.
- HTML button is re-enabled.
- HTML is inserted.

---

## Multiple Compose Windows

### CMP-001 Independent compose windows

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

### LCH-001 New compose

1. Open a new compose window.

**Expected:**

- Exactly one launcher appears.

### LCH-002 Multiple compose windows

1. Open multiple compose windows.

**Expected:**

- Each compose window owns exactly one launcher.

### LCH-003 Minimize

1. Minimize a compose window.

**Expected:**

- Launcher follows the minimized compose window.

### LCH-004 Restore

1. Restore a minimized compose window.

**Expected:**

- Launcher returns to the restored compose window.

### LCH-005 Maximize

1. Maximize a compose window.

**Expected:**

- Launcher remains correctly positioned.

### LCH-006 Restore from maximize

1. Restore a maximized compose window.

**Expected:**

- Launcher remains correctly positioned.

### LCH-007 Browser resize

1. Open a compose window.
2. Resize the browser window.

**Expected:**

- Launcher remains visible.
- Launcher stays attached to the same compose window.
- Launcher repositions correctly.

### LCH-008 Browser scroll

1. Open a compose window.
2. Scroll the page.

**Expected:**

- Launcher remains visible.
- Launcher stays attached to the same compose window.
- Launcher repositions correctly.

### LCH-009 Close compose

1. Close a compose window.

**Expected:**

- Launcher is removed.

## Extension Reload

### EXT-001 Reload extension

1. Reload the extension.
2. Refresh Gmail.

**Expected:**

- Exactly one HTML button appears per compose window.
- No duplicate buttons.
- No duplicate behavior.

---

## Console

### CON-001 Console output

**Expected:**

- No uncaught exceptions.
- No unexpected warnings.
- No stack traces.

---

## Regression

### REG-001 Full regression suite

Run every test in this document.

**Expected:**

- All tests pass without behavioral regressions.

---
