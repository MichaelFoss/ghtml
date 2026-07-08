(() => {
  if (window.GHTML) {
    console.warn('[GHTML 🧪] ♻️ Reloading playground...');
    window.GHTML.destroy();
  }

  const GHTML = {
    savedRange: null,

    htmlButton: null,
    testButton: null,
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
      this.log('  4. Click TEST or HTML.');
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

      this.htmlButton?.remove();
      this.testButton?.remove();
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

    restoreSelection() {
      if (!this.savedRange) {
        this.warn('⚠️ No saved selection.');
        return false;
      }

      const selection = window.getSelection();

      selection.removeAllRanges();
      selection.addRange(this.savedRange);

      this.log('🎯 Selection restored.');

      return true;
    },

    insertFragment(fragment) {
      if (!this.restoreSelection()) {
        alert('Place the cursor inside the Gmail message body first.');
        return;
      }

      const range = this.savedRange;

      this.log('✂️ Deleting selection...');

      range.deleteContents();

      this.log('📥 Inserting fragment...');

      range.insertNode(fragment);

      range.collapse(false);

      const selection = window.getSelection();

      selection.removeAllRanges();
      selection.addRange(range);

      this.savedRange = range.cloneRange();

      this.log('✅ Insert complete.');
      this.log("🤔 Press Cmd/Ctrl+Z now and observe Gmail's behavior.");
    },

    parseHtml(html) {
      this.log('🌐 Parsing HTML...');

      const template = document.createElement('template');
      template.innerHTML = html;

      this.log(
        `🧩 Parsed ${template.content.childNodes.length} top-level node(s).`,
      );

      return template.content.cloneNode(true);
    },

    buildTestFragment() {
      this.log('🧱 Building DOM manually...');

      const fragment = document.createDocumentFragment();

      const heading = document.createElement('h2');
      heading.textContent = 'TEST';

      const paragraph = document.createElement('p');

      paragraph.append('This is ');

      const strong = document.createElement('strong');
      strong.textContent = 'bold';

      paragraph.append(strong);
      paragraph.append(', ');

      const em = document.createElement('em');
      em.textContent = 'italic';

      paragraph.append(em);
      paragraph.append(', and ');

      const link = document.createElement('a');
      link.href = 'https://example.com';
      link.textContent = 'a link';

      paragraph.append(link);
      paragraph.append('.');

      fragment.append(heading);
      fragment.append(paragraph);

      return fragment;
    },

    promptForHtml() {
      const html = prompt(
        'Paste HTML',
        `<h2>Hello</h2>
<p>This is <strong>bold</strong>, <em>italic</em>, and <a href="https://example.com">a link</a>.</p>`,
      );

      if (html == null) {
        this.log('🚫 User cancelled.');
        return;
      }

      this.log('📄 HTML received:');
      this.log(html);

      const fragment = this.parseHtml(html);

      this.insertFragment(fragment);
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

      if (!this.restoreSelection()) {
        return;
      }

      this.log("⚡ Executing document.execCommand('insertHTML')...");

      const result = document.execCommand('insertHTML', false, html);

      this.log(`📋 execCommand returned: ${result}`);

      this.log('🤔 Try Cmd/Ctrl+Z now.');
    },

    createButtons() {
      this.testButton = this.createButton('TEST', 220, () => {
        const fragment = this.buildTestFragment();
        this.insertFragment(fragment);
      });

      this.htmlButton = this.createButton('HTML', 120, () => {
        this.promptForHtml();
      });

      this.execButton = this.createButton('EXEC', 20, () => {
        this.promptForExecHtml();
      });

      this.log('🟢 TEST, HTML and EXEC buttons created.');
    },
  };

  window.GHTML = GHTML;

  GHTML.init();
})();
