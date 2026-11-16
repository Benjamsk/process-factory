import { spawnSync } from "node:child_process"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = path.resolve(__dirname, "../..")
const greeting = "Hello. world!"

function run(args: string[]) {
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" })
}

describe("hello()", () => {
  it("returns exactly the string Hello. world!", async () => {
    const mod = await import("../../src/hello.js")
    expect(typeof mod.hello).toBe("function")
    expect(mod.hello()).toBe(greeting)
  })
})

describe("node src/hello.js", () => {
  it("writes Hello. world! and one line feed to standard output and nothing else", () => {
    const result = run(["src/hello.js"])
    expect(result.stdout).toBe(greeting + "\n")
  })

  it("ends with exit code 0 and writes nothing to standard error", () => {
    const result = run(["src/hello.js"])
    expect(result.status).toBe(0)
    expect(result.stderr).toBe("")
  })

  it("gives the same output and exit code with extra command line arguments", () => {
    const result = run(["src/hello.js", "anything", "--name", "Ada"])
    expect(result.stdout).toBe(greeting + "\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })
})

describe("loading src/hello.js as a module", () => {
  it("prints nothing when it is not the entry point", () => {
    const result = run(["-e", "require('./src/hello.js')"])
    expect(result.status).toBe(0)
    expect(result.stdout).toBe("")
    expect(result.stderr).toBe("")
  })

  it("exports hello to a requiring process without printing the greeting itself", () => {
    const result = run(["-e", "process.stdout.write(JSON.stringify(require('./src/hello.js').hello()))"])
    expect(result.status).toBe(0)
    expect(result.stdout).toBe(JSON.stringify(greeting))
    expect(result.stderr).toBe("")
  })
})
