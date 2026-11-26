import { readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { runCommand, usage, workingDirectory } from "./command-line.ts"

describe("process-factory with anything other than a command", () => {
  it.each([[[]], [["help"]], [["init", "extra"]], [["new"]], [["new", "a", "b", "c"]], [["move"]], [["move", "a"]], [["move", "a", "b", "c"]], [["show", "a", "b"]], [["org"]], [["org", "init", "extra"]], [["answer"]], [["answer", "a"]], [["answer", "a", "b", "c"]], [["accept-spec"]], [["accept-spec", "a", "b"]], [["round"]], [["round", "a", "b"]], [["owner", "a"]], [["owner", "a", "b", "c"]], [["approve", "a"]], [["approve", "a", "b"]], [["approve", "a", "--as", "b"]], [["approve", "a", "--by", "b", "c"]], [["respec"]], [["respec", "a", "b"]], [["edit"]], [["edit", "a", "spec.md", "new.md", "--by"]], [["edit", "a", "spec.md", "new.md", "--from", "b"]], [["check", "extra"]], [["org", "check"]], [["export"]], [["export", "a"]], [["export", "a", "--link", "https://intranet.example"]], [["export", "a", "--link", "https://intranet.example", "--format", "html"]], [["export", "a", "--format", "html", "--link"]], [["export", "a", "--format", "html", "--link", "https://intranet.example", "extra"]], [["serve", "extra"]], [["serve", "--port"]], [["serve", "--host", "0.0.0.0"]], [["serve", "--port", "0", "extra"]], [["dashboard", "extra"]], [["dashboard", "--port"]], [["dashboard", "--host", "0.0.0.0"]], [["dashboard", "--port", "0", "extra"]]])(
    "prints the usage and writes nothing for %j",
    (commandArguments) => {
      const result = runCommand(commandArguments)
      expect(result.stderr).toBe(usage)
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(readdirSync(workingDirectory)).toEqual([])
    },
  )
})
