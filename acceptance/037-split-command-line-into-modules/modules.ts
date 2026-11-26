import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { projectOf, root, runInProject } from "../006-process-state-machine/store.ts"

export const entryFile = "process-factory.mjs"
/** The files of `bin/` in the order of the spec's section 3.2, lowest level first. */
export const levels = [
  ["store.mjs", "usage.mjs"],
  ["skill.mjs", "organisation.mjs", "dependencies.mjs"],
  ["state-machine.mjs"],
  ["reading-view.mjs"],
  ["export.mjs", "dashboard.mjs"],
  [entryFile],
]
/** The ten files of `bin/`, sorted. */
export const binFiles = levels.flat().sort()

const importStatement = /^import\s+([^"']+?)\s+from\s+["']([^"']+)["']/gm

/** The files of the spec that `bin/` of the repository does not have. */
export function missingFiles(): string[] {
  return binFiles.filter((name) => !existsSync(path.join(root, "bin", name)))
}

/** The names in `bin/` of the repository, sorted. */
export function presentNames(): string[] {
  return readdirSync(path.join(root, "bin")).sort()
}

/** The text of a file of `bin/` of the repository. */
export function source(name: string): string {
  return readFileSync(path.join(root, "bin", name), "utf8")
}

/** The number of lines of a file of `bin/`, not counting the empty one after the last line break. */
export function lineCount(name: string): number {
  return source(name).replace(/\r?\n$/, "").split(/\r?\n/).length
}

/** What a file of `bin/` imports: the text between the quotes of every `import` and of every `export ... from`. */
export function imports(name: string): string[] {
  const text = source(name)
  const patterns = [/^import\s[^"']*?["']([^"']+)["']/gm, /\bimport\s*\(\s*["']([^"']+)["']/g, /^export\s+(?:\*|\{[^}]*\})\s*from\s*["']([^"']+)["']/gm]
  return patterns.flatMap((pattern) => [...text.matchAll(pattern)].map((match) => match[1] ?? ""))
}

/** The files of `bin/` a file of `bin/` imports, as their names. */
export function importedFiles(name: string): string[] {
  return imports(name)
    .filter((specifier) => !specifier.startsWith("node:"))
    .map((specifier) => specifier.replace(/^\.\//, ""))
}

/**
 * The names a file of `bin/` imports, one per name: `imported` is the name in the file it comes from (`default` for a
 * default import), `local` the name it has in the importing file and `from` the text between the quotes.
 */
export function importedNames(name: string): { imported: string; local: string; from: string }[] {
  return [...source(name).matchAll(importStatement)].flatMap((match) => {
    const clause = match[1] ?? ""
    const braces = /\{([^}]*)\}/.exec(clause)
    const named = (braces?.[1] ?? "")
      .split(",")
      .map((part) => part.trim().split(/\s+/))
      .filter((words) => words[0] !== undefined && words[0] !== "")
      .map((words) => ({ imported: words[0] ?? "", local: words.at(-1) ?? "", from: match[2] ?? "" }))
    const outside = clause.replace(/\{[^}]*\}/, "").replaceAll(",", " ").trim()
    const whole = outside === "" ? [] : [{ imported: "default", local: outside.split(/\s+/).at(-1) ?? "", from: match[2] ?? "" }]
    return [...whole, ...named]
  })
}

/** The text of a file of `bin/` without its `import` statements. */
export function sourceWithoutImports(name: string): string {
  return source(name).replaceAll(importStatement, "")
}

/** The names a file of `bin/` exports. */
export function exportedNames(name: string): string[] {
  const text = source(name)
  const declared = [...text.matchAll(/^export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class)\s+(\w+)/gm)].map((match) => match[1] ?? "")
  const listed = [...text.matchAll(/^export\s*\{([^}]*)\}/gm)].flatMap((match) =>
    (match[1] ?? "")
      .split(",")
      .map((part) => part.trim().split(/\s+/).at(-1) ?? "")
      .filter((exported) => exported !== ""),
  )
  return [...declared, ...listed]
}

/**
 * Builds the package as it is installed in the project of `project`, the folder of an organisation:
 * `node_modules/process-factory` with the ten files of `bin/`, `templates/` and `package.json`, and nothing else.
 * Gives the folder of the copy.
 */
export function installPackage(project: string): string {
  const packageFolder = path.join(projectOf(project), "node_modules", "process-factory")
  mkdirSync(path.join(packageFolder, "bin"), { recursive: true })
  for (const name of binFiles) cpSync(path.join(root, "bin", name), path.join(packageFolder, "bin", name))
  cpSync(path.join(root, "templates"), path.join(packageFolder, "templates"), { recursive: true })
  cpSync(path.join(root, "package.json"), path.join(packageFolder, "package.json"))
  return packageFolder
}

/** The command file of the copy of the package in the project of `project`, the folder of an organisation. */
export function installedCommand(project: string): string {
  return path.join(projectOf(project), "node_modules", "process-factory", "bin", entryFile)
}

/** Runs the command line of the copy of the package in the project of `project`, the folder of an organisation, with that project as the working directory. */
export function runInstalled(project: string, args: string[]) {
  return runInProject(project, installedCommand(project), args)
}
