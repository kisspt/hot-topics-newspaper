# 自制饮品网站设计文档

**日期：** 2026-09-10  
**项目名称：** 自制饮品网站  
**技术栈：** Next.js 14 + PostgreSQL + Prisma + NextAuth + Tailwind CSS

---

## 1. 项目概述

### 1.1 产品定位
一个帮助用户发现、学习和制作自制饮品的网站，提供食谱百科和智能推荐两大核心功能。

### 1.2 核心功能
1. **食谱百科**：浏览、搜索、学习各类饮品制作方法
2. **智能推荐**：根据用户现有食材和口味偏好，推荐适合的饮品
3. **轻量用户系统**：收藏功能、常备食材管理（后续扩展到社区）

### 1.3 内容范围
- **首期分类**：咖啡、茶、鸡尾酒
- **后续迭代**：果汁、奶昔、气泡水等

---

## 2. 页面结构

### 2.1 核心页面

```
/                          # 首页（分类导航 + 热门推荐 + 分类浏览）
/drinks                    # 食谱列表页（筛选、搜索、分页）
/drinks/[slug]             # 饮品详情页（完整食谱 + 食材清单 + 步骤）
/recommend                 # 智能推荐页（食材输入 + 偏好选择 + 推荐结果）
/categories/[slug]         # 分类详情页（该分类下的所有饮品）

/user/favorites            # 我的收藏
/user/ingredients          # 我的食材库
```

### 2.2 全局组件

- **Header**：Logo、搜索框、主题切换、用户菜单
- **Footer**：版权信息、链接
- **Sidebar**（桌面端）：分类导航、快捷入口
- **MobileNav**（移动端）：底部导航栏

---

## 3. 数据模型

### 3.1 实体关系

```
Category 1:N Drink
User 1:N Favorite
User 1:N UserIngredient
Drink N:N User (through Favorite)
```

### 3.2 数据表定义

#### Drink（饮品）
```typescript
{
  id: string (UUID)
  name: string                    # 名称
  slug: string (unique)           # URL 友好标识
  categoryId: string              # 分类 ID
  description: string             # 简介
  coverImage: string              # 封面图 URL
  difficulty: 'easy' | 'medium' | 'hard'
  prepTime: number                # 制作时间（分钟）
  servings: number                # 份数
  temperature: 'hot' | 'cold' | 'both'
  alcohol: boolean                # 是否含酒精
  flavorTags: string[]            # 口味标签 ["浓郁", "微甜"]
  ingredients: Ingredient[]       # 食材清单（JSON）
  steps: Step[]                   # 制作步骤（JSON）
  tips: string                    # 小贴士
  substitutions: string           # 替代食材建议
  calories: number                # 热量（可选）
  status: 'draft' | 'published'
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Ingredient（食材）
```typescript
{
  name: string                    # 食材名称
  amount: number                  # 用量
  unit: string                    # 单位（ml, g, 个）
  optional: boolean               # 是否可选
}
```

#### Step（步骤）
```typescript
{
  order: number                   # 步骤序号
  description: string             # 步骤描述
  image: string (optional)        # 步骤图片
  duration: number (optional)     # 该步骤耗时
}
```

#### Category（分类）
```typescript
{
  id: string (UUID)
  name: string                    # 分类名称
  slug: string (unique)           # URL 标识
  description: string             # 分类描述
  icon: string                    # 图标
}
```

#### User（用户）
```typescript
{
  id: string (UUID)
  email: string (unique)
  name: string
  avatar: string
  passwordHash: string (optional) # 可选密码登录
  createdAt: DateTime
}
```

#### Favorite（收藏）
```typescript
{
  userId: string
  drinkId: string
  createdAt: DateTime
}
```

#### UserIngredient（用户食材）
```typescript
{
  userId: string
  ingredientName: string          # 食材名称
  createdAt: DateTime
}
```

---

## 4. 主题系统

### 4.1 四套预设主题

#### Fresh（清新自然）- 默认
```typescript
{
  name: "fresh",
  colors: {
    primary: "#4CAF50",           // 绿色
    background: "#FAFAFA",        // 浅灰白
    surface: "#FFFFFF",           // 白色
    text: "#333333",              // 深灰
    textSecondary: "#666666",     // 中灰
    border: "#E0E0E0",            // 边框灰
    accent: "#81C784"             // 浅绿
  },
  borderRadius: "12px",
  spacing: "comfortable"
}
```

#### Dark（深色高级）
```typescript
{
  name: "dark",
  colors: {
    primary: "#D4AF37",           // 金色
    background: "#1A1A1A",        // 深黑
    surface: "#2A2A2A",           // 深灰
    text: "#FFFFFF",              // 白色
    textSecondary: "#B0B0B0",     // 浅灰
    border: "#3A3A3A",            // 边框深灰
    accent: "#FFD700"             // 亮金
  },
  borderRadius: "8px",
  spacing: "compact"
}
```

#### Vibrant（活力明亮）
```typescript
{
  name: "vibrant",
  colors: {
    primary: "#FF6B6B",           // 珊瑚红
    background: "#FFFFFF",        // 纯白
    surface: "#FFF5F5",           // 浅粉白
    text: "#2D3748",              // 深灰蓝
    textSecondary: "#718096",     // 中灰蓝
    border: "#FED7D7",            // 浅粉
    accent: "#FC8181"             // 浅红
  },
  borderRadius: "16px",
  spacing: "comfortable"
}
```

#### Minimal（极简高对比）
```typescript
{
  name: "minimal",
  colors: {
    primary: "#333333",           // 深灰
    background: "#FFFFFF",        // 纯白
    surface: "#F7F7F7",           // 浅灰
    text: "#000000",              // 纯黑
    textSecondary: "#666666",     // 中灰
    border: "#E5E5E5",            // 边框灰
    accent: "#000000"             // 纯黑
  },
  borderRadius: "4px",
  spacing: "dense"
}
```

### 4.2 技术实现

- **CSS 变量**：定义主题颜色
- **Tailwind CSS**：使用 CSS 变量
- **next-themes**：管理主题状态
- **localStorage**：持久化用户选择

### 4.3 用户交互

1. 检测系统偏好（`prefers-color-scheme`）
2. 手动切换主题
3. 自动保存选择
4. 页面加载时应用主题（避免闪烁）

---

## 5. API 设计

### 5.1 路由结构

```
/api
├── /drinks
│   ├── GET /api/drinks              # 获取饮品列表
│   ├── GET /api/drinks/[slug]       # 获取单个饮品
│   ├── POST /api/drinks             # 创建饮品
│   ├── PUT /api/drinks/[id]         # 更新饮品
│   └── DELETE /api/drinks/[id]      # 删除饮品
│
├── /categories
│   ├── GET /api/categories          # 获取所有分类
│   └── GET /api/categories/[slug]   # 获取分类下饮品
│
├── /recommend
│   └── POST /api/recommend          # 智能推荐
│
├── /user
│   ├── GET /api/user/profile        # 获取用户信息
│   ├── PUT /api/user/profile        # 更新用户信息
│   ├── /favorites
│   │   ├── GET /api/user/favorites          # 获取收藏
│   │   ├── POST /api/user/favorites         # 添加收藏
│   │   └── DELETE /api/user/favorites/[id]  # 取消收藏
│   └── /ingredients
│       ├── GET /api/user/ingredients        # 获取食材
│       └── POST /api/user/ingredients       # 添加食材
│
└── /auth
    └── GET /api/auth/[...nextauth]  # NextAuth 路由
```

### 5.2 关键接口

#### 获取饮品列表（GET /api/drinks）

**Query 参数：**
- `category`: 分类 slug
- `difficulty`: 难度筛选
- `time`: 时间筛选
- `temperature`: 温度
- `alcohol`: 含酒精
- `search`: 关键词
- `page`, `limit`: 分页

**Response：**
```json
{
  "drinks": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

#### 智能推荐（POST /api/recommend）

**Request：**
```json
{
  "mode": "both",
  "ingredients": ["牛奶", "鸡蛋", "面粉"],
  "preferences": {
    "taste": ["浓郁"],
    "difficulty": "easy",
    "maxTime": 15,
    "temperature": "hot"
  }
}
```

**Response：**
```json
{
  "drinks": [
    {
      "id": "5",
      "name": "咖啡松饼",
      "matchScore": 92,
      "matchReasons": ["匹配 4/5 种食材", "符合口味偏好"],
      "missingIngredients": ["黄油"]
    }
  ]
}
```

### 5.3 设计原则

1. RESTful 风格
2. 统一响应格式
3. 分页标准化
4. 错误处理规范（400/401/404/500）

---

## 6. 组件架构

### 6.1 组件目录结构

```
src/components/
├── /layout                    # 布局组件
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   └── MobileNav.tsx
│
├── /ui                        # 通用 UI 组件
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   ├── Tabs.tsx
│   ├── SearchInput.tsx
│   ├── Rating.tsx
│   ├── IconButton.tsx
│   └── ThemeSwitcher.tsx
│
├── /drink                     # 饮品相关组件
│   ├── DrinkCard.tsx
│   ├── DrinkGrid.tsx
│   ├── DrinkDetail.tsx
│   ├── IngredientList.tsx
│   ├── StepList.tsx
│   ├── FlavorTags.tsx
│   ├── SubstitutionTip.tsx
│   └── NutritionInfo.tsx
│
├── /recommend                 # 推荐相关组件
│   ├── RecommendPanel.tsx
│   ├── MaterialInput.tsx
│   ├── PreferenceSelector.tsx
│   ├── RecommendResult.tsx
│   ├── MatchScore.tsx
│   └── MissingIngredients.tsx
│
├── /category                  # 分类相关组件
│   ├── CategoryGrid.tsx
│   ├── CategoryCard.tsx
│   └── CategoryFilter.tsx
│
└── /user                      # 用户相关组件
    ├── UserMenu.tsx
    ├── FavoriteButton.tsx
    ├── IngredientManager.tsx
    └── AuthModal.tsx
```

### 6.2 状态管理

#### 服务端状态（React Query / SWR）
- API 数据获取
- 缓存和重新验证
- 加载状态管理

#### 客户端状态（Zustand / Context）
- 用户偏好（主题）
- UI 状态（弹窗、侧边栏）
- 临时数据（推荐输入）

#### URL 状态（Next.js Router）
- 筛选条件
- 分页参数
- 搜索关键词

### 6.3 数据获取模式

1. **页面级数据**：Server Components（静态生成）
2. **交互数据**：Client Components（客户端获取）
3. **混合模式**：Server + Client 组合

### 6.4 响应式设计

**断点：**
- `sm`: 640px（手机横屏）
- `md`: 768px（平板竖屏）
- `lg`: 1024px（平板横屏）
- `xl`: 1280px（笔记本）
- `2xl`: 1536px（桌面）

**策略：**
- 移动端优先
- 网格布局自适应
- 组件响应式 props

---

## 7. 智能推荐算法

### 7.1 算法架构

```
用户输入
  ↓
食材匹配引擎（计算食材覆盖率）
  ↓
偏好匹配引擎（匹配口味、难度、时间）
  ↓
综合评分引擎（加权计算总分）
  ↓
推荐结果列表（Top 10）
```

### 7.2 食材匹配引擎

**输入：** 用户拥有的食材列表

**计算逻辑：**
1. 计算匹配的食材数量
2. 计算覆盖率（匹配数 / 总食材数）
3. 基础分 = 覆盖率 × 100
4. 奖励分：全部匹配 +10 分
5. 惩罚分：缺失核心食材 -20 分/个
6. 最终得分 = max(0, min(100, 基础分 + 奖励分 - 惩罚分))

**示例：**
- 食谱需要：咖啡豆、水
- 用户拥有：咖啡豆、牛奶、糖
- 匹配：咖啡豆 ✓
- 覆盖率：1/2 = 50%
- 得分：50

### 7.3 偏好匹配引擎

**输入：** 用户偏好（口味、难度、时间、温度、酒精）

**匹配维度：**
1. 口味标签匹配（权重 40%）
2. 难度匹配（权重 20%）
3. 时间匹配（权重 20%）
4. 温度匹配（权重 10%）
5. 酒精匹配（权重 10%）

**计算逻辑：**
- 初始分 100
- 每个维度不匹配时按比例扣分
- 返回得分 + 匹配理由

### 7.4 综合评分引擎

**三种模式：**
1. `material`：仅食材匹配
2. `preference`：仅偏好匹配
3. `both`：加权平均（默认 食材 60% + 偏好 40%）

**排序策略：**
1. 计算所有饮品得分
2. 过滤低分（< 30 分）
3. 按总分降序排序
4. 返回 Top 10

### 7.5 推荐理由生成

**理由类型：**
- 食材匹配："匹配 4/5 种食材"
- 缺失提示："还需购买：黄油、奶油"
- 偏好匹配："符合你的口味偏好"
- 综合评分："强烈推荐" / "值得一试"

**显示规则：** 最多 3 条

### 7.6 边界情况处理

1. **未输入食材**：降级为纯偏好推荐
2. **无匹配结果**：放宽筛选条件，返回相似饮品
3. **食材模糊匹配**：标准化食材名称（移除修饰词）

### 7.7 性能优化

1. **缓存策略**：热门分类饮品列表、用户偏好匹配结果
2. **数据库优化**：Prisma select 只查询必要字段
3. **分页加载**：大量数据分页处理

---

## 8. 技术实现细节

### 8.1 项目结构

```
beverage-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # 首页
│   │   ├── drinks/
│   │   │   ├── page.tsx        # 列表页
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # 详情页
│   │   ├── recommend/
│   │   │   └── page.tsx        # 推荐页
│   │   ├── categories/
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # 分类页
│   │   ├── user/
│   │   │   ├── favorites/
│   │   │   └── ingredients/
│   │   └── api/                # API Routes
│   │       ├── drinks/
│   │       ├── recommend/
│   │       └── user/
│   ├── components/             # React 组件
│   ├── lib/                    # 工具函数
│   │   ├── prisma.ts           # Prisma 客户端
│   │   ├── auth.ts             # NextAuth 配置
│   │   └── recommend.ts        # 推荐算法
│   ├── styles/                 # 全局样式
│   └── types/                  # TypeScript 类型
├── prisma/
│   ├── schema.prisma           # 数据模型
│   └── seed.ts                 # 种子数据
├── public/                     # 静态资源
└── package.json
```

### 8.2 关键依赖

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "@prisma/client": "5.x",
    "next-auth": "4.x",
    "tailwindcss": "3.x",
    "next-themes": "0.3.x",
    "@tanstack/react-query": "5.x",
    "zustand": "4.x"
  },
  "devDependencies": {
    "prisma": "5.x",
    "@types/react": "18.x",
    "@types/node": "20.x"
  }
}
```

### 8.3 数据库配置

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

### 8.4 认证配置

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  // ...
};
```

---

## 9. 部署方案

### 9.1 推荐部署平台

**Vercel**（Next.js 官方平台）
- 自动部署（Git 集成）
- 全球 CDN
-  Serverless Functions
- 免费额度充足

### 9.2 数据库托管

**选项：**
1. **Vercel Postgres**（推荐）：与 Vercel 深度集成
2. **Supabase**：开源 Firebase 替代
3. **Railway**：简单易用
4. **Neon**：Serverless PostgreSQL

### 9.3 环境变量

```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."
GOOGLE_ID="..."
GOOGLE_SECRET="..."
```

---

## 10. 后续迭代计划

### Phase 2（3-6 个月）
- 新增分类：果汁、奶昔、气泡水
- 社区功能：用户提交食谱、评论、评分
- 社交分享：分享到微信、微博

### Phase 3（6-12 个月）
- AI 生成食谱：基于食材组合自动生成新食谱
- 视频教学：步骤视频播放
- 购物清单：一键生成食材购买清单
- 制作记录：记录制作历史、评分、改进

### Phase 4（12+ 个月）
- 移动端 App
- 智能硬件集成：连接智能厨具
- 个性化推荐：基于历史行为的深度学习推荐

---

## 11. 成功指标

### 11.1 用户指标
- 日活跃用户（DAU）
- 用户留存率（7 日、30 日）
- 平均访问时长

### 11.2 功能指标
- 食谱浏览量
- 推荐功能使用率
- 收藏功能使用率
- 推荐准确率（用户满意度）

### 11.3 内容指标
- 食谱数量（按分类）
- 用户提交食谱数量
- 食谱平均评分

---

## 12. 风险与应对

### 12.1 技术风险
- **性能问题**：大量数据查询 → 优化查询、添加缓存
- **图片加载慢**：使用 Next.js Image 组件、CDN、懒加载
- **SEO 问题**：使用 Server Components、生成静态页面

### 12.2 内容风险
- **食谱质量**：建立审核机制、用户举报
- **版权问题**：用户提交时确认原创、标注来源
- **内容更新**：定期更新种子数据、鼓励用户贡献

### 12.3 运营风险
- **用户增长慢**：社交媒体推广、SEO 优化
- **用户留存低**：优化推荐算法、增加互动功能
- **竞品压力**：持续迭代、打造差异化功能

---

## 附录

### A. 术语表
- **食谱百科**：饮品食谱的集合和浏览功能
- **智能推荐**：基于食材和偏好的个性化推荐
- **食材匹配**：计算用户食材与食谱食材的匹配度
- **偏好匹配**：根据用户口味、难度、时间等偏好筛选

### B. 参考资料
- Next.js 文档：https://nextjs.org/docs
- Prisma 文档：https://www.prisma.io/docs
- NextAuth 文档：https://next-auth.js.org
- Tailwind CSS：https://tailwindcss.com/docs

---

**文档版本：** 1.0  
**最后更新：** 2026-09-10  
**作者：** AI Assistant + User Collaboration
