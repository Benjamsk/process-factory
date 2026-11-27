import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { root } from "../006-process-state-machine/store.ts"

/** The design tokens of section 3.1 of the spec, each with its value. */
export const tokens: [string, string][] = [
  ["--page", "#ffffff"],
  ["--surface", "#f5f6f7"],
  ["--border", "#c4c7cc"],
  ["--text", "#1b1b1b"],
  ["--muted", "#55595f"],
  ["--link", "#11467b"],
  ["--done-text", "#14532d"],
  ["--done-surface", "#e6f4ea"],
  ["--now-text", "#11467b"],
  ["--now-surface", "#e3edf7"],
  ["--stop-text", "#7a1f1f"],
  ["--stop-surface", "#fbe9e7"],
  ["--size-small", "0.875rem"],
  ["--size-body", "1rem"],
  ["--size-h3", "1.125rem"],
  ["--size-h2", "1.375rem"],
  ["--size-h1", "1.75rem"],
  ["--space-1", "0.25rem"],
  ["--space-2", "0.5rem"],
  ["--space-3", "1rem"],
  ["--space-4", "1.5rem"],
  ["--space-5", "2rem"],
  ["--radius", "0.375rem"],
  ["--line", "1px"],
  ["--measure", "40rem"],
]
/** The pairs of a text colour and the colour it stands on that must have a contrast of 4.5:1. */
export const pairs: [string, string][] = [
  ["--text", "--page"],
  ["--muted", "--page"],
  ["--link", "--page"],
  ["--text", "--surface"],
  ["--muted", "--surface"],
  ["--link", "--surface"],
  ["--done-text", "--done-surface"],
  ["--now-text", "--now-surface"],
  ["--stop-text", "--stop-surface"],
]
/** The ten stages in the order of the state machine. */
export const stages = ["intake", "clarify", "spec", "cases", "draft", "review", "rework", "approval", "published", "regenerate"]

/** The text of a file of the repository with one kind of line break, or an empty string when it is not there. */
export function repositoryFile(file: string): string {
  const absolute = path.join(root, file)
  return existsSync(absolute) ? readFileSync(absolute, "utf8").replace(/\r\n/g, "\n") : ""
}

/** What stands inside the `<style>` element of a page, or an empty string when it has none. */
export function styleOf(page: string): string {
  return /<style>(.*?)<\/style>/s.exec(page)?.[1] ?? ""
}

/** The custom properties a style declares, each with the value of its first declaration. */
export function declaredTokens(style: string): Map<string, string> {
  const declared = new Map<string, string>()
  for (const match of style.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/g)) {
    const name = match[1] ?? ""
    if (!declared.has(name)) declared.set(name, (match[2] ?? "").trim())
  }
  return declared
}

/** The relative luminance of a colour `#rrggbb`, as WCAG 2 defines it. */
function luminance(colour: string): number {
  const channel = (start: number): number => {
    const value = Number.parseInt(colour.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** The contrast of two colours `#rrggbb`, from 1 to 21. */
export function contrast(first: string, second: string): number {
  const lighter = Math.max(luminance(first), luminance(second))
  const darker = Math.min(luminance(first), luminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

/** The trail of the spec for a process: `now` is the stage it is in and `passed` the other stages its history names. */
export function trail(now: string, passed: string[]): string {
  const items = stages.map((stage) => {
    if (stage === now) return `<li class="now" aria-current="step">${stage}: current</li>`
    return passed.includes(stage) ? `<li class="done">${stage}: passed</li>` : `<li>${stage}</li>`
  })
  return `<ol class="trail">${items.join("")}</ol>`
}

/** The trail on a card or in a header, without the whitespace between its elements, or an empty string when there is none or more than one. */
export function trailOf(html: string): string {
  const found = [...html.matchAll(/<ol class="trail">.*?<\/ol>/gs)]
  return found.length === 1 ? (found[0]?.[0] ?? "").replace(/>\s+</g, "><") : ""
}
