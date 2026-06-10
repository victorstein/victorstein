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

<a href="https://github.com/victorstein/tawtui"><img src="./assets/cards/tawtui.svg" /></a>
<a href="https://github.com/victorstein/claude-code-usage-statusline"><img src="./assets/cards/claude-code-usage-statusline.svg" /></a>
<a href="https://github.com/victorstein/lumentui"><img src="./assets/cards/lumentui.svg" /></a>

#### Favorite stack

```text
languages    typescript · python · lua · hcl · shell
runtime      bun · node · pnpm
framework    nestjs (yes, for everything — APIs, daemons, CLIs)
data         prisma · sqlite · redis · bullmq
graphql      apollo · graphql-codegen · graphql-armor
tui          ink · @opentui/core · solid
frontend     react · next · tailwind · zustand · tanstack-query
mobile       react-native · expo · nativewind
test         vitest · playwright
infra        opentofu · docker · github-actions · tailscale · aws s3
terminal     wezterm · neovim (lazyvim) · starship · lazygit · pass
```

#### More

- [TGC](https://github.com/victorstein/TGC) · React Native + Expo app for *Tech, Code & Gaming* local news
- [zmk-config-corne](https://github.com/victorstein/zmk-config-corne) · ZMK config for my Corne split keyboard
- [everything else →](https://github.com/victorstein?tab=repositories)

---

> Also codifying my homelab, GitHub, dotfiles, keyboard, and editor — because if I can't `git blame` it, I'll get around to it.

The real answer to the ultimate question of life, the universe, and everything is… YHWH.
