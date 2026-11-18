import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    passWithNoTests: true,
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
