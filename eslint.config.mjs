import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import { lineBudget } from "./lint/line-budget.ts"
import { oneDeclarationPerFile } from "./lint/one-declaration-per-file.ts"

const local = { rules: { "one-declaration-per-file": oneDeclarationPerFile } }

export default tseslint.config(
  { ignores: ["node_modules/", ".claude/", "factory/"] },
  js.configs.recommended,
  { rules: { "max-lines": ["error", { max: lineBudget }] } },
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { local },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true, "ts-check": false },
      ],
      "@typescript-eslint/no-require-imports": "error",
      "local/one-declaration-per-file": "error",
    },
  },
  {
    files: ["**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
    plugins: { local },
    rules: { "local/one-declaration-per-file": "error" },
  },
)
