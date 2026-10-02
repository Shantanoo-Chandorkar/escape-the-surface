import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clientDirectory, listHtmlPages, projectRoot } from './helpers.js';

const lessonSlugs = readdirSync(join(projectRoot, 'src', 'content', 'topics'))
  .filter((fileName) => fileName.endsWith('.mdx'))
  .map((fileName) => basename(fileName, '.mdx'));

describe('content layer keeps lesson URLs', () => {
  it('builds a page for every lesson file at /topic/<file name>', () => {
    const missingLessonPages = lessonSlugs.filter(
      (lessonSlug) => !existsSync(join(clientDirectory, 'topic', lessonSlug, 'index.html')),
    );

    expect(missingLessonPages).toEqual([]);
  });

  it('builds no lesson page without a lesson file', () => {
    const lessonPages = listHtmlPages().filter((pagePath) => pagePath.startsWith('topic/'));

    expect(lessonPages).toHaveLength(lessonSlugs.length);
  });
});

describe('legacy and on-demand setup', () => {
  it('uses the content layer config, not the legacy one', () => {
    expect(existsSync(join(projectRoot, 'src', 'content.config.ts'))).toBe(true);
    expect(existsSync(join(projectRoot, 'src', 'content', 'config.ts'))).toBe(false);
  });

  it('keeps the feedback endpoint on-demand and out of the static output', () => {
    const feedbackSource = readFileSync(
      join(projectRoot, 'src', 'pages', 'api', 'feedback.js'),
      'utf8',
    );
    const staticApiPages = listHtmlPages().filter((pagePath) => pagePath.startsWith('api/'));

    expect(feedbackSource).toMatch(/export const prerender = false/);
    expect(staticApiPages).toEqual([]);
  });
});
