import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
export const distDirectory = join(projectRoot, 'dist');
export const goldenFilePath = join(projectRoot, 'tests', 'build', 'golden', 'baseline-v4.json');

if (!existsSync(distDirectory)) {
  throw new Error(
    'dist/ not found. Build first with "npm run build", or use "npm run test:build".',
  );
}

// Astro 5+ adapters move static output into dist/client, while 4.x keeps it directly in dist.
export const clientDirectory = existsSync(join(distDirectory, 'client', 'index.html'))
  ? join(distDirectory, 'client')
  : distDirectory;

/**
 * Lists every file under a directory.
 *
 * @param {string} directory Absolute folder to scan recursively.
 * @return {string[]} Sorted forward-slash paths relative to the folder.
 */
export function listFiles(directory) {
  const relativePaths = readdirSync(directory, { withFileTypes: true, recursive: true })
    .filter((directoryEntry) => directoryEntry.isFile())
    .map((directoryEntry) =>
      relative(directory, join(directoryEntry.parentPath, directoryEntry.name))
        .split(sep)
        .join('/'),
    );

  return relativePaths.sort();
}

/**
 * Lists the built HTML pages in the client output.
 *
 * @return {string[]} Sorted page paths relative to the client output folder.
 */
export function listHtmlPages() {
  return listFiles(clientDirectory).filter((filePath) => filePath.endsWith('.html'));
}

/**
 * Parses a built page.
 *
 * @param {string} pagePath Page path relative to the client output folder.
 * @return {import('node-html-parser').HTMLElement} Root of the parsed page.
 */
export function readPage(pagePath) {
  return parse(readFileSync(join(clientDirectory, pagePath), 'utf8'));
}

/**
 * Parses the inside of a code block, because the page parser keeps <pre> contents as one raw text node.
 *
 * @param {import('node-html-parser').HTMLElement} codeBlock A <pre> element from a parsed page.
 * @return {import('node-html-parser').HTMLElement} Root of the highlighted code, with token spans as elements.
 */
export function readCodeBlockContents(codeBlock) {
  return parse(codeBlock.innerHTML);
}

/**
 * Collapses runs of whitespace so formatting-only changes do not count as content changes.
 *
 * @param {string} text Raw text.
 * @return {string} Text with single spaces and no outer whitespace.
 */
export function collapseWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extracts the readable prose of a lesson body, excluding scripts, styles, and code blocks.
 *
 * @param {import('node-html-parser').HTMLElement} contentRoot Lesson body element.
 * @return {string} Whitespace-collapsed visible text.
 */
export function readVisibleText(contentRoot) {
  contentRoot
    .querySelectorAll('script, style, noscript, pre')
    .forEach((excludedNode) => excludedNode.remove());

  return collapseWhitespace(contentRoot.textContent);
}

/**
 * Hashes text to a short stable fingerprint.
 *
 * @param {string} text Text to fingerprint.
 * @return {string} First 16 hex characters of the SHA-256 digest.
 */
export function fingerprint(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Reduces a built page to the facts that must survive an Astro upgrade.
 *
 * @param {string} pagePath Page path relative to the client output folder.
 * @return {object} Title, description, heading, pager links, block counts, and content fingerprints.
 */
export function describePage(pagePath) {
  const pageRoot = readPage(pagePath);
  const contentRoot = pageRoot.querySelector('.mdx-content-wrapper');
  const codeBlocks = contentRoot?.querySelectorAll('pre') ?? [];
  // Astro 4 ended every code block with an invisible newline and Astro 5 does not, so it is not content.
  const codeText = codeBlocks
    .map((codeBlock) => readCodeBlockContents(codeBlock).textContent.trimEnd())
    .join('\n');
  const visibleText = contentRoot ? readVisibleText(contentRoot) : '';

  return {
    title: pageRoot.querySelector('title')?.textContent ?? null,
    description:
      pageRoot.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
    heading: pageRoot.querySelector('h1')?.textContent.trim() ?? null,
    previousHref:
      pageRoot.querySelector('.topic-pager-link--previous')?.getAttribute('href') ?? null,
    nextHref: pageRoot.querySelector('.topic-pager-link--next')?.getAttribute('href') ?? null,
    codeBlockCount: codeBlocks.length,
    tableCount: contentRoot?.querySelectorAll('table').length ?? 0,
    codeFingerprint: fingerprint(codeText),
    textFingerprint: fingerprint(visibleText),
    textLength: visibleText.length,
  };
}

/**
 * Loads the committed baseline captured from the Astro 4 build.
 *
 * @return {{ pages: Record<string, object>, manifest: object }} Per-page facts and the PWA manifest.
 */
export function loadGolden() {
  return JSON.parse(readFileSync(goldenFilePath, 'utf8'));
}
