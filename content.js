(() => {
  if (window.GHTML) {
    console.warn('[GHTML 🧪] ♻️ Reloading playground...');
    window.GHTML.destroy();
  }

  const GHTML = {
    savedRange: null,

    execButton: null,

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
      this.log('  4. Click EXEC.');
      this.log('');
      this.log(
        `⚡ insertHTML supported: ${document.queryCommandSupported?.('insertHTML')}`,
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

      this.execButton?.remove();

      this.log('🧹 Playground destroyed.');
    },

    isMessageBody(el) {
      return (
        el instanceof HTMLElement &&
        el.matches(
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

    promptForExecHtml() {
      const html = prompt(
        'Paste HTML',
        `<h2>Hello</h2>
<p>This is <strong>bold</strong>, <em>italic</em>, and <a href="https://example.com">a link</a>.</p>`,
      );

      if (html == null) {
        this.log('🚫 User cancelled.');
        return;
      }

      this.log("🎯 Using Gmail's native selection.");

      this.log("⚡ Executing document.execCommand('insertHTML')...");

      const result = document.execCommand('insertHTML', false, html);

      this.log(`📋 execCommand returned: ${result}`);

      this.log('🤔 Try Cmd/Ctrl+Z now.');
    },

    createButton(label, right, clickHandler) {
      const button = document.createElement('button');

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
      this.execButton = this.createButton('EXEC', 20, () => {
        this.promptForExecHtml();
      });

      this.log('🟢 EXEC button created.');
    },
  };

  window.GHTML = GHTML;

  GHTML.init();
})();
