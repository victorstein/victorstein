// cards-worker/test/render.test.ts
import { describe, it, expect } from "vitest"
import { escapeXml, renderCard, renderPlaceholder, renderStack, relativeTime } from "../src/render"
import type { InFlightCard } from "../src/github"

const card: InFlightCard = {
  name: "tawtui",
  url: "https://github.com/victorstein/tawtui",
  description: "A TUI on top of Taskwarrior",
  language: "TypeScript",
  stars: 42,
  pushedAt: "2026-06-18T12:00:00Z",
  subject: "feat: add fuzzy task filter",
  diff: [
    { sign: "+", text: "const filtered = fuzzy(tasks, query)" },
    { sign: "-", text: "return tasks.filter(matches)" },
  ],
}

describe("escapeXml", () => {
  it("escapes XML-significant characters", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe("a &amp; b &lt; c &gt; d &quot; e &apos; f")
  })
})

describe("renderCard", () => {
  it("is a self-contained svg with no external refs, scripts, or anchors", () => {
    const svg = renderCard(card)
    expect(svg.startsWith("<svg")).toBe(true)
    expect(svg).not.toContain("<script")
    expect(svg).not.toContain("<image")
    expect(svg).not.toMatch(/href\s*=/)
  })
  it("renders subject and diff lines with add/delete colors", () => {
    const svg = renderCard(card)
    expect(svg).toContain("feat: add fuzzy task filter")
    expect(svg).toContain("#a6e3a1") // add color present
    expect(svg).toContain("#f38ba8") // delete color present
    expect(svg).toContain("fuzzy(tasks, query)")
  })
  it("escapes diff/subject markup", () => {
    const svg = renderCard({ ...card, subject: "fix <Foo> & <Bar>" })
    expect(svg).toContain("fix &lt;Foo&gt; &amp; &lt;Bar&gt;")
    expect(svg).not.toContain("<Foo>")
  })
  it("falls back to description comment when diff is empty", () => {
    const svg = renderCard({ ...card, diff: [], subject: "chore: release 1.2.0" })
    expect(svg).toContain("# A TUI on top of Taskwarrior")
    expect(svg).toContain("chore: release 1.2.0")
    expect(svg).not.toContain(`fill="#a6e3a1">+ `) // no diff-add row
  })
  it("uses the Catppuccin background and purple top bar", () => {
    const svg = renderCard(card)
    expect(svg).toContain("#1e1e2e") // base background
    expect(svg).toContain("#7c3aed") // purple top bar
    expect(svg).toContain('width="416"') // 400 card + 8px margin each side
    expect(svg).toContain('translate(8,8)')
  })
  it("omits the language dot when language is null", () => {
    expect(renderCard({ ...card, language: null })).not.toContain("<circle cx=\"22\"")
  })
})

describe("renderPlaceholder", () => {
  it("returns a self-contained svg", () => {
    const svg = renderPlaceholder()
    expect(svg.startsWith("<svg")).toBe(true)
  })
})

describe("renderStack", () => {
  const svg = renderStack()
  it("is a self-contained svg", () => {
    expect(svg.startsWith("<svg")).toBe(true)
    expect(svg).not.toContain("<script")
    expect(svg).not.toContain("<image")
    expect(svg).not.toMatch(/<a[\s>]/)
  })
  it("renders the host, neovim mark, keys, and a value", () => {
    expect(svg).toContain(">stein<tspan") // host user
    expect(svg).toContain("stein-cloud")
    expect(svg).toContain("#57A143") // neovim brand green
    expect(svg).toContain("#89b4fa") // stack key color
    expect(svg).toContain("typescript")
    expect(svg).toContain("#7c3aed") // purple bar
  })
  it("is 780 wide to match the README img width", () => {
    expect(svg).toContain('width="780"')
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
  it("returns a dash for unparseable input", () => {
    expect(relativeTime("not-a-date", now)).toBe("—")
  })
})
