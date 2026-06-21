// cards-worker/test/github.test.ts
import { describe, it, expect } from "vitest"
import { selectInFlightRepos, buildCard, extractSubject, extractDiffLines, type GitHubRepo } from "../src/github"

function repo(over: Partial<GitHubRepo>): GitHubRepo {
  const name = over.name ?? "r"
  return {
    name,
    full_name: `victorstein/${name}`,
    html_url: `https://github.com/victorstein/${name}`,
    description: null,
    language: null,
    stargazers_count: 0,
    fork: false,
    archived: false,
    private: false,
    pushed_at: "2024-01-01T00:00:00Z",
    default_branch: "main",
    ...over,
  }
}

describe("selectInFlightRepos", () => {
  it("drops forks, archived, and private repos", () => {
    const got = selectInFlightRepos([
      repo({ name: "keep" }),
      repo({ name: "fork", fork: true }),
      repo({ name: "arch", archived: true }),
      repo({ name: "priv", private: true }),
    ])
    expect(got.map((r) => r.name)).toEqual(["keep"])
  })
  it("sorts by pushed_at desc and caps at 4", () => {
    const repos = Array.from({ length: 6 }, (_, i) =>
      repo({ name: `r${i}`, pushed_at: `2025-01-0${i + 1}T00:00:00Z` }),
    )
    expect(selectInFlightRepos(repos).map((r) => r.name)).toEqual(["r5", "r4", "r3", "r2"])
  })
})

describe("buildCard", () => {
  it("maps repo fields and attaches commit subject + diff", () => {
    const card = buildCard(repo({ name: "tawtui", stargazers_count: 2, language: "TypeScript", description: "d" }), {
      subject: "feat: x",
      diff: [{ sign: "+", text: "a" }],
    })
    expect(card).toEqual({
      name: "tawtui",
      url: "https://github.com/victorstein/tawtui",
      description: "d",
      language: "TypeScript",
      stars: 2,
      pushedAt: "2024-01-01T00:00:00Z",
      subject: "feat: x",
      diff: [{ sign: "+", text: "a" }],
    })
  })
  it("falls back to null subject + empty diff when commit is null", () => {
    const card = buildCard(repo({ description: null }), null)
    expect(card.subject).toBeNull()
    expect(card.diff).toEqual([])
    expect(card.description).toBe("")
  })
})

describe("extractSubject", () => {
  it("returns the first line of the commit message", () => {
    expect(extractSubject("feat: add filter\n\nlonger body here")).toBe("feat: add filter")
  })
  it("returns empty string for empty message", () => {
    expect(extractSubject("")).toBe("")
  })
})

describe("extractDiffLines", () => {
  const patch = [
    "@@ -1,3 +1,4 @@ context",
    " unchanged line",
    "+const filtered = fuzzy(tasks, query)",
    "-return tasks.filter(matches)",
    "+another added line",
  ].join("\n")

  it("takes the first two +/- lines, stripping markers, skipping @@/context", () => {
    expect(extractDiffLines([{ patch }])).toEqual([
      { sign: "+", text: "const filtered = fuzzy(tasks, query)" },
      { sign: "-", text: "return tasks.filter(matches)" },
    ])
  })
  it("skips +++/--- file headers and blank additions", () => {
    const p = ["+++ b/file.ts", "--- a/file.ts", "@@ -0,0 +1 @@", "+", "+real line"].join("\n")
    expect(extractDiffLines([{ patch: p }])).toEqual([{ sign: "+", text: "real line" }])
  })
  it("returns [] when there are no usable lines or no patch", () => {
    expect(extractDiffLines([{ patch: "@@ -1 +1 @@\n context only" }])).toEqual([])
    expect(extractDiffLines([{}])).toEqual([])
    expect(extractDiffLines(undefined)).toEqual([])
  })
})
