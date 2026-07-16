(() => {
  const INDENT = '  ';

  function getSelectedLineStarts(value, selectionStart, selectionEnd) {
    const firstLineStart =
      value.lastIndexOf('\n', selectionStart - 1) + 1;
    const selectedLineStarts = [firstLineStart];
    let nextLineStart = value.indexOf('\n', firstLineStart);

    while (nextLineStart !== -1 && nextLineStart + 1 < selectionEnd) {
      nextLineStart += 1;
      selectedLineStarts.push(nextLineStart);
      nextLineStart = value.indexOf('\n', nextLineStart);
    }

    return selectedLineStarts;
  }

  function indentSelection(value, selectionStart, selectionEnd) {
    const lineStarts = getSelectedLineStarts(
      value,
      selectionStart,
      selectionEnd,
    );
    let indentedValue = value;

    for (const lineStart of lineStarts.toReversed()) {
      indentedValue =
        indentedValue.slice(0, lineStart) +
        INDENT +
        indentedValue.slice(lineStart);
    }

    return {
      value: indentedValue,
      selectionStart: selectionStart + INDENT.length,
      selectionEnd: selectionEnd + INDENT.length * lineStarts.length,
    };
  }

  function outdentSelection(value, selectionStart, selectionEnd) {
    const removals = getSelectedLineStarts(
      value,
      selectionStart,
      selectionEnd,
    ).map((lineStart) => ({
      lineStart,
      length: Math.min(
        INDENT.length,
        value.slice(lineStart).match(/^ */)[0].length,
      ),
    }));
    let outdentedValue = value;

    for (const { lineStart, length } of removals.toReversed()) {
      outdentedValue =
        outdentedValue.slice(0, lineStart) +
        outdentedValue.slice(lineStart + length);
    }

    const adjustPosition = (position) =>
      position -
      removals.reduce(
        (removed, { lineStart, length }) =>
          removed + Math.min(Math.max(position - lineStart, 0), length),
        0,
      );

    return {
      value: outdentedValue,
      selectionStart: adjustPosition(selectionStart),
      selectionEnd: adjustPosition(selectionEnd),
    };
  }

  function insertAtSelection(
    value,
    selectionStart,
    selectionEnd,
    insertedText,
  ) {
    const caret = selectionStart + insertedText.length;

    return {
      value:
        value.slice(0, selectionStart) +
        insertedText +
        value.slice(selectionEnd),
      selectionStart: caret,
      selectionEnd: caret,
    };
  }

  function insertIndentedNewline(value, selectionStart, selectionEnd) {
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const indentation = value.slice(lineStart).match(/^[\t ]*/)[0];

    return insertAtSelection(
      value,
      selectionStart,
      selectionEnd,
      `\n${indentation}`,
    );
  }

  function getDialogKeyboardAction({
    key,
    metaKey,
    ctrlKey,
    shiftKey,
    isTextarea,
    value,
    selectionStart,
    selectionEnd,
  }) {
    if (key === 'Escape') {
      return { type: 'cancel' };
    }

    if (key === 'Enter' && (metaKey || ctrlKey)) {
      return { type: 'insert' };
    }

    if (!isTextarea && key === 'Tab') {
      return { type: 'moveFocus', moveBackward: shiftKey };
    }

    if (!isTextarea) {
      return null;
    }

    if (key === 'Enter') {
      return {
        type: 'edit',
        edit: insertIndentedNewline(
          value,
          selectionStart,
          selectionEnd,
        ),
      };
    }

    if (key === 'Tab' && shiftKey) {
      return {
        type: 'edit',
        edit: outdentSelection(value, selectionStart, selectionEnd),
      };
    }

    if (
      key === 'Tab' &&
      value.slice(selectionStart, selectionEnd).includes('\n')
    ) {
      return {
        type: 'edit',
        edit: indentSelection(value, selectionStart, selectionEnd),
      };
    }

    if (key === 'Tab') {
      return {
        type: 'edit',
        edit: insertAtSelection(
          value,
          selectionStart,
          selectionEnd,
          INDENT,
        ),
      };
    }

    return null;
  }

  function createDialogState(position, html) {
    return { position, html };
  }

  function constrainDialogPosition(
    left,
    top,
    dialogWidth,
    titleHeight,
    viewportWidth,
    viewportHeight,
    minVisibleTitleWidth,
  ) {
    const minLeft = minVisibleTitleWidth - dialogWidth;
    const maxLeft = viewportWidth - minVisibleTitleWidth;
    const maxTop = viewportHeight - titleHeight;

    return {
      left: Math.min(Math.max(left, minLeft), maxLeft),
      top: Math.min(Math.max(top, 0), maxTop),
    };
  }

  globalThis.GHTMLDialogHelpers = {
    constrainDialogPosition,
    createDialogState,
    getDialogKeyboardAction,
    indentSelection,
    insertAtSelection,
    insertIndentedNewline,
    outdentSelection,
  };
})();
