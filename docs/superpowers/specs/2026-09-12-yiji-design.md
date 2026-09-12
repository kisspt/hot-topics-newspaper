# 「一记」设计文档

日期：2026-09-12
状态：已与用户逐节确认
代码目录：`yiji/`

---

## 0. 背景

用户此前有一个 `freelance-tracker/` 项目（PRD + 约 3735 行代码 + Supabase 迁移）。该项目的「快速记录」通道 `QuickRecord.tsx` 只收了 3 个字段，其余（时间、地点、完成状态、收款状态）全部硬编码，与 PRD 声明不符。

用户决定**推倒重来**，按本次重新探讨的需求从零设计。旧项目归档保留，不删除。

本次需求探讨逐条确认的决策：

| 议题 | 决策 |
| --- | --- |
| 速记形态 | 常用项磁贴，点几下成一条（3-5 秒） |
| 「时间」语义 | 日期 + 时长（两者都要），支持后续时薪核算 |
| 工作内容字段 | 类型磁贴必填 + 一句话文本选填 |
| 地点用途 | 记录外勤工作地点，目的是「不用费心用脑子记」——外挂记忆，不参与算钱 |
| 地点采集 | 自学习磁贴（打一次就记住），不接定位、不接地图 API |
| 收入建模 | 一条工作挂多笔收款（`WorkRecord 1 → N Payment`） |
| MVP 范围 | 磁贴速记 + 流水列表 + 未收款清单（拖欠排序）+ 多笔收款 |
| 数据存储 | Supabase 云同步 + 账号 |
| 冷启动 | 工作类型预置，客户/地点/金额自学习 |
| 架构方案 | 方案 B：单屏磁贴墙 + IndexedDB outbox 离线暂存队列 |
| 平台 | 移动端优先的响应式 Web |

**为什么选方案 B（离线暂存队列）而非纯云**：用户要记「外勤工作地点」，外勤意味着人在外面、信号不稳。纯云同步在断网时写入失败，直接打在核心场景上——干完活掏出手机记不下来，就只能靠脑子记，产品初衷当场破产。方案 B 用一个 outbox 表 + 重试换回核心场景可靠性，同时**不做双向同步与冲突合并**，比完整 offline-first 轻一个量级。

---

## 1. 产品定义

**一句话**：给自由职业者的「外挂记忆」——干完活点几下磁贴，就把这单的内容、时间、钱、地点、状态全记下来，永远不靠脑子。

**产品名**：一记（一键记录 / 记一笔账）

**目标用户**：个体自由职业者，含创意类（设计、摄影）、文字类（文案、翻译）、咨询教练类、技术类（开发）。以项目制为主但有时间约束，需要知道「这单花了多少时间、划不划算」。

**核心痛点**：Excel 记账 + 手机日历排期 + 微信群确认收款 + 脑子记忆，导致漏记、钱没收回来、月底对账头疼。

---

## 2. MVP 范围

### 做

1. **磁贴速记** —— 单屏点选，3-5 秒成一条
2. **流水列表** —— 时间倒序，可筛选，左滑快捷操作
3. **未收款清单** —— 按拖欠天数排序，拖最久的置顶警示
4. **多笔收款** —— 一条工作挂 N 笔，定金尾款分开记

### 明确不做（v1）

统计图表、客户维度汇总页、时薪排行、Excel 导入、自动定位、地图 API、团队协作、发票与合同、项目层（只留客户）、收款方式字段、账期与交付日管理、软删除。

> `duration_minutes` 字段照存，时薪排行的数据基础已具备，v2 可直接加。

---

## 3. 数据模型

### 3.1 Supabase / PostgreSQL

```sql
clients (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id),
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, name)          -- 自学习磁贴去重
)

work_types (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id),
  name        text not null,
  icon        text,               -- emoji
  sort_order  int  not null default 0,
  unique (user_id, name)
)
-- 注册时把预置类型 seed 到该用户名下，RLS 规则统一，
-- 不用处理 user_id is null 的全局行

locations (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id),
  name         text not null,
  use_count    int  not null default 1,   -- 驱动磁贴排序
  last_used_at timestamptz not null default now(),
  unique (user_id, name)
)

work_records (
  id               uuid primary key,     -- 客户端生成，幂等关键
  user_id          uuid not null references auth.users(id),
  client_id        uuid not null references clients(id),
  work_type_id     uuid not null references work_types(id),
  title            text,                 -- 选填一句话
  work_date        date not null,
  duration_minutes int,                  -- 可空
  location_id      uuid references locations(id),
  expected_amount  numeric(12,2) not null check (expected_amount > 0),
  is_completed     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
)

payments (
  id              uuid primary key,      -- 客户端生成
  user_id         uuid not null references auth.users(id),
  work_record_id  uuid not null references work_records(id) on delete cascade,
  amount          numeric(12,2) not null check (amount > 0),
  received_at     date not null,
  created_at      timestamptz not null default now()
)
```

### 3.2 三个关键决策

**决策 1：收款状态一律派生，不存字段。**

```
paid_amount    = coalesce(sum(payments.amount), 0)
payment_status = paid_amount = 0                -> 'unpaid'
               | paid_amount < expected_amount  -> 'partial'
               | otherwise                      -> 'paid'
```

理由：旧 PRD 同时存 `paymentStatus` 和 `actualAmount`，这两个字段必然会打架（改了收款忘了改状态）。派生则不可能不一致。

**决策 2：金额用 `numeric(12,2)`，绝不用 float。** 浮点会算出 `0.1 + 0.2 = 0.30000000000000004`，对账时是灾难。

**决策 3：outbox 在客户端 IndexedDB，不进 Supabase。** 见 §5.3。

### 3.3 未收款视图

```sql
create view v_unpaid with (security_invoker = true) as
select
  wr.id,
  wr.user_id,
  wr.client_id,
  c.name                                   as client_name,
  wt.name                                  as work_type_name,
  wt.icon                                  as work_type_icon,
  wr.title,
  wr.work_date,
  wr.expected_amount,
  coalesce(p.paid_amount, 0)               as paid_amount,
  wr.expected_amount - coalesce(p.paid_amount, 0) as outstanding_amount,
  greatest(0, current_date - wr.work_date) as days_overdue
from work_records wr
join clients    c  on c.id  = wr.client_id
join work_types wt on wt.id = wr.work_type_id
left join (
  select work_record_id, sum(amount) as paid_amount
  from payments group by work_record_id
) p on p.work_record_id = wr.id
where wr.expected_amount > coalesce(p.paid_amount, 0);
```

`greatest(0, ...)` 兜住 `work_date` 记未来时拖欠天数为负的情况（允许记「明天要干的活」）。

`security_invoker = true` 让视图以调用者身份执行，RLS 生效。

### 3.4 索引与 RLS

索引：
- `work_records (user_id, work_date desc)`
- `work_records (user_id, client_id)`
- `payments (user_id, work_record_id)`
- `locations (user_id, last_used_at desc)`

RLS：每张表 `using (auth.uid() = user_id)` + 同样的 `with check`，用户之间完全隔离。

---

## 4. 界面结构与交互

### 4.1 整体

底部三个 Tab：**速记**（默认落地页）、**流水**、**未收款**（红点角标显示笔数）。

### 4.2 屏 1 · 速记（单屏，不滚动）

```
顶栏   一记                    ⚙
日期   📅 今天 9月12日 ▾

给谁做的？
  [张三] [李四] [王五] [+ 新客户]

做了什么？            <- 必填
  [🎨设计] [💻开发] [📝文案] [📷摄影] [+其他]
  [ 补充一句（选填）              ]

多少钱？              <- 必填
  [¥500] [¥1000] [¥3000] [自定义]

干了多久？
  [0.5h] [1h] [2h] [半天] [全天]

在哪？
  [家] [线上] [客户现场] [+]

  [ ✓ 已完成 ]   [ ¥ 已入账 ]

底部固定  ┌────────────────┐
         │  记一笔 ¥3000   │
         └────────────────┘
```

**交互规则**

1. **单屏放得下**靠：chip 高度 32px、每组只占一行、超宽横向滑动。iPhone SE 视口约 570px，总计约 530px。
2. **磁贴单选**，点一下高亮，再点取消。排序按 `use_count` + `last_used_at`，越常用越靠左。
3. **保存后不跳页**，停在速记页 + toast「已记下」+ 磁贴复位，支持连续记多条。
4. **「已入账」开关打开时**就地向下展开金额输入，默认填应收全额。此时 `received_at` 默认取**今天**，且速记页内**不提供日期选择**——保持录入速度。需要改到账日期时，去流水或未收款页的收款弹层里改。
5. **必填只有 3 个**：客户、类型、金额。未齐时底部按钮置灰并显示缺什么（如「还差：多少钱」）。时长、地点、完成、入账全可空。
6. **自学习**：点 `[+]` → 单行输入弹层 → 输完即选中并落库，下次出现在磁贴行里。

### 4.3 屏 2 · 流水

按日期分组倒序，每条一张卡片：

```
张三 · 🎨设计
¥3000  [部分收款]
2h · 客户现场 · ✓已完成
```

卡片第二行按「时长 · 地点 · 完成标记」拼接，**字段为空则整段省略**，不显示占位符。例如没填时长和地点时只显示 `✓已完成`，三者全空则不渲染第二行。

**左滑卡片**露出 `收款` `完成` 两个快捷按钮，不进详情即可改状态。

顶部筛选 chips：`全部` `未收款` `已完成` `本月`。

### 4.4 屏 3 · 未收款

```
汇总横幅   还没收回来
          ¥18,600
          共 5 笔

置顶警示   ⚠ 拖最久 · 李四
          ¥6,000 · 拖欠 47 天
          [催一下]

列表（按 days_overdue 降序）
  张三 · 🎨设计 · 9月3日
  ¥3000 ▓▓▓░░░░░░ 已收¥1000
  拖欠 9 天            [收款]
```

**拖欠天数** = `今天 - work_date`，即「工作发生至今」。不是账期逾期——v1 不做账期。

**点「收款」** → 底部弹层：金额磁贴（默认 = 剩余未收）+ 到账日期 → 确认，往 `payments` 追加一笔。进度条前进，足额后该条从未收款清单消失。

**「催一下」** v1 只复制一段催款文案到剪贴板，不接微信/短信——接第三方发送成本高且有合规风险。

---

## 5. 技术架构

### 5.1 技术栈

React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui + Supabase（Auth / PostgreSQL / RLS）+ TanStack Query + Zustand + Dexie.js（IndexedDB）

### 5.2 分层与目录

- **UI** —— 三 Tab 页面与磁贴组件
- **状态** —— Zustand 管磁贴草稿；TanStack Query 管服务端读取缓存
- **领域** —— `outbox` 离线队列、`tiles` 自学习、`money` 金额、`derive` 状态派生
- **数据** —— Supabase + Dexie.js

```
src/
  app/              路由 + Provider + Tab 骨架
  features/
    auth/           登录注册、会话守卫
    quick-record/   磁贴墙、草稿状态、保存
    ledger/         流水列表、筛选、左滑操作
    unpaid/         未收款清单、拖欠排序、收款弹层
    tiles/          客户/地点磁贴自学习
  lib/
    supabase.ts     客户端单例
    db.ts           Dexie 定义（outbox + 读缓存）
    outbox.ts       入队 / flush / 重试 / 幂等
    money.ts        整数分运算
    derive.ts       收款状态派生
  types/
```

### 5.3 outbox

```
outbox (
  id          text,    -- 客户端 UUID
  op          text,    -- insert | update | delete
  table_name  text,    -- work_records | payments | clients | locations | work_types
  payload     json,
  created_at  number,
  attempts    number,
  last_error  text?
)
```

**写入路径**

```
点「记一笔」
  -> 生成客户端 UUID
  -> ① 落 IndexedDB outbox
     ② 乐观更新 Query 缓存
     ③ toast「已记下」
  -> 后台 flush
     按 created_at 串行 upsert 到 Supabase
     成功 -> 删除该 outbox 条目
     失败 -> attempts++，退避重试 1s / 5s / 30s / 2min
```

**幂等关键**：UUID 客户端生成 + `upsert on id`。断网重发多次也只有一行，不会产生重复账。

**硬约束：flush 必须「串行 + 遇错即停」**，不能并发、不能跳过失败项。

理由：离线时可能先建 `work_record`，再给它加 `payment`。并发推送时 payment 可能先到，外键找不到 record 直接失败。串行按 `created_at` 推、遇错停下等下次，依赖顺序天然成立。

同一约束也覆盖**速记时新建的客户与地点**：`clients` / `locations` 的 insert 先入队，`work_records` 的 insert 后入队，串行推送保证外键成立。所以「点 `[+]` 新建客户并立刻记一笔」这个动作在断网时也必须正确工作。

**flush 触发时机**：入队后立即试、`online` 事件、窗口重获焦点（`visibilitychange`）、有积压时每 60s 兜底。

### 5.4 读取路径

TanStack Query 直读 Supabase，`staleTime` 30s，窗口聚焦时 refetch。未收款清单读视图 `v_unpaid`，聚合在数据库侧完成，不在前端算。

**冲突处理**：单用户单写者，`updated_at` 后写胜出。不做三方合并。

### 5.5 两个实现决策

**金额在客户端一律用整数分运算。** 不引 `decimal.js`，全程 `cents: number`，只在读写 Supabase 边界与 `numeric(12,2)` 互转。彻底杜绝浮点误差，零依赖成本。

**金额磁贴不建表，动态生成。** 从最近 30 天历史取出现频次 top 4 的金额当磁贴，常用价位自动浮现，无需手动维护。**冷启动兜底**：历史不足 4 个不同金额时，用固定默认档 `¥500 / ¥1000 / ¥3000 / ¥5000` 补齐空位，保证首次使用金额行不是空的。`[自定义]` 始终存在。

时长磁贴固定 5 档不自学习；类型磁贴注册时 seed 预置（设计 / 开发 / 翻译 / 咨询 / 摄影 / 文案 / 其他），用户可加。

### 5.6 同步状态可见性

顶栏一个小圆点：

- 灰点 `已同步`
- 橙点 `待同步 N 条` —— 可点开手动重试
- 红点 `同步失败` —— 提示检查网络，数据仍在本地不会丢

---

## 6. 错误处理

按严重度排序：

1. **读取失败绝不白屏。** Query 出错时展示 IndexedDB 上次缓存 + 顶部条「网络不可用，显示的是上次同步的数据」。
2. **写入失败对用户不可见。** 静默进 outbox，UI 照样「已记下」。
3. **session 过期时保住 outbox。** 静默 refresh；refresh 失败踢到登录页，但 outbox 不清空，登录后继续 flush。这是最容易丢账的地方。
4. **重试耗尽（attempts > 5）转红点。** 停止自动重试，顶栏可手动「立即重试」。数据永不丢弃，一直留在 IndexedDB 直到成功。
5. **双击保存必须前端拦。** UUID 幂等只防云端重复行，防不了双击生成两个不同 UUID。按钮点击后立即 disable + 乐观更新。
6. **新建磁贴重名不报错。** 撞 `unique(user_id, name)` 时直接选中已存在的那个（upsert 语义）。
7. **拖欠天数负数**由 SQL `greatest(0, ...)` 兜住。
8. **金额校验**：> 0、上限 99,999,999、超 2 位小数自动截断并提示。**收款超过应收允许**（客户多付、含税差异），状态判 `paid` 并显示「多收 ¥X」。**时长**：1 分钟 ~ 24 小时，超出提示拆成两条。
9. **删除工作记录会级联删掉其收款。** 二次确认文案写明「同时删除 N 笔收款记录」。不做软删除。

---

## 7. 测试策略

### 第一优先 · 纯函数单测（Vitest）

- `money.ts`：分↔元互转、四舍五入边界（¥0.005）
- `derive.ts`：收款状态全分支（0 笔 / 不足 / 足额 / 超额）
- 拖欠天数：未来日期、跨月、跨年
- 磁贴排序（`use_count` + `last_used_at`）
- 金额磁贴 top4 频次统计

### 第二优先 · outbox 集成测（Vitest + fake-indexeddb）

- 入队 → flush 成功 → outbox 清空
- 网络失败 → `attempts++` → 退避间隔正确
- 同一条目 flush 两次 → Supabase 只有一行（幂等）
- record + payment 乱序入队 → 推送顺序仍正确

### 第三优先 · 组件测（Testing Library）

只测关键交互：必填未齐时按钮置灰、齐了可保存；双击保存只产生一条；左滑出快捷操作。

### 不测

Supabase 真实连接（CI 无凭证）、视觉快照（维护成本高、收益低）。

---

## 8. 验收口径

- 已有磁贴时，从打开到保存 **≤ 5 秒**
- 断网能完成记录，恢复网络后自动同步成功且**不产生重复账**
- 未收款清单拖欠排序正确，收款后条目消失
- 金额计算零浮点误差（单测覆盖）
- 用户数据完全隔离，无法访问他人数据

---

## 9. 落地方式

新项目放独立目录 `D:\qoder project\yiji\`，不动旧项目。

旧 `freelance-tracker/` 归档步骤（**执行前需再次向用户确认**，绝不删除任何内容）：

1. 把 14 个未提交的修改提交到分支 `archive/v1-fullapp`
2. 把未入 git 的 `spark-output/` 与嵌套 `freelance-tracker/freelance-tracker/` 原型稿一并纳入该分支
3. 打 tag `archive-v1`，切回 master 保持原样

Supabase：确认能否复用旧项目 `.env.local` 里的同一实例，避免重新建项目；但表结构全新设计（多笔收款是新模型），需新迁移文件，且不得与旧 `001_initial_schema.sql` 的表名冲突。

---

## 10. v2 候选

时薪与划算度排行（数据已具备）、统计图表、客户维度汇总页、账期与交付日管理、收款方式字段、Excel 导入、自动定位、PWA 离线安装。
