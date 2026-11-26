import { copyFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { errorMessage, folderNames, packageFolder } from "./store.mjs"

export const skillFolder = ".claude/skills/process"
/** The files of the skill, in the order `init` installs them, before the reviewers the package ships. */
const skillFiles = ["SKILL.md", "interviewer.md", "questioner.md", "spec-writer.md", "case-writer.md", "draft-writer.md", "incident.md", "reviewer.md"]

/** The names of the files `<name>-reviewer.md` in a folder, sorted, empty when the folder cannot be read. */
export function reviewerFiles(folder) {
  return folderNames(folder)
    .filter((name) => /^[a-z0-9-]+-reviewer\.md$/.test(name))
    .sort()
}

export function installSkill() {
  const templateFolder = path.join(packageFolder, "templates", "skills", "process")
  for (const file of [...skillFiles, ...reviewerFiles(templateFolder)]) {
    const targetFile = path.join(process.cwd(), skillFolder, file)
    try {
      mkdirSync(path.dirname(targetFile), { recursive: true })
      copyFileSync(path.join(templateFolder, file), targetFile)
    } catch (error) {
      process.stderr.write(`process-factory: cannot write ${skillFolder}/${file}: ${errorMessage(error)}\n`)
      return 1
    }
    process.stdout.write(`Installed ${skillFolder}/${file}\n`)
  }
  return 0
}
