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

  it('preserves data attributes', () => {
    expect(sanitizeHtml('<div data-message-id="123">Text</div>')).toBe(
      '<div data-message-id="123">Text</div>',
    );
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
    expect(sanitizeHtml('<img src="image.png" onload="run()">')).toBe(
      '<img src="image.png">',
    );
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

  it('preserves the element and text when removing a dangerous attribute', () => {
    expect(
      sanitizeHtml(
        '<a class="action" href="javascript:run()">Click me</a>',
      ),
    ).toBe('<a class="action">Click me</a>');
  });
});
