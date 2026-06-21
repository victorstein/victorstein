// cards-worker/src/github.ts
export interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  fork: boolean
  archived: boolean
  private: boolean
  pushed_at: string
}

export interface InFlightCard {
  name: string
  url: string
  description: string
  language: string | null
  stars: number
}

export const SLOT_COUNT = 4

export function selectInFlightRepos(repos: GitHubRepo[]): InFlightCard[] {
  return repos
    .filter((r) => !r.fork && !r.archived && !r.private)
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, SLOT_COUNT)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description ?? "",
      language: r.language,
      stars: r.stargazers_count,
    }))
}

export async function fetchRepos(username: string, token?: string): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    "User-Agent": "victorstein-cards-worker",
    Accept: "application/vnd.github+json",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?type=owner&sort=pushed&direction=desc&per_page=100`,
    { headers },
  )
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? (data as GitHubRepo[]) : []
}
