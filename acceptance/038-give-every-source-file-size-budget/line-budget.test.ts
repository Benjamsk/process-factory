import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { root } from "../006-process-state-machine/store.ts"

const repositories: string[] = []

afterEach(() => {
  for (const folder of repositories.splice(0)) rmSync(folder, { recursive: true, force: true, maxRetries: 5 })
})

/** The module the spec adds. */
async function budget() {
  return import("../../lint/line-budget.ts")
}

/** A text of `count` lines that ends with a line break. */
function lines(count: number, lineBreak = "\n"): string {
  return `x${lineBreak}`.repeat(count)
}

function writeFiles(folder: string, files: Record<string, string>): void {
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(folder, name)), { recursive: true })
    writeFileSync(path.join(folder, name), text)
  }
}

/** A new git repository in a temporary folder with these files tracked and those others written and not added. */
function repository(tracked: Record<string, string>, untracked: Record<string, string> = {}): string {
  const folder = mkdtempSync(path.join(tmpdir(), "process-factory-budget-"))
  repositories.push(folder)
  execFileSync("git", ["init", "-q"], { cwd: folder, stdio: "ignore" })
  writeFiles(folder, tracked)
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "--", "."], { cwd: folder, stdio: "ignore" })
  writeFiles(folder, untracked)
  return folder
}

describe("lint/line-budget.ts", () => {
  it("exports lineBudget, which is 600", async () => {
    expect((await budget()).lineBudget).toBe(600)
  })
})

describe("filesOverBudget of a git repository", () => {
  it("gives <path>: 601 lines for a tracked .mjs file and for a tracked .ts file in a subfolder, with the path as git prints it", async () => {
    const folder = repository({ "long.mjs": lines(601), "src/deep/long.ts": lines(601), "short.ts": lines(3) })

    expect((await budget()).filesOverBudget(folder)).toEqual(["long.mjs: 601 lines", "src/deep/long.ts: 601 lines"])
  })

  it("counts a last line without a line break as a line", async () => {
    const folder = repository({ "open.ts": `${lines(600)}x` })

    expect((await budget()).filesOverBudget(folder)).toEqual(["open.ts: 601 lines"])
  })

  it("gives nothing when every tracked .ts and .mjs file has at most 600 lines, whatever its line breaks", async () => {
    const folder = repository({
      "closed.ts": lines(600),
      "open.mjs": `${lines(599)}x`,
      "windows.ts": lines(600, "\r\n"),
      "empty.mjs": "",
    })

    expect((await budget()).filesOverBudget(folder)).toEqual([])
  })

  it("leaves out a tracked .md file, an untracked .ts file and a tracked file that is no longer on disk", async () => {
    const folder = repository({ "long.mjs": lines(601), "notes.md": lines(601), "gone.ts": lines(601) }, { "new.ts": lines(601) })
    rmSync(path.join(folder, "gone.ts"))

    expect((await budget()).filesOverBudget(folder)).toEqual(["long.mjs: 601 lines"])
  })
})

describe("the budget of this repository", () => {
  it("is met: filesOverBudget gives no file", async () => {
    expect((await budget()).filesOverBudget(root)).toEqual([])
  })

  it("is checked by the unit test lint/line-budget.test.ts, which pnpm test runs", () => {
    const file = path.join(root, "lint/line-budget.test.ts")

    expect(existsSync(file)).toBe(true)
    expect(readFileSync(file, "utf8")).toContain("filesOverBudget(")
    expect(readFileSync(path.join(root, "package.json"), "utf8")).toContain("vitest --project unit")
    expect(readFileSync(path.join(root, "vitest.config.ts"), "utf8")).toContain('include: ["**/*.test.{ts,js}"]')
  })
})
