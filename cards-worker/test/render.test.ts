// cards-worker/test/render.test.ts
import { describe, it, expect } from "vitest"
import { escapeXml, renderCard, renderPlaceholder, relativeTime } from "../src/render"
import type { InFlightCard } from "../src/github"

const card: InFlightCard = {
  name: "tawtui",
  url: "https://github.com/victorstein/tawtui",
  description: "A TUI on top of Taskwarrior",
  language: "TypeScript",
  stars: 42,
}

describe("escapeXml", () => {
  it("escapes XML-significant characters", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe("a &amp; b &lt; c &gt; d &quot; e &apos; f")
  })
})

describe("renderCard", () => {
  it("is a self-contained svg with no external refs or scripts", () => {
    const svg = renderCard(card)
    expect(svg.startsWith("<svg")).toBe(true)
    expect(svg).not.toContain("<script")
    expect(svg).not.toContain("<image")
    expect(svg).not.toMatch(/href\s*=/) // no <a>/xlink inside the SVG
  })

  it("includes repo name, star count, and language", () => {
    const svg = renderCard(card)
    expect(svg).toContain("tawtui")
    expect(svg).toContain("42")
    expect(svg).toContain("TypeScript")
  })

  it("escapes a description containing markup", () => {
    const svg = renderCard({ ...card, description: "uses <Foo> & <Bar>" })
    expect(svg).toContain("&lt;Foo&gt; &amp; ")
    expect(svg).not.toContain("<Foo>")
  })

  it("omits the language dot when language is null", () => {
    const svg = renderCard({ ...card, language: null })
    expect(svg).not.toContain("<circle")
  })

  it("does not emit a lone surrogate when truncation lands mid-emoji", () => {
    const svg = renderCard({ ...card, description: "x".repeat(58) + "😀😀😀" })
    expect(svg).not.toMatch(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/,
    )
  })
})

describe("renderPlaceholder", () => {
  it("returns a self-contained svg", () => {
    const svg = renderPlaceholder()
    expect(svg.startsWith("<svg")).toBe(true)
  })
})

describe("relativeTime", () => {
  const now = Date.parse("2026-06-20T12:00:00Z")
  it("formats minutes, hours, and days", () => {
    expect(relativeTime("2026-06-20T11:30:00Z", now)).toBe("30m ago")
    expect(relativeTime("2026-06-20T09:00:00Z", now)).toBe("3h ago")
    expect(relativeTime("2026-06-18T12:00:00Z", now)).toBe("2d ago")
  })
  it("never goes negative", () => {
    expect(relativeTime("2026-06-20T12:05:00Z", now)).toBe("0m ago")
  })
})
