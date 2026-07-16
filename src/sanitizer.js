(() => {
  const DISALLOWED_ELEMENTS = new Set([
    'script',
    'iframe',
    'object',
    'embed',
    'link',
    'meta',
    'base',
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
    if (DISALLOWED_ELEMENTS.has(element.localName)) {
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
