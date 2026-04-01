import { randomBytes } from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ============================================================
// Claude Code Buddy Companion Finder
// 选择你想要的外观，脚本自动搜索最高属性匹配的 userID
// ============================================================

// --- 核心生成逻辑 (与源码 companion.ts 完全一致) ---

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  if (typeof Bun !== 'undefined') {
    return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
  }
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const SPECIES = ['duck','goose','blob','cat','dragon','octopus','owl','penguin','turtle','snail','ghost','axolotl','capybara','cactus','robot','rabbit','mushroom','chonk'] as const
const EYES = ['·','✦','×','◉','@','°'] as const
const HATS = ['none','crown','tophat','propeller','halo','wizard','beanie','tinyduck'] as const
const RARITY_WEIGHTS: Record<string,number> = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 }
const RARITIES = ['common','uncommon','rare','epic','legendary']
const STAT_NAMES = ['DEBUGGING','PATIENCE','CHAOS','WISDOM','SNARK'] as const
const RARITY_FLOOR: Record<string,number> = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 }
const SALT = 'friend-2026-401'

type Species = typeof SPECIES[number]
type Eye = typeof EYES[number]
type Hat = typeof HATS[number]

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!
}

function rollRarity(rng: () => number): string {
  const total = Object.values(RARITY_WEIGHTS).reduce((a: number, b: number) => a + b, 0)
  let roll = rng() * total
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHTS[r]
    if (roll < 0) return r
  }
  return 'common'
}

function rollStats(rng: () => number, rarity: string): Record<string,number> {
  const floor = RARITY_FLOOR[rarity]
  const peak = pick(rng, STAT_NAMES)
  let dump = pick(rng, STAT_NAMES)
  while (dump === peak) dump = pick(rng, STAT_NAMES)
  const stats: Record<string,number> = {}
  for (const name of STAT_NAMES) {
    if (name === peak) {
      stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))
    } else if (name === dump) {
      stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))
    } else {
      stats[name] = floor + Math.floor(rng() * 40)
    }
  }
  return stats
}

// 顺序：rarity → species → eye → hat → shiny → stats (与源码一致)
function rollCompanion(userId: string) {
  const key = userId + SALT
  const seed = hashString(key)
  const rng = mulberry32(seed)
  const rarity = rollRarity(rng)
  const species = pick(rng, SPECIES)
  const eye = pick(rng, EYES)
  const hat = rarity === 'common' ? 'none' : pick(rng, HATS)
  const shiny = rng() < 0.01
  const stats = rollStats(rng, rarity)
  return { rarity, species, eye, hat, shiny, stats, stat_total: Object.values(stats).reduce((a,b) => a+b, 0) }
}

// ============================================================
// 交互式选择
// ============================================================

function ask(question: string, options: readonly string[]): number {
  console.log(`\n${question}`)
  for (let i = 0; i < options.length; i++) {
    console.log(`  ${String(i + 1).padStart(2)}) ${options[i]}`)
  }
  const answer = prompt(`  选择 [1-${options.length}]: `)
  if (answer === null) process.exit(0)
  const n = parseInt(answer.trim())
  if (isNaN(n) || n < 1 || n > options.length) {
    console.log(`  无效输入，默认选第 1 项: ${options[0]}`)
    return 0
  }
  return n - 1
}

function askCount(question: string, min: number, max: number, defaultVal: number): number {
  const answer = prompt(`\n${question} [${min}-${max}, 默认 ${defaultVal}]: `)
  if (answer === null || answer.trim() === '') return defaultVal
  const n = parseInt(answer.trim())
  if (isNaN(n) || n < min || n > max) return defaultVal
  return n
}

// --- 物种展示 ---
const SPECIES_DISPLAY = [
  'duck      🦆  小鸭',
  'goose     🪿  大鹅',
  'blob      🫧  果冻',
  'cat       🐱  小猫',
  'dragon    🐉  火龙',
  'octopus   🐙  章鱼',
  'owl       🦉  猫头鹰',
  'penguin   🐧  企鹅',
  'turtle    🐢  乌龟',
  'snail     🐌  蜗牛',
  'ghost     👻  幽灵',
  'axolotl   🦎  蝾螈',
  'capybara  🫎  水豚',
  'cactus    🌵  仙人掌',
  'robot     🤖  机器人',
  'rabbit    🐰  兔子',
  'mushroom  🍄  蘑菇',
  'chonk     🐷  胖墩',
] as const

const HAT_DISPLAY = [
  'none       无帽',
  'crown      👑  王冠',
  'tophat     🎩  礼帽',
  'propeller  🚁  螺旋桨',
  'halo       😇  光环',
  'wizard     🧙  巫师帽',
  'beanie     🧢  毛线帽',
  'tinyduck   🐤  小鸭帽',
] as const

// ============================================================
// 主流程
// ============================================================

console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║   Claude Code Buddy Companion Finder v2.0               ║')
console.log('║   选择外观 → 自动搜索最高属性匹配                        ║')
console.log('╚══════════════════════════════════════════════════════════╝')

const speciesIdx = ask('选择物种 (species):', SPECIES_DISPLAY)
const eyeIdx = ask('选择眼睛 (eye):', [...EYES])
const hatIdx = ask('选择帽子 (hat):', HAT_DISPLAY)
const shinyIdx = ask('是否闪光 (shiny):', ['是 ★ shiny', '否 (普通)'])

const wantSpecies = SPECIES[speciesIdx]
const wantEye = EYES[eyeIdx]
const wantHat = HATS[hatIdx]
const wantShiny = shinyIdx === 0

// 搜索量：legendary+shiny = ~0.01%, 只选物种 = ~0.56%,
// 全部限定 = 极低概率，需要更多搜索
// 估算匹配概率
const pRarity = 0.01            // legendary = 1/100
const pSpecies = 1 / SPECIES.length  // ~5.6%
const pEye = 1 / EYES.length        // ~16.7%
const pHat = 1 / HATS.length        // ~12.5% (8 hats)
const pShiny = wantShiny ? 0.01 : 1

const matchProb = pRarity * pSpecies * pEye * pHat * pShiny
const recommendedN = Math.min(500_000_000, Math.max(50_000_000, Math.ceil(10 / matchProb)))
const defaultN = Math.min(200_000_000, recommendedN)

console.log('\n┌──────────────────────────────────────────────────────┐')
console.log('│  你的选择:                                            │')
console.log(`│  物种: ${String(wantSpecies).padEnd(12)} 眼睛: ${wantEye.padEnd(3)}          │`)
console.log(`│  帽子: ${String(wantHat).padEnd(12)} 闪光: ${wantShiny ? '★ 是' : '否 '}          │`)
console.log(`│  稀有度: legendary (固定)                              │`)
console.log(`│  属性: 自动搜索最高                                    │`)
console.log(`│  匹配概率: 1/${Math.round(1/matchProb).toLocaleString()}                               │`)
console.log('└──────────────────────────────────────────────────────┘')

const N = askCount('搜索数量 (越大越可能找到高分)', 10_000_000, 500_000_000, defaultN)

console.log(`\n搜索 ${N.toLocaleString()} 个 userID...\n`)

let bestScore = 0
let bestId = ''
let bestComp: ReturnType<typeof rollCompanion> | null = null
let matchCount = 0
const start = Date.now()

for (let i = 0; i < N; i++) {
  const uid = randomBytes(32).toString('hex')
  const comp = rollCompanion(uid)

  if (
    comp.rarity === 'legendary' &&
    comp.species === wantSpecies &&
    comp.eye === wantEye &&
    comp.hat === wantHat &&
    comp.shiny === wantShiny
  ) {
    matchCount++
    if (comp.stat_total > bestScore) {
      bestScore = comp.stat_total
      bestId = uid
      bestComp = comp
      console.log(`  ★ NEW BEST #${matchCount}: total=${comp.stat_total}`)
      console.log(`    userID: ${uid}`)
      console.log(`    stats:  ${JSON.stringify(comp.stats)}`)
    }
  }

  if ((i + 1) % 5_000_000 === 0) {
    const elapsed = (Date.now() - start) / 1000
    const rate = (i + 1) / elapsed
    const best = bestComp ? `best total=${bestScore}` : 'no match yet'
    console.log(`  [${(i + 1).toLocaleString()} | ${rate.toFixed(0)}/s | ${matchCount} matches | ${best}]`)
  }
}

const elapsed = (Date.now() - start) / 1000
console.log(`\n${'═'.repeat(60)}`)
console.log(`完成: ${N.toLocaleString()} IDs / ${elapsed.toFixed(1)}s (${(N / elapsed).toFixed(0)}/s)`)
console.log(`匹配数: ${matchCount}`)
console.log(`${'═'.repeat(60)}`)

if (bestComp) {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║  LEGENDARY${bestComp.shiny ? ' ★ SHINY' : '        '} FOUND              ║
  ╠══════════════════════════════════════════════════╣
  ║  userID:  ${bestId}  ║
  ║  species: ${String(bestComp.species).padEnd(12)} eye: ${bestComp.eye.padEnd(3)}            ║
  ║  hat:     ${String(bestComp.hat).padEnd(12)} shiny: ${String(bestComp.shiny).padEnd(5)}          ║
  ║  stats:                                          ║${Object.entries(bestComp.stats).map(([k, v]) => `\n  ║    ${k.padEnd(12)} ${String(v).padStart(3)}${v === 100 ? ' ★' : '  '}                      ║`).join('')}
  ║  total:   ${String(bestComp.stat_total).padEnd(3)} / 500${bestComp.stat_total >= 410 ? '  NEAR PERFECT!' : '              '}         ║
  ╚══════════════════════════════════════════════════╝`)

  // --- 确认并自动重置 ---
  const confirmIdx = ask('\n是否立即重置 buddy？', ['是，写入 ~/.claude.json', '否，仅显示结果'])
  if (confirmIdx === 0) {
    const configPath = path.join(os.homedir(), '.claude.json')

    // 读取现有配置
    let config: Record<string, any>
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    } catch {
      console.log(`\n  错误: 无法读取 ${configPath}`)
      process.exit(1)
    }

    // 备份
    const backupPath = `${configPath}.buddy-backup.${Date.now()}`
    fs.copyFileSync(configPath, backupPath)
    console.log(`\n  备份: ${backupPath}`)

    // 写入新 userID，移除 companion，设置 companionMuted
    config.userID = bestId
    delete config.companion
    config.companionMuted = false
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')

    // 验证
    const verify = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    if (verify.userID === bestId && verify.companion === undefined) {
      console.log(`  写入成功!`)
      console.log(`\n  重启 Claude Code 并运行 /buddy 即可孵化新宠物。`)
    } else {
      console.log(`  写入验证失败，请手动检查 ${configPath}`)
      console.log(`  备份已保存: ${backupPath}`)
    }
  } else {
    console.log(`\n  已跳过重置。手动使用以下命令:`)
    console.log(`  python3 -c "import json; f=open('$HOME/.claude.json'); d=json.load(f); f.close(); d['userID']='${bestId}'; d.pop('companion',None); f=open('$HOME/.claude.json','w'); json.dump(d,f,indent=2,ensure_ascii=False); print('Done')"`)
  }
} else {
  console.log(`\n  未找到匹配。尝试增加搜索数量。`)
  console.log(`  建议: 搜索 ${Math.ceil(50 / matchProb).toLocaleString()} 个 ID`)
}
