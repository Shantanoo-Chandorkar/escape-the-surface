import { describe, expect, it } from 'vitest';
import { listHtmlPages, readPage } from './helpers.js';

const VIEWPORT_META_CONTENT = 'width=device-width, initial-scale=1.0';
// Bare redirect page with no layout; it never shows content, so it has no viewport tag.
const PAGES_WITHOUT_LAYOUT = ['continue/index.html'];

describe('viewport meta tag', () => {
  // viewport-fit=cover lets installed Android apps draw under the status and navigation bars, hiding the header and pager.
  it.each(listHtmlPages().filter((pagePath) => !PAGES_WITHOUT_LAYOUT.includes(pagePath)))(
    '%s does not let the page draw under system bars',
    (pagePath) => {
      const viewportContent = readPage(pagePath)
        .querySelector('meta[name="viewport"]')
        ?.getAttribute('content');

      expect(viewportContent).toBe(VIEWPORT_META_CONTENT);
    },
  );

  it.each(PAGES_WITHOUT_LAYOUT)('%s never uses viewport-fit', (pagePath) => {
    const viewportContent = readPage(pagePath)
      .querySelector('meta[name="viewport"]')
      ?.getAttribute('content');

    expect(viewportContent ?? '').not.toContain('viewport-fit');
  });
});
