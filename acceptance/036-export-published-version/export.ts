import { runCommand } from "../006-process-state-machine/store.ts"
import { compact, laptopId } from "../026-reading-view-on-localhost/view.ts"

/** The address of the reading view as employees reach it. */
export const address = "https://intranet.example/processes"
/** The link of the export of version 2 of the process of the acceptance criteria. */
export const link = `${address}/${laptopId}/2`
export const htmlFile = `exports/${laptopId}-v2.html`
export const markdownFile = `exports/${laptopId}-v2.md`
export const linkRefusal = "process-factory: the link must be an address that starts with http:// or https://, without a user name, a query or a fragment\n"

/** Runs `export` in the fixed form of the usage. */
export function runExport(project: string, format: string, to = address, id = laptopId) {
  return runCommand(project, ["export", id, "--format", format, "--link", to])
}

/** The six paragraphs of the stamp of an HTML export, without whitespace between them. The values are given as the page holds them, escaped. */
export function htmlStamp(title: string, version: number, owner: string, by: string, on: string, to: string): string {
  return [
    `<p><strong>${title}</strong></p>`,
    `<p>Version ${String(version)}</p>`,
    `<p>Owner: ${owner}</p>`,
    `<p>Approved by: ${by}</p>`,
    `<p>Approved on: ${on}</p>`,
    `<p>This is a copy. The reading view is the source of truth, and the current version is at <a href="${to}">${to}</a>.</p>`,
  ].join("")
}

/** The stamp of a Markdown export. The values are given as the file holds them, escaped. */
export function markdownStamp(title: string, version: number, owner: string, by: string, on: string, to: string): string {
  return [
    `**${title}**`,
    "",
    `- Version ${String(version)}`,
    `- Owner: ${owner}`,
    `- Approved by: ${by}`,
    `- Approved on: ${on}`,
    "",
    `This is a copy. The reading view is the source of truth, and the current version is at <${to}>.`,
  ].join("\n")
}

/** What stands inside the `<body>` element of a page, without the whitespace between its elements. */
export function bodyOf(page: string): string {
  return compact(/<body>(.*)<\/body>/s.exec(page)?.[1] ?? "")
}

/** What stands inside the first element with this tag of a page, without the whitespace between its elements. */
export function elementOf(page: string, tag: string): string {
  return compact(new RegExp(`<${tag}>(.*?)</${tag}>`, "s").exec(page)?.[1] ?? "")
}
