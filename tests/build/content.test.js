import { describe, expect, it } from 'vitest';
import { describePage, loadGolden } from './helpers.js';

describe('page content matches the baseline', () => {
  const baselinePages = Object.entries(loadGolden().pages);

  it.each(baselinePages)('%s', (pagePath, baselineFacts) => {
    expect(describePage(pagePath)).toEqual(baselineFacts);
  });
});
