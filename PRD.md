# 虚拟试衣 AI 工具 V1 PRD

> 文档版本: v1.0  
> 创建日期: 2026-08-19  
> 适用范围: V1 MVP 全量功能设计

---

## 目录

1. [用户流程（User Flow）](#1-用户流程user-flow)
2. [页面模块（Pages & Modules）](#2-页面模块pages--modules)
3. [核心状态机（State Machine）](#3-核心状态机state-machine)
4. [订阅体系（Subscription Design）](#4-订阅体系subscription-design)
5. [埋点指标（Tracking Metrics）](#5-埋点指标tracking-metrics)
6. [MVP 优先级排期（MVP Prioritization）](#6-mvp-优先级排期mvp-prioritization)

---

## 1. 用户流程（User Flow）

### 1.1 主流程：首次访问 → 完成第一次试穿

```
Landing Page（落地页）
    │
    ▼
[点击 "Try Now" / "Start Free Trial"]
    │
    ▼
Trial Onboarding（试用引导页）
    │ 说明：免费额度、使用步骤、隐私承诺
    ▼
Step 1: Upload Person Photo（上传人物照）
    │ 支持：拖拽 / 点击选择 / 示例图
    │ 校验：文件格式、文件大小
    ▼
Step 2: Upload Clothing Photo（上传服装图）
    │ 支持：拖拽 / 点击选择 / 示例图
    │ 校验：文件格式、文件大小
    ▼
Generating（生成中）
    │ 进度条 + 预估时间（10-20s）
    │ 服装类别自动识别（后台进行，UI展示识别结果）
    ▼
Result Page（结果页）
    │ 展示：试穿预览图 + 原图对比
    │ 操作：下载 / 重新生成 / 换一件 / 保存（登录后）
    ├─→ [换一件] → 回到 Step 2（人物图复用）
    ├─→ [重新生成] → 回到 Generating（同一张服装图重试）
    └─→ [免费额度用完] → 引导订阅页
```

### 1.2 复用流程：连续试穿（人物图复用）

```
Result Page
    │
    ▼ [点击 "Try Another Outfit"]
    │
Step 2: Upload New Clothing（仅上传服装图）
    │ 人物照区域显示已上传的缩略图 + "Change" 按钮
    ▼
Generating（生成中）
    ▼
Result Page（新结果）
    └─→ 可继续循环 N 次，直到额度用完
```

### 1.3 登录 / 注册流程

```
任意页面 [点击 Sign In / Save Result]
    │
    ▼
Auth Page（登录注册页）
    │ 支持：Email + Password / Google OAuth / Apple OAuth
    │ 新用户自动创建账号
    ▼
回调到触发页面
    ├─→ 如果是从 Save Result 触发 → 结果自动写入历史
    └─→ 如果是从 Landing 触发 → 进入 Dashboard
```

### 1.4 订阅转化流程

```
额度用尽弹窗 / Result Page 订阅入口
    │
    ▼
Pricing Page（订阅方案页）
    │ 展示：各方案对比 + 权益说明
    ▼
Checkout（支付页）
    │ 集成：Stripe
    ▼
支付成功 → 额度充值 → 返回试衣页 / Dashboard
```

### 1.5 历史记录流程

```
Dashboard（登录后首页）
    │
    ├─→ Recent History（最近试穿记录）
    │       ├─ 点击某条 → History Detail（单条详情）
    │       │       ├─ 下载结果图
    │       │       ├─ 用同款服装重新生成（换人物图）
    │       │       └─ 删除该记录
    │       └─ 查看全部 → History List（历史列表页）
    │
    ├─→ My Uploads（我的上传素材）
    │       ├─ 人物图库（可快速选用）
    │       └─ 服装图库（可快速选用）
    │
    └─→ Subscription（订阅管理）
            ├─ 当前方案 & 到期时间
            ├─ 剩余额度
            └─ 升级 / 取消订阅
```

---

## 2. 页面模块（Pages & Modules）

### 2.1 路由结构（Next.js App Router）

```
app/
├── layout.tsx                      # 全局布局（Header + Footer + Providers）
├── page.tsx                        # 落地页 Landing
├── try/
│   ├── layout.tsx                  # 试衣流程布局（步骤指示器）
│   ├── page.tsx                    # 试衣主容器（根据 step 渲染子组件）
│   ├── step-person.tsx             # Step 1: 上传人物照
│   ├── step-clothing.tsx           # Step 2: 上传服装图
│   ├── generating.tsx              # 生成中页面
│   └── result.tsx                  # 结果页
├── auth/
│   ├── page.tsx                    # 登录/注册页
│   └── callback/
│       └── page.tsx                # OAuth 回调
├── dashboard/
│   ├── page.tsx                    # 仪表盘首页（登录后）
│   ├── history/
│   │   ├── page.tsx                # 历史记录列表
│   │   └── [id]/
│   │       └── page.tsx            # 单条历史详情
│   ├── uploads/
│   │   └── page.tsx                # 我的素材库
│   └── subscription/
│       └── page.tsx                # 订阅管理
├── pricing/
│   └── page.tsx                    # 订阅方案页
├── checkout/
│   └── page.tsx                    # 支付页
└── api/                            # API Routes（后端接口）
    ├── auth/[...]                  # Auth.js 路由
    ├── upload/route.ts             # 图片上传（→ S3 / Cloudflare R2）
    ├── try-on/generate/route.ts    # 调用 AI 生成试穿图
    ├── try-on/regenerate/route.ts  # 重新生成
    ├── history/route.ts            # CRUD 历史记录
    ├── subscription/
    │   ├── check/route.ts          # 检查订阅状态 & 额度
    │   └── webhook/route.ts        # Stripe Webhook
    └── usage/consume/route.ts      # 扣减试穿额度
```

### 2.2 全局组件（Shared Components）

| 组件名 | 路径 | 说明 |
|--------|------|------|
| `SiteHeader` | `components/layout/site-header.tsx` | 顶部导航：Logo / Sign In / Sign Up / 用户头像菜单 |
| `SiteFooter` | `components/layout/site-footer.tsx` | 页脚：版权 / 链接 / 社交 |
| `StepIndicator` | `components/try-on/step-indicator.tsx` | 试衣流程步骤条（1→2→3→4） |
| `ImageUploader` | `components/ui/image-uploader.tsx` | 通用图片上传组件（拖拽 + 预览 + 校验） |
| `PersonPhotoUploader` | `components/try-on/person-photo-uploader.tsx` | 人物照上传器（带示例图、使用提示） |
| `ClothingPhotoUploader` | `components/try-on/clothing-photo-uploader.tsx` | 服装图上传器（带品类说明） |
| `GeneratingSpinner` | `components/try-on/generating-spinner.tsx` | 生成中动画 + 进度文案 |
| `ResultComparison` | `components/try-on/result-comparison.tsx` | 结果对比滑块（Before / After） |
| `TryOnResultCard` | `components/try-on/try-on-result-card.tsx` | 结果卡：图 + 操作按钮 |
| `CategoryBadge` | `components/ui/category-badge.tsx` | 识别品类标签（上装/下装/连衣裙） |
| `UsageMeter` | `components/subscription/usage-meter.tsx` | 额度使用进度条 |
| `QuotaExceededModal` | `components/subscription/quota-exceeded-modal.tsx` | 额度用尽弹窗 → 引导订阅 |
| `FeatureCard` | `components/marketing/feature-card.tsx` | 落地页特性卡片 |
| `PricingCard` | `components/subscription/pricing-card.tsx` | 订阅方案卡片 |

### 2.3 各页面详细模块

#### 2.3.1 Landing Page（落地页）

目标：让访客 3 秒内理解产品价值，点击 "Try Now"。

```
┌─────────────────────────────────────────────────────────┐
│ Hero Section                                            │
│   • 大标题: "See how clothes look on YOU before buying" │
│   • 副标题: 1-2句价值主张                                │
│   • CTA按钮: [Start Free Trial] 主按钮                  │
│   • 右侧/下方: 3张 Before→After 示例对比图              │
├─────────────────────────────────────────────────────────┤
│ How It Works（3步流程）                                  │
│   Step 1 📸 Upload your photo                           │
│   Step 2 👕 Upload clothing image                       │
│   Step 3 ✨ Get your try-on preview (10-20s)            │
├─────────────────────────────────────────────────────────┤
│ Features（核心卖点，4-6张卡片）                           │
│   • Works with any photo (no pose required)             │
│   • Keep your face & body shape                         │
│   • Tops, bottoms, dresses supported                    │
│   • Try unlimited outfits in one session                │
├─────────────────────────────────────────────────────────┤
│ Use Cases（使用场景）                                     │
│   • Online shopping preview                             │
│   • Wardrobe combination testing                        │
│   • Before ordering custom clothes                      │
├─────────────────────────────────────────────────────────┤
│ Pricing Preview（订阅方案预览，锚链到/pricing）            │
│   "Start free, upgrade anytime" + 3方案卡片             │
├─────────────────────────────────────────────────────────┤
│ FAQ（常见问题，5-8条）                                     │
│   • Is my photo safe?                                   │
│   • What kinds of clothes work best?                    │
│   • How accurate is the preview?                        │
│   • Can I delete my history?                            │
├─────────────────────────────────────────────────────────┤
│ Footer                                                  │
└─────────────────────────────────────────────────────────┘
```

#### 2.3.2 Try-On Flow（试衣流程页）

**Step 1 - 上传人物照：**
```
┌───────────────────────────────────────────────┐
│ StepIndicator: [① 上传人物照 → ② 上传服装 → ...] │
├───────────────────────────────────────────────┤
│ 左侧: 上传区域（大框，拖拽/点击）                │
│   • 支持 JPG/PNG/WebP, ≤10MB                  │
│   • 上传后显示预览 + "重新上传" + "继续"按钮     │
│ 右侧: 使用 Tips + 示例图                        │
│   • Good: 全身照、正面/侧面、光线充足            │
│   • OK: 日常自拍、背景有人物                    │
│   • Bad: 多人合照、坐姿蹲姿、严重遮挡            │
│   • 4张示例缩略图（点击即用作人物图）            │
├───────────────────────────────────────────────┤
│ 底部: [← Back]    [Continue →]（禁用→可用）     │
└───────────────────────────────────────────────┘
```

**Step 2 - 上传服装图：**
```
┌───────────────────────────────────────────────┐
│ StepIndicator: [① ✓ → ② 上传服装 → ③ 生成 → ...]│
├───────────────────────────────────────────────┤
│ 顶部: 人物图缩略图（小）+ "Change" 按钮         │
├───────────────────────────────────────────────┤
│ 左侧: 服装上传区域（同 Step1 样式）              │
│ 右侧: 品类说明 + 示例                            │
│   • Supported: Tops / Bottoms / Dresses        │
│   • 每类一张示例图                              │
│   • 一张仅替换一件（V1 Non-goal 说明）           │
├───────────────────────────────────────────────┤
│ 底部: [← Back]    [Generate Try-On →]          │
└───────────────────────────────────────────────┘
```

**Generating - 生成中：**
```
┌───────────────────────────────────────────────┐
│ StepIndicator: [① ✓ → ② ✓ → ③ 生成中 → ④ 结果] │
├───────────────────────────────────────────────┤
│     ⏳ 大号加载动画（品牌色渐变 Spinner）         │
│     "Generating your preview..."               │
│     进度条（模拟，0→100% 约 15s）                │
│     动态文案轮换:                               │
│       • Detecting clothing category...         │
│       • Aligning garment to your body...       │
│       • Refining details...                    │
│       • Almost there...                        │
├───────────────────────────────────────────────┤
│ 识别到的品类 Badge（识别完成后显示）              │
│   Detected: [T-shirt 👕 / Pants 👖 / Dress 👗] │
├───────────────────────────────────────────────┤
│ "This usually takes 10-20 seconds"             │
│ "You'll receive a preview — not a guarantee"   │
└───────────────────────────────────────────────┘
```

**Result - 结果页：**
```
┌───────────────────────────────────────────────────┐
│ StepIndicator: [① ✓ → ② ✓ → ③ ✓ → ④ 结果]          │
├───────────────────────────────────────────────────┤
│ 顶部: UsageMeter（剩余额度：3/5 免费）               │
├───────────────────────────────────────────────────┤
│ ResultComparison（左右对比滑块）                     │
│   左: Original Person      右: Try-On Result       │
│   支持拖拽切换，0%~100%                            │
├───────────────────────────────────────────────────┤
│ 结果操作区:                                         │
│   [⤓ Download PNG]          主按钮                 │
│   [🔄 Regenerate]           次按钮（消耗额度）       │
│   [👕 Try Another Outfit]   次按钮（回到Step2）     │
│   [💾 Save to History]      文字按钮（需登录）       │
├───────────────────────────────────────────────────┤
│ Disclaimer（小字）:                                 │
│   "This is a purchase preview reference only.     │
│    Actual fit, drape, and details may vary."       │
└───────────────────────────────────────────────────┘
```

#### 2.3.3 Dashboard（登录后首页）

```
┌───────────────────────────────────────────────────┐
│ Welcome Back, {name}!                             │
│ Current Plan: Free / Pro / Premium (Change Plan)  │
│ Usage: 12 / 50 tries this cycle  [Upgrade →]      │
├───────────────────────────────────────────────────┤
│ Quick Start（快捷入口）                             │
│   [+ Start New Try-On] → 跳转到 /try              │
│   [📂 Use Saved Person Photo] → 从素材库选人       │
├───────────────────────────────────────────────────┤
│ Recent History（最近 6 条）                         │
│   2列网格 × 3行: 每张结果缩略图 + 日期 + 品类标签   │
│   悬停: 显示下载/删除按钮                           │
│   [View All History →]                             │
├───────────────────────────────────────────────────┤
│ Your Uploads（素材快速访问）                         │
│   Person Photos (x5)  [Manage →]                  │
│   Clothing Images (x12) [Manage →]                │
└───────────────────────────────────────────────────┘
```

#### 2.3.4 Pricing Page（订阅方案页）

```
┌───────────────────────────────────────────────────┐
│ Pricing: Simple, transparent plans                │
│ Monthly ○   ● Yearly (Save 20%)                   │
├───────────────────────────────────────────────────┤
│ 3 Cards（左→右）                                    │
│ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│ │ Free         │ │ Pro          │ │ Premium    │ │
│ │ $0           │ │ $9.99/mo     │ │ $19.99/mo  │ │
│ │ ─────────── │ │ ───────────  │ │ ────────── │ │
│ │ ✅ 5 tries   │ │ ✅ 50 tries  │ │ ✅ 200     │ │
│ │ ✅ Basic qty │ │ ✅ HD Output │ │ ✅ Ultra HD │ │
│ │ ❌ No save   │ │ ✅ Save hist │ │ ✅ Priority │ │
│ │ [Get Started│ │ [Start Pro]  │ │ [Go Premi] │ │
│ └──────────────┘ └──────────────┘ └────────────┘ │
├───────────────────────────────────────────────────┤
│ Feature Comparison Table（功能对比表，10行±）         │
├───────────────────────────────────────────────────┤
│ 7-day money-back guarantee · Cancel anytime       │
└───────────────────────────────────────────────────┘
```

---

## 3. 核心状态机（State Machine）

### 3.1 GameContext 全局状态（React Context）

```typescript
interface GameState {
  // ===== 会话层（Session，仅当前浏览器会话有效）=====
  session: {
    personPhoto: File | null;       // 当前会话人物图文件
    personPhotoUrl: string | null;  // 预览/上传后的 URL
    clothingPhoto: File | null;     // 当前服装图
    clothingPhotoUrl: string | null;
    detectedCategory: ClothingCategory | null; // 识别结果
    currentTry: TryResult | null;   // 当前一次的生成结果
    step: TryStep;                  // 当前试衣步骤
    isGenerating: boolean;
    generatingProgress: number;     // 0-100
    error: string | null;
  };

  // ===== 用户层（User，持久化）=====
  user: {
    isAuthenticated: boolean;
    profile: UserProfile | null;
    subscription: SubscriptionStatus;
    usage: UsageInfo;
  };

  // ===== 历史层（History，已登录时加载）=====
  history: {
    items: HistoryItem[];
    isLoading: boolean;
    page: number;
    hasMore: boolean;
  };
}

type TryStep = 'landing' | 'step-person' | 'step-clothing' | 'generating' | 'result';
type ClothingCategory = 'top' | 'bottom' | 'dress' | 'unknown';

interface TryResult {
  id: string;
  originalPersonUrl: string;
  originalClothingUrl: string;
  resultImageUrl: string;
  category: ClothingCategory;
  createdAt: string;
  generationMs: number;
  status: 'success' | 'failed' | 'saved';
}
```

### 3.2 Try-On 流程状态机

```
                  ┌─────────┐
                  │ landing │
                  └────┬────┘
                       │ click "Try Now"
                       ▼
                  ┌─────────────┐
        ┌────────│ step-person │◄──────────┐
        │        └──────┬──────┘           │
        │ upload&ok     │ click "Change"   │
        │               ▼                  │
        │        ┌───────────────┐         │
        │        │ step-clothing │─────────┘
        │        └───────┬───────┘  "Change Person"
        │  upload & click Generate
        │                ▼
        │         ┌─────────────┐
        │         │ generating  │─────────┐ 失败重试
        │         └──────┬──────┘         │
        │       success  │                │
        │          +额度  │ fail           │
        │                ▼                │
        │          ┌─────────┐            │
        └─────────►│ result  │◄───────────┘
   "Try Another"   └────┬────┘   "Regenerate" (扣额度)
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
    step-clothing  generating  额度用尽→订阅页
 (复用person图)  (同服装重试)
```

### 3.3 关键状态迁移规则

| 当前状态 | 触发事件 | 动作 | 下一状态 |
|---------|---------|------|---------|
| landing | 点击 Try Now | - | step-person |
| step-person | 人物图校验通过 | 预览、存入 session | step-person（Continue 可用） |
| step-person | 点击 Continue | - | step-clothing |
| step-clothing | 点击 Change Person | 清空 clothingPhoto | step-person |
| step-clothing | 服装图校验通过 + 点击 Generate | 预扣额度、显示进度 | generating |
| generating | API 返回成功 | 存结果、进度→100% | result |
| generating | API 返回失败 | 退还额度、显示错误 | result（带错误态）或 step-clothing |
| result | Try Another Outfit | 清空 clothing 相关 | step-clothing |
| result | Regenerate | 扣额度、复用两张图 | generating |
| result | Save to History（未登录） | 弹出登录框 | auth → 登录后回调并保存 |
| result | Save to History（已登录） | 调 API 存库 | result（按钮→已保存） |
| 任意有额度状态 | 额度用尽 | 弹窗 | quota-exceeded-modal → pricing |

### 3.4 订阅 & 额度状态流

```
 ┌────────────┐    访问任意页面      ┌───────────────────┐
 │ 页面加载    │────────────────────►│ 拉取 subscription  │
 └────────────┘                      │ & usage（SWR 5min）│
                                     └─────────┬─────────┘
                                               │
                                    ┌──────────▼──────────┐
                                    │ 每次点击 Generate    │
                                    │ 前检查 remaining > 0 │
                                    └──────────┬──────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │ Yes                │ No                 │
                          ▼                    ▼                    ▼
                 继续生成流程         QuotaExceededModal        已订阅用户
                                          │                   额度用尽→
                                          ├─ [Upgrade] → pricing
                                          ├─ [See Plans] → pricing
                                          └─ [Close] → 留在结果页/试衣页
```

---

## 4. 订阅体系（Subscription Design）

### 4.1 套餐设计

| 维度 | Free（免费） | Pro（专业） | Premium（高级） |
|------|-------------|------------|----------------|
| **价格（月付）** | $0 | $9.99 / mo | $19.99 / mo |
| **价格（年付）** | - | $95.90 / yr（省20%） | $191.90 / yr（省20%） |
| **每月试穿次数** | 5 次 / 永久 | 50 次 / 月 | 200 次 / 月 |
| **输出质量** | Standard (1024px) | HD (2048px) | Ultra HD (4096px) |
| **历史记录保存** | ❌ 仅当前会话 | ✅ 无限期保存 | ✅ 无限期保存 |
| **素材库（人物/服装）** | ❌ | ✅ 各 50 张 | ✅ 各 500 张 |
| **生成优先级** | 普通队列 | 普通队列 | 优先队列（≤10s） |
| **连续试穿（复用人物）** | ✅ | ✅ | ✅ |
| **结果水印** | 小字半透明水印 | ❌ 无水印 | ❌ 无水印 |
| **退款保证** | - | 7 天无理由 | 7 天无理由 |

### 4.2 额度规则

```
额度（Credits）定义:
  1 Credit = 1 次试穿生成（含 Regenerate）
  Step 上传不扣额度，只在点击 Generate/Regenerate 时扣

扣减时机:
  • 用户点击 Generate → 预检通过 → 预扣 1 Credit → 发起请求
  • 请求成功: 预扣正式消费
  • 请求失败（网络/服务端错误）: 24h 内自动退还

不清零规则:
  • Free: 5 次 = 账号终身额度，用完即止，不清零不重置
  • Pro/Premium: 每月 1 号（按订阅日对齐）重置额度，当月未用完不结转

超额策略:
  • 订阅用户当月额度用尽 → 可按 $0.25 / 次 额外购买 Credits 包
  • Credits 包: 10次=$2 / 30次=$5 / 100次=$15（叠加在月额度上，永不清零）
```

### 4.3 订阅漏斗设计

#### 漏斗触点矩阵

| 用户阶段 | 触发位置 | 展示形态 | 核心 CTA |
|---------|---------|---------|---------|
| **L1 认知** | 落地页首屏下方 | 卡片式 3 方案预览 | "See Pricing →" |
| **L2 首次体验前** | Try-On 流程 Step 1 侧栏 | 额度说明 "Free: 5 tries included" | 小字链接 "Compare plans" |
| **L3 首次成功后** | Result Page（第 1 次成功） | 顶部 UsageMeter 进度条（5/5） + Banner | "Upgrade for more →" |
| **L4 额度用尽** | 点击 Generate 时额度=0 | QuotaExceededModal（全屏遮罩弹窗） | [Start Pro - $9.99/mo] 主按钮 |
| **L5 多次使用后** | Dashboard 首页（登录后） | 剩余额度 < 20% 时高亮卡片 | "Refill or Upgrade →" |
| **L6 免费用户回流** | 邮件（用完额度 24h 后） | 邮件模板：专属 8 折首月 | 链接带 UTM → Pricing |

#### 关键转化文案（A/B Test 初始版本）

```
QuotaExceededModal 主标题（A/B）:
  A: "You've used all 5 free tries. Unlock 50 more for just $9.99/mo."
  B: "Loving the preview? Get 50 tries/month + HD quality for less than a coffee."

Pricing CTA（A/B）:
  A: "Start Pro — Risk Free 7-Day Guarantee"
  B: "Unlock Unlimited Previews — Only $9.99/mo"
```

### 4.4 Stripe 集成方案

```
Product & Price（Stripe Dashboard 创建）:
  Product: Virtual Try-On Pro (Monthly)   → price_xxx: $9.99 / month
  Product: Virtual Try-On Pro (Yearly)    → price_xxx: $95.90 / year
  Product: Virtual Try-On Premium (Month) → price_xxx: $19.99 / month
  Product: Virtual Try-On Premium (Year)  → price_xxx: $191.90 / year
  Product: Credits Pack (10)              → one-time $2.00
  Product: Credits Pack (30)              → one-time $5.00
  Product: Credits Pack (100)             → one-time $15.00

Webhook（/api/subscription/webhook）处理事件:
  ✅ checkout.session.completed   → 发放初始额度 + 更新 subscription.status
  ✅ invoice.paid                 → 月度扣款成功 → 重置月额度
  ✅ invoice.payment_failed       → 邮件提醒 + 标记 grace_period
  ✅ customer.subscription.updated → 升级/降级/取消 → 同步状态
  ✅ customer.subscription.deleted → 取消生效日 → 降级到 Free

前端 Checkout Flow:
  /pricing → 选方案 → /checkout?plan=pro_monthly
    → 调 Stripe.checkout.sessions.create（后端）
    → redirectToCheckout（Stripe SDK）
    → success → /dashboard?subscribed=pro
    → cancel  → /pricing?canceled=true
```

---

## 5. 埋点指标（Tracking Metrics）

### 5.1 工具选型

| 层级 | 工具 | 说明 |
|------|------|------|
| 产品分析 | Mixpanel / Amplitude | 漏斗、留存、事件分析 |
| 错误监控 | Sentry | 前端 + API 异常捕获 |
| 性能监控 | Vercel Analytics | Web Vitals + API 耗时 |
| A/B 实验 | Statsig / GrowthBook | 订阅文案 CTA 实验 |
| 埋点规范 | 自定义 Event SDK（基于上述封装） | 统一 `track(event, props)` 接口 |

### 5.2 事件清单（必埋）

#### A. Acquisition（获客）

| Event Name | 触发时机 | Props |
|-----------|---------|-------|
| `landing_view` | 落地页加载完成 | `utm_source`, `utm_medium`, `utm_campaign`, `referrer` |
| `landing_cta_click` | 点击任意 Try Now / Start Trial | `cta_position`: hero/navbar/how_it_works/pricing_preview/footer |
| `pricing_view` | Pricing 页访问 | `from`: landing/result_modal/dashboard_menu/direct |
| `auth_view` | 登录页访问 | `from`: result_save/header_click/history_click |

#### B. Activation（激活 & 首次使用）

| Event Name | 触发时机 | Props |
|-----------|---------|-------|
| `try_flow_start` | 进入 Step 1 上传人物照 | `is_authed`: T/F |
| `person_upload_success` | 人物照通过校验 | `file_size_kb`, `aspect_ratio`, `used_sample`: T/F |
| `person_upload_fail` | 人物照校验失败 | `fail_reason`: format/size/dim/other |
| `clothing_upload_success` | 服装照通过校验 | `file_size_kb`, `aspect_ratio` |
| `clothing_upload_fail` | 服装照校验失败 | `fail_reason` |
| `generate_click` | 点击 Generate 按钮 | `step`: first/retry/swap_outfit, `plan`: free/pro/premium, `remaining_credits` |
| `generate_start` | 生成请求发出 | `session_id`, `try_seq`: 第几次 |
| `category_detect_result` | 识别返回 | `category`: top/bottom/dress/unknown, `confidence` |
| `generate_success` | 成功拿到结果图 | `duration_ms`, `category`, `image_quality` |
| `generate_fail` | 生成失败 | `error_code`, `error_message`, `duration_ms` |
| `result_view` | 结果页渲染 | `try_seq`, `plan`, `category`, `success`: T/F |

#### C. Retention（留存 & 复用 - 核心指标）

| Event Name | 触发时机 | Props |
|-----------|---------|-------|
| `result_regenerate_click` | 点击 Regenerate | `session_id`, `try_seq_within_session`, `from_result_id` |
| `result_try_another_click` | 点击 Try Another | `session_id`, `person_reuse_count`: 同一张人图第几次 |
| `result_download_click` | 点击下载 | `plan`, `output_quality` |
| `result_save_click` | 点击 Save to History | `is_authed_before`: T/F |
| `result_save_success` | 保存成功 | `history_id` |
| `session_retry_count` | 同会话生成次数（会话结束时计算） | `person_reused`: T/F, `total_tries_in_session` |
| `dashboard_view` | 登录后进入 Dashboard | `days_since_first_use`, `total_tries_lifetime` |
| `history_item_click` | 历史列表中点击某条 | `history_age_days`, `action`: view/download/delete |
| `uploads_use_click` | 从素材库直接选用人物/服装 | `type`: person/clothing, `upload_age_days` |

#### D. Revenue（营收）

| Event Name | 触发时机 | Props |
|-----------|---------|-------|
| `quota_exceeded_show` | 额度用尽弹窗出现 | `used_count_in_plan`, `plan_before`: free/pro, `funnel_tier`: L4 |
| `quota_exceeded_cta_click` | 弹窗内 CTA | `cta`: upgrade/see_plans/close, `plan_target` |
| `pricing_plan_select` | Pricing 选择某方案 | `plan`: pro_monthly/pro_yearly/premium_monthly/premium_yearly, `billing_toggle`: monthly/yearly |
| `checkout_view` | 进入 Stripe Checkout | `plan`, `from_modal`: T/F |
| `checkout_success` | Stripe success 回调 | `plan`, `amount`, `is_refill_credit`: T/F, `promo_code` |
| `checkout_cancel` | Stripe cancel 回调 | `plan` |
| `subscription_upgrade` | 后台收到升级事件 | `from_plan`, `to_plan`, `prorated_amount` |
| `subscription_cancel` | 用户取消订阅 | `plan`, `cancel_reason`（可选问卷） |

#### E. 关键分母（用于计算率）

所有页面埋 `page_view`（page path + referrer），作为漏斗分母。

### 5.3 核心指标看板（Dashboard Metrics）

#### 单次结果成功（对应 SPEC 成功标准 1）

| 指标 | 定义 | 目标值 | 数据源 |
|------|------|--------|--------|
| **生成成功率** | `generate_success / generate_start` | ≥ 90% | 服务端日志 + 埋点 |
| **品类识别准确率** | （暂无自动校验，先用 **不满意 Regenerate 率** 反向衡量） | Regenerate 率 ≤ 30% | `result_regenerate_click / result_view(success)` |
| **用户满意度（隐式）** | 下载率 + 保存率之和 | ≥ 50% | `(download_click + save_success) / result_view` |
| **脸部/身份保留（人工抽检）** | 随机抽 100 张成功图，人工判"一眼认出是本人"比例 | ≥ 85% | 离线抽检 Weekly |

#### 产品级成功（对应 SPEC 成功标准 2 - 复用 / 留存）

| 指标 | 定义 | 目标值（V1 Launch 后 30 天） |
|------|------|------------------------------|
| **Session 平均试穿次数** | `AVG(total_tries_in_session)` 对所有含 generate_start 的会话 | ≥ 2.5 次 / 会话 |
| **Session 复用率（人物图）** | `(1次以上的会话数) / (总会话数)` | ≥ 40% 会话 ≥ 2 次 |
| **D1 留存率** | Day 0 活跃 → Day 1 再回访 | ≥ 15% |
| **D7 留存率** | Day 0 活跃 → Day 7 再回访 | ≥ 5% |
| **D30 留存率** | Day 0 活跃 → Day 30 再回访 | ≥ 2% |
| **周活跃频次（WAU 人均）** | 每个 WAU 平均每周访问天数 | ≥ 1.5 天 / 周 |

#### 商业化信号（对应 SPEC 成功标准 3）

| 指标 | 定义 | 观察目标 |
|------|------|----------|
| **免费额度耗尽率** | 免费用户中 `used >= 5` / 完成 ≥1 次的免费用户 | Launch 30 天内 ≥ 40% |
| **耗尽后订阅转化率** | `用完额度 → 7 天内 checkout_success` / 用完额度人数 | ≥ 8% |
| **付费转化漏斗** | landing_view → try_flow_start → result_view(success) → quota_exceeded → checkout_success | 每步转化率单独监控 |
| **ARPU（付费用户月均）** | 月订阅收入 / 付费用户数 | ≥ $12（通过 Premium 提升结构） |
| **免费 vs 付费频次比** | 付费用户人均周试穿次数 / 免费用户人均周试穿次数 | ≥ 2.0x |

---

## 6. MVP 优先级排期（MVP Prioritization）

### 6.1 功能分级

使用 **RICE × 可行性** 排序：
- **P0（必须，MVP 上线前完成）**：没有就无法验证核心价值
- **P1（重要，Launch 后 2 周内补完）**：显著影响转化 / 留存，但可以先简化
- **P2（Nice to have，V1.x 迭代）**：锦上添花，或依赖 P0 数据后才决策

### 6.2 功能清单 × 优先级

#### A. 核心试穿链路（RICE 最高）

| # | 功能模块 | 子项 | 优先级 | 估算（人天） | 备注 |
|---|---------|------|--------|-------------|------|
| A1 | Landing Page | Hero + How It Works + Features + CTA | P0 | 2d | shadcn + Tailwind，首屏即重点 |
| A2 | Try-On Step 1 | 人物上传 + 校验 + 示例图 | P0 | 1.5d | 核心交互：拖拽 + 预览 |
| A3 | Try-On Step 2 | 服装上传 + 校验 + 品类说明 | P0 | 1.5d | 同上 |
| A4 | Generating 页 | 进度模拟 + 品类识别展示 | P0 | 1d | 进度条用动画模拟，识别完成后更新 badge |
| A5 | Result 页 + 对比滑块 | Before/After 对比 + 操作按钮 | P0 | 2d | 对比滑块是核心体验 |
| A6 | Regenerate（同服装重试） | 调 API 重新生成，扣额度 | P0 | 0.5d | 复用生成逻辑 |
| A7 | Try Another（换服装，复用人物） | 回 Step2，人物已存在 | P0 | 0.5d | Session 级存储 |
| A8 | AI Service 封装 | upload → 调第三方 AI API → 存图 → 返回 URL | P0 | 3d | 含错误处理 + 超时重试 |
| A9 | 自动品类识别 | 调用或集成服装分类能力 | P0 | 2d | 失败时默认 top / unknown |
| **小计** | | | | **14d** | |

#### B. 账号 & 历史记录

| # | 功能模块 | 子项 | 优先级 | 估算（人天） | 备注 |
|---|---------|------|--------|-------------|------|
| B1 | Auth.js 集成 | Email + Google + Apple OAuth | P0 | 3d | NextAuth 5，适配 Next 16 |
| B2 | Save to History | 结果图 + 原图 + 品类存 DB | P0 | 2d | 未登录→先登录再保存 |
| B3 | Dashboard 首页 | 欢迎 + 额度 + 最近 6 条 + 快捷入口 | P0 | 2d | |
| B4 | History 列表 + 分页 | 全部历史，支持删除 | P0 | 1.5d | |
| B5 | History Detail 页 | 单条详情 + 下载 + 删除 | P1 | 1d | MVP 可先在列表直接删/下载，详情页延后 |
| B6 | Uploads 素材库（人物/服装） | 快速选用已有素材 | P1 | 2d | MVP 可先用会话复用，素材库延后 2 周 |
| **小计** | | | | **11.5d** | P0=8.5d, P1=3d |

#### C. 订阅 & 支付

| # | 功能模块 | 子项 | 优先级 | 估算（人天） | 备注 |
|---|---------|------|--------|-------------|------|
| C1 | Free 额度扣减 | 本地 + DB 双重校验，防刷 | P0 | 1.5d | 核心防刷逻辑 |
| C2 | UsageMeter 组件 | 顶部显示剩余额度 | P0 | 0.5d | |
| C3 | QuotaExceededModal | 额度用尽弹窗 + 转化文案 | P0 | 1d | 关键转化触点 |
| C4 | Pricing 页 + 3 方案卡片 | 月/年切换 + CTA | P0 | 2d | |
| C5 | Stripe Checkout 集成 | 创建 Session + redirect + success | P0 | 2.5d | 一次性付款（额度包）MVP 不做 |
| C6 | Stripe Webhook | 订单成功/失败/取消同步 | P0 | 1.5d | |
| C7 | Subscription 管理页 | 当前方案 + 取消 | P1 | 1.5d | MVP 用户需取消可先邮件联系，后续上线自助取消 |
| C8 | Credits 叠加包购买 | 一次性商品 | P2 | 2d | V1.x 迭代 |
| **小计** | | | | **12.5d** | P0=9d, P1=1.5d, P2=2d |

#### D. 埋点 & 质量

| # | 功能模块 | 子项 | 优先级 | 估算（人天） | 备注 |
|---|---------|------|--------|-------------|------|
| D1 | Event SDK 封装 | 统一 track()，上报 Mixpanel | P0 | 1d | |
| D2 | A/B~E 类核心事件埋入 | 所有清单中的必埋事件 | P0 | 3d | 边开发边埋 |
| D3 | Sentry 接入 | 前后端异常捕获 + Sourcemap | P0 | 0.5d | |
| D4 | Vercel Analytics | Web Vitals | P1 | 0.5d | Launch 前加 |
| D5 | E2E 冒烟测试（Playwright） | Landing → Step1 → Step2 → Generate → Result | P1 | 2d | Launch 前补，保证主干 |
| D6 | 单测（关键逻辑） | 额度校验、AI 调用、Webhook 解析 | P1 | 2d | |
| **小计** | | | | **9d** | P0=4.5d, P1=4.5d |

#### E. 基础架构 / 脚手架

| # | 功能模块 | 子项 | 优先级 | 估算（人天） | 备注 |
|---|---------|------|--------|-------------|------|
| E1 | 项目初始化 | Next 16 + TS5 + Tailwind 4 + shadcn/ui + Lucide + pnpm | P0 | 1d | Coze CLI 初始化 |
| E2 | GameContext 搭建 | 全局状态 + reducer + 类型定义 | P0 | 1d | |
| E3 | DB Schema & ORM | Prisma + PostgreSQL / Vercel Postgres | P0 | 1.5d | User / History / Upload / Subscription / UsageLog |
| E4 | 图片存储 | S3 / Cloudflare R2 + 签名上传 | P0 | 1.5d | 上传→签名→返回 URL |
| E5 | 环境变量 & Secret 管理 | .env.example + Vercel Env | P0 | 0.5d | |
| E6 | 代码规范 | ESLint (Airbnb) + Prettier + pre-commit | P0 | 0.5d | |
| **小计** | | | | **6d** | |

### 6.3 里程碑（Milestones）

假设 **2 名前端 + 1 名后端 + 0.5 名 AI 集成**，共 ~3.5 FTE。

| Milestone | 时间 | 包含内容 | DOD（Definition of Done） |
|-----------|------|---------|---------------------------|
| **M1: 脚手架就绪** | Week 1（5d） | E1~E6 全部 | pnpm dev 可起、DB 连通、Context 可用、AI SDK 基础封装 OK |
| **M2: 主链路可用（无登录）** | Week 2-3（10d） | A1~A9 + C1~C3 | 游客可走完 Landing→Step1→Step2→Generating→Result→额度用完，真实拿到 AI 图 |
| **M3: 账号 + 历史可用** | Week 4（5d） | B1~B4 + B5(P0 化减版) | 登录注册 OK、保存历史 OK、Dashboard 看记录 OK、删除 OK |
| **M4: 订阅全链路 + 埋点** | Week 5-6（10d） | C4~C6 + D1~D3 | Pricing→Stripe→支付→Webhook→额度到账全链路跑通；埋点齐；Sentry OK |
| **M5: 稳定性 & 体验收尾** | Week 7（5d） | P1 全部 + D4~D6 + UI 走查 | E2E 用例全绿；核心页面 Lighthouse ≥ 80；UI 在 1280/375 宽度正常；Quota Modal 文案 A/B Test 上线 |
| **M6: 灰度 & Launch** | Week 8（5d） | 全量回归 + 灰度 5%→25%→100% | 灰度期 P95 生成时间 ≤25s；无 S0/S1 Bug；核心转化漏斗数据有产出 |
| **M7: V1.x 迭代（Launch 后 2 周）** | Week 9-10 | B5/B6/C7/C8 等 P1/P2 | 素材库上线、自助取消上线、Credits Pack 上线 |

### 6.4 MVP 范围声明（Scope Boundary）

✅ **Launch 时必须有的**
- 游客 5 次免费试穿完整链路
- 上装 / 下装 / 连衣裙 三类
- 登录后保存历史 + 查看 + 删除
- Stripe 月/年订阅 + 额度自动发放
- 埋点（A~E 全清单事件）
- 移动端 375px 自适应
- 服务端生成 P95 ≤25s SLA

⚠️ **Launch 时可简化 / 延后**（用 P1/P2 标注）
- **无自助取消订阅**（用户发邮件，客服后台取消 → P1 上线后 1 周补）
- **无 Credits 叠加包**（P2 看用户是否有超额需求）
- **无素材库 Uploads 页**（先用会话复用 + Dashboard 快捷入口 → P1）
- **无 History Detail 单独页**（列表页直接操作 → P1）
- **无 A/B Test 框架**（先用人工分桶或 Statsig 免费版）
- **无未成年人/公众人物专项风控**（明显违规走 Content Moderation 通用规则）
- **无多语言**（Launch 仅英文，V1.x 加西语/法语）
- **无 App**（纯 Web，响应式移动优先）

### 6.5 技术风险 & 缓解

| 风险 | 等级 | 影响 | 缓解措施 |
|------|------|------|---------|
| AI API 延迟 >30s 或失败率高 | 🔴 高 | 核心体验崩，用户流失 | ① 接 2 家 AI 供应商做 Failover；② SLA <95% 时在生成页提示"High traffic, longer wait"；③ 预扣失败自动退还额度 |
| 免费额度被刷（脚本批量生成） | 🔴 高 | 成本失控 | ① 扣减前结合 IP + Fingerprint + 账号多因子限流；② 游客模式额外 ReCAPTCHA v3；③ 单 IP 每日游客上限 15 次 |
| 识别品类准确率低 → 生成明显穿帮 | 🟡 中 | 满意度低 | ① 识别 confidence <0.7 时在 Result 页加提示 "Not the right category? Try a clearer photo"；② 加手动切换品类按钮（P1 迭代） |
| Stripe Webhook 丢事件 → 额度未到账 | 🟡 中 | 付费客诉 | ① Webhook 入库 + 幂等 key；② Dashboard 加"额度没收到？联系客服"按钮；③ 每日对账任务 Stripe API → 补账 |
| 用户上传违规图（色情/暴力） | 🟡 中 | 合规风险 | ① 上传时调 AWS Rekognition / Cloudflare Moderation 自动拦截；② 命中直接返回 400 + 文案；③ 后台人工审核漏网之鱼 |

---

## 附录：一句话版本（Executive Summary）

V1 MVP 通过 **8 周、~3.5 FTE** 交付一个面向海外普通消费者的 Web 虚拟试衣工具：
- **核心价值**：低门槛上传自己照 + 服装图，10-20s 拿到可用于购买前参考的静态试穿预览
- **增长策略**：游客 5 次免费试用 → 额度用尽弹窗 → 引导订阅（Pro $9.99/mo / Premium $19.99/mo），月/年付可选
- **核心验证指标**：Session 人均 ≥2.5 次试穿、D7 留存 ≥5%、免费额度耗尽后订阅转化率 ≥8%
- **技术栈**：Next 16 (App Router) + TS5 + Node 24 + React 19 + Tailwind 4 + shadcn/ui + Lucide + Auth.js + Stripe + Prisma(Postgres) + S3/R2 + Mixpanel + Sentry
- **Non-goals**：不做尺码推荐、不做精确量体、不做整套换装、不做动态试衣、不做高精度承诺

---
*文档结束*
