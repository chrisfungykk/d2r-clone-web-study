/// <reference types="vitest/config" />
import { defineConfig } from "vite";

// Single build target matches the sim's ES2022 numeric semantics.
// The Vitest `test` block runs the deterministic sim suites in a Node
// environment (no DOM) so purity assumptions hold in test too.
export default defineConfig({
  build: {
    target: "es2022",
    sourcemap: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Golden replays and hash tests must never be silently skipped.
    passWithNoTests: false,
  },
});
