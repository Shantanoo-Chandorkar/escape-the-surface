import { describe, expect, it } from 'vitest';
import { listHtmlPages, loadGolden } from './helpers.js';

describe('built routes', () => {
  const baselinePagePaths = Object.keys(loadGolden().pages).sort();

  it('builds exactly the pages in the baseline', () => {
    expect(listHtmlPages()).toEqual(baselinePagePaths);
  });

  it('keeps one page per lesson', () => {
    const lessonPages = baselinePagePaths.filter((pagePath) => pagePath.startsWith('topic/'));

    expect(lessonPages.length).toBeGreaterThan(70);
  });
});
