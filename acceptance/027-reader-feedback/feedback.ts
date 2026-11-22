import { request as httpRequest } from "node:http"
import { laptopId } from "../026-reading-view-on-localhost/view.ts"
import type { Answer } from "./Answer.ts"

export const laptopPath = `/${laptopId}`
/** The address a reader of version 2 posts feedback to. */
export const feedbackPath = `${laptopPath}/2/feedback`
export const feedbackFolder = `processes/${laptopId}/feedback`
/** The post of the acceptance criteria. */
export const fields = { kind: "document", step: "1", text: "I did not understand step one.", name: "Ola Hansen" }

/** Sends a request with a body to the view, on a connection of its own. An answer that arrived counts, also when the server closes the connection early. */
export function send(address: string, pathname: string, body: string, more: { method?: string; headers?: Record<string, string> } = {}): Promise<Answer> {
  const url = new URL(address)
  return new Promise<Answer>((resolve, reject) => {
    let answer: Answer | undefined
    const fail = (error: Error): void => {
      if (answer === undefined) reject(error)
      else resolve(answer)
    }
    const sent = httpRequest(
      {
        host: url.hostname,
        port: url.port,
        path: pathname,
        method: more.method ?? "POST",
        agent: false,
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": String(Buffer.byteLength(body)), ...more.headers },
      },
      (response) => {
        const received: Answer = { status: response.statusCode ?? 0, headers: response.headers, body: "" }
        answer = received
        response.setEncoding("utf8")
        response.on("data", (chunk: string) => {
          received.body += chunk
        })
        response.on("end", () => {
          resolve(received)
        })
        response.on("error", fail)
      },
    )
    sent.on("error", fail)
    sent.end(body)
  })
}

/** Posts form fields to the view as `application/x-www-form-urlencoded`. */
export function post(address: string, pathname: string, values: Record<string, string>, headers: Record<string, string> = {}): Promise<Answer> {
  return send(address, pathname, new URLSearchParams(values).toString(), { headers })
}

/** A page with every run of whitespace as one space and none between two tags. */
export function flat(html: string): string {
  return html.replace(/\s+/g, " ").replace(/> </g, "><").trim()
}

/** The number of forms on a page. */
export function forms(html: string): number {
  return html.split("<form").length - 1
}

/** The text of a feedback file as the view writes it: the title, the given lines above the text, and the text. */
export function feedbackText(number: number, lines: string[], text: string): string {
  return `# Feedback ${String(number)}\n\n${lines.join("\n")}\n\n## Text\n\n${text}\n`
}

/** The lines above the text of a feedback file of the process of the acceptance criteria. */
export function feedbackLines(version: number, step: string, kind: string, status = "open"): string[] {
  return [`Process: ${laptopId}`, `Version: ${String(version)}`, `Step: ${step}`, `Kind: ${kind}`, "From: Ola Hansen", "Received at: 2026-11-22T10:15:00.000Z", `Status: ${status}`]
}
