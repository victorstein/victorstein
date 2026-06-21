// cards-worker/test/github.test.ts
import { describe, it, expect } from "vitest"
import { selectInFlightRepos, extractSubject, extractDiffLines, type GitHubRepo } from "../src/github"

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
    expect(got.map((c) => c.name)).toEqual(["keep"])
  })

  it("sorts by pushed_at descending", () => {
    const got = selectInFlightRepos([
      repo({ name: "old", pushed_at: "2023-01-01T00:00:00Z" }),
      repo({ name: "new", pushed_at: "2025-06-01T00:00:00Z" }),
      repo({ name: "mid", pushed_at: "2024-06-01T00:00:00Z" }),
    ])
    expect(got.map((c) => c.name)).toEqual(["new", "mid", "old"])
  })

  it("returns at most 4 cards and maps fields", () => {
    const repos = Array.from({ length: 6 }, (_, i) =>
      repo({ name: `r${i}`, pushed_at: `2025-01-0${i + 1}T00:00:00Z`, stargazers_count: i, description: `d${i}`, language: "TypeScript" }),
    )
    const got = selectInFlightRepos(repos)
    expect(got).toHaveLength(4)
    expect(got[0]).toEqual({
      name: "r5",
      url: "https://github.com/victorstein/r5",
      description: "d5",
      language: "TypeScript",
      stars: 5,
    })
  })

  it("coerces null description to empty string", () => {
    const got = selectInFlightRepos([repo({ description: null })])
    expect(got[0].description).toBe("")
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
