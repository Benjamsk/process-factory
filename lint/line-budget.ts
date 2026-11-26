import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

/** The most lines a tracked `.ts` or `.mjs` file of this repository may have. */
export const lineBudget = 600

/**
 * One text `<path>: <n> lines` per tracked `.ts` or `.mjs` file of the git repository at `root` that has more than
 * `lineBudget` lines, in the order git lists them. A line ends at `\r\n`, `\n` or `\r`, and the empty text after the
 * last line break is not a line. A tracked file that is not on disk is left out.
 */
export function filesOverBudget(root: string): string[] {
  const tracked = execFileSync("git", ["ls-files", "-z", "--", "*.ts", "*.mjs"], { cwd: root, encoding: "utf8" })
  return tracked.split("\0").flatMap((file) => {
    if (file === "" || !existsSync(path.join(root, file))) return []
    const lines = readFileSync(path.join(root, file), "utf8").split(/\r\n|[\n\r]/)
    const count = lines.at(-1) === "" ? lines.length - 1 : lines.length
    return count > lineBudget ? [`${file}: ${String(count)} lines`] : []
  })
}
