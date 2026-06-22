// cards-worker/test/selection.test.ts
import { describe, it, expect } from "vitest"
import { chooseSelection, isCacheable } from "../src/selection"
import type { InFlightCard } from "../src/github"

function card(over: Partial<InFlightCard> = {}): InFlightCard {
  return {
    name: "r",
    url: "https://github.com/victorstein/r",
    description: "",
    language: null,
    stars: 0,
    pushedAt: "2024-01-01T00:00:00Z",
    subject: "do a thing",
    diff: [],
    ...over,
  }
}

const four = [card({ name: "a" }), card({ name: "b" }), card({ name: "c" }), card({ name: "d" })]

describe("chooseSelection", () => {
  it("returns the live-fetched cards when the fetch succeeds", () => {
    expect(chooseSelection({ fresh: null, fetched: four, fallback: null })).toBe(four)
  })

  it("prefers the fresh cache over a live fetch", () => {
    const fresh = [card({ name: "fresh" })]
    expect(chooseSelection({ fresh, fetched: four, fallback: null })).toBe(fresh)
  })

  it("falls back to the last-known-good selection when the live fetch fails", () => {
    // fetched: null models a thrown/failed fetch. This is the regression:
    // the old code returned [] here, which rendered placeholders that Camo froze.
    expect(chooseSelection({ fresh: null, fetched: null, fallback: four })).toBe(four)
  })

  it("never returns an empty selection when any usable cards exist", () => {
    expect(chooseSelection({ fresh: null, fetched: null, fallback: four })).not.toEqual([])
  })

  it("returns empty only when the fetch fails and there is no fallback", () => {
    expect(chooseSelection({ fresh: null, fetched: null, fallback: null })).toEqual([])
  })

  it("treats an empty live result as a failure and uses the fallback", () => {
    // fetchRepos() returns [] on a non-array GitHub response, so an empty array
    // is a degraded result, not a real selection — it must not win over fallback.
    expect(chooseSelection({ fresh: null, fetched: [], fallback: four })).toBe(four)
  })
})

describe("isCacheable", () => {
  it("persists a populated selection that has at least one commit subject", () => {
    expect(isCacheable(four)).toBe(true)
  })

  it("does not persist an empty selection (would freeze blank tiles via Camo)", () => {
    expect(isCacheable([])).toBe(false)
  })

  it("does not persist an all-subjectless selection (GitHub commits API degraded)", () => {
    expect(isCacheable([card({ subject: null }), card({ subject: null })])).toBe(false)
  })
})
