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

    boundSelectionHandler: null,
    boundPositionHandler: null,
    composeObserver: null,

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

      for (const button of this.composeButtons.values()) {
        button.remove();
      }

      this.composeButtons.clear();
      this.clearActiveCompose();
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

    showDialog() {
      if (!this.dialog) {
        const dialog = document.createElement('div');

        Object.assign(dialog.style, {
          position: 'fixed',
          right: '20px',
          bottom: '70px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '10px',
          zIndex: '2147483647',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          maxWidth: 'fit-content',
        });

        const title = document.createElement('h3');
        title.textContent = 'HTML';
        dialog.appendChild(title);

        const textarea = document.createElement('textarea');
        textarea.rows = 12;
        textarea.cols = 60;
        textarea.value = `<h2>Hello</h2>
<p>This is <strong>bold</strong>, <em>italic</em>, and <a href="https://example.com">a link</a>.</p>`;
        dialog.appendChild(textarea);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.marginTop = '8px';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';

        cancelButton.addEventListener('mousedown', (event) => {
          event.preventDefault();
        });

        cancelButton.addEventListener('click', () => {
          this.dialog.style.display = 'none';
          this.clearActiveCompose();

          this.restoreEditor();
        });

        buttonsDiv.appendChild(cancelButton);

        const insertButton = document.createElement('button');
        insertButton.textContent = 'Insert';
        insertButton.style.marginLeft = '8px';

        insertButton.addEventListener('mousedown', (event) => {
          event.preventDefault();
        });

        insertButton.addEventListener('click', () => {
          const html = this.textarea.value;

          this.dialog.style.display = 'none';
          this.clearActiveCompose();

          if (!this.restoreSelection()) {
            return;
          }

          this.log(
            "⚡ Executing document.execCommand('insertHTML')...",
          );

          const result = document.execCommand(
            'insertHTML',
            false,
            html,
          );

          this.log(`📋 execCommand returned: ${result}`);
          this.log('🤔 Try Cmd/Ctrl+Z now.');
        });

        buttonsDiv.appendChild(insertButton);
        dialog.appendChild(buttonsDiv);
        document.body.appendChild(dialog);

        this.dialog = dialog;
        this.textarea = textarea;
      }

      this.activeComposeButton.disabled = true;
      this.dialog.style.display = 'block';
      this.textarea.focus();
      this.textarea.select();
    },

    createButton(label, clickHandler) {
      const button = document.createElement('button');

      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
      });

      button.textContent = label;

      Object.assign(button.style, {
        position: 'fixed',
        zIndex: '2147483647',
        padding: '10px 16px',
        fontSize: '14px',
        cursor: 'pointer',
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

    positionButton(composeWindow, button) {
      const composeRect = composeWindow.getBoundingClientRect();
      const spacing = 8;
      const left = Math.max(
        spacing,
        composeRect.right - button.offsetWidth - spacing,
      );
      const top = Math.max(spacing, composeRect.top + spacing);

      button.style.left = `${left}px`;
      button.style.top = `${top}px`;
    },

    positionComposeButtons() {
      for (const [composeWindow, button] of this.composeButtons) {
        this.positionButton(composeWindow, button);
      }
    },

    createComposeButton(composeWindow) {
      const button = this.createButton('HTML', () => {
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
        }
      }

      for (const [composeWindow, button] of this.composeButtons) {
        if (!composeWindows.has(composeWindow)) {
          button.remove();
          this.composeButtons.delete(composeWindow);
          this.log('🔴 Compose HTML button removed.');
        }
      }

      this.positionComposeButtons();
    },

    observeComposeWindows() {
      this.composeObserver = new MutationObserver(() => {
        this.syncComposeButtons();
      });

      this.composeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      this.syncComposeButtons();
    },
  };

  window.GHTML = GHTML;

  GHTML.init();
})();
