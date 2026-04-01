# find-best-buddy

Claude Code Buddy 宠物搜索工具 —— 选择外观，自动搜索最高属性的 legendary 宠物。

## 快速开始

```bash
# macOS / Linux
bash find-buddy.sh

# Windows
find-buddy.bat
```

运行后进入交互界面：

1. 选择物种（18 种，带 emoji 和中文名）
2. 选择眼睛（6 种）
3. 选择帽子（8 种）
4. 选择是否闪光（shiny）
5. 设置搜索数量（根据匹配概率自动推荐）
6. 自动搜索 legendary + 匹配外观 + 最高属性
7. 确认后自动写入 `~/.claude.json`（含备份）

Bun 运行时搜索速度约 **190 万 userID/秒**，50M 次搜索约 26 秒。

## 前置依赖

- **Bun** — 脚本会自动检测并安装
- 无需 Python、Node.js 等其他依赖

## 原理

Claude Code 的 buddy 宠物系统基于**确定性生成**：

```
Bun.hash(userID + salt) → mulberry32 PRNG → 依次抽取稀有度、物种、眼睛、帽子、闪光、属性
```

- 同一 userID 永远生成同一只宠物
- 宠物外属性（Bones）不持久化，每次从 userID 重算
- 灵魂（名字/性格）由 AI 一次性生成，存在配置中

### 属性上限

算法强制分配一个峰值属性和一个谷值属性，**不可能全属性 100**：

```
legendary floor = 50

峰值属性: min(100, 50+50+0~30) = 100 (必然满)
谷值属性: max(1,  50-10+0~15)  = 最高 55
其他属性: 50+0~40               = 最高 90

理论最高总分: 100 + 55 + 90×3 = 425 / 500
```

### 稀有度概率

| 稀有度 | 概率 | 星级 |
|--------|------|------|
| common | 60% | ★ |
| uncommon | 25% | ★★ |
| rare | 10% | ★★★ |
| epic | 4% | ★★★★ |
| legendary | 1% | ★★★★★ |

Shiny 概率：1%

### 匹配概率参考

| 限定条件 | 匹配概率 | 推荐 50M 内命中数 |
|----------|---------|------------------|
| legendary + 物种 | ~1/17 万 | ~290 |
| legendary + 物种 + 帽子 | ~1/140 万 | ~35 |
| legendary + 物种 + 帽子 + shiny | ~1/860 万 | ~6 |
| legendary + 物种 + 帽子 + 眼睛 + shiny | ~1/5200 万 | ~1 |

限定越多，建议加大搜索量。

## userID 更改影响

对**未登录的本地用户**，改 userID 几乎没有副作用：

- 不会丢失 API 访问（认证依赖 `ANTHROPIC_AUTH_TOKEN`）
- 不会丢失项目配置（存储在 `projects` 字段）
- 不会丢失全局设置（主题、快捷键等）
- 遥测数据会断裂（可忽略）

## 文件说明

```
find-best-buddy/
├── find-buddy.sh    # Shell 启动器 - macOS/Linux（自动查找/安装 bun）
├── find-buddy.bat   # 启动器 - Windows（自动查找/安装 bun）
├── find-buddy.ts    # 主逻辑（Bun TypeScript）
├── README.md
└── .gitignore
```

## 许可

MIT
