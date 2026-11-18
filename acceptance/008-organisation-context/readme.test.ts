import { describe, expect, it } from "vitest"
import { organisationFiles, readFile, root } from "./organisation.ts"

/** The collapsed text under `## Status` in README.md, up to the next heading. */
function status(): string {
  const lines = readFile(root, "README.md").split(/\r?\n/)
  const start = lines.indexOf("## Status")
  if (start === -1) {
    return ""
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^#{1,6} /.test(line))
  return (end === -1 ? rest : rest.slice(0, end)).join(" ").replace(/\s+/g, " ")
}

describe("the Status section of README.md", () => {
  it("describes org init, the folder organisation/ and its five files", () => {
    expect(status()).toContain("`process-factory org init`")
    expect(status()).toContain("`/process org init`")
    expect(status()).toContain("`organisation/`")
    for (const file of organisationFiles) {
      expect(status()).toContain(`\`${file}\``)
    }
    expect(status()).toContain("never overwrites one")
  })

  it("adds the organisation context after what it said about the skill, the store and the stages", () => {
    const text = status()
    expect(text).toContain("process-factory org init")
    expect(text.indexOf("process-factory org init")).toBeGreaterThan(text.indexOf("process-factory show <process-id>"))
    expect(text).toContain("`/process next <process-id>`")
    expect(text).toContain("pnpm exec process-factory init")
    expect(text).toContain('process-factory new "<title>"')
    expect(text).toContain("command line writes the store")
    expect(text).toContain("process-factory move <process-id> <stage>")
  })
})
