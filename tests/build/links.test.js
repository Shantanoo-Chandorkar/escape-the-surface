import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clientDirectory, listHtmlPages, projectRoot, readPage } from './helpers.js';

// Handled by the Netlify function, so there is no built file to find.
const SERVER_ROUTES = ['/api/feedback'];

/**
 * Reads the paths Netlify redirects, which have no built file but are valid link targets.
 *
 * @return {string[]} Redirect source paths from netlify.toml.
 */
function readRedirectSources() {
  const netlifyConfig = readFileSync(join(projectRoot, 'netlify.toml'), 'utf8');

  return [...netlifyConfig.matchAll(/from\s*=\s*"([^"]+)"/g)].map(
    (redirectMatch) => redirectMatch[1],
  );
}

/**
 * Checks whether a root-relative link path points at something that was built.
 *
 * @param {string} linkPath Link path without query string or hash, such as "/topic/closures".
 * @return {boolean} True when a file or page exists for the path.
 */
function builtTargetExists(linkPath) {
  if (extname(linkPath)) return existsSync(join(clientDirectory, linkPath));

  const pathWithoutTrailingSlash = linkPath.replace(/\/+$/, '');

  return (
    existsSync(join(clientDirectory, pathWithoutTrailingSlash, 'index.html')) ||
    existsSync(join(clientDirectory, `${pathWithoutTrailingSlash}.html`))
  );
}

/**
 * Follows every internal link on every built page.
 *
 * @return {{ checkedLinkCount: number, brokenLinks: string[] }} Links checked, and "page -> href" for each dead one.
 */
function checkInternalLinks() {
  const knownTargets = new Set([...SERVER_ROUTES, ...readRedirectSources()]);
  const brokenLinks = [];
  let checkedLinkCount = 0;

  for (const pagePath of listHtmlPages()) {
    for (const anchor of readPage(pagePath).querySelectorAll('a[href]')) {
      const href = anchor.getAttribute('href');
      if (!href.startsWith('/') || href.startsWith('//')) continue;

      checkedLinkCount += 1;
      const linkPath = decodeURIComponent(href.split(/[?#]/)[0]);
      if (!knownTargets.has(linkPath) && !builtTargetExists(linkPath)) {
        brokenLinks.push(`${pagePath} -> ${href}`);
      }
    }
  }

  return { checkedLinkCount, brokenLinks };
}

describe('internal links', () => {
  const { checkedLinkCount, brokenLinks } = checkInternalLinks();

  it('checks a realistic number of links', () => {
    expect(checkedLinkCount).toBeGreaterThan(500);
  });

  it('has no link that leads to a missing page', () => {
    expect(brokenLinks).toEqual([]);
  });

  it('points the home page start button at a built lesson', () => {
    const startButtonHref = readPage('index.html')
      .querySelector('.editorial-cta-button')
      ?.getAttribute('href');

    expect(startButtonHref).toMatch(/^\/topic\/[a-z0-9-]+$/);
    expect(builtTargetExists(startButtonHref)).toBe(true);
  });
});
