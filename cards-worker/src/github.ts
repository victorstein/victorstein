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
  default_branch: string
}

export interface DiffLine {
  sign: "+" | "-"
  text: string
}

export interface CommitInfo {
  subject: string
  diff: DiffLine[]
}

export function extractSubject(message: string): string {
  return message.split("\n")[0] ?? ""
}

export function extractDiffLines(files: { patch?: string }[] | undefined): DiffLine[] {
  const out: DiffLine[] = []
  for (const f of files ?? []) {
    if (!f.patch) continue
    for (const line of f.patch.split("\n")) {
      if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) continue
      const sign = line[0]
      if (sign !== "+" && sign !== "-") continue
      const text = line.slice(1).trim()
      if (text === "") continue
      out.push({ sign, text })
      if (out.length >= 2) return out
    }
  }
  return out
}

export interface InFlightCard {
  name: string
  url: string
  description: string
  language: string | null
  stars: number
  pushedAt: string
  subject: string | null
  diff: DiffLine[]
}

export const SLOT_COUNT = 4

export function selectInFlightRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return repos
    .filter((r) => !r.fork && !r.archived && !r.private)
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, SLOT_COUNT)
}

export function buildCard(repo: GitHubRepo, commit: CommitInfo | null): InFlightCard {
  return {
    name: repo.name,
    url: repo.html_url,
    description: repo.description ?? "",
    language: repo.language,
    stars: repo.stargazers_count,
    pushedAt: repo.pushed_at,
    subject: commit?.subject ?? null,
    diff: commit?.diff ?? [],
  }
}

export async function fetchLatestCommit(
  owner: string,
  repo: GitHubRepo,
  token?: string,
): Promise<CommitInfo | null> {
  const headers: Record<string, string> = {
    "User-Agent": "victorstein-cards-worker",
    Accept: "application/vnd.github+json",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo.name}/commits/${repo.default_branch}`,
    { headers },
  )
  if (!res.ok) return null
  const data = (await res.json()) as { commit?: { message?: string }; files?: { patch?: string }[] }
  return {
    subject: extractSubject(data.commit?.message ?? ""),
    diff: extractDiffLines(data.files),
  }
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
