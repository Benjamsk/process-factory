import path from "node:path"
import { ESLint } from "eslint"
import type { Linter } from "eslint"

export const root = path.resolve(import.meta.dirname, "../..")
export const oneDeclarationRule = "local/one-declaration-per-file"

const fixtures = path.join(import.meta.dirname, "fixtures")
const eslint = new ESLint({ cwd: root })

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/** Lints `text` with the repository's ESLint configuration, as if it were the content of the fixture file. */
export async function lintFixture(fixture: string, text: string): Promise<Linter.LintMessage[]> {
  const results = await eslint.lintText(text, { filePath: path.join(fixtures, fixture) })
  const messages = results.flatMap((result) => result.messages)
  const fatal = messages.find((message) => message.fatal === true)
  if (fatal !== undefined) {
    throw new Error(`ESLint could not parse the fixture ${fixture}: ${fatal.message}`)
  }
  return messages
}

/** The messages of one rule, reduced to what the tests assert. */
export async function reportsOf(fixture: string, text: string, rule: string) {
  const messages = await lintFixture(fixture, text)
  return messages
    .filter((message) => message.ruleId === rule)
    .map((message) => ({
      messageId: message.messageId,
      message: message.message,
      line: message.line,
      severity: message.severity,
    }))
}

/** The setting of `rule` for `file` (a path relative to the repository root), as ESLint resolves it: `[severity, ...options]`. */
export async function ruleSetting(file: string, rule: string): Promise<unknown> {
  const config: unknown = await eslint.calculateConfigForFile(path.join(root, file))
  if (!isRecord(config) || !isRecord(config.rules)) {
    return undefined
  }
  return config.rules[rule]
}
