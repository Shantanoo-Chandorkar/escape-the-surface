import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clientDirectory, loadGolden, readPage } from './helpers.js';

const serviceWorkerText = readFileSync(join(clientDirectory, 'sw.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(clientDirectory, 'manifest.webmanifest'), 'utf8'));

/**
 * Checks that a URL used by the PWA points at a built file.
 *
 * @param {string} assetUrl Root-relative or relative URL from the manifest or service worker.
 * @return {boolean} True when the file exists in the client output.
 */
function builtFileExists(assetUrl) {
  const relativeUrl = assetUrl.replace(/^\//, '');
  const filePath =
    relativeUrl === '' || relativeUrl.endsWith('/') ? `${relativeUrl}index.html` : relativeUrl;

  return existsSync(join(clientDirectory, filePath));
}

describe('PWA output', () => {
  it('keeps the manifest identical to the baseline', () => {
    expect(manifest).toEqual(loadGolden().manifest);
  });

  it('ships every manifest and shortcut icon', () => {
    const iconUrls = [
      ...manifest.icons,
      ...manifest.shortcuts.flatMap((shortcut) => shortcut.icons),
    ].map((icon) => icon.src);

    expect(iconUrls.filter((iconUrl) => !builtFileExists(iconUrl))).toEqual([]);
  });

  it('links the manifest from the home page', () => {
    const manifestHref = readPage('index.html')
      .querySelector('link[rel="manifest"]')
      ?.getAttribute('href');

    expect(manifestHref).toBe('/manifest.webmanifest');
  });

  it('precaches only files that exist', () => {
    const precacheUrls = [...serviceWorkerText.matchAll(/url:"([^"]+)"/g)].map(
      (urlMatch) => urlMatch[1],
    );

    expect(precacheUrls.length).toBeGreaterThan(5);
    expect(precacheUrls.filter((precacheUrl) => !builtFileExists(precacheUrl))).toEqual([]);
  });

  it('waits for the update prompt before taking over', () => {
    expect(serviceWorkerText).toContain('SKIP_WAITING');
  });

  it('serves sw.js uncached so updates are noticed', () => {
    const headersText = readFileSync(join(clientDirectory, '_headers'), 'utf8');

    expect(headersText).toMatch(/\/sw\.js\s+Cache-Control:\s*no-cache/);
  });
});
