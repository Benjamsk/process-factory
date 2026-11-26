import { createHash } from "node:crypto"
import { readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { usage } from "../006-process-state-machine/store.ts"
import { berg, bergName, createBoth, emptyProject, fjord, fjordName, kari, laptopId, moreThanOne, names, noOrganisation, organisationFiles, read, root, run, store, write, writeBoard, writePublished } from "./organisations.ts"

const breachId = "001-handle-a-breach"
const breachTitle = "Handle a breach"
const systemsText = "# Systems\n\n## Payroll system\n\nExample Payroll AS supplies it.\n"
const nothingChanged = "No published process has a changed dependency.\n"

let project = ""

beforeEach(() => {
  project = emptyProject()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory org new", () => {
  it("prints the id, and creates organisation.json with the name and the five files of the templates, and nothing else", () => {
    const result = run(project, ["org", "new", "  Acme Holding AS "])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe("acme-holding-as\n")
    expect(result.status).toBe(0)
    expect(names(project)).toEqual(["organisations"])
    expect(names(project, "organisations")).toEqual(["acme-holding-as"])
    expect(names(project, store("acme-holding-as"))).toEqual(["organisation", "organisation.json"])
    expect(read(project, `${store("acme-holding-as")}/organisation.json`)).toBe('{\n  "name": "Acme Holding AS"\n}\n')
    expect(names(project, `${store("acme-holding-as")}/organisation`)).toEqual([...organisationFiles].sort())
    for (const file of organisationFiles) {
      const created = readFileSync(path.join(project, store("acme-holding-as"), "organisation", file))
      expect(created.equals(readFileSync(path.join(root, "templates/organisation", file)))).toBe(true)
    }
  })

  it.each([
    ["a name without a letter or digit", "???"],
    ["a name of only whitespace", "   "],
    ["a name with a line break", "Acme\nHolding"],
  ])("refuses %s with one line and creates nothing", (_name, name) => {
    const result = run(project, ["org", "new", name])

    expect(result.stderr).toBe("process-factory: the name must be one line with at least one letter or digit\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(names(project)).toEqual([])
  })

  it("refuses a name whose id exists and leaves that organisation as it was", () => {
    expect(run(project, ["org", "new", "Acme Holding AS"]).status).toBe(0)
    write(project, `${store("acme-holding-as")}/organisation/roles.md`, "# Roles\n\nWhat the user wrote.\n")

    const result = run(project, ["org", "new", "acme holding as"])

    expect(result.stderr).toBe("process-factory: cannot create organisation acme-holding-as: it already exists\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(read(project, `${store("acme-holding-as")}/organisation/roles.md`)).toBe("# Roles\n\nWhat the user wrote.\n")
    expect(read(project, `${store("acme-holding-as")}/organisation.json`)).toBe('{\n  "name": "Acme Holding AS"\n}\n')
  })
})

describe("process-factory org list", () => {
  it("prints No organisations. in an empty folder and creates nothing", () => {
    const result = run(project, ["org", "list"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe("No organisations.\n")
    expect(result.status).toBe(0)
    expect(names(project)).toEqual([])
  })

  it("prints one line with the id and the name per organisation, sorted by id", () => {
    createBoth(project)

    const result = run(project, ["org", "list"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`${berg}  ${bergName}\n${fjord}  ${fjordName}\n`)
    expect(result.status).toBe(0)
  })

  it("gives the id as the name of an organisation whose organisation.json cannot be read, and skips what is no organisation", () => {
    createBoth(project)
    write(project, `${store(fjord)}/organisation.json`, "{ not json")
    write(project, "organisations/Not_An_Id/organisation.json", '{\n  "name": "No organisation"\n}\n')
    write(project, "organisations/notes.txt", "notes\n")

    expect(run(project, ["org", "list"]).stdout).toBe(`${berg}  ${bergName}\n${fjord}  ${fjord}\n`)
  })
})

describe("a command that reads or writes the store, in a folder without an organisation", () => {
  it.each([
    ["new", ["new", breachTitle]],
    ["new with a title it would refuse", ["new", "???"]],
    ["show", ["show"]],
    ["check", ["check"]],
    ["org init", ["org", "init"]],
  ])("is refused with the line that names org new, and creates nothing: %s", (_name, args) => {
    const result = run(project, args)

    expect(result.stderr).toBe(noOrganisation)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(names(project)).toEqual([])
  })
})

describe("a command without --org in a project with one organisation", () => {
  it("works on that organisation: new writes its board and its process folder, and nothing in the working directory", () => {
    expect(run(project, ["org", "new", fjordName]).status).toBe(0)

    const result = run(project, ["new", breachTitle])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`${breachId}\n`)
    expect(result.status).toBe(0)
    expect(read(project, `${store(fjord)}/processes/${breachId}/request.md`)).toBe(`# ${breachTitle}\n`)
    expect(read(project, `${store(fjord)}/processes/board.json`)).toContain(`"id": "${breachId}"`)
    expect(names(project)).toEqual(["organisations"])
    expect(run(project, ["show"]).stdout).toBe(`${breachId}  intake  ${breachTitle}\n`)
  })

  it("names the board it cannot read by its path from the project's folder", () => {
    expect(run(project, ["org", "new", fjordName]).status).toBe(0)
    write(project, `${store(fjord)}/processes/board.json`, "{ not json")

    const result = run(project, ["show"])

    expect(result.stderr.startsWith(`process-factory: cannot read ${store(fjord)}/processes/board.json: `)).toBe(true)
    expect(result.status).toBe(1)
  })
})

describe("a command in a project with two organisations", () => {
  it.each([
    ["new", ["new", breachTitle]],
    ["show", ["show"]],
    ["check", ["check"]],
    ["org init", ["org", "init"]],
  ])("is refused without --org, with the list of the organisations, and changes nothing: %s", (_name, args) => {
    createBoth(project)

    const result = run(project, args)

    expect(result.stderr).toBe(moreThanOne)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(names(project)).toEqual(["organisations"])
    expect(names(project, store(fjord))).toEqual(["organisation", "organisation.json"])
    expect(names(project, store(berg))).toEqual(["organisation", "organisation.json"])
  })

  it("numbers the processes of each organisation from 001 on its own board, and show --org lists only its own", () => {
    createBoth(project)

    expect(run(project, ["new", breachTitle, "--org", fjord]).stdout).toBe(`${breachId}\n`)
    expect(run(project, ["new", breachTitle, "--org", berg]).stdout).toBe(`${breachId}\n`)
    expect(run(project, ["new", "Order a badge", "--org", fjord]).stdout).toBe("002-order-a-badge\n")

    expect(run(project, ["show", "--org", fjord]).stdout).toBe(`${breachId}  intake  ${breachTitle}\n002-order-a-badge  intake  Order a badge\n`)
    expect(run(project, ["show", "--org", berg]).stdout).toBe(`${breachId}  intake  ${breachTitle}\n`)
    expect(names(project, `${store(fjord)}/processes`)).toEqual([breachId, "002-order-a-badge", "board.json"])
    expect(names(project, `${store(berg)}/processes`)).toEqual([breachId, "board.json"])
    expect(names(project)).toEqual(["organisations"])
  })

  it.each([["nowhere"], ["../fjord-skole"], ["Fjord_Skole"]])("says there is no organisation %s for an --org that names none", (organisation) => {
    createBoth(project)

    const result = run(project, ["show", "--org", organisation])

    expect(result.stderr).toBe(`process-factory: there is no organisation ${organisation}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  it("checks an owner against roles.md of the organisation of the process only", () => {
    createBoth(project)
    expect(run(project, ["new", breachTitle, "--org", fjord]).status).toBe(0)
    write(project, `${store(berg)}/organisation/roles.md`, `# Roles\n\n## Data protection officer\n\n${kari} is the data protection officer.\n`)

    const refused = run(project, ["owner", breachId, kari, "--org", fjord])

    expect(refused.stderr).toBe(`process-factory: cannot set the owner of ${breachId}: ${kari} is not named in ${store(fjord)}/organisation/roles.md\n`)
    expect(refused.status).toBe(1)

    write(project, `${store(fjord)}/organisation/roles.md`, `# Roles\n\n## Head of school\n\n${kari} is the head of school.\n`)
    const stored = run(project, ["owner", breachId, kari, "--org", fjord])

    expect(stored.stderr).toBe("")
    expect(stored.stdout).toBe(`Owner: ${kari}\n`)
    expect(stored.status).toBe(0)
  })

  it("lists a changed dependency only for the organisation whose file changed, with the path of that file", () => {
    createBoth(project)
    const hash = createHash("sha256").update("Example Payroll AS supplies it.").digest("hex")
    const entry = { id: "001-pay-salaries", title: "Pay salaries", stage: "published", dependencies: [{ kind: "System", name: "Payroll system", hash }] }
    for (const organisation of [fjord, berg]) {
      writeBoard(project, organisation, [entry])
      write(project, `${store(organisation)}/organisation/systems.md`, systemsText)
    }
    expect(run(project, ["check", "--org", fjord]).stdout).toBe(nothingChanged)

    write(project, `${store(berg)}/organisation/systems.md`, systemsText.replace("Example Payroll AS", "Another Payroll AS"))

    expect(run(project, ["check", "--org", fjord]).stdout).toBe(nothingChanged)
    expect(run(project, ["check", "--org", berg]).stdout).toBe(
      `Work waiting for the owner:\n001-pay-salaries  Pay salaries\n  System: Payroll system  changed in ${store(berg)}/organisation/systems.md\n`,
    )
  })

  it("exports into the folder exports of the organisation, with the organisation in the address of the stamp and no line that names the organisation", () => {
    createBoth(project)
    writePublished(project, fjord, "Handle a lost laptop", "# Handle a lost laptop\n\n## Steps\n\n1. Call the IT manager.\n")

    const result = run(project, ["export", laptopId, "--format", "html", "--link", "http://intranet", "--org", fjord])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`${store(fjord)}/exports/${laptopId}-v1.html\n`)
    expect(result.status).toBe(0)
    const page = read(project, `${store(fjord)}/exports/${laptopId}-v1.html`)
    expect(page).toContain(`<a href="http://intranet/${fjord}/${laptopId}/1">http://intranet/${fjord}/${laptopId}/1</a>`)
    expect(page).toContain("Call the IT manager.")
    expect(page).not.toContain("Organisation:")
    expect(names(project)).toEqual(["organisations"])
    expect(names(project, store(berg))).toEqual(["organisation", "organisation.json"])
  })

  it("puts back a missing context file with org init --org, and touches no other organisation", () => {
    createBoth(project)
    rmSync(path.join(project, store(fjord), "organisation/systems.md"))
    rmSync(path.join(project, store(berg), "organisation/systems.md"))

    const result = run(project, ["org", "init", "--org", fjord])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Created ${store(fjord)}/organisation/systems.md\n`)
    expect(result.status).toBe(0)
    expect(names(project, `${store(fjord)}/organisation`)).toEqual([...organisationFiles].sort())
    expect(names(project, `${store(berg)}/organisation`)).toEqual(organisationFiles.filter((file) => file !== "systems.md").sort())
    expect(read(project, `${store(fjord)}/organisation.json`)).toBe(`{\n  "name": "${fjordName}"\n}\n`)
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["init with --org", ["init", "--org", fjord]],
    ["org new with --org", ["org", "new", "Third School", "--org", fjord]],
    ["org list with --org", ["org", "list", "--org", fjord]],
    ["serve with --org", ["serve", "--org", fjord]],
    ["dashboard with --org", ["dashboard", "--org", fjord]],
    ["--org before the arguments of a command", ["--org", fjord, "show"]],
    ["an unknown command", ["organisations"]],
  ])("has the nineteen lines of the spec and is printed with %s, which changes nothing", (_name, args) => {
    createBoth(project)

    const result = run(project, args)

    expect(result.stderr).toBe(usage)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(19)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(names(project)).toEqual(["organisations"])
    expect(names(project, "organisations")).toEqual([berg, fjord])
  })
})
