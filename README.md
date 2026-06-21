### victorstein

Full-stack TypeScript engineer in Nicaragua.
I build NestJS + GraphQL backends, React + Next.js frontends, and the CLIs/TUIs that tie everything together.

---

> **the block of OpenTofu that produces this profile:**
>
> ```hcl
> # stein-infra/tofu/repos.tf
> resource "github_repository_file" "this" {
>   for_each = local.repository_files
>
>   repository          = each.value.repository  # "victorstein"
>   file                = each.value.file        # "README.md"
>   content             = each.value.content     # file("profile-readme.md")
>   overwrite_on_create = true
> }
> ```
>
> Yes, really.

---

#### In flight

<a href="https://cards.victor-stein.dev/in-flight/0"><img src="https://cards.victor-stein.dev/in-flight/0.svg" /></a> <a href="https://cards.victor-stein.dev/in-flight/1"><img src="https://cards.victor-stein.dev/in-flight/1.svg" /></a> <a href="https://cards.victor-stein.dev/in-flight/2"><img src="https://cards.victor-stein.dev/in-flight/2.svg" /></a> <a href="https://cards.victor-stein.dev/in-flight/3"><img src="https://cards.victor-stein.dev/in-flight/3.svg" /></a>

#### Favorite stack

<img width="780" src="https://cards.victor-stein.dev/stack.svg" alt="Favorite stack — languages: typescript, python, lua, hcl, shell; runtime: bun, node, pnpm; framework: nestjs; data: prisma, sqlite, redis, bullmq; graphql: apollo, graphql-codegen, graphql-armor; tui: ink, opentui, solid; frontend: react, next, tailwind, zustand, tanstack-query; mobile: react-native, expo, nativewind; test: vitest, playwright; infra: opentofu, docker, github-actions, tailscale, aws s3; terminal: wezterm, neovim, starship, lazygit, pass" />

#### More

- [TGC](https://github.com/victorstein/TGC) · React Native + Expo app for *Tech, Code & Gaming* local news
- [zmk-config-corne](https://github.com/victorstein/zmk-config-corne) · ZMK config for my Corne split keyboard
- [everything else →](https://github.com/victorstein?tab=repositories)

---

> Also codifying my homelab, GitHub, dotfiles, keyboard, and editor — because if I can't `git blame` it, I'll get around to it.

The real answer to the ultimate question of life, the universe, and everything is… YHWH.
