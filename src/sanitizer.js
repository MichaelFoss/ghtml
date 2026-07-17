(() => {
  const ALLOWED_ELEMENTS = new Set([
    'a',
    'abbr',
    'address',
    'b',
    'blockquote',
    'br',
    'caption',
    'center',
    'cite',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'div',
    'dl',
    'dt',
    'em',
    'font',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'li',
    'ol',
    'p',
    'pre',
    'q',
    's',
    'small',
    'span',
    'strike',
    'strong',
    'sub',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
  ]);

  function sanitizeHtml(html) {
    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');

    sanitizeDocument(document.body);

    return document.body.innerHTML;
  }

  function sanitizeDocument(root) {
    const elements = [root, ...root.querySelectorAll('*')];

    for (const element of elements) {
      sanitizeElement(element);
    }
  }

  function sanitizeElement(element) {
    if (
      element !== element.ownerDocument.body &&
      !ALLOWED_ELEMENTS.has(element.localName)
    ) {
      element.remove();
      return;
    }

    sanitizeAttributes(element);
  }

  function sanitizeAttributes(element) {
    for (const attribute of [...element.attributes]) {
      const attributeName = attribute.name.toLowerCase();

      if (attributeName.startsWith('on')) {
        element.removeAttribute(attribute.name);
        continue;
      }

      const isUrlAttribute =
        attributeName === 'href' || attributeName === 'src';

      if (isUrlAttribute && isJavaScriptUrl(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  function isJavaScriptUrl(value) {
    const normalizedValue = [...value]
      .filter((character) => !isUrlSeparator(character))
      .join('')
      .toLowerCase();

    return normalizedValue.startsWith('javascript:');
  }

  function isUrlSeparator(character) {
    return character.charCodeAt(0) <= 32;
  }

  globalThis.sanitizeHtml = sanitizeHtml;
})();
