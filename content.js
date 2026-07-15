(() => {
  if (window.GHTML) {
    console.warn('[GHTML 🧪] ♻️ Reloading playground...');
    window.GHTML.destroy();
  }

  const GHTML = {
    savedRange: null,

    htmlButton: null,
    dialog: null,
    textarea: null,

    boundSelectionHandler: null,

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

      document.addEventListener(
        'selectionchange',
        this.boundSelectionHandler,
        true,
      );

      this.createButtons();
    },

    destroy() {
      document.removeEventListener(
        'selectionchange',
        this.boundSelectionHandler,
        true,
      );

      this.htmlButton?.remove();
      this.dialog?.remove();

      this.log('🧹 Playground destroyed.');
    },

    isMessageBody(element) {
      return (
        element instanceof HTMLElement &&
        element.matches(
          '[g_editable="true"][role="textbox"][contenteditable="true"]',
        )
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

      const editor = editorNode?.closest(
        '[g_editable="true"][role="textbox"][contenteditable="true"]',
      );

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
          this.htmlButton.disabled = false;

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
          this.htmlButton.disabled = false;

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

      this.htmlButton.disabled = true;
      this.dialog.style.display = 'block';
      this.textarea.focus();
      this.textarea.select();
    },

    createButton(label, right, clickHandler) {
      const button = document.createElement('button');

      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
      });

      button.textContent = label;

      Object.assign(button.style, {
        position: 'fixed',
        right: `${right}px`,
        bottom: '20px',
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

    createButtons() {
      this.htmlButton = this.createButton('HTML', 20, () => {
        this.showDialog();
      });

      this.log('🟢 HTML button created.');
    },
  };

  window.GHTML = GHTML;

  GHTML.init();
})();
