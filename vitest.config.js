import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Simulate browser environment
    globals: true,        // Allow global describe/it/expect
    setupFiles: './tests/setup/vitest.setup.js',
    include: ['tests/**/*.test.{js,ts}', 'public/js/**/*.test.{js,ts}'],
    coverage: {
      reporter: ['text', 'html'],
      provider: 'v8' // Changed from c8 to v8
    }
  },
});
