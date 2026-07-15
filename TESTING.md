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

**Expected:**

- Dialog closes.
- HTML button is re-enabled.
- Editor regains focus.

### Insert

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

## Positioning

### Browser resize

**Expected:**

- Buttons remain attached to their compose windows.

### Browser scroll

**Expected:**

- Buttons reposition correctly.

---

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
- No warnings related to GHTML.
- No stack traces.

---

## Regression

Run every test in this document.

**Expected:**

- All tests pass without behavioral regressions.

---

## Test History

Version Date Tester Result

---
