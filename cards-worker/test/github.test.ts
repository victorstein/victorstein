// cards-worker/test/github.test.ts
import { describe, it, expect } from "vitest"
import { selectInFlightRepos, type GitHubRepo } from "../src/github"

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
