import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  binFile,
  emptyFolder,
  entries,
  organisationFiles,
  readFile,
  root,
  runCommand,
  runNode,
  templateFolder,
  usage,
  writeFile,
} from "./organisation.ts"

const allCreated = organisationFiles.map((file) => `Created organisation/${file}\n`).join("")

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

function template(file: string): Buffer {
  return readFileSync(path.join(root, templateFolder, file))
}

function created(file: string): Buffer {
  return readFileSync(path.join(project, "organisation", file))
}

describe("process-factory org init in an empty working directory", () => {
  it("prints one Created line per file in the fixed order, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["org", "init"])
    expect(result.stdout).toBe(allCreated)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("creates only the folder organisation with the five files, each byte-identical to its template", () => {
    expect(runCommand(project, ["org", "init"]).status).toBe(0)
    expect(entries(project)).toEqual(["organisation"])
    expect(entries(project, "organisation")).toEqual([...organisationFiles].sort())
    for (const file of organisationFiles) {
      expect(created(file).equals(template(file))).toBe(true)
    }
  })
})

describe("process-factory org init when files already exist", () => {
  it("prints No files created. on a second run and leaves the five files as they were", () => {
    expect(runCommand(project, ["org", "init"]).status).toBe(0)
    writeFile(project, "organisation/systems.md", "# Systems\n\nWhat the user wrote.\n")
    const before = organisationFiles.map((file) => readFile(project, `organisation/${file}`))

    const result = runCommand(project, ["org", "init"])

    expect(result.stdout).toBe("No files created.\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(organisationFiles.map((file) => readFile(project, `organisation/${file}`))).toEqual(before)
    expect(readFile(project, "organisation/systems.md")).toBe("# Systems\n\nWhat the user wrote.\n")
    expect(entries(project, "organisation")).toEqual([...organisationFiles].sort())
  })

  it("keeps an existing roles.md and unknown.md and creates the four files that are missing", () => {
    writeFile(project, "organisation/roles.md", "# Roles\n\nKari is the managing director.\n")
    writeFile(project, "organisation/unknown.md", "Not known yet.\n")

    const result = runCommand(project, ["org", "init"])

    expect(result.stdout).toBe(
      "Created organisation/systems.md\nCreated organisation/processors.md\nCreated organisation/policies.md\nCreated organisation/authority.md\n",
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readFile(project, "organisation/roles.md")).toBe("# Roles\n\nKari is the managing director.\n")
    expect(readFile(project, "organisation/unknown.md")).toBe("Not known yet.\n")
    expect(entries(project, "organisation")).toEqual([...organisationFiles, "unknown.md"].sort())
    for (const file of organisationFiles.slice(1)) {
      expect(created(file).equals(template(file))).toBe(true)
    }
  })
})

describe("process-factory org init when organisation cannot be written", () => {
  it("exits with 1 and names organisation/roles.md when organisation is a file", () => {
    writeFile(project, "organisation", "not a folder\n")

    const result = runCommand(project, ["org", "init"])

    expect(result.stderr.startsWith("process-factory: cannot write organisation/roles.md: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, "organisation")).toBe("not a folder\n")
    expect(entries(project)).toEqual(["organisation"])
  })
})

describe("process-factory org init from an installed copy", () => {
  it("takes the templates from the copy under node_modules and creates organisation in the project", () => {
    expect(existsSync(path.join(root, templateFolder, "roles.md"))).toBe(true)
    const packageFolder = path.join(project, "node_modules", "process-factory")
    mkdirSync(packageFolder, { recursive: true })
    cpSync(path.join(root, "bin"), path.join(packageFolder, "bin"), { recursive: true })
    cpSync(path.join(root, "templates"), path.join(packageFolder, "templates"), { recursive: true })
    cpSync(path.join(root, "package.json"), path.join(packageFolder, "package.json"))
    appendFileSync(path.join(packageFolder, templateFolder, "roles.md"), "\nFrom the installed copy.\n")

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["org", "init"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(allCreated)
    expect(result.status).toBe(0)
    expect(created("roles.md").equals(readFileSync(path.join(packageFolder, templateFolder, "roles.md")))).toBe(true)
    expect(created("roles.md").equals(template("roles.md"))).toBe(false)
    expect(entries(project)).toEqual(["node_modules", "organisation"])
    expect(entries(packageFolder)).toEqual(["bin", "package.json", "templates"])
  })
})

describe("process-factory org without exactly init", () => {
  it.each([
    ["org alone", ["org"]],
    ["the arguments org init extra", ["org", "init", "extra"]],
    ["the arguments org show", ["org", "show"]],
  ])("prints the fourteen usage lines to standard error, exits with 1 and creates nothing with %s", (_name, args) => {
    const result = runCommand(project, args)
    expect(result.stderr).toBe(usage)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})
