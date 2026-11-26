import { createHash } from "node:crypto"
import path from "node:path"
import { fileLines, readProcessesOrPrintReason, sectionLines } from "./store.mjs"

/** The kinds of dependency the command line watches, each with the file of `organisation/` that describes them. */
const dependencyFiles = { Role: "organisation/roles.md", System: "organisation/systems.md", Agreement: "organisation/processors.md", Policy: "organisation/policies.md" }

/** The `Role`, `System`, `Agreement` and `Policy` lines of the section `Dependencies` of a `spec.md`, in their order. */
export function specDependencies(folder) {
  const lines = fileLines(path.join(folder, "spec.md"))
  const body = lines === null ? null : sectionLines(lines, "Dependencies")
  if (body === null) return []
  return body.flatMap((line) => {
    const dependency = /^- (Role|System|Agreement|Policy): (.+)$/.exec(line)
    return dependency === null ? [] : [{ kind: dependency[1], name: dependency[2] }]
  })
}

/** The hash of the section `## <name>` in the file of this kind, or null when the file or the section is missing. */
export function dependencyHash(kind, name) {
  const lines = fileLines(path.join(process.cwd(), dependencyFiles[kind]))
  const body = lines === null ? null : sectionLines(lines, name)
  return body === null ? null : createHash("sha256").update(body.join("\n").trim()).digest("hex")
}

/** The recorded dependencies of an entry whose section in `organisation/` has changed or is gone, each with its name and what happened. */
export function changedDependencies(entry) {
  return (entry.dependencies ?? []).flatMap((dependency) => {
    const hash = dependencyHash(dependency.kind, dependency.name)
    if (hash === dependency.hash) return []
    const file = dependencyFiles[dependency.kind]
    return [{ name: `${dependency.kind}: ${dependency.name}`, what: hash === null ? `removed from ${file}` : `changed in ${file}` }]
  })
}

/** Lists every published process of which a recorded dependency changed in `organisation/` or is gone. */
export function checkDependencies() {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  const listed = []
  for (const entry of processes) {
    if (entry.stage !== "published") continue
    const changed = changedDependencies(entry).map((dependency) => `  ${dependency.name}  ${dependency.what}`)
    if (changed.length > 0) listed.push(`${entry.id}  ${entry.title}`, ...changed)
  }
  if (listed.length === 0) process.stdout.write("No published process has a changed dependency.\n")
  else process.stdout.write(`Work waiting for the owner:\n${listed.join("\n")}\n`)
  return 0
}
