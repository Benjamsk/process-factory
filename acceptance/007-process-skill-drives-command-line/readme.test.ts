import { describe, expect, it } from "vitest"
import { readText } from "./skill.ts"

/** The collapsed text under `## Status` in README.md, up to the next heading. */
function status(): string {
  const lines = readText("README.md").split(/\r?\n/)
  const start = lines.indexOf("## Status")
  if (start === -1) {
    return ""
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^#{1,6} /.test(line))
  return (end === -1 ? rest : rest.slice(0, end)).join(" ").replace(/\s+/g, " ")
}

describe("the Status section of README.md", () => {
  it("names the forms of /process and says next reports the stage and moves nothing", () => {
    expect(status()).toContain("`/process <prompt>`")
    expect(status()).toContain("`/process show`")
    expect(status()).toContain("`/process show <process-id>`")
    expect(status()).toContain("`/process next <process-id>`")
    expect(status()).toContain("reports the stage and moves nothing")
    expect(status()).not.toContain("Claude answers it in conversation")
  })

  it("keeps what it said about installing the skill, the store and the stages", () => {
    expect(status()).toContain("`/process next <process-id>`")
    expect(status()).toContain("pnpm exec process-factory init")
    expect(status()).toContain('process-factory new "<title>"')
    expect(status()).toContain("command line writes the store")
    expect(status()).toContain("process-factory move <process-id> <stage>")
  })
})
