import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./setupTests.js",
    globals: true,
    testTimeout: 10000, // Set a timeout for tests
  },
});
