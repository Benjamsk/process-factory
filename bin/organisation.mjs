import { constants, copyFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { errorMessage, fileLines, packageFolder } from "./store.mjs"

/** The files of the organisation context, in the order `org init` creates them. */
const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]

/** The lines of `organisation/roles.md` outside the sections whose heading starts with `## Example:`. */
function rolesLines() {
  let inExample = false
  return (fileLines(path.join(process.cwd(), "organisation", "roles.md")) ?? []).filter((line) => {
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
    const targetFile = path.join(process.cwd(), "organisation", file)
    try {
      mkdirSync(path.dirname(targetFile), { recursive: true })
    } catch (error) {
      process.stderr.write(`process-factory: cannot write organisation/${file}: ${errorMessage(error)}\n`)
      return 1
    }
    try {
      copyFileSync(path.join(packageFolder, "templates", "organisation", file), targetFile, constants.COPYFILE_EXCL)
    } catch (error) {
      if (error.code !== "EEXIST") {
        process.stderr.write(`process-factory: cannot write organisation/${file}: ${errorMessage(error)}\n`)
        return 1
      }
      continue
    }
    process.stdout.write(`Created organisation/${file}\n`)
    createdAny = true
  }
  if (!createdAny) process.stdout.write("No files created.\n")
  return 0
}
