# expo-app-lp-monorepo-boilerplate

Expo（`apps/sp`）+ Astro LP（`apps/lp`）向けの Bun workspaces モノレポ骨子（一段目）。

| App | Stack | 役割 |
| --- | --- | --- |
| `apps/sp` | Expo + Expo Router | iPhone ローカルアプリの薄い骨格 |
| `apps/lp` | Astro | App Store 向け LP の枠（stub） |

**一段目のまま製品へ直コピーしない。** 必ず二段目（共通層）を経由する。

## Setup

**前提:** [Bun](https://bun.com) 1.3+

```bash
bun install
```

ルートの `bunfig.toml` で `linker = "isolated"` を使う。

## ローカル開発

```bash
# sp / lp を mprocs で並列起動
bun run dev

# 個別起動
bun run dev:sp
bun run dev:lp
```

### mprocs 操作

- `bun run dev` で起動（TTY 必須。IDE 統合ターミナルまたは通常のターミナルで実行）
- `Tab` でプロセス一覧とターミナルのフォーカス切替
- `s` 起動、`x` 停止、`r` 再起動（mprocs デフォルト）
- 参照: [mprocs](https://github.com/pvolok/mprocs)

### Expo Go での確認（`apps/sp`）

1. `bun run dev:sp`（または `bun run dev` の `sp`）を起動
2. Expo Go で `/` が SwiftUI ホーム雛形（「Home」）を表示すること
3. 初回起動時に Drizzle migration が適用され、ゲート通過後に通常ルートが表示されること
4. `AnalyticsClient` は no-op（ネットワーク送信なし）

SwiftUI（`@expo/ui`）や実機依存の確認が進んだら、Expo Go から Development Build へ移る。

## Scripts（ルート）

| Script | 内容 |
| --- | --- |
| `dev` | mprocs（sp / lp） |
| `dev:sp` / `dev:lp` | 個別起動 |
| `check` | Biome check |
| `typecheck:sp` / `check:sp` | sp 向け typecheck / Biome |
| `test:sp` | sp unit test（`local-date` 等） |

## コピー手順

1. 本リポジトリ（一段目）を `DemoProject/local-app-common-lp-monorepo-boilerplate/` へコピーする（二段目）。
2. 二段目で写真共通・PostHog 輸送層などを足す（LC-000〜LC-006。通知は含めない）。
3. 二段目から製品へコピーする。
   - みずどき: `Project/houseplant-care/`
   - 現場日報: `Project/field-nippo/`
4. 各製品は独立 Git とし、共有パッケージのランタイム結合を残さない。
5. コピー先で下記 rename チェックリストを完了する。

```bash
# 例: 一段目 → 二段目（パスは環境に合わせて変更）
cp -R expo-app-lp-monorepo-boilerplate local-app-common-lp-monorepo-boilerplate
cd local-app-common-lp-monorepo-boilerplate
# 新規独立リポジトリにする場合
# rm -rf .git && git init
bun install
```

## 複製後 rename チェックリスト

コピー先で必ず差し替える。

- [ ] ルート / `apps/sp` / `apps/lp` の `package.json` name
- [ ] `apps/sp` の `app.config.ts`（`name`、`slug`、`bundleIdentifier`、scheme）
- [ ] EAS project 仮値（production 確定値は製品指示書で所有者確認）
- [ ] README の製品名と下流 Cursor 指示書リンク
- [ ] Git remote（新規独立リポジトリ）
- [ ] `apps/lp` のサイトタイトル placeholder

## 下流（二段目・製品）

| 段 | 置き場 | 内容 |
| --- | --- | --- |
| 一段目（本リポジトリ） | `DemoProject/expo-app-lp-monorepo-boilerplate/` | 汎用 sp+lp 骨格 |
| 二段目 | `DemoProject/local-app-common-lp-monorepo-boilerplate/` | 一段目コピー＋写真共通＋PostHog 輸送層（通知は含めない）。パック同梱外 |
| 製品 | `Project/houseplant-care/` / `Project/field-nippo/` | 二段目からコピー。ドメインは各 Cursor 指示書 |

Cursor 指示書の参照先（パック同梱外のものは各パックを正本とする）:

- 一段目: [Cursor実装指示書 v1](./docs/monorepo_boilerplate/expo_app_lp_monorepo_boilerplate_cursor_implementation_instruction_v1.md)
- 二段目: `local-app-common-lp-monorepo-boilerplate` の Cursor 指示書（LC-000〜LC-006）
- みずどき: `Project/houseplant-care/` 向け Cursor 指示書 v2
- 現場日報: `Project/field-nippo/` 向け Cursor 指示書 v1

## Docs

- [仕様書 v1](./docs/monorepo_boilerplate/expo_app_lp_monorepo_boilerplate_spec_v1.md)
- [Cursor実装指示書 v1](./docs/monorepo_boilerplate/expo_app_lp_monorepo_boilerplate_cursor_implementation_instruction_v1.md)
- チケット: `docs/ticket_management/`
