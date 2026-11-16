import { spawnSync } from "node:child_process"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = path.resolve(import.meta.dirname, "../..")
const greeting = "Hello. world!"

function run(args: string[]) {
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" })
}

function runModule(source: string) {
  return run(["--input-type=module", "-e", source])
}

describe("hello()", () => {
  it("returns exactly the string Hello. world!", async () => {
    const mod = await import("../../src/hello.ts")
    expect(typeof mod.hello).toBe("function")
    expect(mod.hello()).toBe(greeting)
  })
})

describe("node src/hello.ts", () => {
  it("writes Hello. world! and one line feed to standard output and nothing else", () => {
    const result = run(["src/hello.ts"])
    expect(result.stdout).toBe(greeting + "\n")
  })

  it("ends with exit code 0 and writes nothing to standard error", () => {
    const result = run(["src/hello.ts"])
    expect(result.status).toBe(0)
    expect(result.stderr).toBe("")
  })

  it("gives the same output and exit code with extra command line arguments", () => {
    const result = run(["src/hello.ts", "anything", "--name", "Ada"])
    expect(result.stdout).toBe(greeting + "\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })
})

describe("loading src/hello.ts as a module", () => {
  it("prints nothing when it is not the entry point", () => {
    const result = runModule('import "./src/hello.ts"')
    expect(result.status).toBe(0)
    expect(result.stdout).toBe("")
    expect(result.stderr).toBe("")
  })

  it("exports hello to an importing process without printing the greeting itself", () => {
    const result = runModule('import { hello } from "./src/hello.ts"; process.stdout.write(JSON.stringify(hello()))')
    expect(result.status).toBe(0)
    expect(result.stdout).toBe(JSON.stringify(greeting))
    expect(result.stderr).toBe("")
  })
})
