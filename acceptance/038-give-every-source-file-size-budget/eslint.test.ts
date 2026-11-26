import { ESLint } from "eslint"
import { describe, expect, it, vi } from "vitest"
import { lintFixture, oneDeclarationRule, reportsOf, root, ruleSetting } from "../002-move-project-to-typescript-with-very/lintFixture.ts"

vi.setConfig({ testTimeout: 120_000 })

const fixtureFolder = "acceptance/002-move-project-to-typescript-with-very/fixtures"
const budgetSetting = [2, { max: 600 }]

/** A text of `count` lines that every rule but `max-lines` accepts as a module. */
function moduleText(count: number): string {
  return `${["export const value = 1", ...Array.from({ length: count - 1 }, () => "// filler")].join("\n")}\n`
}

/** The `max-lines` reports for a text of `count` lines in the fixture, as their severities. */
async function budgetReports(fixture: string, count: number): Promise<number[]> {
  const messages = await lintFixture(fixture, moduleText(count))
  return messages.filter((message) => message.ruleId === "max-lines").map((message) => message.severity)
}

/** The reports of `local/one-declaration-per-file` for `text` in the fixture; fails when the rule is not switched on for that file. */
async function declarationReports(fixture: string, text: string) {
  expect(await ruleSetting(`${fixtureFolder}/${fixture}`, oneDeclarationRule)).toEqual([2])
  return reportsOf(fixture, text, oneDeclarationRule)
}

describe("max-lines in the ESLint configuration of the repository", () => {
  it.each(["src/anything.ts", "acceptance/any-job/anything.test.ts", "bin/anything.mjs", "eslint.config.mjs"])(
    "is an error with max 600 for %s",
    async (file) => {
      expect(await ruleSetting(file, "max-lines")).toEqual(budgetSetting)
    },
  )

  it.each(["sample.ts", "long.mjs"])("reports a text of 601 lines once and accepts a text of 600 lines in %s", async (fixture) => {
    expect(await budgetReports(fixture, 601)).toEqual([2])
    expect(await budgetReports(fixture, 600)).toEqual([])
  })
})

describe("local/one-declaration-per-file on .mjs files", () => {
  it("is an error for bin/anything.mjs and stays an error for src/anything.ts", async () => {
    expect(await ruleSetting("bin/anything.mjs", oneDeclarationRule)).toEqual([2])
    expect(await ruleSetting("src/anything.ts", oneDeclarationRule)).toEqual([2])
  })

  it("names the file a misnamed class needs with the extension of the linted file: .mjs and, as before, .ts", async () => {
    expect(await declarationReports("tools.mjs", "class Greeter {}\n")).toEqual([
      { messageId: "nameMismatch", message: 'The file "tools.mjs" declares the class "Greeter" and must be named "Greeter.mjs".', line: 1, severity: 2 },
    ])
    expect(await declarationReports("Welcome.ts", "export class Greeter {}\n")).toEqual([
      { messageId: "nameMismatch", message: 'The file "Welcome.ts" declares the class "Greeter" and must be named "Greeter.ts".', line: 1, severity: 2 },
    ])
  })

  it("names the file a second class moves to with the extension of the linted file: .mjs and, as before, .ts", async () => {
    expect(await declarationReports("Greeter.mjs", "class Greeter {}\nclass Other {}\n")).toEqual([
      { messageId: "tooMany", message: 'A file declares at most one class, interface, type alias or enum. Move "Other" to its own file "Other.mjs".', line: 2, severity: 2 },
    ])
    expect(await declarationReports("Greeter.ts", "export class Greeter {}\nclass Other {}\n")).toEqual([
      { messageId: "tooMany", message: 'A file declares at most one class, interface, type alias or enum. Move "Other" to its own file "Other.ts".', line: 2, severity: 2 },
    ])
  })

  it("does not report a .mjs file with only functions and constants", async () => {
    const text = 'const punctuation = "!"\nexport function shout(text) {\n  return text + punctuation\n}\n'

    expect(await declarationReports("tools.mjs", text)).toEqual([])
  })
})

describe("the files of bin and eslint.config.mjs", () => {
  it("are linted with both rules and have no max-lines and no local/one-declaration-per-file problem", async () => {
    expect(await ruleSetting("bin/state-machine.mjs", "max-lines")).toEqual(budgetSetting)
    expect(await ruleSetting("bin/state-machine.mjs", oneDeclarationRule)).toEqual([2])

    const results = await new ESLint({ cwd: root }).lintFiles(["bin/*.mjs", "eslint.config.mjs"])
    const problems = results.flatMap((result) =>
      result.messages
        .filter((message) => message.ruleId === "max-lines" || message.ruleId === oneDeclarationRule)
        .map((message) => `${result.filePath.replaceAll("\\", "/").replace(`${root.replaceAll("\\", "/")}/`, "")}: ${message.ruleId ?? ""}`),
    )

    expect(problems).toEqual([])
  })
})
