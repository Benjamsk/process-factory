import { writeBoard, writeFile } from "../006-process-state-machine/store.ts"

export const processId = "001-handle-a-lost-laptop"
export const specFile = `processes/${processId}/spec.md`
export const enteredSpec = { at: "2026-11-19T15:40:02.456Z", stage: "spec" }
/** The ten sections of a specification, in the order of `spec-writer.md`. */
export const sections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records"]
export const openLine = `process-factory: cannot accept the spec of ${processId}: these sections of ${specFile} are open`
export const staysLine = `process-factory: ${processId} stays in spec: /process next ${processId} writes the questions for the open sections`

/** One section of a specification in the form of `spec-writer.md`, decided or open. */
export function sectionText(name: string, decided: boolean): string {
  return decided ? `## ${name}\n\nStatus: decided\n\nSettled.\n` : `## ${name}\n\nStatus: open\n\n- Question: What is still missing here?\n`
}

/** A specification with the ten sections in order, decided except those named in `open`. */
export function specText(open: string[] = []): string {
  return `# Specification: Handle a lost laptop\n\n${sections.map((name) => sectionText(name, !open.includes(name))).join("\n")}`
}

/** Writes a board with the one process in `stage`, and its `spec.md` when `spec` is given. */
export function writeProcess(folder: string, stage: string, spec?: string): void {
  writeBoard(folder, [{ id: processId, title: "Handle a lost laptop", stage, history: [{ at: "2026-11-19T15:02:11.123Z", stage: "intake" }, enteredSpec] }])
  if (spec !== undefined) {
    writeFile(folder, specFile, spec)
  }
}

/** The standard error of a refusal that names these open sections and leaves the process in `spec`. */
export function staysRefusal(open: string[]): string {
  return `${[openLine, ...open.map((name) => `  ${name}`), staysLine].join("\n")}\n`
}
