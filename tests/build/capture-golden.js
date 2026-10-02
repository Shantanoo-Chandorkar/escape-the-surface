import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  clientDirectory,
  describePage,
  goldenFilePath,
  listHtmlPages,
  projectRoot,
} from './helpers.js';

// Overwriting the baseline would hide real regressions, so it needs an explicit flag.
if (existsSync(goldenFilePath) && !process.argv.includes('--update')) {
  console.error('Baseline already exists. Re-run with --update only if the change is approved.');
  process.exit(1);
}

const installedAstro = JSON.parse(
  readFileSync(join(projectRoot, 'node_modules', 'astro', 'package.json'), 'utf8'),
);
const pagesByPath = Object.fromEntries(
  listHtmlPages().map((pagePath) => [pagePath, describePage(pagePath)]),
);
const manifest = JSON.parse(readFileSync(join(clientDirectory, 'manifest.webmanifest'), 'utf8'));

mkdirSync(dirname(goldenFilePath), { recursive: true });
writeFileSync(
  goldenFilePath,
  `${JSON.stringify({ capturedWithAstro: installedAstro.version, pages: pagesByPath, manifest }, null, 2)}\n`,
);

console.log(
  `Captured ${Object.keys(pagesByPath).length} pages from Astro ${installedAstro.version}.`,
);
