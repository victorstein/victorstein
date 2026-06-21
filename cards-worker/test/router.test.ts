// cards-worker/test/router.test.ts
import { describe, it, expect } from "vitest"
import { parseRoute } from "../src/router"

describe("parseRoute", () => {
  it("parses an svg slot route", () => {
    expect(parseRoute("/in-flight/0.svg")).toEqual({ slot: 0, svg: true })
  })
  it("parses a redirect slot route", () => {
    expect(parseRoute("/in-flight/3")).toEqual({ slot: 3, svg: false })
  })
  it("rejects out-of-range slots", () => {
    expect(parseRoute("/in-flight/4")).toBeNull()
    expect(parseRoute("/in-flight/4.svg")).toBeNull()
  })
  it("rejects non-numeric and unknown paths", () => {
    expect(parseRoute("/in-flight/x")).toBeNull()
    expect(parseRoute("/in-flight/")).toBeNull()
    expect(parseRoute("/")).toBeNull()
    expect(parseRoute("/in-flight/0.png")).toBeNull()
  })
})
