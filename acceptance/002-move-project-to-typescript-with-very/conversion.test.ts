import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { root } from "./lintFixture.ts"

function run(args: string[]) {
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" })
}

function filesUnder(folder: string): string[] {
  const absolute = path.join(root, folder)
  if (!existsSync(absolute)) {
    return []
  }
  return readdirSync(absolute, { recursive: true, encoding: "utf8" }).map((file) => file.replaceAll("\\", "/"))
}

function compilerSettings() {
  const host: ts.ParseConfigFileHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: (...args) => ts.sys.readDirectory(...args),
    fileExists: (file) => ts.sys.fileExists(file),
    readFile: (file) => ts.sys.readFile(file),
    getCurrentDirectory: () => root,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
    },
  }
  const parsed = ts.getParsedCommandLineOfConfigFile(path.join(root, "tsconfig.json"), {}, host)
  if (parsed === undefined) {
    throw new Error("tsconfig.json could not be read")
  }
  const prefix = root.replaceAll("\\", "/") + "/"
  const files = parsed.fileNames.map((file) => file.replaceAll("\\", "/").replace(prefix, ""))
  return { options: parsed.options, files }
}

describe("source files", () => {
  it("replaces src/hello.js and src/hello.test.js with TypeScript files", () => {
    expect(existsSync(path.join(root, "src/hello.ts"))).toBe(true)
    expect(existsSync(path.join(root, "src/hello.test.ts"))).toBe(true)
    expect(existsSync(path.join(root, "src/hello.js"))).toBe(false)
    expect(existsSync(path.join(root, "src/hello.test.js"))).toBe(false)
  })

  it("keeps no JavaScript file under src/ or lint/", () => {
    expect(filesUnder("lint")).toContain("one-declaration-per-file.ts")
    const files = [...filesUnder("src"), ...filesUnder("lint")]
    expect(files.filter((file) => /\.(js|cjs|jsx)$/.test(file))).toEqual([])
  })

  it("runs the greeting with node src/hello.ts and no longer with node src/hello.js", () => {
    const typescript = run(["src/hello.ts"])
    expect(typescript.stdout).toBe("Hello. world!\n")
    expect(typescript.stderr).toBe("")
    expect(typescript.status).toBe(0)

    const javascript = run(["src/hello.js"])
    expect(javascript.stdout).toBe("")
    expect(javascript.status).not.toBe(0)
  })
})

describe("package.json", () => {
  const manifest: unknown = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))

  it("is an ES module package with src/hello.ts as main and Node 24.11 as the minimum", () => {
    expect(manifest).toMatchObject({
      type: "module",
      main: "src/hello.ts",
      engines: { node: ">=24.11.0" },
    })
  })

  it("has @typescript-eslint/utils as a devDependency and unchanged scripts", () => {
    expect(manifest).toHaveProperty(["devDependencies", "@typescript-eslint/utils"])
    expect(manifest).toHaveProperty("scripts", {
      test: "vitest --project unit",
      "test:acceptance": "vitest --project acceptance",
      lint: "eslint .",
      typecheck: "tsc --noEmit -p .",
      factory: "kaizen-factory",
    })
  })
})

describe("tsconfig.json", () => {
  it("sets strict and the seven added options to true", () => {
    expect(compilerSettings().options).toMatchObject({
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      noImplicitOverride: true,
      noFallthroughCasesInSwitch: true,
      verbatimModuleSyntax: true,
      allowImportingTsExtensions: true,
      erasableSyntaxOnly: true,
    })
  })

  it("checks no JavaScript and covers src, lint and acceptance", () => {
    const { options, files } = compilerSettings()
    expect(options.allowJs).not.toBe(true)
    expect(options.checkJs).not.toBe(true)
    expect(files).toEqual(
      expect.arrayContaining([
        "src/hello.ts",
        "src/hello.test.ts",
        "lint/one-declaration-per-file.ts",
        "acceptance/002-move-project-to-typescript-with-very/conversion.test.ts",
      ]),
    )
    expect(files.filter((file) => /\.(js|cjs|mjs|jsx)$/.test(file))).toEqual([])
  })

  it("passes the type check of the whole project", () => {
    const result = run(["node_modules/typescript/bin/tsc", "--noEmit", "-p", "."])
    expect(result.stdout).toBe("")
    expect(result.status).toBe(0)
  }, 180_000)
})
