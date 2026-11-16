import { describe, expect, it, vi } from "vitest"
import { lintFixture, reportsOf, ruleSetting } from "./lintFixture.ts"

vi.setConfig({ testTimeout: 120_000 })

const typescriptFiles = ["src/anything.ts", "lint/anything.ts", "acceptance/any-job/anything.test.ts"]

const rulesWithoutOptions = [
  "@typescript-eslint/no-explicit-any",
  "@typescript-eslint/no-unsafe-argument",
  "@typescript-eslint/no-unsafe-assignment",
  "@typescript-eslint/no-unsafe-call",
  "@typescript-eslint/no-unsafe-member-access",
  "@typescript-eslint/no-unsafe-return",
  "@typescript-eslint/no-non-null-assertion",
  "@typescript-eslint/no-require-imports",
  "local/one-declaration-per-file",
]

async function errorRules(text: string): Promise<string[]> {
  const messages = await lintFixture("sample.ts", text)
  return messages.filter((message) => message.severity === 2).map((message) => message.ruleId ?? "")
}

describe.each(typescriptFiles)("ESLint configuration for %s", (file) => {
  it("has every clean-type rule without options at severity error", async () => {
    const settings: [string, unknown][] = []
    for (const rule of rulesWithoutOptions) {
      settings.push([rule, await ruleSetting(file, rule)])
    }
    expect(settings).toEqual(rulesWithoutOptions.map((rule) => [rule, [2]]))
  })

  it("forbids every type assertion with consistent-type-assertions", async () => {
    expect(await ruleSetting(file, "@typescript-eslint/consistent-type-assertions")).toEqual([
      2,
      { assertionStyle: "never" },
    ])
  })

  it("forbids ts-expect-error, ts-ignore and ts-nocheck comments, also with a description", async () => {
    expect(await ruleSetting(file, "@typescript-eslint/ban-ts-comment")).toEqual([
      2,
      { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true, "ts-check": false },
    ])
  })
})

describe("linting TypeScript text with the repository's configuration", () => {
  it("reports a written any and every use of an inferred any as errors", async () => {
    const rules = await errorRules(
      [
        "const written: any = 1",
        'const parsed = JSON.parse("{}")',
        "export const name: string = parsed.name",
        "export const copy: number = written",
        "export function run(): string {",
        "  return parsed",
        "}",
        "export const called: unknown = parsed.run()",
        "export const size = parseInt(parsed)",
        "",
      ].join("\n"),
    )
    expect(rules).toEqual(
      expect.arrayContaining([
        "@typescript-eslint/no-explicit-any",
        "@typescript-eslint/no-unsafe-assignment",
        "@typescript-eslint/no-unsafe-member-access",
        "@typescript-eslint/no-unsafe-return",
        "@typescript-eslint/no-unsafe-call",
        "@typescript-eslint/no-unsafe-argument",
      ]),
    )
  })

  it("reports an as assertion and an angle-bracket assertion, and does not report as const", async () => {
    const reports = await reportsOf(
      "sample.ts",
      [
        'const value: unknown = "x"',
        "export const text = value as string",
        'export const tuple = ["a", "b"] as const',
        "export const old = <string>value",
        "",
      ].join("\n"),
      "@typescript-eslint/consistent-type-assertions",
    )
    expect(reports.map((report) => [report.line, report.severity])).toEqual([
      [2, 2],
      [4, 2],
    ])
  })

  it("reports a non-null assertion and a require call as errors", async () => {
    const rules = await errorRules(
      [
        'const fs = require("node:fs")',
        "const list: string[] = []",
        "export const first = list[0]!",
        "export const second = fs",
        "",
      ].join("\n"),
    )
    expect(rules).toEqual(
      expect.arrayContaining(["@typescript-eslint/no-non-null-assertion", "@typescript-eslint/no-require-imports"]),
    )
  })

  it("reports @ts-nocheck, @ts-ignore and a described @ts-expect-error comment as errors", async () => {
    const reports = await reportsOf(
      "sample.ts",
      [
        "// @ts-nocheck",
        "// @ts-ignore",
        'export const a: number = "a"',
        "// @ts-expect-error: described, and still not allowed",
        'export const b: number = "b"',
        "",
      ].join("\n"),
      "@typescript-eslint/ban-ts-comment",
    )
    expect(reports.map((report) => [report.line, report.severity])).toEqual([
      [1, 2],
      [2, 2],
      [4, 2],
    ])
  })
})
