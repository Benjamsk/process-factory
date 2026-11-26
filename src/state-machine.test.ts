import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  boardPath,
  projectDirectory,
  readWorkingFile,
  runCommand,
  storedHistory,
  storedProcesses,
  timeForm,
  workingDirectory,
  writeBoardFile,
  writeProjectFile,
  writeWorkingFile,
} from "./command-line.ts"

describe("process-factory move", () => {
  it("prints the new stage, stores it and appends a dated history entry", () => {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "intake", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "intake" }] },
    ])

    const result = runCommand(["move", "001-handle-a-breach", "spec"])

    expect(result.stdout).toBe("spec\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        {
          id: "001-handle-a-breach",
          title: "Handle a breach",
          stage: "spec",
          history: [
            { at: "2026-11-18T17:02:11.123Z", stage: "intake" },
            { at: expect.stringMatching(timeForm), stage: "spec" },
          ],
        },
      ],
    })
  })

  it("keeps the other entries and the keys it does not know", () => {
    const older = { id: "001-older-process", title: "Older process", stage: "review", owner: "Kari" }
    writeBoardFile([older, { id: "002-handle-a-breach", title: "Handle a breach", stage: "cases", owner: "Ola" }])

    expect(runCommand(["move", "002-handle-a-breach", "draft"]).status).toBe(0)

    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        older,
        {
          id: "002-handle-a-breach",
          title: "Handle a breach",
          stage: "draft",
          owner: "Ola",
          history: [{ at: expect.stringMatching(timeForm), stage: "draft" }],
        },
      ],
    })
  })

  it.each([
    ["published", "intake", "(allowed from intake: clarify, spec)"],
    ["intake", "intake", "(allowed from intake: clarify, spec)"],
    ["done", "review", "(allowed from review: rework, approval)"],
    ["intake", "archived", "(allowed from archived: none)"],
  ])("refuses the move to %s from %s and leaves the board as it was", (to, from, allowed) => {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: from }])
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", "001-handle-a-breach", to])

    expect(result.stderr).toBe(`process-factory: cannot move 001-handle-a-breach from ${from} to ${to} ${allowed}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("says there is no process and writes nothing when there is no board", () => {
    const result = runCommand(["move", "../../outside", "clarify"])
    expect(result.stderr).toBe("process-factory: there is no process ../../outside\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(workingDirectory)).toEqual([])
  })

  it.each([["{ not json\n"], ['{ "processes": "none" }\n']])(
    "names the board it cannot read and writes nothing for %j",
    (content) => {
      writeWorkingFile(boardPath, content)
      const result = runCommand(["move", "001-handle-a-breach", "clarify"])
      expect(result.status).toBe(1)
      expect(result.stdout).toBe("")
      expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
      expect(readWorkingFile(boardPath)).toBe(content)
    },
  )
})

describe("process-factory answer", () => {
  const processFolder = "processes/001-handle-a-breach"
  const answers = "# Answers 1\n\n## 1. Who reports a lost laptop?\n\nThe employee.\n"

  function prepareClarify(questionsFiles: string[]): void {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "clarify", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "clarify" }] },
    ])
    for (const file of questionsFiles) writeWorkingFile(`${processFolder}/${file}`, "# Questions\n")
    writeProjectFile("my-answers.md", answers)
  }

  it("stores the answers under the number of the newest questions file and moves the process to spec", () => {
    prepareClarify(["questions-9.md", "questions-10.md"])

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stdout).toBe(`Stored ${processFolder}/answers-10.md\nspec\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readWorkingFile(`${processFolder}/answers-10.md`)).toBe(answers)
    expect(readFileSync(path.join(projectDirectory(), "my-answers.md"), "utf8")).toBe(answers)
    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        {
          id: "001-handle-a-breach",
          title: "Handle a breach",
          stage: "spec",
          history: [
            { at: "2026-11-18T17:02:11.123Z", stage: "clarify" },
            { at: expect.stringMatching(timeForm), stage: "spec" },
          ],
        },
      ],
    })
  })

  it("names the stage when the process is not in clarify and writes nothing", () => {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])
    writeWorkingFile(`${processFolder}/questions-1.md`, "# Questions\n")
    writeProjectFile("my-answers.md", answers)
    const before = readWorkingFile(boardPath)

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stderr).toBe("process-factory: cannot answer 001-handle-a-breach: it is in the stage intake, not in clarify\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["questions-1.md"])
  })

  it.each([["002-handle-a-breach"], ["../../outside"]])("says there is no process %s and writes nothing", (unknown) => {
    prepareClarify(["questions-1.md"])
    const before = readWorkingFile(boardPath)

    const result = runCommand(["answer", unknown, "my-answers.md"])

    expect(result.stderr).toBe(`process-factory: there is no process ${unknown}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["questions-1.md"])
  })

  it.each([
    ["the folder holds only questions-one.md", "questions-one.md"],
    ["the folder of the process is missing", ""],
  ])("says there is no questions file and leaves the board as it was when %s", (_name, questionsFile) => {
    prepareClarify(questionsFile === "" ? [] : [questionsFile])
    const before = readWorkingFile(boardPath)

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stderr).toBe(`process-factory: cannot answer 001-handle-a-breach: there is no questions file in ${processFolder}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names the file it cannot read and stores nothing", () => {
    prepareClarify(["questions-1.md"])

    const result = runCommand(["answer", "001-handle-a-breach", "missing.md"])

    expect(result.stderr).toMatch(/^process-factory: cannot read missing\.md: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["questions-1.md"])
  })

  it("says the file is empty when it holds only whitespace", () => {
    prepareClarify(["questions-1.md"])
    writeProjectFile("blank.md", " \n\t\n")

    const result = runCommand(["answer", "001-handle-a-breach", "blank.md"])

    expect(result.stderr).toBe("process-factory: cannot answer 001-handle-a-breach: blank.md is empty\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["questions-1.md"])
  })

  it("never replaces an answers file that is already there and leaves the process in clarify", () => {
    prepareClarify(["questions-1.md"])
    writeWorkingFile(`${processFolder}/answers-1.md`, "the earlier answers\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stderr).toMatch(/^process-factory: cannot write processes\/001-handle-a-breach\/answers-1\.md: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(`${processFolder}/answers-1.md`)).toBe("the earlier answers\n")
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([["{ not json\n"], ['{ "processes": "none" }\n']])("names the board it cannot read for %j", (content) => {
    writeWorkingFile(boardPath, content)

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(content)
  })
})

describe("process-factory accept-spec", () => {
  const processFolder = "processes/001-handle-a-breach"
  const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records", "Dependencies"]
  const openLine = `process-factory: cannot accept the spec of 001-handle-a-breach: these sections of ${processFolder}/spec.md are open`
  const staysLine = "process-factory: 001-handle-a-breach stays in spec: /process next 001-handle-a-breach writes the questions for the open sections"

  function specText(open: string[] = []): string {
    const sections = specSections.map((name) => `## ${name}\n\nStatus: ${open.includes(name) ? "open" : "decided"}\n`)
    return `# Specification: Handle a breach\n\n${sections.join("\n")}`
  }

  function prepareSpec(spec?: string, stage = "spec"): void {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage, history: [{ at: "2026-11-18T17:02:11.123Z", stage }] }])
    if (spec !== undefined) writeWorkingFile(`${processFolder}/spec.md`, spec)
  }

  it("records the acceptance, moves the process to cases and leaves spec.md as it was", () => {
    prepareSpec(specText())

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Accepted ${processFolder}/spec.md\ncases\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const acceptedAt = storedProcesses()[0]?.specAcceptedAt
    expect(acceptedAt).toMatch(timeForm)
    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        {
          id: "001-handle-a-breach",
          title: "Handle a breach",
          stage: "cases",
          history: [
            { at: "2026-11-18T17:02:11.123Z", stage: "spec" },
            { at: acceptedAt, stage: "cases" },
          ],
          specAcceptedAt: acceptedAt,
        },
      ],
    })
    expect(readWorkingFile(`${processFolder}/spec.md`)).toBe(specText())
  })

  it.each([
    ["line ends of \\r\\n", specText().replaceAll("\n", "\r\n")],
    ["spaces at the end of a heading and of a Status line", specText().replaceAll("## Roles\n", "## Roles  \n").replaceAll("Status: decided\n", "Status: decided \n")],
    ["three blank lines under a heading", specText().replaceAll("\n\nStatus: decided", "\n\n\n\nStatus: decided")],
    ["a further level 2 heading", `${specText()}\n## Notes\n\nNothing more.\n`],
  ])("accepts a decided spec.md with %s", (_name, spec) => {
    prepareSpec(spec)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("cases")
  })

  it("names the open sections in the order of the eleven, leaves the process in spec and the board as it was", () => {
    prepareSpec(specText(["Deadlines", "Roles"]))
    const before = readWorkingFile(boardPath)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${openLine}\n  Roles\n  Deadlines\n${staysLine}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([
    ["whose heading is missing", specText().replace("## Steps\n\nStatus: decided\n", "")],
    ["whose first line is not Status: decided", specText().replace("## Steps\n\nStatus: decided", "## Steps\n\nStatus: settled")],
    ["whose Status: decided comes after another line", specText().replace("## Steps\n\nStatus: decided", "## Steps\n\nThe steps follow.\n\nStatus: decided")],
  ])("names a section %s as open", (_name, spec) => {
    prepareSpec(spec)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${openLine}\n  Steps\n${staysLine}\n`)
    expect(result.status).toBe(1)
  })

  it("names all eleven sections for a process without a spec.md", () => {
    prepareSpec()

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${openLine}\n${specSections.map((name) => `  ${name}\n`).join("")}${staysLine}\n`)
    expect(result.status).toBe(1)
  })

  it("moves the process to clarify when the newest questions file has no answers", () => {
    prepareSpec(specText(["Roles"]))
    for (const file of ["questions-1.md", "answers-1.md", "questions-2.md"]) writeWorkingFile(`${processFolder}/${file}`, "# Round\n")

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `${openLine}\n  Roles\nprocess-factory: ${processFolder}/questions-2.md has no answers yet: 001-handle-a-breach moves to clarify\n`,
    )
    expect(result.stdout).toBe("clarify\n")
    expect(result.status).toBe(1)
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("clarify")
    const changes = storedHistory(entry)
    expect(changes).toHaveLength(2)
    expect(changes[0]).toEqual({ at: "2026-11-18T17:02:11.123Z", stage: "spec" })
    expect(changes[1]?.stage).toBe("clarify")
    expect(changes[1]?.at).toMatch(timeForm)
    expect(Object.keys(entry ?? {})).not.toContain("specAcceptedAt")
  })

  it("leaves the process in spec when the newest questions file has its answers file", () => {
    prepareSpec(specText(["Roles"]))
    for (const file of ["questions-1.md", "questions-2.md", "answers-2.md"]) writeWorkingFile(`${processFolder}/${file}`, "# Round\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${openLine}\n  Roles\n${staysLine}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names the stage of a process that is not in spec and writes nothing", () => {
    prepareSpec(specText(), "cases")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe("process-factory: cannot accept the spec of 001-handle-a-breach: it is in the stage cases, not in spec\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([["002-handle-a-breach"], ["../../outside"]])("says there is no process %s and writes nothing", (unknown) => {
    prepareSpec(specText())
    const before = readWorkingFile(boardPath)

    const result = runCommand(["accept-spec", unknown])

    expect(result.stderr).toBe(`process-factory: there is no process ${unknown}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names the board it cannot read", () => {
    writeWorkingFile(boardPath, "{ not json\n")

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  it("refuses move to cases from spec, names accept-spec and still allows the move to clarify", () => {
    prepareSpec(specText())
    const before = readWorkingFile(boardPath)

    const refused = runCommand(["move", "001-handle-a-breach", "cases"])
    expect(refused.stderr).toBe(
      "process-factory: cannot move 001-handle-a-breach from spec to cases: only accept-spec 001-handle-a-breach moves a process from spec to cases\n",
    )
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)

    const toDraft = runCommand(["move", "001-handle-a-breach", "draft"])
    expect(toDraft.stderr).toBe("process-factory: cannot move 001-handle-a-breach from spec to draft (allowed from spec: clarify)\n")

    expect(runCommand(["move", "001-handle-a-breach", "clarify"]).status).toBe(0)
  })

  it("prints Spec accepted between the Stage line and the History line, and only for an accepted process", () => {
    prepareSpec(specText())
    runCommand(["accept-spec", "001-handle-a-breach"])

    const lines = runCommand(["show", "001-handle-a-breach"]).stdout.split("\n")

    expect(lines[2]).toBe("Stage: cases")
    expect(lines[3]?.slice("Spec accepted: ".length)).toBe(storedProcesses()[0]?.specAcceptedAt)
    expect(lines[4]).toBe("History:")
    writeBoardFile([{ id: "002-handle-a-breach", title: "Handle a breach", stage: "spec" }])
    expect(runCommand(["show", "002-handle-a-breach"]).stdout).not.toContain("Spec accepted:")
  })
})
