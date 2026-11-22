import { describe, expect, it } from "vitest"
import config from "../../vitest.config.ts"

describe("the worker cap in vitest.config.ts", () => {
  it("caps the worker pool at 4 at the root of the config", () => {
    expect(config.test?.maxWorkers).toBe(4)
  })

  it("sets the cap at the root only and leaves the unit and acceptance projects as they were", () => {
    expect(config.test?.maxWorkers).toBe(4)
    const projects = JSON.stringify(config.test?.projects)
    expect(projects).not.toContain("maxWorkers")
    expect(projects).not.toContain("minWorkers")
    expect(projects).not.toContain("poolOptions")
    expect(config.test?.projects).toStrictEqual([
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
          testTimeout: 30000,
        },
      },
    ])
  })
})
