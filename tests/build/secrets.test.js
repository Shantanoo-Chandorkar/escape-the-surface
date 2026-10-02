import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clientDirectory, listFiles, projectRoot } from './helpers.js';

const SECRET_ENV_NAMES = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'FEEDBACK_TO_EMAIL'];
const RESEND_KEY_PATTERN = /\bre_[A-Za-z0-9_]{20,}/;
const TEXT_FILE_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.webmanifest',
  '.txt',
  '.map',
  '.svg',
  '.xml',
]);
const MIN_SECRET_LENGTH = 6;

/**
 * Collects configured secret values from the environment and local .env files.
 *
 * @return {string[]} Secret values worth searching for; never logged.
 */
function readConfiguredSecretValues() {
  const secretValues = SECRET_ENV_NAMES.map((envName) => process.env[envName]);

  for (const envFileName of ['.env', '.env.local', '.env.production']) {
    const envFilePath = join(projectRoot, envFileName);
    if (!existsSync(envFilePath)) continue;

    for (const envLine of readFileSync(envFilePath, 'utf8').split(/\r?\n/)) {
      const [envName, ...valueParts] = envLine.split('=');
      if (SECRET_ENV_NAMES.includes(envName.trim())) {
        secretValues.push(
          valueParts
            .join('=')
            .trim()
            .replace(/^["']|["']$/g, ''),
        );
      }
    }
  }

  return secretValues.filter(
    (secretValue) => secretValue && secretValue.length >= MIN_SECRET_LENGTH,
  );
}

/**
 * Finds shipped client files whose text matches a check.
 *
 * @param {(fileText: string) => boolean} matchesCheck Returns true when the file text is a leak.
 * @return {string[]} Paths of leaking files only, so failures never print the secret itself.
 */
function findLeakingFiles(matchesCheck) {
  return clientFilePaths.filter((filePath) =>
    matchesCheck(readFileSync(join(clientDirectory, filePath), 'utf8')),
  );
}

const clientFilePaths = listFiles(clientDirectory).filter((filePath) =>
  TEXT_FILE_EXTENSIONS.has(extname(filePath)),
);
const configuredSecretValues = readConfiguredSecretValues();

describe('secrets stay out of shipped client files', () => {
  it('scans a realistic number of files', () => {
    expect(clientFilePaths.length).toBeGreaterThan(50);
  });

  it('ships no secret variable names', () => {
    const leakingFiles = findLeakingFiles((fileText) =>
      SECRET_ENV_NAMES.some((envName) => fileText.includes(envName)),
    );

    expect(leakingFiles).toEqual([]);
  });

  it('ships no key-shaped strings', () => {
    expect(findLeakingFiles((fileText) => RESEND_KEY_PATTERN.test(fileText))).toEqual([]);
  });

  it.skipIf(configuredSecretValues.length === 0)(
    'ships none of the configured secret values',
    () => {
      const leakingFiles = findLeakingFiles((fileText) =>
        configuredSecretValues.some((secretValue) => fileText.includes(secretValue)),
      );

      expect(leakingFiles).toEqual([]);
    },
  );
});
