// Vitest configuration
// Tests pure ES-module functions under Node – no browser environment needed.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include:     ['tests/unit/**/*.test.js'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include:  ['js/board.js', 'js/common.js', 'js/store.js', 'js/controller.js'],
      reporter: ['text', 'html'],
      thresholds: {
        statements: 96,
        branches: 96,
        functions: 96,
        lines: 96,
      },
    },
  },
});
