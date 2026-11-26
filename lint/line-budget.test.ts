import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { filesOverBudget, lineBudget } from "./line-budget.ts"

const repositoryRoot = path.resolve(import.meta.dirname, "..")

/** The folders of the git repositories a test made, which are removed when it ends. */
const repositories: string[] = []

afterEach(() => {
  for (const folder of repositories.splice(0)) rmSync(folder, { recursive: true, force: true, maxRetries: 5 })
})

/** A text of `count` lines that ends with a line break. */
function lines(count: number): string {
  return "x\n".repeat(count)
}

/** A new git repository in a temporary folder with these files tracked and those others written and not added. */
function repository(tracked: Record<string, string>, untracked: Record<string, string>): string {
  const folder = mkdtempSync(path.join(tmpdir(), "process-factory-budget-"))
  repositories.push(folder)
  execFileSync("git", ["init", "-q"], { cwd: folder, stdio: "ignore" })
  for (const [name, text] of Object.entries(tracked)) writeFileSync(path.join(folder, name), text)
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "--", "."], { cwd: folder, stdio: "ignore" })
  for (const [name, text] of Object.entries(untracked)) writeFileSync(path.join(folder, name), text)
  return folder
}

describe("lint/line-budget.ts", () => {
  it("has a budget of 600 lines", () => {
    expect(lineBudget).toBe(600)
  })

  it("reports a tracked .mjs file of 601 lines and no file that is within the budget, of another kind or untracked", () => {
    const folder = repository(
      { "long.mjs": lines(601), "short.mjs": lines(600), "notes.md": lines(601) },
      { "new.ts": lines(601) },
    )

    expect(filesOverBudget(folder)).toEqual(["long.mjs: 601 lines"])
  })
})

describe("the budget of this repository", () => {
  it("is met: no tracked .ts or .mjs file has more than 600 lines", () => {
    expect(filesOverBudget(repositoryRoot)).toEqual([])
  })
})
