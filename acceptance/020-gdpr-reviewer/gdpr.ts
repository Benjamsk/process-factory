import { readFile, root } from "../010-clarifying-questions/clarify.ts"

export const gdprTemplate = "templates/skills/process/gdpr-reviewer.md"
export const gdprInstalled = ".claude/skills/process/gdpr-reviewer.md"

/** The text of the template of the GDPR reviewer, or an empty string when it does not exist. */
export function gdprText(): string {
  return readFile(root, gdprTemplate)
}
