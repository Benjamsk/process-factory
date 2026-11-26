import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  emptyProject,
  organisationFiles,
  readWorkingFile,
  repositoryRoot,
  runCommand,
  runInProject,
  usage,
  workingDirectory,
  writeWorkingFile,
} from "./command-line.ts"

describe("process-factory org init", () => {
  it("creates the five files in the fixed order, reports each one and copies the templates", () => {
    const result = runCommand(["org", "init"])
    expect(result.stdout).toBe(organisationFiles.map((file) => `Created organisation/${file}\n`).join(""))
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readdirSync(workingDirectory)).toEqual(["organisation"])
    for (const file of organisationFiles) {
      const template = readFileSync(path.join(repositoryRoot, "templates", "organisation", file), "utf8")
      expect(readWorkingFile(`organisation/${file}`)).toBe(template)
    }
  })

  it("prints No files created. on a second run and leaves what the user wrote", () => {
    expect(runCommand(["org", "init"]).status).toBe(0)
    writeWorkingFile("organisation/policies.md", "# Policies\n\nWhat the user wrote.\n")

    const result = runCommand(["org", "init"])

    expect(result.stdout).toBe("No files created.\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readWorkingFile("organisation/policies.md")).toBe("# Policies\n\nWhat the user wrote.\n")
  })

  it("keeps a file that is already there and creates the four that are missing", () => {
    writeWorkingFile("organisation/roles.md", "# Roles\n\nKari is the managing director.\n")

    const result = runCommand(["org", "init"])

    expect(result.stdout).toBe(
      "Created organisation/systems.md\nCreated organisation/processors.md\nCreated organisation/policies.md\nCreated organisation/authority.md\n",
    )
    expect(result.status).toBe(0)
    expect(readWorkingFile("organisation/roles.md")).toBe("# Roles\n\nKari is the managing director.\n")
    expect(readdirSync(path.join(workingDirectory, "organisation")).sort()).toEqual([...organisationFiles].sort())
  })

  it("fails with exit code 1 and names roles.md when organisation is a file", () => {
    writeWorkingFile("organisation", "not a folder\n")
    const result = runCommand(["org", "init"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^process-factory: cannot write organisation\/roles\.md: .+\n$/)
    expect(readWorkingFile("organisation")).toBe("not a folder\n")
  })
})

describe("the organisations of a project", () => {
  const noOrganisation = 'process-factory: there is no organisation: run process-factory org new "<name>" first\n'
  const moreThanOne = "process-factory: there is more than one organisation: name one with --org <org-id>\n  berg-as  Berg AS\n  fjord-skole  Fjord Skole\n"

  /** The sorted names in a folder of a project, or an empty list when the folder is not there. */
  function names(project: string, folder = "."): string[] {
    const absolute = path.join(project, folder)
    return existsSync(absolute) ? readdirSync(absolute).sort() : []
  }

  /** Creates the organisations Fjord Skole and Berg AS, and expects both to succeed. */
  function createBoth(project: string): void {
    expect(runInProject(project, ["org", "new", "Fjord Skole"]).stdout).toBe("fjord-skole\n")
    expect(runInProject(project, ["org", "new", "Berg AS"]).stdout).toBe("berg-as\n")
  }

  it("creates an organisation with org new: the id from the name, organisation.json and the five templates", () => {
    const project = emptyProject()

    const result = runInProject(project, ["org", "new", "  Acme Holding AS "])

    expect(result.stdout).toBe("acme-holding-as\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(names(project)).toEqual(["organisations"])
    expect(names(project, "organisations/acme-holding-as")).toEqual(["organisation", "organisation.json"])
    expect(readFileSync(path.join(project, "organisations/acme-holding-as/organisation.json"), "utf8")).toBe('{\n  "name": "Acme Holding AS"\n}\n')
    expect(names(project, "organisations/acme-holding-as/organisation")).toEqual([...organisationFiles].sort())
    for (const file of organisationFiles) {
      const created = readFileSync(path.join(project, "organisations/acme-holding-as/organisation", file))
      expect(created.equals(readFileSync(path.join(repositoryRoot, "templates", "organisation", file)))).toBe(true)
    }
  })

  it.each([["???"], ["   "], ["Acme\nHolding"]])("refuses the name %j with one line and creates nothing", (name) => {
    const project = emptyProject()

    const result = runInProject(project, ["org", "new", name])

    expect(result.stderr).toBe("process-factory: the name must be one line with at least one letter or digit\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(names(project)).toEqual([])
  })

  it("refuses a name whose id exists and leaves that organisation as it was", () => {
    const project = emptyProject()
    expect(runInProject(project, ["org", "new", "Acme Holding AS"]).status).toBe(0)
    writeFileSync(path.join(project, "organisations/acme-holding-as/organisation/roles.md"), "# Roles\n\nWhat the user wrote.\n")

    const result = runInProject(project, ["org", "new", "acme holding as"])

    expect(result.stderr).toBe("process-factory: cannot create organisation acme-holding-as: it already exists\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFileSync(path.join(project, "organisations/acme-holding-as/organisation/roles.md"), "utf8")).toBe("# Roles\n\nWhat the user wrote.\n")
  })

  it("lists the organisations with org list, sorted by id, and gives the id as the name of one whose organisation.json cannot be read", () => {
    const project = emptyProject()
    expect(runInProject(project, ["org", "list"]).stdout).toBe("No organisations.\n")
    createBoth(project)

    expect(runInProject(project, ["org", "list"]).stdout).toBe("berg-as  Berg AS\nfjord-skole  Fjord Skole\n")

    writeFileSync(path.join(project, "organisations/fjord-skole/organisation.json"), "{ not json")
    mkdirSync(path.join(project, "organisations/Not_An_Id"), { recursive: true })
    expect(runInProject(project, ["org", "list"]).stdout).toBe("berg-as  Berg AS\nfjord-skole  fjord-skole\n")
  })

  it.each([[["new", "Handle a breach"]], [["show"]], [["check"]], [["org", "init"]]])("refuses %j in a project without an organisation and creates nothing", (commandArguments) => {
    const project = emptyProject()

    const result = runInProject(project, commandArguments)

    expect(result.stderr).toBe(noOrganisation)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(names(project)).toEqual([])
  })

  it("works on the only organisation without --org and writes nothing beside it", () => {
    const project = emptyProject()
    expect(runInProject(project, ["org", "new", "Fjord Skole"]).status).toBe(0)

    expect(runInProject(project, ["new", "Handle a breach"]).stdout).toBe("001-handle-a-breach\n")

    expect(runInProject(project, ["show"]).stdout).toBe("001-handle-a-breach  intake  Handle a breach\n")
    expect(names(project)).toEqual(["organisations"])
    expect(names(project, "organisations/fjord-skole/processes")).toEqual(["001-handle-a-breach", "board.json"])
  })

  it.each([[["new", "Handle a breach"]], [["show"]], [["check"]], [["org", "init"]]])("refuses %j without --org when there is more than one organisation", (commandArguments) => {
    const project = emptyProject()
    createBoth(project)

    const result = runInProject(project, commandArguments)

    expect(result.stderr).toBe(moreThanOne)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(names(project, "organisations/fjord-skole")).toEqual(["organisation", "organisation.json"])
  })

  it.each([["nowhere"], ["../fjord-skole"], ["Fjord_Skole"]])("says there is no organisation %s for an --org that names none", (organisation) => {
    const project = emptyProject()
    createBoth(project)

    const result = runInProject(project, ["show", "--org", organisation])

    expect(result.stderr).toBe(`process-factory: there is no organisation ${organisation}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  it("numbers the processes of each organisation from 001 on its own board, and shows only its own", () => {
    const project = emptyProject()
    createBoth(project)

    expect(runInProject(project, ["new", "Handle a breach", "--org", "fjord-skole"]).stdout).toBe("001-handle-a-breach\n")
    expect(runInProject(project, ["new", "Handle a breach", "--org", "berg-as"]).stdout).toBe("001-handle-a-breach\n")
    expect(runInProject(project, ["new", "Order a badge", "--org", "fjord-skole"]).stdout).toBe("002-order-a-badge\n")

    expect(runInProject(project, ["show", "--org", "berg-as"]).stdout).toBe("001-handle-a-breach  intake  Handle a breach\n")
    expect(names(project, "organisations/berg-as/processes")).toEqual(["001-handle-a-breach", "board.json"])
    expect(names(project, "organisations/fjord-skole/processes")).toEqual(["001-handle-a-breach", "002-order-a-badge", "board.json"])
  })

  it("names every path of the store it prints from the project's folder", () => {
    const project = emptyProject()
    createBoth(project)
    rmSync(path.join(project, "organisations/fjord-skole/organisation/systems.md"))

    expect(runInProject(project, ["org", "init", "--org", "fjord-skole"]).stdout).toBe("Created organisations/fjord-skole/organisation/systems.md\n")
    expect(names(project, "organisations/berg-as/organisation")).toEqual([...organisationFiles].sort())

    expect(runInProject(project, ["new", "Handle a breach", "--org", "fjord-skole"]).status).toBe(0)
    writeFileSync(path.join(project, "organisations/fjord-skole/processes/board.json"), "{ not json")

    const result = runInProject(project, ["show", "--org", "fjord-skole"])

    expect(result.stderr.startsWith("process-factory: cannot read organisations/fjord-skole/processes/board.json: ")).toBe(true)
    expect(result.status).toBe(1)
  })

  it.each([[["init", "--org", "fjord-skole"]], [["org", "new", "Third School", "--org", "fjord-skole"]], [["org", "list", "--org", "fjord-skole"]], [["serve", "--org", "fjord-skole"]], [["dashboard", "--org", "fjord-skole"]], [["--org", "fjord-skole", "show"]]])(
    "prints the usage for %j, which takes no organisation, and changes nothing",
    (commandArguments) => {
      const project = emptyProject()
      createBoth(project)

      const result = runInProject(project, commandArguments)

      expect(result.stderr).toBe(usage)
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(names(project, "organisations")).toEqual(["berg-as", "fjord-skole"])
    },
  )
})

describe("the migration of the layout of one organisation", () => {
  const moved = "process-factory: moved organisation/ and processes/ to organisations/fjordlys-laering/\n"
  const boardText = `${JSON.stringify({ processes: [{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "intake" }] }] }, null, 2)}\n`

  /** A new project with the folders `organisation/` and `processes/` of the layout before this change. */
  function projectOfTheOldLayout(): string {
    const project = emptyProject()
    mkdirSync(path.join(project, "organisation"), { recursive: true })
    mkdirSync(path.join(project, "processes"), { recursive: true })
    writeFileSync(path.join(project, "organisation/roles.md"), "# Roles\n\n## Data protection officer\n\nKari Nordmann is the data protection officer.\n")
    writeFileSync(path.join(project, "processes/board.json"), boardText)
    return project
  }

  it("moves both folders into the first organisation, says so on standard error and goes on with the command", () => {
    const project = projectOfTheOldLayout()

    const result = runInProject(project, ["show"])

    expect(result.stdout).toBe("001-handle-a-breach  intake  Handle a breach\n")
    expect(result.stderr).toBe(moved)
    expect(result.status).toBe(0)
    expect(readdirSync(project)).toEqual(["organisations"])
    expect(readdirSync(path.join(project, "organisations/fjordlys-laering")).sort()).toEqual(["organisation", "organisation.json", "processes"])
    expect(readFileSync(path.join(project, "organisations/fjordlys-laering/processes/board.json"), "utf8")).toBe(boardText)
    expect(readFileSync(path.join(project, "organisations/fjordlys-laering/organisation.json"), "utf8")).toBe('{\n  "name": "Fjordlys Læring AS"\n}\n')
  })

  it("names the first organisation Fjordlys Læring AS and moves nothing a second time", () => {
    const project = projectOfTheOldLayout()
    expect(runInProject(project, ["show"]).status).toBe(0)

    const listed = runInProject(project, ["org", "list"])

    expect(listed.stdout).toBe("fjordlys-laering  Fjordlys Læring AS\n")
    expect(listed.stderr).toBe("")
  })

  it("is not run by init, which leaves both folders where they are", () => {
    const project = projectOfTheOldLayout()

    expect(runInProject(project, ["init"]).status).toBe(0)

    expect(readdirSync(project).sort()).toEqual([".claude", "organisation", "processes"])
    expect(runInProject(project, ["org", "list"]).stderr).toBe(moved)
    expect(readdirSync(project).sort()).toEqual([".claude", "organisations"])
  })

  it("leaves a root exports/ folder where it is", () => {
    const project = projectOfTheOldLayout()
    mkdirSync(path.join(project, "exports"), { recursive: true })
    writeFileSync(path.join(project, "exports/001-handle-a-breach-v1.md"), "an earlier export\n")

    expect(runInProject(project, ["show"]).status).toBe(0)

    expect(readdirSync(project).sort()).toEqual(["exports", "organisations"])
    expect(readFileSync(path.join(project, "exports/001-handle-a-breach-v1.md"), "utf8")).toBe("an earlier export\n")
  })
})
