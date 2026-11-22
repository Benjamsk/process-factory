import type { IncomingHttpHeaders } from "node:http"

/** What the view answered to a request. */
export interface Answer {
  status: number
  headers: IncomingHttpHeaders
  body: string
}
