import { TSESLint } from "@typescript-eslint/utils"
import tseslint from "typescript-eslint"
import { describe, expect, it } from "vitest"
import { oneDeclarationPerFile } from "./one-declaration-per-file.ts"

const linter = new TSESLint.Linter({ configType: "flat" })
const local = { rules: { "one-declaration-per-file": oneDeclarationPerFile } }

function lint(fileName: string, text: string) {
  const messages = linter.verify(
    text,
    [
      {
        files: ["**/*.ts"],
        languageOptions: { parser: tseslint.parser },
        plugins: { local },
        rules: { "local/one-declaration-per-file": "error" },
      },
      {
        files: ["**/*.mjs"],
        plugins: { local },
        rules: { "local/one-declaration-per-file": "error" },
      },
    ],
    { filename: fileName },
  )
  return messages.map((message) => ({ messageId: message.messageId, message: message.message, line: message.line }))
}

function tooMany(name: string, line: number, extension = ".ts") {
  return {
    messageId: "tooMany",
    message: `A file declares at most one class, interface, type alias or enum. Move "${name}" to its own file "${name}${extension}".`,
    line,
  }
}

function nameMismatch(fileName: string, kind: string, name: string, line: number, extension = ".ts") {
  return {
    messageId: "nameMismatch",
    message: `The file "${fileName}" declares the ${kind} "${name}" and must be named "${name}${extension}".`,
    line,
  }
}

describe("oneDeclarationPerFile", () => {
  it("is a problem rule without options and without a fixer", () => {
    expect(oneDeclarationPerFile.meta.type).toBe("problem")
    expect(oneDeclarationPerFile.meta.schema).toEqual([])
    expect(oneDeclarationPerFile.meta.fixable).toBeUndefined()
  })

  it("accepts a file without a counted declaration", () => {
    expect(lint("anything.ts", "export function hello(): string {\n  return \"Hello\"\n}\n")).toEqual([])
  })

  it.each([
    ["class", "export class Greeter {}\n"],
    ["interface", "export interface Greeter {\n  name: string\n}\n"],
    ["type alias", "export type Greeter = string\n"],
    ["enum", "export enum Greeter {\n  Formal,\n}\n"],
  ])("accepts one %s named after the file", (_kind, text) => {
    expect(lint("src/Greeter.ts", text)).toEqual([])
  })

  it("does not count functions, variables, class expressions, imports or re-exports", () => {
    const text = [
      'import { Thing } from "./Thing.ts"',
      'export { Other } from "./Other.ts"',
      "export const Anonymous = class {}",
      "export function make(): Thing {",
      "  return new Thing()",
      "}",
      "",
    ].join("\n")
    expect(lint("src/sample.ts", text)).toEqual([])
  })

  it("does not count an unnamed default exported class", () => {
    expect(lint("src/sample.ts", "export default class {}\n")).toEqual([])
  })

  it("reports every declaration after the first with tooMany", () => {
    const text = "export class Greeter {}\ninterface Options {}\ntype Mood = string\nenum Colour {\n  Red,\n}\n"
    expect(lint("src/Greeter.ts", text)).toEqual([tooMany("Options", 2), tooMany("Mood", 3), tooMany("Colour", 4)])
  })

  it.each([
    ["class", "export class Greeter {}\n"],
    ["interface", "export interface Greeter {}\n"],
    ["type alias", "export type Greeter = string\n"],
    ["enum", "export enum Greeter {\n  Formal,\n}\n"],
  ])("reports a %s that is not named after the file with nameMismatch", (kind, text) => {
    expect(lint("src/folder/Welcome.ts", text)).toEqual([nameMismatch("Welcome.ts", kind, "Greeter", 1)])
  })

  it("compares the name case-sensitively and removes only the final extension", () => {
    expect(lint("greeter.ts", "class Greeter {}\n")).toEqual([nameMismatch("greeter.ts", "class", "Greeter", 1)])
    expect(lint("Greeter.test.ts", "class Greeter {}\n")).toEqual([
      nameMismatch("Greeter.test.ts", "class", "Greeter", 1),
    ])
  })

  it("reports both problems when the first declaration is misnamed and a second follows", () => {
    expect(lint("Greeter.ts", "type Mood = string\ntype Tone = string\n")).toEqual([
      nameMismatch("Greeter.ts", "type alias", "Mood", 1),
      tooMany("Tone", 2),
    ])
  })

  it("names the file a class of a .mjs file needs with .mjs", () => {
    expect(lint("bin/tools.mjs", "class Greeter {}\n")).toEqual([nameMismatch("tools.mjs", "class", "Greeter", 1, ".mjs")])
    expect(lint("bin/Greeter.mjs", "class Greeter {}\nclass Other {}\n")).toEqual([tooMany("Other", 2, ".mjs")])
  })

  it("accepts a .mjs file with only functions and constants", () => {
    const text = 'const punctuation = "!"\nexport function shout(text) {\n  return text + punctuation\n}\n'
    expect(lint("bin/tools.mjs", text)).toEqual([])
  })

  it("counts a declaration nested in a function like one at the top level", () => {
    const text = "export interface Greeter {}\nexport function make(): object {\n  class Inner {}\n  return new Inner()\n}\n"
    expect(lint("Greeter.ts", text)).toEqual([tooMany("Inner", 3)])
    expect(lint("Welcome.ts", "export function make(): object {\n  class Inner {}\n  return new Inner()\n}\n")).toEqual([
      nameMismatch("Welcome.ts", "class", "Inner", 2),
    ])
  })
})
