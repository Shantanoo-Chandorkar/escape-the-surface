import { describe, expect, it } from 'vitest';
import { readCodeBlockContents, readPage, readVisibleText } from './helpers.js';

const SAMPLE_LESSON_WITH_TABLE_AND_CODE = 'topic/arrow-functions/index.html';
const SAMPLE_LESSON_WITH_TABLE_AND_PLAINTEXT = 'topic/cors/index.html';

describe('GFM tables', () => {
  it.each([SAMPLE_LESSON_WITH_TABLE_AND_CODE, SAMPLE_LESSON_WITH_TABLE_AND_PLAINTEXT])(
    '%s renders a header and body with matching column counts',
    (pagePath) => {
      const lessonTable = readPage(pagePath).querySelector('.mdx-content-wrapper table');
      const headerCellCount = lessonTable.querySelectorAll('thead th').length;
      const bodyRows = lessonTable.querySelectorAll('tbody tr');

      expect(headerCellCount).toBeGreaterThan(1);
      expect(bodyRows.length).toBeGreaterThan(0);
      for (const bodyRow of bodyRows) {
        expect(bodyRow.querySelectorAll('td').length).toBe(headerCellCount);
      }
    },
  );
});

describe('code blocks', () => {
  const codeBlocks = readPage(SAMPLE_LESSON_WITH_TABLE_AND_CODE).querySelectorAll(
    '.mdx-content-wrapper pre',
  );

  it('are accessible regions with a language tag', () => {
    expect(codeBlocks.length).toBeGreaterThan(0);
    for (const codeBlock of codeBlocks) {
      expect(codeBlock.getAttribute('role')).toBe('region');
      expect(codeBlock.getAttribute('aria-label')).toBe('Code snippet');
      expect(codeBlock.getAttribute('data-language')).toBeTruthy();
    }
  });

  it('use the github-dark theme with colored tokens', () => {
    const highlightedBlock = codeBlocks.find(
      (codeBlock) => codeBlock.getAttribute('data-language') === 'js',
    );

    expect(highlightedBlock.getAttribute('style')).toContain('background-color:#24292e');
    expect(
      readCodeBlockContents(highlightedBlock).querySelectorAll('span[style*="color"]').length,
    ).toBeGreaterThan(0);
  });

  it('render language-less fences as plaintext', () => {
    const plaintextBlocks = readPage(SAMPLE_LESSON_WITH_TABLE_AND_PLAINTEXT)
      .querySelectorAll('.mdx-content-wrapper pre')
      .filter((codeBlock) => codeBlock.getAttribute('data-language') === 'plaintext');

    expect(plaintextBlocks.length).toBeGreaterThan(0);
  });
});

describe('inline spacing', () => {
  it('keeps spaces around bold and inline code', () => {
    const lessonText = readVisibleText(
      readPage(SAMPLE_LESSON_WITH_TABLE_AND_CODE).querySelector('.mdx-content-wrapper'),
    );

    expect(lessonText).toContain(
      'Arrow functions capture this from their enclosing lexical scope at definition time. call, apply, and bind cannot override it.',
    );
  });
});
