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

  const GLOBAL_ALLOWED_ATTRIBUTES = new Set([
    'class',
    'dir',
    'lang',
    'style',
    'title',
  ]);

  const ELEMENT_ALLOWED_ATTRIBUTES = new Map([
    ['a', new Set(['href', 'name', 'target'])],
    ['blockquote', new Set(['cite'])],
    ['col', new Set(['span', 'width'])],
    ['colgroup', new Set(['span', 'width'])],
    ['del', new Set(['cite', 'datetime'])],
    ['font', new Set(['color', 'face', 'size'])],
    ['img', new Set(['alt', 'height', 'src', 'width'])],
    ['li', new Set(['value'])],
    ['ol', new Set(['reversed', 'start', 'type'])],
    ['q', new Set(['cite'])],
    [
      'table',
      new Set(['border', 'cellpadding', 'cellspacing', 'width']),
    ],
    ['td', new Set(['colspan', 'headers', 'rowspan'])],
    ['th', new Set(['colspan', 'headers', 'rowspan', 'scope'])],
  ]);

  const ALLOWED_URL_SCHEMES = new Map([
    ['cite', new Set(['http:', 'https:'])],
    ['href', new Set(['http:', 'https:', 'mailto:', 'tel:'])],
    ['src', new Set(['http:', 'https:'])],
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

      if (!isAllowedAttribute(element.localName, attributeName)) {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (
        ALLOWED_URL_SCHEMES.has(attributeName) &&
        !isAllowedUrl(attributeName, attribute.value)
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  function isAllowedAttribute(elementName, attributeName) {
    if (GLOBAL_ALLOWED_ATTRIBUTES.has(attributeName)) {
      return true;
    }

    return (
      ELEMENT_ALLOWED_ATTRIBUTES.get(elementName)?.has(attributeName) ??
      false
    );
  }

  function isAllowedUrl(attributeName, value) {
    try {
      const url = new URL(value);

      return ALLOWED_URL_SCHEMES.get(attributeName).has(url.protocol);
    } catch {
      return false;
    }
  }

  globalThis.sanitizeHtml = sanitizeHtml;
})();
