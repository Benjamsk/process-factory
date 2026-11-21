import { approveDraft, processes, runCommand, writeBoard, writeFile } from "../006-process-state-machine/store.ts"

export const breachId = "001-handle-a-personal-data-breach"
export const breachTitle = "Handle a personal data breach"
export const laptopId = "002-handle-a-lost-laptop"
export const laptopTitle = "Handle a lost laptop"
export const nothingChanged = "No published process has a changed dependency.\n"
export const workHeading = "Work waiting for the owner:"
export const rolesFile = "organisation/roles.md"
export const systemsFile = "organisation/systems.md"
export const processorsFile = "organisation/processors.md"
export const policiesFile = "organisation/policies.md"
/** The ten sections a specification had before `Dependencies`, in the order of `spec-writer.md`. */
export const firstTenSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records"]

export const officerSection = "## Data protection officer\n\nKari Nordmann is the data protection officer. Ola Hansen steps in when she is away.\n"
export const headOfItSection = "## Head of IT\n\nPer Olsen is the head of IT.\n"
export const rolesText = `# Roles\n\nThe roles in the organisation.\n\n${officerSection}\n${headOfItSection}`
export const systemsText = "# Systems\n\n## Payroll system\n\nThe payroll system is used to pay salaries. Example Payroll AS supplies it.\n"
export const processorsText = "# Data processor agreements\n\n## Example Payroll AS\n\nThe agreement was signed on 1 March 2024.\n"
export const policiesText = "# Policies\n\n## Information security policy\n\nThe managing director approved it on 15 January 2025.\n"

/** The six dependency lines of the spec's example, one of each kind. */
export const sixLines = [
  "- Law: GDPR article 33",
  "- Role: Data protection officer",
  "- System: Payroll system",
  "- Agreement: Example Payroll AS",
  "- Policy: Information security policy",
  "- Process: Handle a lost laptop",
]

/** The four of the six lines that the command line records, as kind and name. */
export const fourRecorded = [
  { kind: "Role", name: "Data protection officer" },
  { kind: "System", name: "Payroll system" },
  { kind: "Agreement", name: "Example Payroll AS" },
  { kind: "Policy", name: "Information security policy" },
]

/** The first ten sections of a specification, each decided. */
export function tenDecided(title: string): string {
  return `# Specification: ${title}\n\n${firstTenSections.map((name) => `## ${name}\n\nStatus: decided\n\nSettled.\n`).join("\n")}`
}

/** A specification with eleven decided sections, of which `Dependencies` holds these lines. */
export function specWith(title: string, lines: string[]): string {
  return `${tenDecided(title)}\n## Dependencies\n\nStatus: decided\n\n${lines.join("\n")}\n`
}

/** Writes the four organisation files the dependencies point at. */
export function writeOrganisation(folder: string): void {
  writeFile(folder, rolesFile, rolesText)
  writeFile(folder, systemsFile, systemsText)
  writeFile(folder, processorsFile, processorsText)
  writeFile(folder, policiesFile, policiesText)
}

/** A board entry in `stage` with one history entry. */
export function boardEntry(id: string, title: string, stage: string): Record<string, unknown> {
  return { id, title, stage, history: [{ at: "2026-11-20T15:02:11.123Z", stage }] }
}

/** Writes a board with the breach process in `approval`, with a draft its owner approved, and its `spec.md` when one is given. */
export function writeApproved(folder: string, spec?: string): void {
  writeBoard(folder, [boardEntry(breachId, breachTitle, "approval")])
  approveDraft(folder, breachId)
  if (spec !== undefined) {
    writeFile(folder, `processes/${breachId}/spec.md`, spec)
  }
}

/** Writes the organisation and the breach process with these dependency lines, and moves the process to `published`. */
export function publishBreach(folder: string, lines: string[] = sixLines) {
  writeOrganisation(folder)
  writeApproved(folder, specWith(breachTitle, lines))
  return runCommand(folder, ["move", breachId, "published"])
}

/** The value under `dependencies` of the first entry on the board. */
export function recorded(folder: string): unknown {
  return processes(folder)[0]?.dependencies
}

/** What `check` prints for these processes, each with its lines of changed dependencies. */
export function work(listed: [string, string, string[]][]): string {
  return `${[workHeading, ...listed.flatMap(([id, title, lines]) => [`${id}  ${title}`, ...lines.map((line) => `  ${line}`)])].join("\n")}\n`
}
