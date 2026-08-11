# sp-lp-simple-monorepo-boilerplate

Expo アプリ（`apps/sp`）と Astro LP（`apps/lp`）の Bun workspaces モノレポ骨子。

## 構成

```
.
├── apps/
│   ├── sp/          # Expo + Expo Router（スマホアプリ）
│   └── lp/          # Astro + Cloudflare Workers（LP）
├── scripts/         # プロジェクト初期化（init:project）
├── package.json     # workspaces ルート
├── mprocs.yaml      # sp / lp 並列起動
└── biome.json
```

| App | Stack | 役割 |
| --- | --- | --- |
| `apps/sp` | Expo + Expo Router | iPhone アプリの骨格 |
| `apps/lp` | Astro + Cloudflare | App Store 向け LP |

## Setup

```bash
bun install
bun run dev        # mprocs で sp / lp を並列起動
bun run init:project -- <slug>  # プロジェクト名の差し替え
```
