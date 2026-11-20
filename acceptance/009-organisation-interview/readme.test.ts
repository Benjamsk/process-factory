import { describe, expect, it } from "vitest"
import { readmeStatus } from "./interview.ts"

describe("the Status section of README.md", () => {
  it("says init writes the skill, and interviewer.md, questioner.md, spec-writer.md and case-writer.md next to it", () => {
    expect(readmeStatus()).toContain(
      "That writes `.claude/skills/process/SKILL.md`, and `interviewer.md`, `questioner.md`, `spec-writer.md` and `case-writer.md` next to it",
    )
    expect(readmeStatus()).toContain("pnpm exec process-factory init")
  })

  it("describes the interview of /process org and organisation/unknown.md after org init", () => {
    const text = readmeStatus()
    expect(text).toContain("`/process org` in Claude Code interviews the user one area at a time")
    expect(text).toContain("`organisation/unknown.md`")
    expect(text).toContain("which processes on the board it blocks")
    expect(text).toContain("never overwrites one")
    expect(text.indexOf("`/process org` in Claude Code interviews")).toBeGreaterThan(text.indexOf("never overwrites one"))
  })
})
