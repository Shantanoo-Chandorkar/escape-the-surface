import { defineConfig } from 'vitest/config';

// Separate from vitest.config.js: these tests read the built dist/ folder and must never run in `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/build/**/*.test.js'],
  },
});
