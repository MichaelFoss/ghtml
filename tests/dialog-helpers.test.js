import { describe, expect, it } from 'vitest';

import '../src/dialog-helpers.js';

const {
  constrainDialogPosition,
  createDialogState,
  getDialogKeyboardAction,
  indentSelection,
  insertAtSelection,
  insertIndentedNewline,
  outdentSelection,
} = globalThis.GHTMLDialogHelpers;

describe('dialog persistence helpers', () => {
  it('creates the minimal persisted dialog state', () => {
    const position = { left: 12, top: 34 };

    expect(createDialogState(position, '<p>Hello</p>')).toEqual({
      position,
      html: '<p>Hello</p>',
    });
  });

  it('preserves empty HTML in dialog state', () => {
    expect(createDialogState({ left: 0, top: 0 }, '').html).toBe('');
  });
});

describe('dialog position constraints', () => {
  const constrain = (left, top) =>
    constrainDialogPosition(left, top, 600, 44, 1000, 800, 48);

  it('preserves a position within the viewport constraints', () => {
    expect(constrain(100, 120)).toEqual({ left: 100, top: 120 });
  });

  it('keeps the minimum title width visible on the left', () => {
    expect(constrain(-900, 120).left).toBe(-552);
  });

  it('keeps the minimum title width visible on the right', () => {
    expect(constrain(1200, 120).left).toBe(952);
  });

  it('keeps the title below the top of the viewport', () => {
    expect(constrain(100, -50).top).toBe(0);
  });

  it('keeps the title above the bottom of the viewport', () => {
    expect(constrain(100, 900).top).toBe(756);
  });
});

describe('textarea editing helpers', () => {
  it('inserts text at the caret', () => {
    expect(insertAtSelection('abcd', 2, 2, '  ')).toEqual({
      value: 'ab  cd',
      selectionStart: 4,
      selectionEnd: 4,
    });
  });

  it('replaces a selection with inserted text', () => {
    expect(insertAtSelection('abcdef', 2, 5, 'X')).toEqual({
      value: 'abXf',
      selectionStart: 3,
      selectionEnd: 3,
    });
  });

  it('preserves spaces when inserting a newline', () => {
    expect(insertIndentedNewline('  <div>', 7, 7)).toEqual({
      value: '  <div>\n  ',
      selectionStart: 10,
      selectionEnd: 10,
    });
  });

  it('preserves tabs when inserting a newline', () => {
    expect(insertIndentedNewline('\t<span>', 7, 7).value).toBe(
      '\t<span>\n\t',
    );
  });

  it('replaces selected text when inserting a newline', () => {
    expect(insertIndentedNewline('  abc', 2, 5)).toEqual({
      value: '  \n  ',
      selectionStart: 5,
      selectionEnd: 5,
    });
  });

  it('indents every selected line', () => {
    expect(indentSelection('one\ntwo\nthree', 0, 13)).toEqual({
      value: '  one\n  two\n  three',
      selectionStart: 2,
      selectionEnd: 19,
    });
  });

  it('does not indent a line beginning at the selection end', () => {
    expect(indentSelection('one\ntwo', 0, 4).value).toBe('  one\ntwo');
  });

  it('indents from the beginning of a partially selected line', () => {
    expect(indentSelection('one\ntwo', 5, 7).value).toBe('one\n  two');
  });

  it('outdents every selected line', () => {
    expect(outdentSelection('  one\n  two', 2, 11)).toEqual({
      value: 'one\ntwo',
      selectionStart: 0,
      selectionEnd: 7,
    });
  });

  it('outdents only the available spaces', () => {
    expect(outdentSelection(' one\n  two', 0, 10).value).toBe(
      'one\ntwo',
    );
  });

  it('leaves unindented lines unchanged when outdenting', () => {
    expect(outdentSelection('one\n  two', 0, 9).value).toBe('one\ntwo');
  });
});

describe('dialog keyboard actions', () => {
  const actionFor = (overrides) =>
    getDialogKeyboardAction({
      key: '',
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      isTextarea: true,
      value: 'abc',
      selectionStart: 1,
      selectionEnd: 1,
      ...overrides,
    });

  it('maps Escape to cancel', () => {
    expect(actionFor({ key: 'Escape' })).toEqual({ type: 'cancel' });
  });

  it('maps Cmd+Enter to insert', () => {
    expect(actionFor({ key: 'Enter', metaKey: true })).toEqual({
      type: 'insert',
    });
  });

  it('maps Ctrl+Enter to insert', () => {
    expect(actionFor({ key: 'Enter', ctrlKey: true })).toEqual({
      type: 'insert',
    });
  });

  it('maps Tab outside the textarea to forward focus movement', () => {
    expect(actionFor({ key: 'Tab', isTextarea: false })).toEqual({
      type: 'moveFocus',
      moveBackward: false,
    });
  });

  it('maps Shift+Tab outside the textarea to backward focus movement', () => {
    expect(
      actionFor({ key: 'Tab', shiftKey: true, isTextarea: false }),
    ).toEqual({ type: 'moveFocus', moveBackward: true });
  });

  it('maps Enter in the textarea to an indented newline edit', () => {
    expect(
      actionFor({
        key: 'Enter',
        value: '  abc',
        selectionStart: 5,
        selectionEnd: 5,
      }),
    ).toEqual({
      type: 'edit',
      edit: {
        value: '  abc\n  ',
        selectionStart: 8,
        selectionEnd: 8,
      },
    });
  });

  it('maps Tab at a caret to a two-space edit', () => {
    expect(actionFor({ key: 'Tab' })).toEqual({
      type: 'edit',
      edit: {
        value: 'a  bc',
        selectionStart: 3,
        selectionEnd: 3,
      },
    });
  });

  it('maps Tab over multiple lines to an indent edit', () => {
    const action = actionFor({
      key: 'Tab',
      value: 'one\ntwo',
      selectionStart: 0,
      selectionEnd: 7,
    });

    expect(action.edit.value).toBe('  one\n  two');
  });

  it('maps Shift+Tab to an outdent edit', () => {
    const action = actionFor({
      key: 'Tab',
      shiftKey: true,
      value: '  abc',
      selectionStart: 2,
      selectionEnd: 5,
    });

    expect(action.edit.value).toBe('abc');
  });

  it('ignores ordinary keys in the textarea', () => {
    expect(actionFor({ key: 'a' })).toBeNull();
  });

  it('ignores ordinary keys outside the textarea', () => {
    expect(actionFor({ key: 'Enter', isTextarea: false })).toBeNull();
  });
});
