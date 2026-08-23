# Code Context

## Files Retrieved
1. `app/pages/pulse.vue` (lines 1-27) — Pulse 路由入口；调用 `useGithubPulse()`，把 loading/error/retry 传给页面组件。
2. `app/composables/useGithubPulse.ts` (lines 1-10) — 浏览器/SSR 数据入口：`useFetch('/api/github/pulse')`，固定 key，启用 SSR。
3. `app/components/pulse/PulseSection.vue` (lines 1-58) — 页面编排、source/updatedAt 展示、错误态、主体限宽与移动端规则。
4. `app/components/pulse/ContributionLandscape.vue` (lines 1-219) — Contribution Activity 热力图、总数/最长连续天数/范围及 container query。
5. `app/components/pulse/ContributionProjects.vue` (lines 1-100) — Recent Commits 与 Activity Timeline 的渲染及双列到单列响应式规则。
6. `server/api/github/pulse.get.ts` (lines 1-333) — 全部 GitHub REST/GraphQL 请求、映射、降级、缓存逻辑。
7. `shared/types/github.ts` (lines 1-48) — `GithubPulse`、`ContributionDay`、`RecentCommit`、`ActivityEvent` 数据契约。
8. `shared/constants.ts` (lines 137-158) — `createEmptyPulse()` 可信不可用态；无模拟活动。
9. `i18n/locales/en.json` (lines 93-144) / `i18n/locales/zh-CN.json` (对应 `pulse` 同构段，约 lines 93-144) — Pulse 全部用户文案。
10. `app/assets/css/tokens.css` (lines 86-130) — 内容最大宽度、页面 gutter、safe-area、Dock 高度和底部安全空间 token。
11. `app/assets/css/main.css` (lines 128-151, 315-354) — `.site-main`、`.view-shell`、`.dashboard-panel` 容器与底部 Dock 留白。
12. `app/components/navigation/BottomDock.vue` (lines 1-119) — Dock 导航结构及最大视口宽度。
13. `nuxt.config.ts` (lines 70-82) — 私有 `githubToken` 配置与 `viewport-fit=cover`。

## Key Code

### 数据契约与页面流

```ts
// app/composables/useGithubPulse.ts:4-9
return useFetch<GithubPulse>('/api/github/pulse', {
  key: 'neoverse-github-pulse',
  server: true,
  default: () => createEmptyPulse(),
});
```

`app/pages/pulse.vue:5-7` 取得 `data/status/error/refresh`；`PulseSection.vue:37-39` 分发：
- `pulse.contributions` → `ContributionLandscape`（Contribution Activity）；
- `pulse.recentCommits` → Recent Commits；
- `pulse.activityTimeline` → Activity Timeline。

`GithubPulse` 仅包含 profile、贡献日历、最近提交、活动事件、source 与 updatedAt（`shared/types/github.ts:30-48`），没有 repository-level aggregate 类型。

### Contribution Activity 的真实来源

- **有 `githubToken`**：`queryContributions()` 调 GitHub GraphQL `contributionsCollection.contributionCalendar`，滚动 12 个月，取 `totalContributions`、每天 count/level，再本地算 `longestStreak`（`server/api/github/pulse.get.ts:254-284`）。这是 GitHub 用户贡献日历口径，可能包含公开之外的贡献计数语义，但响应不含仓库维度。
- **无 token 或 GraphQL 失败**：使用 REST `GET /users/SSJ-ZYJ/events/public?per_page=100`，`buildRecentLandscape()` 将公开事件按日计数；PushEvent 按 payload commits 数，其他每事件计 1，并强制铺成最近 84 天（lines 100-131, 293-305）。这不是 GitHub contribution calendar 等价口径，UI 以 `scope: recent` / “Recent public events” 明示。
- events 为空时返回 `scope: unavailable`，不造数据（lines 101-103；`createEmptyPulse` lines 137-158）。

### Recent Commits 的真实来源

`fetchRecentCommits()` 只针对硬编码仓库 `SSJ-ZYJ/Neoverse-Doc`：
1. `GET /repos/.../branches?per_page=10`；
2. 取前 4 个分支；
3. 并行对每支 `GET /repos/.../commits?sha=<branch>&per_page=5`；
4. 按 SHA 去重、author date 排序、截前 5（`server/api/github/pulse.get.ts:140-173`）。

若整条 commits 请求失败/为空，则从用户公开 PushEvent payload 提取前 5 个 commit，范围会变成跨仓库（lines 176-193, 317）。UI 最终只显示前三条（`ContributionProjects.vue:30-40`）。因此此栏目正常态与降级态的仓库范围并不一致。

### Activity Timeline 的真实来源

同一份用户公开 events 响应经 `mapTimeline()`：仅保留 Push、PullRequest、PullRequestReview、Issues、Create，先截前 6，再映射成通用 kind（`server/api/github/pulse.get.ts:195-252`）；UI 再只显示前三条（`ContributionProjects.vue:52-63`）。映射没有保留 PR/issue 的 `payload.action`，文案只能说 “Updated”，无法区分 opened/closed/merged。

## Architecture

### 请求实时性、缓存与更新时间语义

请求链：浏览器/SSR `useFetch` → Nuxt server `/api/github/pulse` → GitHub REST/GraphQL。`server: true` 且固定 Nuxt key 使 SSR 首次请求结果进入 Nuxt payload，正常 hydration 不应再发同一请求；手动 Retry 调 `refresh()`（`pulse.vue:5,23`）。

服务端使用 `defineCachedEventHandler`，`maxAge: 900`、`swr: true`（`pulse.get.ts:286-333`）：
- **不是实时流，也不是每次访问直连 GitHub**；缓存新鲜期为 15 分钟。
- SWR 允许先返回 stale 响应并后台重验证，因此超过 15 分钟后，首个访问者仍可能看到旧数据，实际陈旧时间没有硬上限承诺（还受重验证成功与运行时缓存存储影响）。
- token/无 token 使用两个固定 cache key（lines 327-329），不是按用户或查询参数分片。
- `updatedAt = new Date().toISOString()`（line 321）表示**服务端成功组装该缓存对象的时间**，不是 GitHub 最后一项活动时间、不是客户端读取时间，也不保证所有并行子请求均成功。partial 数据也会显示该时间。
- GitHub public Events API 本身并非实时保证且历史范围有限；本实现只取第一页 100 条。

### 指标支持边界

**当前响应可较可靠展示：**
- 有 token 且 GraphQL 成功时：该 GitHub 用户滚动 12 个月贡献总数、逐日强度、最长连续贡献天数（GraphQL contribution calendar 口径）。
- `Neoverse-Doc` 前 4 个（按 branches API 返回顺序）分支交集中的最近提交候选，最多每支 5 个、最终 5 个；不能称为账户级 Recent Commits。
- 用户最近公开事件样本中的最新 6 个受支持事件（UI 3 个），作为 timeline 明细而非统计。
- 无 token 时只能可靠描述为“最近 public Events 样本的近 84 天近似活动”，不能与 contribution 数等同。

**不能可靠支持现成 Repository Pulse KPI：**
- **Active repositories / 仓库活动分布**：服务端虽收到最多 100 条 event 的 `repo.name`，但响应只保留 timeline 最多 6 条和 fallback commits；没有完整 repo aggregate，且 public Events 是截断样本。
- **Merged PR**：未请求 Search/PR API；`payload.action` 虽声明但映射时丢弃，且 PR 是否 merged 的字段未声明/保存。
- **Closed issues**：同理，action 丢失，无法从返回类型区分 closed。
- **Releases**：`ReleaseEvent` 未列入 supported set，payload/types 也无 release。
- **跨仓库 commit 数、参与者、活跃分支、代码变更量、PR lead time、issue resolution time**：均无相应字段/API。
- 即使直接基于当前 100 条 events 临时聚合，上述结果也只能称“recent public event sample”，不能称完整时间窗 KPI；私有活动、较老活动及样本外事件不可见。

### 重复/无效请求审查

- **中等：profile 请求当前对页面基本无效。** `GET /users/SSJ-ZYJ`（`pulse.get.ts:294`）只填 profile；Pulse 三个组件没有读取 `pulse.profile`。它每次缓存重建消耗一次 GitHub API 配额。
- **中等：Recent Commits 扇出较重。** 每次重建是 1 次 branches + 最多 4 次 commits；多个分支共享提交会重复从 GitHub 下载，之后才按 SHA 去重（lines 146-173）。不是严格重复 URL，但有显著重叠数据与最多 5 次 REST 成本。
- **低/合理复用：events 只请求一次，同时供无 token contribution fallback、timeline、commit fallback 使用，不是重复请求。GraphQL 与 events 在 token 模式并行请求虽都反映活动，但分别服务年度日历与 timeline，功能不重复。**
- `Promise.allSettled` 可容忍部分失败（lines 293-305），但 source 仅由 verified calendar 决定：GraphQL 成功即 `live`，即使 timeline/commits/profile 失败仍标为 live；这是状态语义风险。

### Responsive / container / Dock 安全区

- `--content-max: 88rem`、`--focus-content-max: 72rem`；Pulse header/body 均限制 72rem 并居中（`tokens.css:86-95`; `PulseSection.vue:50-52`）。
- `.dashboard-panel` 使用 `padding: var(--page-block-start) var(--page-inline) var(--dock-safe-space)`（`main.css:142-151`）。`--page-inline` 取 gutter、左右 safe-area 与超宽居中值的 max；`--dock-safe-space` 包含 Dock 高度、Dock-footer gap、footer、高度、bottom safe-area 及 page end（`tokens.css:89-113`）。因此页面自然滚动不会被底部 Dock 遮挡。
- `viewport-fit=cover` 已启用（`nuxt.config.ts:78-82`）。Dock 自身 `max-width: calc(100vw - 1.2rem)`（`BottomDock.vue:91-119`）。
- Contribution card 定义 inline-size container；仅当 card ≥56rem 时统计栏转到热力图右侧，否则三列横排（`ContributionLandscape.vue:143, 204-210`）。图表过窄时横向滚动。
- Activity 两列在 viewport ≤560px 改一列（`ContributionProjects.vue:99`）；stats 在 ≤600px 缩 padding/font；更新时间在 ≤540px 隐藏（`PulseSection.vue:57`）。
- 风险（低）：`dashboard-panel { overflow:hidden }` 与 card 内横滚配合正常，但 tooltip 是 card absolute 且 card本身没有 overflow hidden；外层 panel 边缘仍可能裁剪靠边浮层。现有 placement 已降低概率。

## 最小实现建议（不改整体视觉）

1. **先修语义而非布局**：保留现有三卡视觉，在 API 返回增加 `coverage`（window/from/to、public/sample/verified）与各 section 独立状态；header 的 Updated 改为“Fetched/缓存生成于”，避免误读为 GitHub 最后活动时间。所有新文案必须同步 en/zh-CN。
2. **若做 Repository Pulse 最小 MVP**：在服务端利用已取得的 events 一次遍历生成 `repositoryActivity[]`，明确标为“latest 100 public events sample”；UI 可复用现有 stats/list 样式，不新增视觉体系。它适合做样本内 active repo 数和活动分布，但必须展示覆盖说明。
3. **merged PR / closed issues / releases 要可信就新增专用查询**：优先 GitHub GraphQL/Search 按明确时间窗聚合；不要从当前 timeline 猜测。若短期只用 events，则保留 `payload.action`、PR `merged`、加入 `ReleaseEvent`，并将指标明确标为 sampled—not complete。
4. **降请求成本**：删除未展示的 profile 请求；Recent Commits 若产品目标仍是单仓库，改为明确默认分支一次 commits 请求，或用 compare/GraphQL 一次取候选。若必须多分支，限制为配置的目标分支而非 branches 返回前 4 个。
5. **统一 Recent Commits 口径**：正常与 fallback 都固定同一仓库，或栏目明确改名为账户级 recent public commits；当前混合口径会误导。
6. **保留现有响应式与 Dock token**：不改 `.dashboard-panel` 底部 padding、72rem 容器、56rem container query 与 560px 单列断点；新 KPI 只替换/扩充卡片内容即可。

## Start Here

先打开 `server/api/github/pulse.get.ts`（尤其 lines 100-131、146-173、195-252、254-333）。所有指标可信度、请求成本、缓存与 source 语义都在这里决定；确定产品口径后再改 `shared/types/github.ts` 和现有两个展示组件。

## Review Findings

- **medium** — `server/api/github/pulse.get.ts:294, 309-315`：profile API 结果未被 Pulse UI 使用，每次缓存重建浪费一请求配额。
- **medium** — `server/api/github/pulse.get.ts:146-173`：多分支请求最多 5 次 REST，跨分支重复提交下载后才去重；且“Recent Commits”实际仅主目标仓库。
- **medium** — `server/api/github/pulse.get.ts:195-252`：PR/issue action 被丢弃且 ReleaseEvent 不支持，不能产出 merged/closed/release KPI。
- **medium** — `server/api/github/pulse.get.ts:319-322`：`source: live` 只代表 contribution GraphQL 成功，不代表 commits/timeline/profile 完整；header 状态可能过度概括。
- **low** — `server/api/github/pulse.get.ts:176-193, 317`：Recent Commits 正常态为单仓库，多分支请求失败后却变成跨仓库 public-event fallback，口径不一致。
- **low** — `PulseSection.vue:8-17` + `pulse.get.ts:321, 328-329`：“Updated” 实为缓存对象生成时间，SWR 下还可能先返回 stale，并非上游活动更新时间。

## Residual Risks

- 未实际调用 GitHub API，无法证明部署环境是否配置 `githubToken`；运行时会决定年度 verified calendar 或 public snapshot 两种路径。
- Nitro 缓存的持久性与跨实例共享取决于部署 preset/storage；代码只能确认 900 秒 SWR 配置，不能确认多实例环境的实际命中率。
- GitHub Events API 的上游可见性/保留和分页限制意味着基于该端点的 aggregate 天生不完整。

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "已在 Review Findings 中按 severity 引用 server/api/github/pulse.get.ts、PulseSection.vue 等具体路径与行号，并在 Residual Risks 记录部署 token、Nitro 缓存和 Events API 覆盖风险。"
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "read/grep/find static inspection",
      "result": "passed",
      "summary": "只读定位并检查 Pulse 页面、组件、类型、i18n、样式、Dock 与 GitHub API 链路。"
    }
  ],
  "validationOutput": [
    "确认 defineCachedEventHandler maxAge=900, swr=true。",
    "确认 GitHub 请求包括 profile、public events、branches + 最多四个 branch commits，以及 token 模式 GraphQL contribution calendar。",
    "确认工作树源文件未修改，仅生成要求的 context.md 审查产物。"
  ],
  "residualRisks": [
    "未调用外部 GitHub API，部署环境 githubToken 状态未知。",
    "Nitro 缓存跨实例行为取决于部署 storage。",
    "Public Events 第一页 100 条不能支持完整 repository KPI。"
  ],
  "noStagedFiles": true,
  "diffSummary": "无项目源代码变更；仅写入只读审查报告 context.md。",
  "reviewFindings": [
    "medium: server/api/github/pulse.get.ts:294 - profile 请求结果未被 Pulse UI 使用。",
    "medium: server/api/github/pulse.get.ts:146-173 - Recent Commits 多分支扇出且下载重叠提交后才去重。",
    "medium: server/api/github/pulse.get.ts:195-252 - 丢弃 PR/issue action 且不支持 ReleaseEvent，无法提供目标 KPI。",
    "medium: server/api/github/pulse.get.ts:319-322 - live source 不能代表所有 section 完整。"
  ],
  "manualNotes": "本任务为只读静态检查，未运行类型检查或外部请求。"
}
```
