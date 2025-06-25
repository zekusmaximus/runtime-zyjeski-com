import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Simulate browser environment
    globals: true,        // Allow global describe/it/expect
    setupFiles: './tests/vitest.setup.js', // Optional: setup globals
    include: ['tests/**/*.test.{js,ts}'],
  },
});
