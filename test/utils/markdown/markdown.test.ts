import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../../../src/utils/markdown/markdown.ts';

const ALLOWED_TAGS = new Set([
  'p',
  'ul',
  'li',
  'h1',
  'h2',
  'h3',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'strong',
  'em',
  'a',
  'hr',
]);

const emittedTagNames = (html: string): string[] => {
  const names: string[] = [];
  for (const match of html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)) {
    names.push((match[1] ?? '').toLowerCase());
  }
  return names;
};

const expectOnlyAllowedTags = (html: string) => {
  for (const name of emittedTagNames(html)) {
    expect(ALLOWED_TAGS.has(name), `unexpected tag <${name}>`).toBe(true);
  }
};

describe('renderMarkdown hardening', () => {
  it('escapes raw HTML so tags cannot reach the DOM', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)> <script>alert(2)</script>');
    try {
      expect(html).toContain('&lt;img');
      expect(html).not.toMatch(/<img/);
      expect(html).not.toMatch(/<script/);
      expectOnlyAllowedTags(html);
    } catch (error) {
      console.log('escape mismatch:', html);
      throw error;
    }
  });

  it('never creates anchors for non-http schemes', () => {
    const html = renderMarkdown('javascript:alert(1) and data:text/html,<b>x</b>');
    try {
      expect(html).not.toMatch(/<a /);
      expect(html).toContain('javascript:');
      expectOnlyAllowedTags(html);
    } catch (error) {
      console.log('scheme mismatch:', html);
      throw error;
    }
  });

  it('creates safe anchors for http and https URLs', () => {
    const html = renderMarkdown('See https://example.com/page and http://a.b');
    try {
      expect(html).toContain(
        '<a href="https://example.com/page" target="_blank" rel="noreferrer">',
      );
      expect(html).toContain('<a href="http://a.b" target="_blank" rel="noreferrer">');
      expectOnlyAllowedTags(html);
    } catch (error) {
      console.log('link mismatch:', html);
      throw error;
    }
  });

  it('cannot break out of the anchor href attribute', () => {
    const html = renderMarkdown('https://x.com/"onmouseover="alert(1)');
    try {
      // Quotes are escaped to &quot; entities inside the attribute value,
      // so the attribute can never be terminated early by source text.
      expect(html).not.toMatch(/"\s*onmouseover=/);
      expect(html).toContain('&quot;onmouseover=&quot;');
      expectOnlyAllowedTags(html);
    } catch (error) {
      console.log('href breakout:', html);
      throw error;
    }
  });

  it('escapes the code-fence language inside the class attribute', () => {
    const html = renderMarkdown('```x" onmouseover="alert(1)\ncode\n```');
    try {
      expect(html).not.toMatch(/"\s*onmouseover=/);
      expect(html).toContain('language-x&quot;');
      expectOnlyAllowedTags(html);
    } catch (error) {
      console.log('fence breakout:', html);
      throw error;
    }
  });

  it('escapes markup inside headings, lists, and table cells', () => {
    const html = renderMarkdown(
      '# <svg onload=alert(1)>\n\n- <b>x</b>\n\n| a | b |\n| --- | --- |\n| <i>y</i> | z |',
    );
    try {
      expect(html).not.toMatch(/<svg/);
      expect(html).not.toMatch(/<b>/);
      expect(html).not.toMatch(/<i>/);
      expectOnlyAllowedTags(html);
    } catch (error) {
      console.log('context mismatch:', html);
      throw error;
    }
  });

  it('keeps inline code free of formatting and markup', () => {
    const html = renderMarkdown('`<img onerror=x>` and `**not bold**`');
    try {
      expect(html).toContain('&lt;img');
      expect(html).toContain('**not bold**');
      expectOnlyAllowedTags(html);
    } catch (error) {
      console.log('code mismatch:', html);
      throw error;
    }
  });
});

describe('renderMarkdown allowed grammar', () => {
  it('renders the documented grammar to its tag whitelist', () => {
    const html = renderMarkdown(
      '# Title\n\n## Sub\n\n### Deep\n\nPara with **bold** and *em*.\n\n- item\n\n| h |\n| --- |\n| c |\n\n```\nblock\n```\n\n---\n',
    );
    try {
      for (const tag of ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'ul', 'li', 'table', 'pre', 'hr']) {
        expect(emittedTagNames(html)).toContain(tag);
      }
      expectOnlyAllowedTags(html);
    } catch (error) {
      console.log('grammar mismatch:', html);
      throw error;
    }
  });
});
