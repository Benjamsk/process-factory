import { describe, expect, it, vi } from "vitest"
import { oneDeclarationRule, reportsOf, ruleSetting } from "./lintFixture.ts"

vi.setConfig({ testTimeout: 120_000 })

const fixtureFolder = "acceptance/002-move-project-to-typescript-with-very/fixtures"

function tooMany(name: string, line: number) {
  return {
    messageId: "tooMany",
    message: `A file declares at most one class, interface, type alias or enum. Move "${name}" to its own file "${name}.ts".`,
    line,
    severity: 2,
  }
}

function nameMismatch(file: string, kind: string, name: string, line: number) {
  return {
    messageId: "nameMismatch",
    message: `The file "${file}" declares the ${kind} "${name}" and must be named "${name}.ts".`,
    line,
    severity: 2,
  }
}

/** The rule's reports for `text` in the fixture; fails when the rule is not switched on for that file. */
async function reports(fixture: string, text: string) {
  expect(await ruleSetting(`${fixtureFolder}/${fixture}`, oneDeclarationRule)).toEqual([2])
  return reportsOf(fixture, text, oneDeclarationRule)
}

describe("lint/one-declaration-per-file.ts", () => {
  it("exports the rule module oneDeclarationPerFile", async () => {
    const ruleModule = await import("../../lint/one-declaration-per-file.ts")
    expect(ruleModule.oneDeclarationPerFile.meta.type).toBe("problem")
    expect(typeof ruleModule.oneDeclarationPerFile.create).toBe("function")
  })
})

describe("local/one-declaration-per-file: files it accepts", () => {
  it.each([
    ["class", 'export class Greeter {\n  greet(): string {\n    return "Hello"\n  }\n}\n'],
    ["interface", "export interface Greeter {\n  greet(): string\n}\n"],
    ["type alias", "export type Greeter = { greet(): string }\n"],
  ])("accepts one %s named Greeter in Greeter.ts", async (_kind, text) => {
    expect(await reports("Greeter.ts", text)).toEqual([])
  })

  it("accepts one class next to functions, constants and a class expression", async () => {
    const text = [
      'const punctuation = "!"',
      "export function shout(text: string): string {",
      "  return text + punctuation",
      "}",
      "export class Greeter {",
      "  greet(): string {",
      '    return shout("Hello")',
      "  }",
      "}",
      "export const Anonymous = class {",
      "  name = punctuation",
      "}",
      "",
    ].join("\n")
    expect(await reports("Greeter.ts", text)).toEqual([])
  })

  it("accepts a file without a class, interface, type alias or enum, whatever its name", async () => {
    const text = 'export function hello(): string {\n  return "Hello. world!"\n}\n'
    expect(await reports("Welcome.ts", text)).toEqual([])
    expect(await reports("Greeter.spec.ts", text)).toEqual([])
  })
})

describe("local/one-declaration-per-file: more than one declaration", () => {
  it("reports the class that shares a file with its interface", async () => {
    const text = [
      "export interface Greeter {",
      "  greet(): string",
      "}",
      "export class PoliteGreeter implements Greeter {",
      "  greet(): string {",
      '    return "Good day"',
      "  }",
      "}",
      "",
    ].join("\n")
    expect(await reports("Greeter.ts", text)).toEqual([tooMany("PoliteGreeter", 4)])
  })

  it("reports every declaration after the first: class, interface, type alias and enum", async () => {
    const text = [
      "export class Greeter {",
      '  name = "Ada"',
      "}",
      "interface Options {",
      "  loud: boolean",
      "}",
      "type Mood = string",
      "enum Colour {",
      "  Red,",
      "}",
      "export class Second {",
      '  name = "Bo"',
      "}",
      "export const used: [Options, Mood, Colour] | undefined = undefined",
      "",
    ].join("\n")
    expect(await reports("Greeter.ts", text)).toEqual([
      tooMany("Options", 4),
      tooMany("Mood", 7),
      tooMany("Colour", 8),
      tooMany("Second", 11),
    ])
  })

  it("reports both problems when the first declaration is also not named after the file", async () => {
    const text = "export type Mood = string\nexport type Tone = string\n"
    expect(await reports("Greeter.ts", text)).toEqual([
      nameMismatch("Greeter.ts", "type alias", "Mood", 1),
      tooMany("Tone", 2),
    ])
  })
})

describe("local/one-declaration-per-file: file name", () => {
  const greeterClass = 'export class Greeter {\n  name = "Ada"\n}\n'

  it("reports a class in a file with another name", async () => {
    expect(await reports("Welcome.ts", greeterClass)).toEqual([nameMismatch("Welcome.ts", "class", "Greeter", 1)])
  })

  it("compares the name case-sensitively", async () => {
    expect(await reports("lowercase/greeter.ts", greeterClass)).toEqual([
      nameMismatch("greeter.ts", "class", "Greeter", 1),
    ])
  })

  it("takes only the final extension off the file name to get the base name", async () => {
    expect(await reports("Greeter.spec.ts", greeterClass)).toEqual([
      nameMismatch("Greeter.spec.ts", "class", "Greeter", 1),
    ])
  })

  it.each([
    ["interface", "export interface Greeter {\n  greet(): string\n}\n"],
    ["type alias", "export type Greeter = { greet(): string }\n"],
    ["enum", "export enum Greeter {\n  Formal,\n}\n"],
  ])("names the kind %s in the message", async (kind, text) => {
    expect(await reports("Welcome.ts", text)).toEqual([nameMismatch("Welcome.ts", kind, "Greeter", 1)])
  })
})

describe("local/one-declaration-per-file: nested declarations", () => {
  it("counts a class declared inside a function like one at the top level", async () => {
    const text = [
      "export interface Greeter {",
      "  greet(): string",
      "}",
      "export function makeGreeter(): Greeter {",
      "  class Inner implements Greeter {",
      "    greet(): string {",
      '      return "Hello"',
      "    }",
      "  }",
      "  return new Inner()",
      "}",
      "",
    ].join("\n")
    expect(await reports("Greeter.ts", text)).toEqual([tooMany("Inner", 5)])
  })

  it("requires a single nested declaration to be named after the file", async () => {
    const text = [
      "export function makeGreeter(): object {",
      "  class Inner {",
      '    name = "Ada"',
      "  }",
      "  return new Inner()",
      "}",
      "",
    ].join("\n")
    expect(await reports("Welcome.ts", text)).toEqual([nameMismatch("Welcome.ts", "class", "Inner", 2)])
  })
})
