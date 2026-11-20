import { readFile, root } from "../010-clarifying-questions/clarify.ts"

export const simulationTemplate = "templates/skills/process/simulation-reviewer.md"
export const simulationCopy = ".claude/skills/process/simulation-reviewer.md"

/** The content of every fenced code block of the simulation reviewer template, without the fence lines, in order. */
export function fencedBlocks(): string[] {
  const blocks: string[] = []
  let fence = ""
  let block: string[] = []
  for (const line of readFile(root, simulationTemplate).split(/\r?\n/)) {
    const marks = /^(`{3,})/.exec(line)?.[1] ?? ""
    if (fence === "" && marks !== "") {
      fence = marks
      block = []
    } else if (fence !== "" && line === fence) {
      blocks.push(`${block.join("\n")}\n`)
      fence = ""
    } else if (fence !== "") {
      block.push(line)
    }
  }
  return blocks
}
