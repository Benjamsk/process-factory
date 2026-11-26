import { statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { root } from "../006-process-state-machine/store.ts"
import {
  binFiles,
  entryFile,
  exportedNames,
  importedFiles,
  importedNames,
  imports,
  levels,
  lineCount,
  missingFiles,
  presentNames,
  source,
  sourceWithoutImports,
} from "./modules.ts"

describe("the folder bin", () => {
  it("holds exactly the twelve files of the spec and no subfolder", () => {
    expect(presentNames()).toEqual([
      "dashboard.mjs",
      "dependencies.mjs",
      "export.mjs",
      "organisation.mjs",
      "panel.mjs",
      "process-factory.mjs",
      "reading-view.mjs",
      "review.mjs",
      "skill.mjs",
      "state-machine.mjs",
      "store.mjs",
      "usage.mjs",
    ])
    expect(presentNames().filter((name) => !statSync(path.join(root, "bin", name)).isFile())).toEqual([])
  })

  it("has no file longer than 1000 lines", () => {
    const tooLong = presentNames()
      .filter((name) => statSync(path.join(root, "bin", name)).isFile())
      .filter((name) => lineCount(name) > 1000)

    expect(tooLong).toEqual([])
  })

  it("has the usage text in usage.mjs and in no other file", () => {
    const withUsage = presentNames()
      .filter((name) => statSync(path.join(root, "bin", name)).isFile())
      .filter((name) => source(name).includes("Usage: process-factory init"))

    expect(withUsage).toEqual(["usage.mjs"])
  })
})

describe("bin/process-factory.mjs", () => {
  it("starts with #!/usr/bin/env node, is at most 60 lines long and declares no function", () => {
    const text = source(entryFile)

    expect(text.split(/\r?\n/)[0]).toBe("#!/usr/bin/env node")
    expect(lineCount(entryFile)).toBeLessThanOrEqual(60)
    expect(text).not.toMatch(/^\s*(?:export\s+)?(?:async\s+)?function\b/m)
  })
})

describe("the imports of the files of bin", () => {
  it("name only node: built-ins and files ./<name>.mjs that exist in bin", () => {
    expect(missingFiles()).toEqual([])

    const wrong = binFiles.flatMap((name) =>
      imports(name)
        .filter((specifier) => !specifier.startsWith("node:") && !binFiles.map((file) => `./${file}`).includes(specifier))
        .map((specifier) => `${name} imports ${specifier}`),
    )

    expect(wrong).toEqual([])
  })

  it("are all used: every imported name stands in its file outside the import statements", () => {
    expect(missingFiles()).toEqual([])

    const unused = binFiles.flatMap((name) => {
      const text = sourceWithoutImports(name)
      return importedNames(name)
        .filter(({ local }) => !new RegExp(String.raw`\b${local}\b`).test(text))
        .map(({ local, from }) => `${name} does not use ${local} of ${from}`)
    })

    expect(unused).toEqual([])
  })

  it("go one way, in the order of the spec: each file imports only files of a lower level", () => {
    expect(missingFiles()).toEqual([])

    const wrong = levels.flatMap((files, level) => {
      const lower = level === 1 ? ["store.mjs"] : levels.slice(0, level).flat()
      return files.flatMap((name) =>
        importedFiles(name)
          .filter((imported) => !lower.includes(imported))
          .map((imported) => `${name} imports ${imported}`),
      )
    })

    expect(wrong).toEqual([])
  })

  it("reach every other file of bin from process-factory.mjs, directly or through others", () => {
    expect(missingFiles()).toEqual([])

    const reached = new Set([entryFile])
    const waiting = [entryFile]
    for (let name = waiting.pop(); name !== undefined; name = waiting.pop()) {
      for (const imported of importedFiles(name)) {
        if (!binFiles.includes(imported) || reached.has(imported)) continue
        reached.add(imported)
        waiting.push(imported)
      }
    }

    expect([...reached].sort()).toEqual(binFiles)
  })
})

describe("the exports of the files of bin", () => {
  it("are all imported by another file of bin", () => {
    expect(missingFiles()).toEqual([])

    const wanted = new Set(binFiles.flatMap((name) => importedNames(name).map(({ imported, from }) => `${from} ${imported}`)))
    const unused = binFiles.flatMap((name) =>
      exportedNames(name)
        .filter((exported) => !wanted.has(`./${name} ${exported}`))
        .map((exported) => `no file imports ${exported} of ${name}`),
    )

    expect(unused).toEqual([])
  })

  it("hold every name another file of bin imports from them", () => {
    expect(missingFiles()).toEqual([])

    const absent = binFiles.flatMap((name) =>
      importedNames(name)
        .filter(({ from }) => !from.startsWith("node:"))
        .filter(({ imported, from }) => !exportedNames(from.replace(/^\.\//, "")).includes(imported))
        .map(({ imported, from }) => `${name} imports ${imported}, which ${from} does not export`),
    )

    expect(absent).toEqual([])
  })
})
