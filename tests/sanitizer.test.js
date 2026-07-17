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

  it('preserves plain text', () => {
    expect(sanitizeHtml('Just plain text')).toBe('Just plain text');
  });

  it('preserves inline styles', () => {
    expect(sanitizeHtml('<span style="color: red">Red</span>')).toBe(
      '<span style="color: red">Red</span>',
    );
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
      '<p class="message" dir="rtl" lang="ar" style="color: red" title="Greeting">Hello</p>',
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

  it('preserves the element and text when removing a dangerous attribute', () => {
    expect(
      sanitizeHtml(
        '<a class="action" href="javascript:run()">Click me</a>',
      ),
    ).toBe('<a class="action">Click me</a>');
  });
});
