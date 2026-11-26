import { spawnSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { root } from "../006-process-state-machine/store.ts"

const dashboard = "the dashboard of process-factory dashboard"
/**
 * The test files of the command line of the spec's section 3.6: the top-level `describe` titles each holds, the nested
 * ones that moved out of their parent with it, and the number of tests those blocks hold on `main` before the split.
 */
const testFiles: { file: string; blocks: string[]; nested: string[]; tests: number }[] = [
  { file: "process-factory.test.ts", blocks: ["process-factory with anything other than a command"], nested: [], tests: 45 },
  { file: "skill.test.ts", blocks: ["process-factory init"], nested: [], tests: 4 },
  { file: "store.test.ts", blocks: ["process-factory new", "process-factory show", "process-factory show and the open feedback of a process"], nested: [], tests: 23 },
  { file: "state-machine.test.ts", blocks: ["process-factory move", "process-factory answer", "process-factory accept-spec"], nested: [], tests: 38 },
  {
    file: "state-machine.publish.test.ts",
    blocks: ["process-factory owner and process-factory approve", "the version that process-factory move to published writes"],
    nested: [],
    tests: 22,
  },
  { file: "state-machine.regeneration.test.ts", blocks: ["the regeneration of a published process"], nested: [], tests: 28 },
  { file: "review.round.test.ts", blocks: ["process-factory round"], nested: [], tests: 31 },
  { file: "review.respec.test.ts", blocks: ["process-factory respec", "process-factory send-back"], nested: [], tests: 27 },
  { file: "review.edit.test.ts", blocks: ["process-factory edit"], nested: [], tests: 19 },
  {
    file: "organisation.test.ts",
    blocks: ["process-factory org init", "the organisations of a project", "the migration of the layout of one organisation"],
    nested: [],
    tests: 34,
  },
  { file: "dependencies.test.ts", blocks: ["process-factory move to published and process-factory check"], nested: [], tests: 8 },
  { file: "reading-view.test.ts", blocks: ["the reading view of process-factory serve"], nested: ["the feedback a reader sends from the page of a version"], tests: 45 },
  { file: "dashboard.test.ts", blocks: [dashboard], nested: ["the decisions a person takes on the dashboard"], tests: 28 },
  { file: "dashboard.edit.test.ts", blocks: [dashboard], nested: ["the pages on which a person edits a file of a process"], tests: 9 },
  { file: "panel.test.ts", blocks: [dashboard], nested: ["the panel of a process at the address of that process"], tests: 28 },
  { file: "export.test.ts", blocks: ["process-factory export"], nested: [], tests: 21 },
]
const helperFiles = ["command-line.ts", "dashboard-pages.ts"]

function sourceNames(): string[] {
  return readdirSync(path.join(root, "src")).sort()
}

function text(file: string): string {
  return readFileSync(path.join(root, "src", file), "utf8")
}

/** The titles of the `describe` blocks of a file of `src/` that start after this many spaces. */
function describeTitles(file: string, indent: number): string[] {
  return [...text(file).matchAll(new RegExp(String.raw`^ {${String(indent)}}describe\("(.+?)", \(\) => \{\r?$`, "gm"))].map((match) => match[1] ?? "")
}

describe("the folder src", () => {
  it("holds the sixteen test files of the command line, hello.test.ts and the two helper files", () => {
    expect(sourceNames()).toEqual(expect.arrayContaining([...testFiles.map((entry) => entry.file), "hello.test.ts", ...helperFiles]))
  })

  it("has no file with more than 600 lines", () => {
    const tooLong = sourceNames()
      .map((name) => ({ name, count: text(name).replace(/\r?\n$/, "").split(/\r?\n/).length }))
      .filter(({ count }) => count > 600)
      .map(({ name, count }) => `${name}: ${String(count)} lines`)

    expect(tooLong).toEqual([])
  })

  it("keeps only the tests of the dispatch in process-factory.test.ts", () => {
    expect(describeTitles("process-factory.test.ts", 0)).toEqual(["process-factory with anything other than a command"])
  })
})

describe("the test files of the command line", () => {
  it.each(testFiles.filter((entry) => entry.file !== "process-factory.test.ts"))(
    "$file holds its describe blocks, in the order they have today",
    ({ file, blocks, nested }) => {
      expect(describeTitles(file, 0)).toEqual(blocks)
      expect(describeTitles(file, 2)).toEqual(expect.arrayContaining(nested))
    },
  )

  it("hold the 410 tests of today, each file the tests of its blocks", () => {
    const listed = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "list", "--project", "unit", "src/"], { cwd: root, encoding: "utf8" })
    const names = listed.stdout.split(/\r?\n/).filter((line) => line.startsWith("[unit] src/"))
    const short = testFiles
      .map(({ file, blocks, tests }) => {
        const found = names.filter((name) => blocks.some((block) => name.startsWith(`[unit] src/${file} > ${block} > `))).length
        return { file, found, tests }
      })
      .filter(({ found, tests }) => found < tests)
      .map(({ file, found, tests }) => `${file}: ${String(found)} of ${String(tests)} tests`)

    expect(testFiles.reduce((sum, entry) => sum + entry.tests, 0)).toBe(410)
    expect(short).toEqual([])
  }, 180_000)
})
