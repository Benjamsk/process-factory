import path from "node:path"
import { ESLintUtils } from "@typescript-eslint/utils"
import type { TSESTree } from "@typescript-eslint/utils"

const declarationKinds = {
  ClassDeclaration: "class",
  TSInterfaceDeclaration: "interface",
  TSTypeAliasDeclaration: "type alias",
  TSEnumDeclaration: "enum",
} as const

function baseNameOf(fileName: string): string {
  return path.parse(fileName).name
}

export const oneDeclarationPerFile = ESLintUtils.RuleCreator.withoutDocs<[], "tooMany" | "nameMismatch">({
  meta: {
    type: "problem",
    docs: {
      description: "Allow at most one class, interface, type alias or enum per file and name the file after it.",
    },
    schema: [],
    messages: {
      tooMany:
        'A file declares at most one class, interface, type alias or enum. Move "{{name}}" to its own file "{{name}}{{extension}}".',
      nameMismatch: 'The file "{{fileName}}" declares the {{kind}} "{{name}}" and must be named "{{name}}{{extension}}".',
    },
    defaultOptions: [],
  },
  create(context) {
    const fileName = path.basename(context.filename)
    const extension = path.extname(fileName)
    let countedDeclarations = 0

    function checkDeclaration(
      node:
        | TSESTree.ClassDeclaration
        | TSESTree.TSInterfaceDeclaration
        | TSESTree.TSTypeAliasDeclaration
        | TSESTree.TSEnumDeclaration,
    ): void {
      const identifier = node.id
      if (identifier === null) {
        return
      }
      countedDeclarations += 1
      const name = identifier.name
      if (countedDeclarations > 1) {
        context.report({ node: identifier, messageId: "tooMany", data: { name, extension } })
        return
      }
      if (name !== baseNameOf(fileName)) {
        context.report({ node: identifier, messageId: "nameMismatch", data: { fileName, kind: declarationKinds[node.type], name, extension } })
      }
    }

    return {
      ClassDeclaration: checkDeclaration,
      TSInterfaceDeclaration: checkDeclaration,
      TSTypeAliasDeclaration: checkDeclaration,
      TSEnumDeclaration: checkDeclaration,
    }
  },
})
