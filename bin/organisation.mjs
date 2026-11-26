import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { errorMessage, fileLines, folderNames, inOrganisation, organisationPath, organisationsFolder, packageFolder, printedPath, storePath, titleSlug } from "./store.mjs"

/** The files of the organisation context, in the order `org init` creates them. */
const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]
/** The folders of the layout before a checkout held several organisations, which the migration moves. */
const oldFolders = ["organisation", "processes"]
/** The organisation a checkout of that layout is moved into. */
const firstOrganisation = { id: "fjordlys-laering", name: "Fjordlys Læring AS" }

/** The text of the `organisation.json` of an organisation with this name. */
function organisationJson(name) {
  return `${JSON.stringify({ name }, null, 2)}\n`
}

/** The name of an organisation: `name` of its `organisation.json` when that is JSON with a non-empty string there, otherwise its id. */
function organisationName(id) {
  try {
    const stored = JSON.parse(readFileSync(organisationPath(id, "organisation.json"), "utf8"))
    return typeof stored.name === "string" && stored.name !== "" ? stored.name : id
  } catch {
    return id
  }
}

/** The organisations of the working directory, each with its name, sorted by id: every name in `organisations/` that is an id. */
export function organisations() {
  return folderNames(path.join(process.cwd(), organisationsFolder))
    .filter((name) => /^[a-z0-9-]+$/.test(name))
    .sort()
    .map((id) => ({ id, name: organisationName(id) }))
}

/** Moves a root `organisation/` and `processes/` of the old layout into the first organisation, or prints why it cannot. */
export function migrateOldLayout() {
  if (existsSync(path.join(process.cwd(), organisationsFolder))) return 0
  const toMove = oldFolders.filter((name) => existsSync(path.join(process.cwd(), name)))
  if (toMove.length === 0) return 0
  const moved = `organisation/ and processes/ to ${organisationsFolder}/${firstOrganisation.id}/`
  try {
    mkdirSync(organisationPath(firstOrganisation.id), { recursive: true })
    writeFileSync(organisationPath(firstOrganisation.id, "organisation.json"), organisationJson(firstOrganisation.name))
    for (const name of toMove) renameSync(path.join(process.cwd(), name), organisationPath(firstOrganisation.id, name))
  } catch (error) {
    process.stderr.write(`process-factory: cannot move ${moved}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stderr.write(`process-factory: moved ${moved}\n`)
  return 0
}

/** Runs a command that reads or writes the store in the organisation `--org` named or in the only one, after the migration. */
export function runStoreCommand(organisation, action) {
  const problem = migrateOldLayout()
  if (problem !== 0) return problem
  const listed = organisations()
  if (organisation !== undefined) {
    if (!listed.some((found) => found.id === organisation)) {
      process.stderr.write(`process-factory: there is no organisation ${organisation}\n`)
      return 1
    }
    return inOrganisation(organisation, action)
  }
  if (listed.length === 0) {
    process.stderr.write('process-factory: there is no organisation: run process-factory org new "<name>" first\n')
    return 1
  }
  if (listed.length > 1) {
    process.stderr.write("process-factory: there is more than one organisation: name one with --org <org-id>\n")
    for (const found of listed) process.stderr.write(`  ${found.id}  ${found.name}\n`)
    return 1
  }
  return inOrganisation(listed[0].id, action)
}

/** Creates an organisation with its name and the five templates of the organisation context, and prints its id. */
export function createOrganisation(nameArgument) {
  const problem = migrateOldLayout()
  if (problem !== 0) return problem
  const name = nameArgument.trim()
  if (/[\r\n]/.test(name) || !/[a-zA-Z0-9]/.test(name)) {
    process.stderr.write("process-factory: the name must be one line with at least one letter or digit\n")
    return 1
  }
  const id = titleSlug(name)
  if (existsSync(organisationPath(id))) {
    process.stderr.write(`process-factory: cannot create organisation ${id}: it already exists\n`)
    return 1
  }
  try {
    mkdirSync(organisationPath(id, "organisation"), { recursive: true })
    writeFileSync(organisationPath(id, "organisation.json"), organisationJson(name))
    for (const file of organisationFiles) {
      copyFileSync(path.join(packageFolder, "templates", "organisation", file), organisationPath(id, "organisation", file))
    }
  } catch (error) {
    process.stderr.write(`process-factory: cannot create organisation ${id}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`${id}\n`)
  return 0
}

/** Prints one line `<org-id>  <name>` per organisation, sorted by id, or that there is none. */
export function listOrganisations() {
  const problem = migrateOldLayout()
  if (problem !== 0) return problem
  const listed = organisations()
  if (listed.length === 0) process.stdout.write("No organisations.\n")
  else for (const found of listed) process.stdout.write(`${found.id}  ${found.name}\n`)
  return 0
}

/** The lines of `organisation/roles.md` outside the sections whose heading starts with `## Example:`. */
function rolesLines() {
  let inExample = false
  return (fileLines(storePath("organisation", "roles.md")) ?? []).filter((line) => {
    if (line.startsWith("## ")) inExample = line.startsWith("## Example:")
    return !inExample
  })
}

/** Whether a name stands in a line, letter for letter, with no letter and no digit directly before or after it. */
function standsInLine(line, name) {
  const bounds = (character) => !/[\p{L}\p{N}]/u.test(character)
  for (let at = line.indexOf(name); at !== -1; at = line.indexOf(name, at + 1)) {
    if (bounds(line.slice(at - 1, at)) && bounds(line.slice(at + name.length, at + name.length + 1))) return true
  }
  return false
}

/** Whether a name stands in `organisation/roles.md`, outside the example sections. */
export function isNamedInRoles(name) {
  return rolesLines().some((line) => standsInLine(line, name))
}

/** Copies the organisation templates into `organisation/`, keeping every file that is already there. */
export function initialiseOrganisation() {
  let createdAny = false
  for (const file of organisationFiles) {
    const targetFile = storePath("organisation", file)
    const shown = printedPath("organisation", file)
    try {
      mkdirSync(path.dirname(targetFile), { recursive: true })
    } catch (error) {
      process.stderr.write(`process-factory: cannot write ${shown}: ${errorMessage(error)}\n`)
      return 1
    }
    try {
      copyFileSync(path.join(packageFolder, "templates", "organisation", file), targetFile, constants.COPYFILE_EXCL)
    } catch (error) {
      if (error.code !== "EEXIST") {
        process.stderr.write(`process-factory: cannot write ${shown}: ${errorMessage(error)}\n`)
        return 1
      }
      continue
    }
    process.stdout.write(`Created ${shown}\n`)
    createdAny = true
  }
  if (!createdAny) process.stdout.write("No files created.\n")
  return 0
}
