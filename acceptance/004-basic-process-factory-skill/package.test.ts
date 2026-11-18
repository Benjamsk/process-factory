import { describe, expect, it } from "vitest"
import { binFile, isRecord, manifest, readText } from "./repository.ts"

/** The lines of the importer `.` in pnpm-lock.yaml, from the line after `  .:` up to the next top-level key. */
function rootImporterLines(): string[] {
  const lines = readText("pnpm-lock.yaml").split(/\r?\n/)
  const start = lines.indexOf("  .:")
  if (start === -1) {
    return []
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^\S/.test(line))
  return end === -1 ? rest : rest.slice(0, end)
}

/** The collapsed text under `## <title>` in README.md, up to the next heading. */
function readmeSection(title: string): string {
  const lines = readText("README.md").split(/\r?\n/)
  const start = lines.indexOf(`## ${title}`)
  if (start === -1) {
    return ""
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^#{1,6} /.test(line))
  return (end === -1 ? rest : rest.slice(0, end)).join(" ").replace(/\s+/g, " ").trim()
}

describe("package.json as an installable package", () => {
  it("is named process-factory, has the process-factory bin and ships only bin and templates", () => {
    const pkg = manifest()
    expect(pkg.name).toBe("process-factory")
    expect(pkg.bin).toEqual({ "process-factory": "./bin/process-factory.mjs" })
    expect(pkg.files).toEqual(["bin", "templates"])
    expect(pkg).not.toHaveProperty("private")
  })

  it("has a bin file that starts with #!/usr/bin/env node", () => {
    expect(readText(binFile).split(/\r?\n/)[0]).toBe("#!/usr/bin/env node")
  })

  it("runs no script at install time and installs the skill before vitest in the test script", () => {
    const scripts = manifest().scripts
    expect(scripts).not.toHaveProperty("preinstall")
    expect(scripts).not.toHaveProperty("install")
    expect(scripts).not.toHaveProperty("postinstall")
    expect(scripts).not.toHaveProperty("prepare")
    expect(scripts).toEqual({
      test: "node bin/process-factory.mjs init && vitest --project unit",
      "test:acceptance": "vitest --project acceptance",
      lint: "eslint .",
      typecheck: "tsc --noEmit -p .",
      factory: "kaizen-factory",
    })
  })

  it("has no dependencies and has @olevedeler/kaizen-factory ^1.56.0 as a devDependency", () => {
    const pkg = manifest()
    const dependencies = pkg.dependencies
    expect(isRecord(dependencies) ? Object.keys(dependencies) : []).toEqual([])
    expect(pkg).toHaveProperty(["devDependencies", "@olevedeler/kaizen-factory"], "^1.56.0")
  })
})

describe("pnpm-lock.yaml", () => {
  it("lists @olevedeler/kaizen-factory under devDependencies of the importer . and has no dependencies block there", () => {
    const lines = rootImporterLines()
    const devDependencies = lines.indexOf("    devDependencies:")
    expect(devDependencies).not.toBe(-1)
    expect(lines).not.toContain("    dependencies:")
    expect(lines.slice(devDependencies + 1)).toContain("      '@olevedeler/kaizen-factory':")
  })
})

describe("the Status section of README.md", () => {
  it("names /process <prompt> and no longer says the README describes nothing that works", () => {
    const status = readmeSection("Status")
    expect(status).toContain("/process <prompt>")
    expect(status).not.toContain("not what already works")
  })

  it("says how to install the skill in a project", () => {
    const status = readmeSection("Status")
    expect(status).toContain("pnpm add -D github:Benjamsk/process-factory")
    expect(status).toContain("pnpm exec process-factory init")
    expect(status).toContain(".claude/skills/process/SKILL.md")
  })
})
