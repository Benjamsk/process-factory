import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    passWithNoTests: true,
    // More workers starve vitest's reporter RPC: the run exits 1 with no failing test.
    // Measured on the 120-file suite: 4 workers spend 606s of worker time in 197s and
    // still time out calling onTaskUpdate; 2 spend 267s in 170s and exit 0.
    maxWorkers: 2,
    projects: [
      {
        test: {
          name: "unit",
          include: ["**/*.test.{ts,js}"],
          exclude: ["acceptance/**", "node_modules/**", ".claude/**", "factory/**"],
        },
      },
      {
        test: {
          name: "acceptance",
          include: ["acceptance/**/*.test.{ts,js}"],
          testTimeout: 30_000,
        },
      },
    ],
  },
})
