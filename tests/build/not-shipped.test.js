import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { distDirectory, listFiles, projectRoot } from './helpers.js';

const TEST_ONLY_PATH_PATTERN = /(^|\/)tests?\/|\.test\.|golden|baseline-v4|vitest/;

describe('tests stay out of production', () => {
  it('puts no test or baseline files in dist', () => {
    expect(
      listFiles(distDirectory).filter((filePath) => TEST_ONLY_PATH_PATTERN.test(filePath)),
    ).toEqual([]);
  });

  it('keeps the production build script free of test commands', () => {
    const { scripts } = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

    expect(scripts.build).toBe('astro build');
  });

  it('keeps the Netlify build command on the plain build script', () => {
    const netlifyConfig = readFileSync(join(projectRoot, 'netlify.toml'), 'utf8');

    expect(netlifyConfig).toMatch(/command\s*=\s*"npm run build"/);
  });
});
