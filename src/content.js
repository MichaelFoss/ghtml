(() => {
  const MESSAGE_BODY_SELECTOR =
    '[g_editable="true"][role="textbox"][contenteditable="true"]';
  const COMPOSE_WINDOW_SELECTOR = '[role="dialog"]';
  const DIALOG_STATE_KEY = 'dialogState';
  const MIN_VISIBLE_TITLE_WIDTH = 48;
  const LAUNCHER_Z_INDEX = '2147483647';
  const MODAL_LAUNCHER_Z_INDEX = '2147483645';
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

  if (window.GHTML) {
    console.warn('[GHTML 🧪] ♻️ Reloading playground...');
    window.GHTML.destroy();
  }

  const GHTML = {
    activeComposeWindow: null,
    activeComposeButton: null,
    composeButtons: new Map(),
    composeSelections: new Map(),
    backdrop: null,
    dialog: null,
    textarea: null,
    cancelButton: null,
    insertButton: null,

    boundSelectionHandler: null,
    boundPositionHandler: null,
    boundDialogKeydownHandler: null,
    boundModalFocusHandler: null,
    dragOffset: null,
    composeObserver: null,
    composeResizeObserver: null,

    log(...args) {
      console.log(`[GHTML 🧪] ${args.join(' ')}`);
    },

    warn(...args) {
      console.warn(`[GHTML 🧪] ${args.join(' ')}`);
    },

    error(...args) {
      console.error(`[GHTML 🧪] ${args.join(' ')}`);
    },

    group(label) {
      this.log(`━━━━━━━━━━ ${label} ━━━━━━━━━━`);
    },

    init() {
      this.log('🚀 Playground loaded.');
      this.log('');
      this.log('Instructions:');
      this.log('  1. Open a Gmail compose window.');
      this.log('  2. Click inside the message body.');
      this.log('  3. Move the caret or select some text.');
      this.log('  4. Click HTML.');
      this.log('');
      this.log(
        `⚡ insertHTML supported: ${document.queryCommandSupported?.(
          'insertHTML',
        )}`,
      );

      this.boundSelectionHandler = this.onSelectionChange.bind(this);
      this.boundPositionHandler =
        this.positionComposeButtons.bind(this);

      document.addEventListener(
        'selectionchange',
        this.boundSelectionHandler,
        true,
      );
      window.addEventListener('resize', this.boundPositionHandler);
      window.addEventListener(
        'scroll',
        this.boundPositionHandler,
        true,
      );

      this.observeComposeWindows();
    },

    destroy() {
      document.removeEventListener(
        'selectionchange',
        this.boundSelectionHandler,
        true,
      );
      window.removeEventListener('resize', this.boundPositionHandler);
      window.removeEventListener(
        'scroll',
        this.boundPositionHandler,
        true,
      );
      this.composeObserver?.disconnect();
      this.composeResizeObserver?.disconnect();

      for (const button of this.composeButtons.values()) {
        button.remove();
      }

      this.composeButtons.clear();
      this.composeSelections.clear();
      this.clearActiveCompose();
      window.removeEventListener(
        'keydown',
        this.boundDialogKeydownHandler,
        true,
      );
      document.removeEventListener(
        'focusin',
        this.boundModalFocusHandler,
        true,
      );
      this.backdrop?.remove();
      this.dialog?.remove();

      this.log('🧹 Playground destroyed.');
    },

    isMessageBody(element) {
      return (
        element instanceof HTMLElement &&
        element.matches(MESSAGE_BODY_SELECTOR)
      );
    },

    findMessageBody(element) {
      return element?.closest(MESSAGE_BODY_SELECTOR);
    },

    findComposeWindow(element) {
      return element.closest(COMPOSE_WINDOW_SELECTOR);
    },

    isComposeWindowMinimized(composeWindow) {
      const messageBody = composeWindow.querySelector(
        MESSAGE_BODY_SELECTOR,
      );

      if (!(messageBody instanceof HTMLElement)) {
        return true;
      }

      const composeRect = composeWindow.getBoundingClientRect();
      const messageRect = messageBody.getBoundingClientRect();

      return (
        messageBody.getClientRects().length === 0 ||
        messageRect.width === 0 ||
        messageRect.height === 0 ||
        messageRect.right <= composeRect.left ||
        messageRect.left >= composeRect.right ||
        messageRect.bottom <= composeRect.top ||
        messageRect.top >= composeRect.bottom
      );
    },

    onSelectionChange() {
      if (this.activeComposeWindow) {
        return;
      }

      const messageBody = this.findMessageBody(document.activeElement);

      if (!(messageBody instanceof HTMLElement)) {
        return;
      }

      const composeWindow = this.findComposeWindow(messageBody);

      if (!(composeWindow instanceof HTMLElement)) {
        return;
      }

      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0).cloneRange();
      const savedRange = this.composeSelections.get(composeWindow);

      const changed =
        !savedRange ||
        range.startContainer !== savedRange.startContainer ||
        range.startOffset !== savedRange.startOffset ||
        range.endContainer !== savedRange.endContainer ||
        range.endOffset !== savedRange.endOffset;

      this.composeSelections.set(composeWindow, range);

      if (changed) {
        this.log('💾 Selection saved.');
      }
    },

    restoreSelection(composeWindow) {
      const savedRange = this.composeSelections.get(composeWindow);

      if (!savedRange) {
        this.warn('⚠️ No saved Gmail selection.');
        return false;
      }

      const selection = window.getSelection();

      if (!selection) {
        this.warn('⚠️ Browser selection is unavailable.');
        return false;
      }

      selection.removeAllRanges();
      selection.addRange(savedRange);

      return true;
    },

    restoreEditor(composeWindow = this.activeComposeWindow) {
      const editor = composeWindow?.querySelector(
        MESSAGE_BODY_SELECTOR,
      );

      if (!(editor instanceof HTMLElement)) {
        this.warn('⚠️ Gmail message body could not be restored.');
        return false;
      }

      if (!this.composeSelections.has(composeWindow)) {
        const fallbackRange = document.createRange();

        fallbackRange.selectNodeContents(editor);
        fallbackRange.collapse(false);
        this.composeSelections.set(composeWindow, fallbackRange);
      }

      editor.focus();

      if (!this.restoreSelection(composeWindow)) {
        return false;
      }

      this.log('🎯 Gmail editor focused.');

      return true;
    },

    clearActiveCompose() {
      this.activeComposeButton?.removeAttribute('disabled');
      this.activeComposeWindow = null;
      this.activeComposeButton = null;
    },

    closeDialog() {
      const composeWindow = this.activeComposeWindow;

      this.saveDialogState();
      window.removeEventListener(
        'keydown',
        this.boundDialogKeydownHandler,
        true,
      );
      document.removeEventListener(
        'focusin',
        this.boundModalFocusHandler,
        true,
      );
      this.dialog.style.display = 'none';
      this.backdrop.style.display = 'none';
      this.setLauncherModalState(false);
      const editorRestored = this.restoreEditor(composeWindow);

      this.clearActiveCompose();

      return editorRestored;
    },

    setLauncherModalState(isModal) {
      const zIndex = isModal
        ? MODAL_LAUNCHER_Z_INDEX
        : LAUNCHER_Z_INDEX;

      for (const button of this.composeButtons.values()) {
        button.style.zIndex = zIndex;
      }
    },

    getDialogPosition() {
      const { left, top } = this.dialog.getBoundingClientRect();

      return { left, top };
    },

    saveDialogState() {
      const dialogState = {
        position: this.getDialogPosition(),
        html: this.textarea.value,
      };

      globalThis.chrome.storage.local.set({
        [DIALOG_STATE_KEY]: dialogState,
      });
    },

    restoreDialogState() {
      return globalThis.chrome.storage.local
        .get(DIALOG_STATE_KEY)
        .then((result) => {
          const dialogState = result[DIALOG_STATE_KEY];

          if (!dialogState) {
            return;
          }

          const { left, top } = this.constrainDialogPosition(
            dialogState.position.left,
            dialogState.position.top,
          );

          Object.assign(this.dialog.style, {
            right: 'auto',
            bottom: 'auto',
            left: `${left}px`,
            top: `${top}px`,
          });
          this.textarea.value = dialogState.html;
        });
    },

    constrainDialogPosition(left, top) {
      const dialogRect = this.dialog.getBoundingClientRect();
      const titleRect =
        this.dialog.firstElementChild.getBoundingClientRect();
      const minLeft = MIN_VISIBLE_TITLE_WIDTH - dialogRect.width;
      const maxLeft = window.innerWidth - MIN_VISIBLE_TITLE_WIDTH;
      const maxTop = window.innerHeight - titleRect.height;

      return {
        left: Math.min(Math.max(left, minLeft), maxLeft),
        top: Math.min(Math.max(top, 0), maxTop),
      };
    },

    onDialogDragStart(event) {
      if (event.button !== 0) {
        return;
      }

      const { left, top } = this.dialog.getBoundingClientRect();

      this.dragOffset = {
        x: event.clientX - left,
        y: event.clientY - top,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },

    onDialogDrag(event) {
      if (!this.dragOffset) {
        return;
      }

      const { left, top } = this.constrainDialogPosition(
        event.clientX - this.dragOffset.x,
        event.clientY - this.dragOffset.y,
      );

      Object.assign(this.dialog.style, {
        right: 'auto',
        bottom: 'auto',
        left: `${left}px`,
        top: `${top}px`,
      });
    },

    onDialogDragEnd() {
      if (!this.dragOffset) {
        return;
      }

      this.dragOffset = null;
      this.saveDialogState();
    },

    onDialogKeydown(event) {
      event.stopPropagation();

      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelButton.click();
        return;
      }

      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        this.insertButton.click();
        return;
      }

      if (event.target !== this.textarea && event.key === 'Tab') {
        event.preventDefault();
        this.moveDialogFocus(event.shiftKey);
        return;
      }

      if (event.target !== this.textarea) {
        return;
      }

      const { value, selectionStart, selectionEnd } = this.textarea;
      let edit;

      if (event.key === 'Enter') {
        edit = insertIndentedNewline(
          value,
          selectionStart,
          selectionEnd,
        );
      } else if (event.key === 'Tab' && event.shiftKey) {
        edit = outdentSelection(value, selectionStart, selectionEnd);
      } else if (
        event.key === 'Tab' &&
        value.slice(selectionStart, selectionEnd).includes('\n')
      ) {
        edit = indentSelection(value, selectionStart, selectionEnd);
      } else if (event.key === 'Tab') {
        edit = insertAtSelection(
          value,
          selectionStart,
          selectionEnd,
          INDENT,
        );
      } else {
        return;
      }

      event.preventDefault();
      this.applyTextareaEdit(edit);
    },

    moveDialogFocus(moveBackward) {
      const controls = [
        this.dialog.querySelector('[aria-label="Close"]'),
        this.textarea,
        this.cancelButton,
        this.insertButton,
      ];
      const currentIndex = controls.indexOf(document.activeElement);
      const offset = moveBackward ? -1 : 1;
      const nextIndex =
        (currentIndex + offset + controls.length) % controls.length;

      controls[nextIndex].focus();
    },

    keepFocusInDialog(event) {
      if (this.dialog.contains(event.target)) {
        return;
      }

      this.textarea.focus();
    },

    addButtonInteractionStyles(button, styles) {
      const applyRestingStyle = () => {
        Object.assign(button.style, styles.resting);
      };

      button.addEventListener('mouseenter', () => {
        Object.assign(button.style, styles.hover);
      });
      button.addEventListener('mouseleave', applyRestingStyle);
      button.addEventListener('focus', () => {
        if (button.matches(':focus-visible')) {
          Object.assign(button.style, styles.focus);
        }
      });
      button.addEventListener('blur', applyRestingStyle);
    },

    applyTextareaEdit(edit) {
      this.textarea.value = edit.value;
      this.textarea.setSelectionRange(
        edit.selectionStart,
        edit.selectionEnd,
      );
    },

    showDialog() {
      if (!this.dialog) {
        const backdrop = document.createElement('div');
        backdrop.className = 'ghtml-backdrop';
        Object.assign(backdrop.style, {
          position: 'fixed',
          inset: '0',
          display: 'none',
          backgroundColor: 'rgba(32, 33, 36, 0.32)',
          zIndex: '2147483646',
        });

        const dialog = document.createElement('div');
        dialog.className = 'ghtml-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        Object.assign(dialog.style, {
          position: 'fixed',
          right: '16px',
          bottom: '64px',
          display: 'none',
          flexDirection: 'column',
          width: 'min(600px, calc(100vw - 32px))',
          height: 'min(420px, calc(100vh - 96px))',
          minWidth: 'min(320px, calc(100vw - 32px))',
          minHeight: 'min(240px, calc(100vh - 96px))',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 96px)',
          boxSizing: 'border-box',
          overflow: 'auto',
          backgroundColor: '#fff',
          border: '1px solid #dadce0',
          borderRadius: '8px',
          padding: '24px',
          zIndex: '2147483647',
          boxShadow:
            '0 8px 24px rgba(60, 64, 67, 0.24), 0 2px 6px rgba(60, 64, 67, 0.16)',
          color: '#202124',
          fontFamily: 'Roboto, Arial, sans-serif',
        });

        const header = document.createElement('header');
        Object.assign(header.style, {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: '0 0 auto',
          width: 'calc(100% + 48px)',
          boxSizing: 'border-box',
          margin: '-24px -24px 16px',
          padding: '10px 12px 10px 16px',
          backgroundColor: '#f2f6fc',
          borderRadius: '7px 7px 0 0',
          cursor: 'move',
          userSelect: 'none',
          touchAction: 'none',
        });
        header.addEventListener(
          'pointerdown',
          this.onDialogDragStart.bind(this),
        );
        header.addEventListener(
          'pointermove',
          this.onDialogDrag.bind(this),
        );
        header.addEventListener(
          'pointerup',
          this.onDialogDragEnd.bind(this),
        );
        header.addEventListener(
          'pointercancel',
          this.onDialogDragEnd.bind(this),
        );

        const title = document.createElement('h3');
        title.id = 'ghtml-dialog-title';
        title.textContent = 'Insert HTML';
        dialog.setAttribute('aria-labelledby', title.id);
        Object.assign(title.style, {
          margin: '0',
          fontSize: '16px',
          fontWeight: '500',
          lineHeight: '24px',
        });
        header.appendChild(title);

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = '×';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.title = 'Close';
        Object.assign(closeButton.style, {
          flex: '0 0 auto',
          width: '28px',
          height: '28px',
          border: '0',
          borderRadius: '4px',
          padding: '0',
          backgroundColor: 'transparent',
          color: '#5f6368',
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          fontWeight: '400',
          lineHeight: '28px',
          cursor: 'pointer',
        });
        closeButton.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
        this.addButtonInteractionStyles(closeButton, {
          resting: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
          hover: {
            backgroundColor: '#e4e9f0',
            boxShadow: 'none',
          },
          focus: {
            backgroundColor: '#e8f0fe',
            boxShadow: '0 0 0 2px #1a73e8',
          },
        });
        header.appendChild(closeButton);
        dialog.appendChild(header);

        const textarea = document.createElement('textarea');
        textarea.rows = 12;
        textarea.cols = 60;
        textarea.value = `<h2>Hello</h2>
<p>This is <strong>bold</strong>, <em>italic</em>, and <a href="https://example.com">a link</a>.</p>`;
        Object.assign(textarea.style, {
          flex: '1 1 auto',
          width: '100%',
          minHeight: '100px',
          boxSizing: 'border-box',
          border: '1px solid #dadce0',
          borderRadius: '4px',
          padding: '12px',
          backgroundColor: '#fff',
          color: '#202124',
          fontFamily: 'Roboto Mono, monospace',
          fontSize: '13px',
          lineHeight: '20px',
          outlineColor: '#1a73e8',
          resize: 'vertical',
        });
        dialog.appendChild(textarea);
        textarea.addEventListener('input', () => {
          this.saveDialogState();
        });

        const buttonsDiv = document.createElement('div');
        Object.assign(buttonsDiv.style, {
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '20px',
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        Object.assign(cancelButton.style, {
          minWidth: '72px',
          height: '36px',
          border: '1px solid #dadce0',
          borderRadius: '4px',
          padding: '0 16px',
          backgroundColor: '#fff',
          color: '#1a73e8',
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        });

        cancelButton.addEventListener('mousedown', (event) => {
          event.preventDefault();
        });
        this.addButtonInteractionStyles(cancelButton, {
          resting: {
            backgroundColor: '#fff',
            boxShadow: 'none',
          },
          hover: {
            backgroundColor: '#f8faff',
            boxShadow: '0 1px 2px rgba(60, 64, 67, 0.2)',
          },
          focus: {
            backgroundColor: '#fff',
            boxShadow: '0 0 0 2px #aecbfa',
          },
        });

        cancelButton.addEventListener('click', () => {
          this.closeDialog();
        });

        closeButton.addEventListener('click', () => {
          cancelButton.click();
        });

        buttonsDiv.appendChild(cancelButton);

        const insertButton = document.createElement('button');
        insertButton.textContent = 'Insert';
        Object.assign(insertButton.style, {
          minWidth: '72px',
          height: '36px',
          border: '1px solid #1a73e8',
          borderRadius: '4px',
          padding: '0 16px',
          backgroundColor: '#1a73e8',
          color: '#fff',
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
        });

        insertButton.addEventListener('mousedown', (event) => {
          event.preventDefault();
        });
        this.addButtonInteractionStyles(insertButton, {
          resting: {
            backgroundColor: '#1a73e8',
            boxShadow: 'none',
          },
          hover: {
            backgroundColor: '#1765cc',
            boxShadow: '0 1px 2px rgba(60, 64, 67, 0.3)',
          },
          focus: {
            backgroundColor: '#1a73e8',
            boxShadow: '0 0 0 2px #aecbfa',
          },
        });

        insertButton.addEventListener('click', () => {
          const html = this.textarea.value;

          if (!this.closeDialog()) {
            return;
          }

          this.log(
            "⚡ Executing document.execCommand('insertHTML')...",
          );

          const sanitizedHtml = globalThis.sanitizeHtml(html);

          const result = document.execCommand(
            'insertHTML',
            false,
            sanitizedHtml,
          );

          this.log(`📋 execCommand returned: ${result}`);
          this.log('🤔 Try Cmd/Ctrl+Z now.');
        });

        buttonsDiv.appendChild(insertButton);
        dialog.appendChild(buttonsDiv);
        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);

        this.backdrop = backdrop;
        this.dialog = dialog;
        this.textarea = textarea;
        this.cancelButton = cancelButton;
        this.insertButton = insertButton;
        this.boundDialogKeydownHandler =
          this.onDialogKeydown.bind(this);
        this.boundModalFocusHandler = this.keepFocusInDialog.bind(this);
      }

      this.activeComposeButton.disabled = true;
      this.setLauncherModalState(true);
      this.backdrop.style.display = 'block';
      this.dialog.style.visibility = 'hidden';
      this.dialog.style.display = 'flex';
      this.restoreDialogState()
        .catch((error) => {
          this.error(error);
        })
        .finally(() => {
          this.dialog.style.visibility = 'visible';
          window.addEventListener(
            'keydown',
            this.boundDialogKeydownHandler,
            true,
          );
          document.addEventListener(
            'focusin',
            this.boundModalFocusHandler,
            true,
          );
          this.textarea.focus();
          this.textarea.select();
        });
    },

    createButton(label, clickHandler) {
      const button = document.createElement('button');

      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
      });

      button.textContent = label;
      button.setAttribute('aria-label', 'Insert HTML');
      button.title = 'Insert HTML';

      Object.assign(button.style, {
        position: 'fixed',
        zIndex:
          this.dialog?.style.display === 'flex'
            ? MODAL_LAUNCHER_Z_INDEX
            : LAUNCHER_Z_INDEX,
        width: '24px',
        height: '24px',
        padding: '0',
        border: '1px solid #dadce0',
        borderRadius: '4px',
        backgroundColor: '#f1f3f4',
        color: '#5f6368',
        fontFamily: 'Roboto, Arial, sans-serif',
        fontSize: '11px',
        fontWeight: '500',
        lineHeight: '22px',
        textAlign: 'center',
        opacity: '1',
        cursor: 'pointer',
        transition:
          'background-color 120ms ease, box-shadow 120ms ease',
      });

      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#e8eaed';
        button.style.boxShadow = '0 1px 2px rgba(60, 64, 67, 0.3)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = '#f1f3f4';
        button.style.boxShadow = 'none';
      });

      button.addEventListener('click', () => {
        this.group(label);

        try {
          clickHandler();
        } catch (error) {
          this.error(error);
        }
      });

      document.body.appendChild(button);

      return button;
    },

    findComposeWindows() {
      const messageBodies = document.querySelectorAll(
        MESSAGE_BODY_SELECTOR,
      );
      const composeWindows = new Set();

      for (const messageBody of messageBodies) {
        const composeWindow = this.findComposeWindow(messageBody);

        if (composeWindow instanceof HTMLElement) {
          composeWindows.add(composeWindow);
        }
      }

      return composeWindows;
    },

    getComposeButtonPosition(composeWindow) {
      const composeRect = composeWindow.getBoundingClientRect();
      const topPadding = 8;
      const rightControlReserve = 96;
      const buttonSize = 24;
      const left = composeRect.right - rightControlReserve - buttonSize;
      const top = composeRect.top + topPadding;

      return { left, top };
    },

    positionButton(composeWindow, button) {
      if (this.isComposeWindowMinimized(composeWindow)) {
        button.hidden = true;
        return;
      }

      button.hidden = false;

      const { left, top } =
        this.getComposeButtonPosition(composeWindow);

      button.style.left = `${left}px`;
      button.style.top = `${top}px`;
    },

    positionComposeButtons() {
      for (const [composeWindow, button] of this.composeButtons) {
        this.positionButton(composeWindow, button);
      }
    },

    createComposeButton(composeWindow) {
      const button = this.createButton('</>', () => {
        this.activeComposeWindow = composeWindow;
        this.activeComposeButton = button;
        this.showDialog();
      });

      this.composeButtons.set(composeWindow, button);
      this.positionButton(composeWindow, button);
      this.log('🟢 Compose HTML button created.');
    },

    syncComposeButtons() {
      const composeWindows = this.findComposeWindows();

      for (const composeWindow of composeWindows) {
        if (!this.composeButtons.has(composeWindow)) {
          this.createComposeButton(composeWindow);
          this.composeResizeObserver.observe(composeWindow);
        }
      }

      for (const [composeWindow, button] of this.composeButtons) {
        if (!composeWindows.has(composeWindow)) {
          button.remove();
          this.composeResizeObserver.unobserve(composeWindow);
          this.composeButtons.delete(composeWindow);
          this.composeSelections.delete(composeWindow);
          this.log('🔴 Compose HTML button removed.');
        }
      }

      this.positionComposeButtons();
    },

    observeComposeWindows() {
      this.composeResizeObserver = new ResizeObserver(() => {
        this.positionComposeButtons();
      });

      this.composeObserver = new MutationObserver((mutations) => {
        const buttons = new Set(this.composeButtons.values());

        if (mutations.every(({ target }) => buttons.has(target))) {
          return;
        }

        this.syncComposeButtons();
      });

      this.composeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        subtree: true,
      });

      this.syncComposeButtons();
    },
  };

  window.GHTML = GHTML;

  GHTML.init();
})();
