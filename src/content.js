(() => {
  const MESSAGE_BODY_SELECTOR =
    '[g_editable="true"][role="textbox"][contenteditable="true"]';
  const COMPOSE_WINDOW_SELECTOR = '[role="dialog"]';

  if (window.GHTML) {
    console.warn('[GHTML 🧪] ♻️ Reloading playground...');
    window.GHTML.destroy();
  }

  const GHTML = {
    savedRange: null,

    activeComposeWindow: null,
    activeComposeButton: null,
    composeButtons: new Map(),
    dialog: null,
    textarea: null,
    cancelButton: null,
    insertButton: null,

    boundSelectionHandler: null,
    boundPositionHandler: null,
    boundDialogKeydownHandler: null,
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
      this.clearActiveCompose();
      this.dialog?.removeEventListener(
        'keydown',
        this.boundDialogKeydownHandler,
      );
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
      if (!this.isMessageBody(document.activeElement)) {
        return;
      }

      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0).cloneRange();

      const changed =
        !this.savedRange ||
        range.startContainer !== this.savedRange.startContainer ||
        range.startOffset !== this.savedRange.startOffset ||
        range.endContainer !== this.savedRange.endContainer ||
        range.endOffset !== this.savedRange.endOffset;

      this.savedRange = range;

      if (changed) {
        this.log('💾 Selection saved.');
      }
    },

    restoreSelection() {
      if (!this.savedRange) {
        this.warn('⚠️ No saved Gmail selection.');
        return false;
      }

      const selection = window.getSelection();

      if (!selection) {
        this.warn('⚠️ Browser selection is unavailable.');
        return false;
      }

      selection.removeAllRanges();
      selection.addRange(this.savedRange);

      return true;
    },

    restoreEditor() {
      if (!this.savedRange) {
        this.warn('⚠️ No saved Gmail selection.');
        return false;
      }

      const editorNode =
        this.savedRange.startContainer.nodeType === Node.ELEMENT_NODE
          ? this.savedRange.startContainer
          : this.savedRange.startContainer.parentElement;

      const editor = this.findMessageBody(editorNode);

      if (!(editor instanceof HTMLElement)) {
        this.warn('⚠️ Gmail message body could not be restored.');
        return false;
      }

      editor.focus();

      if (!this.restoreSelection()) {
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
      this.dialog.removeEventListener(
        'keydown',
        this.boundDialogKeydownHandler,
      );
      this.dialog.style.display = 'none';
      this.clearActiveCompose();
    },

    onDialogKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelButton.click();
        return;
      }

      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        this.insertButton.click();
      }
    },

    showDialog() {
      if (!this.dialog) {
        const dialog = document.createElement('div');

        Object.assign(dialog.style, {
          position: 'fixed',
          right: '16px',
          bottom: '64px',
          display: 'flex',
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

        const title = document.createElement('h3');
        title.textContent = 'HTML';
        Object.assign(title.style, {
          margin: '0 0 16px',
          fontSize: '20px',
          fontWeight: '500',
          lineHeight: '28px',
        });
        dialog.appendChild(title);

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
        });
        dialog.appendChild(textarea);

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

        cancelButton.addEventListener('click', () => {
          this.closeDialog();

          this.restoreEditor();
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

        insertButton.addEventListener('click', () => {
          const html = this.textarea.value;

          this.closeDialog();

          if (!this.restoreSelection()) {
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
        document.body.appendChild(dialog);

        this.dialog = dialog;
        this.textarea = textarea;
        this.cancelButton = cancelButton;
        this.insertButton = insertButton;
        this.boundDialogKeydownHandler =
          this.onDialogKeydown.bind(this);
      }

      this.activeComposeButton.disabled = true;
      this.dialog.style.display = 'flex';
      this.dialog.addEventListener(
        'keydown',
        this.boundDialogKeydownHandler,
      );
      this.textarea.focus();
      this.textarea.select();
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
        zIndex: '2147483647',
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
