import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: resolve(__dirname, 'tests'),
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.js'],
    setupFiles: ['./setup-test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: resolve(__dirname, 'coverage'),
      include: [resolve(__dirname, 'src/**/*.js')],
      exclude: [resolve(__dirname, 'src/app.js')],
    },
    testTimeout: 60000,
    hookTimeout: 60000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
