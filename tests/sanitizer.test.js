import { describe, expect, it } from 'vitest';

import '../src/sanitizer.js';

const sanitizeHtml = globalThis.sanitizeHtml;

describe('sanitizeHtml', () => {
  it('preserves ordinary safe HTML', () => {
    expect(sanitizeHtml('<p>Hello <strong>world</strong></p>')).toBe(
      '<p>Hello <strong>world</strong></p>',
    );
  });

  it('preserves nested formatting', () => {
    expect(sanitizeHtml('<strong><em>Important</em></strong>')).toBe(
      '<strong><em>Important</em></strong>',
    );
  });

  it.each([
    ['text formatting', '<b>Bold</b><i>Italic</i><u>Underline</u>'],
    [
      'semantic formatting',
      '<abbr>HTML</abbr><cite>Source</cite><code>code</code><del>old</del><s>old</s><small>small</small><strike>old</strike><sub>sub</sub><sup>sup</sup>',
    ],
    [
      'headings and blocks',
      '<address>Address</address><blockquote>Quote</blockquote><center>Centered</center><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5><h6>Six</h6><pre>Pre</pre><q>Quote</q>',
    ],
    [
      'lists',
      '<dl><dt>Term</dt><dd>Definition</dd></dl><ol><li>One</li></ol><ul><li>Two</li></ul>',
    ],
    [
      'tables',
      '<table><caption>Caption</caption><colgroup><col></colgroup><thead><tr><th>Head</th></tr></thead><tbody><tr><td>Body</td></tr></tbody><tfoot><tr><td>Foot</td></tr></tfoot></table>',
    ],
    ['void and legacy elements', '<br><hr><font>Legacy</font><img>'],
  ])('preserves supported %s elements', (_description, html) => {
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('preserves plain text', () => {
    expect(sanitizeHtml('Just plain text')).toBe('Just plain text');
  });

  it('preserves supported inline styles', () => {
    expect(
      sanitizeHtml(
        '<span style="color: red; font-weight: bold">Red</span>',
      ),
    ).toBe('<span style="color: red; font-weight: bold;">Red</span>');
  });

  it('removes unsupported inline styles', () => {
    expect(
      sanitizeHtml(
        '<span style="color: red; position: fixed; opacity: 0">Red</span>',
      ),
    ).toBe('<span style="color: red;">Red</span>');
  });

  it('removes URL-bearing inline styles', () => {
    expect(
      sanitizeHtml(
        '<div style="background-color: red; background-image: url(https://example.com/image.png)">Text</div>',
      ),
    ).toBe('<div style="background-color: red;">Text</div>');
  });

  it('removes style attributes with no supported declarations', () => {
    expect(
      sanitizeHtml(
        '<span style="position: fixed; opacity: 0">Text</span>',
      ),
    ).toBe('<span>Text</span>');
  });

  it('preserves important priority on supported inline styles', () => {
    expect(
      sanitizeHtml('<span style="color: red !important">Red</span>'),
    ).toBe('<span style="color: red !important;">Red</span>');
  });

  it('preserves classes', () => {
    expect(
      sanitizeHtml('<div class="message featured">Text</div>'),
    ).toBe('<div class="message featured">Text</div>');
  });

  it('preserves globally supported attributes', () => {
    expect(
      sanitizeHtml(
        '<p class="message" dir="rtl" lang="ar" style="color: red" title="Greeting">Hello</p>',
      ),
    ).toBe(
      '<p class="message" dir="rtl" lang="ar" style="color: red;" title="Greeting">Hello</p>',
    );
  });

  it('preserves supported element-specific attributes', () => {
    expect(
      sanitizeHtml(
        '<a href="https://example.com" target="_blank">Example</a><img alt="Example" height="20" src="https://example.com/image.png" width="40">',
      ),
    ).toBe(
      '<a href="https://example.com" target="_blank">Example</a><img alt="Example" height="20" src="https://example.com/image.png" width="40">',
    );
  });

  it.each([
    [
      'anchors',
      '<a href="https://example.com" name="section" target="_blank">Example</a>',
    ],
    [
      'quoted sources',
      '<blockquote cite="https://example.com/source">Quote</blockquote><del cite="https://example.com/revision" datetime="2026-07-17">Old</del><q cite="https://example.com/quote">Quote</q>',
    ],
    [
      'columns',
      '<table><colgroup span="2" width="100"><col span="2" width="50"></colgroup></table>',
    ],
    ['fonts', '<font color="red" face="Arial" size="3">Text</font>'],
    [
      'images',
      '<img alt="Example" height="20" src="https://example.com/image.png" width="40">',
    ],
    [
      'lists',
      '<ol reversed="" start="3" type="A"><li value="5">Item</li></ol>',
    ],
    [
      'tables',
      '<table border="1" cellpadding="2" cellspacing="3" width="100"><tbody><tr><th colspan="2" headers="name" rowspan="3" scope="col">Head</th><td colspan="2" headers="name" rowspan="3">Cell</td></tr></tbody></table>',
    ],
  ])('preserves supported attributes on %s', (_description, html) => {
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('removes unsupported attributes', () => {
    expect(
      sanitizeHtml(
        '<div aria-label="Message" data-message-id="123" draggable="true">Text</div>',
      ),
    ).toBe('<div>Text</div>');
  });

  it('removes attributes supported only by another element', () => {
    expect(
      sanitizeHtml('<div href="https://example.com">Text</div>'),
    ).toBe('<div>Text</div>');
  });

  it('preserves safe href values', () => {
    expect(
      sanitizeHtml('<a href="https://example.com">Example</a>'),
    ).toBe('<a href="https://example.com">Example</a>');
  });

  it('preserves safe src values', () => {
    expect(
      sanitizeHtml('<img src="https://example.com/image.png">'),
    ).toBe('<img src="https://example.com/image.png">');
  });

  it.each([
    ['https://example.com', 'https://example.com'],
    ['http://example.com', 'http://example.com'],
    ['mailto:person@example.com', 'mailto:person@example.com'],
    ['tel:+15551234567', 'tel:+15551234567'],
  ])('preserves supported href URL %s', (url, serializedUrl) => {
    expect(sanitizeHtml(`<a href="${url}">Example</a>`)).toBe(
      `<a href="${serializedUrl}">Example</a>`,
    );
  });

  it('preserves supported cite URLs', () => {
    expect(
      sanitizeHtml(
        '<blockquote cite="https://example.com/source">Quote</blockquote>',
      ),
    ).toBe(
      '<blockquote cite="https://example.com/source">Quote</blockquote>',
    );
  });

  it.each(['http://example.com/source', 'https://example.com/source'])(
    'preserves supported cite URL %s',
    (url) => {
      expect(sanitizeHtml(`<q cite="${url}">Quote</q>`)).toBe(
        `<q cite="${url}">Quote</q>`,
      );
    },
  );

  it.each([
    'http://example.com/image.png',
    'https://example.com/image.png',
  ])('preserves supported src URL %s', (url) => {
    expect(sanitizeHtml(`<img src="${url}">`)).toBe(
      `<img src="${url}">`,
    );
  });

  it.each([
    'script',
    'iframe',
    'object',
    'embed',
    'link',
    'meta',
    'base',
  ])('removes unsupported <%s> elements', (elementName) => {
    const html = `<p>Before</p><${elementName}></${elementName}><p>After</p>`;

    expect(sanitizeHtml(html)).toBe('<p>Before</p><p>After</p>');
  });

  it('removes elements that are not explicitly allowed', () => {
    expect(
      sanitizeHtml('<p>Before</p><dialog>Hidden</dialog><p>After</p>'),
    ).toBe('<p>Before</p><p>After</p>');
  });

  it('removes the contents of unsupported elements', () => {
    expect(
      sanitizeHtml(
        '<p>Before</p><dialog><strong>Hidden</strong></dialog><p>After</p>',
      ),
    ).toBe('<p>Before</p><p>After</p>');
  });

  it('removes onclick attributes', () => {
    expect(sanitizeHtml('<div onclick="run()">Click</div>')).toBe(
      '<div>Click</div>',
    );
  });

  it('removes onload attributes', () => {
    expect(
      sanitizeHtml(
        '<img src="https://example.com/image.png" onload="run()">',
      ),
    ).toBe('<img src="https://example.com/image.png">');
  });

  it('removes mixed-case event-handler attributes', () => {
    expect(sanitizeHtml('<div oNcLiCk="run()">Click</div>')).toBe(
      '<div>Click</div>',
    );
  });

  it('removes javascript URLs from href attributes', () => {
    expect(sanitizeHtml('<a href="javascript:run()">Click</a>')).toBe(
      '<a>Click</a>',
    );
  });

  it('removes javascript URLs from src attributes', () => {
    expect(sanitizeHtml('<img src="javascript:run()">')).toBe('<img>');
  });

  it('removes case-insensitive javascript URLs', () => {
    expect(sanitizeHtml('<a href="JaVaScRiPt:run()">Click</a>')).toBe(
      '<a>Click</a>',
    );
  });

  it('removes javascript URLs obfuscated with whitespace', () => {
    expect(
      sanitizeHtml('<a href=" java\nscript : run()">Click</a>'),
    ).toBe('<a>Click</a>');
  });

  it('removes javascript URLs obfuscated with control characters', () => {
    expect(sanitizeHtml('<img src="java\u0001script:run()">')).toBe(
      '<img>',
    );
  });

  it.each([
    ['relative URLs', 'image.png'],
    ['protocol-relative URLs', '//example.com/image.png'],
    ['unknown schemes', 'future:resource'],
    ['malformed URLs', 'https://'],
  ])('removes %s', (_description, url) => {
    expect(sanitizeHtml(`<img src="${url}">`)).toBe('<img>');
  });

  it('removes schemes that are unsupported for the URL attribute', () => {
    expect(sanitizeHtml('<img src="mailto:person@example.com">')).toBe(
      '<img>',
    );
    expect(sanitizeHtml('<q cite="tel:+15551234567">Quote</q>')).toBe(
      '<q>Quote</q>',
    );
  });

  it.each([
    ['cite', 'data:text/plain,source'],
    ['href', 'data:text/html,example'],
    ['href', 'ftp://example.com/file'],
    ['src', 'data:image/png;base64,AAAA'],
    ['src', 'blob:https://example.com/id'],
  ])('removes unsupported %s URL %s', (attributeName, url) => {
    const elementName =
      attributeName === 'src'
        ? 'img'
        : attributeName === 'href'
          ? 'a'
          : 'q';
    const content = elementName === 'img' ? '' : 'Text';
    const closingTag = elementName === 'img' ? '' : `</${elementName}>`;

    expect(
      sanitizeHtml(
        `<${elementName} ${attributeName}="${url}">${content}${closingTag}`,
      ),
    ).toBe(`<${elementName}>${content}${closingTag}`);
  });

  it('removes URL values from otherwise supported CSS properties', () => {
    expect(
      sanitizeHtml(
        '<div style="background-color: url(https://example.com/image.png); color: red">Text</div>',
      ),
    ).toBe('<div style="color: red;">Text</div>');
  });

  it('removes image-set values from otherwise supported CSS properties', () => {
    expect(
      sanitizeHtml(
        '<div style="background-color: image-set(url(https://example.com/image.png) 1x); color: red">Text</div>',
      ),
    ).toBe('<div style="color: red;">Text</div>');
  });

  it('removes custom properties', () => {
    expect(
      sanitizeHtml(
        '<span style="--brand-color: red; color: blue">Text</span>',
      ),
    ).toBe('<span style="color: blue;">Text</span>');
  });

  it('preserves the element and text when removing a dangerous attribute', () => {
    expect(
      sanitizeHtml(
        '<a class="action" href="javascript:run()">Click me</a>',
      ),
    ).toBe('<a class="action">Click me</a>');
  });
});
