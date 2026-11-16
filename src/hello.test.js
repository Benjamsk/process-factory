import { describe, expect, it } from "vitest"
import { hello } from "./hello.js"

describe("hello", () => {
  it("returns exactly the string Hello. world!", () => {
    expect(hello()).toBe("Hello. world!")
  })
})
