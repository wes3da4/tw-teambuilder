import type { Member } from './types'
import { CHARAS, ROLES } from './constants'
import { getBuildOptions } from './components/BuildTypeSelector'
import { getMasterySkillIds, getMasteryOptionNames } from './components/MasterySelector'

const MEMBER_SEPARATOR = '|'
const DIGIT_CHARS = ['ゼ', 'リ', 'ピ', 'ッ']
const CHAR_TO_DIGIT: Record<string, number> = {}
DIGIT_CHARS.forEach((c, i) => { CHAR_TO_DIGIT[c] = i })

// buildType・roleはランダム化の対象外(buildTypeの先頭文字が"ッ"にならない保証を保つため)。
function toQuat(value: number, width: number): string {
  const digits: number[] = []
  let v = value
  for (let i = 0; i < width; i++) {
    digits.unshift(v % 4)
    v = Math.floor(v / 4)
  }
  return digits.map(d => DIGIT_CHARS[d]).join('')
}

function fromQuat(str: string): number {
  let v = 0
  for (const ch of str) {
    const raw = CHAR_TO_DIGIT[ch]
    if (raw === undefined) throw new Error(`不正な文字です: ${ch}`)
    v = v * 4 + raw
  }
  return v
}

// chara・masteryの桁は「キー + 桁の位置番号」を加算して回転させる。
// 元の値が全部0(未選択のデフォルト)でも、位置ごとに加算量が変わるため同じ文字の連続を防げる。
function rotateDigit(value: number, key: number, pos: number): number {
  return (value + key + pos) % 4
}

function unrotateDigit(encoded: number, key: number, pos: number): number {
  return (encoded - key - pos + 400) % 4
}

function encodeRotatedQuat(value: number, width: number, key: number, startPos: number): string {
  const digits: number[] = []
  let v = value
  for (let i = 0; i < width; i++) {
    digits.unshift(v % 4)
    v = Math.floor(v / 4)
  }
  return digits.map((d, i) => DIGIT_CHARS[rotateDigit(d, key, startPos + i)]).join('')
}

function decodeRotatedQuat(str: string, key: number, startPos: number): number {
  let v = 0
  for (let i = 0; i < str.length; i++) {
    const raw = CHAR_TO_DIGIT[str[i]]
    if (raw === undefined) throw new Error(`不正な文字です: ${str[i]}`)
    v = v * 4 + unrotateDigit(raw, key, startPos + i)
  }
  return v
}

export function encodeMember(member: Member): string {
  const { level, role, chara } = member
  const name = member.name ?? ''
  const memo = member.memo ?? ''

  if (/\d/.test(name)) throw new Error('名前に数字を含めることはできません')
  if (name.includes(MEMBER_SEPARATOR)) throw new Error(`名前に "${MEMBER_SEPARATOR}" を含めることはできません`)
  if (memo.includes(MEMBER_SEPARATOR)) throw new Error(`メモに "${MEMBER_SEPARATOR}" を含めることはできません`)

  const charaIndex = CHARAS.indexOf(chara as (typeof CHARAS)[number])
  if (charaIndex === -1) throw new Error(`未対応のキャラクターです: ${chara}`)

  const roleIndex = ROLES.findIndex(r => r.value === role)
  if (roleIndex === -1) throw new Error(`不正なロールです: ${role}`)

  const buildOptions = getBuildOptions(chara) ?? []
  const effectiveBuildType = member.buildType ?? buildOptions[0]?.name
  const buildIndex = Math.max(0, buildOptions.findIndex(o => o.name === effectiveBuildType))

  const key = Math.floor(Math.random() * 4)

  const masterySelections = member.masterySelections ?? {}
  const masteryDigits = getMasterySkillIds(chara).map((skillId, i) => {
    const optionNames = getMasteryOptionNames(skillId)
    const selected = masterySelections[skillId] ?? optionNames[0]
    const optionIndex = Math.max(0, optionNames.indexOf(selected))
    return DIGIT_CHARS[rotateDigit(optionIndex, key, 3 + i)]
  }).join('')

  const levelStr = String(Math.min(999, Math.max(0, level))).padStart(3, '0')
  const block = toQuat(buildIndex, 1) + DIGIT_CHARS[key] + encodeRotatedQuat(charaIndex, 3, key, 0) + toQuat(roleIndex, 1) + masteryDigits

  return `${name}${levelStr}${block}${memo}`
}

export function decodeMember(code: string): Member {
  const name = code.match(/^\D*/)?.[0] ?? ''
  if (!name) throw new Error('名前を読み取れませんでした')
  let rest = code.slice(name.length)

  const levelStr = rest.slice(0, 3)
  if (!/^\d{3}$/.test(levelStr)) throw new Error('エタ(レベル)の形式が不正です')
  const level = parseInt(levelStr, 10)
  rest = rest.slice(3)

  if (rest.length < 6) throw new Error('ゼリピッピが短すぎます')
  const buildDigit = rest.slice(0, 1)
  const keyDigit = rest.slice(1, 2)
  const charaDigits = rest.slice(2, 5)
  const roleDigit = rest.slice(5, 6)
  rest = rest.slice(6)

  const key = CHAR_TO_DIGIT[keyDigit]
  if (key === undefined) throw new Error(`不正なキー文字です: ${keyDigit}`)

  const charaIndex = decodeRotatedQuat(charaDigits, key, 0)
  const chara = CHARAS[charaIndex] as string | undefined
  if (!chara) throw new Error(`不正なキャラクターです(index=${charaIndex})`)

  const roleIndex = fromQuat(roleDigit)
  const role = ROLES[roleIndex]?.value
  if (!role) throw new Error(`不正なロールです(index=${roleIndex})`)

  const buildOptions = getBuildOptions(chara) ?? []
  const buildIndex = fromQuat(buildDigit)
  const buildType = buildOptions[buildIndex]?.name
  if (buildOptions.length > 0 && !buildType) throw new Error(`不正な育成型です(${chara}, index=${buildIndex})`)

  const masterySkillIds = getMasterySkillIds(chara)
  const masteryDigits = rest.slice(0, masterySkillIds.length)
  if (masteryDigits.length !== masterySkillIds.length) throw new Error('マスタリー情報が不足しています')

  const masterySelections: Record<string, string> = {}
  masterySkillIds.forEach((skillId, i) => {
    const raw = CHAR_TO_DIGIT[masteryDigits[i]]
    if (raw === undefined) throw new Error(`不正なマスタリー文字です: ${masteryDigits[i]}`)
    const optionIndex = unrotateDigit(raw, key, 3 + i)
    const optionNames = getMasteryOptionNames(skillId)
    const optionName = optionNames[optionIndex]
    if (!optionName) throw new Error(`不正なマスタリー選択です(${chara}, ${skillId})`)
    masterySelections[skillId] = optionName
  })

  const memo = rest.slice(masterySkillIds.length)

  return {
    id: crypto.randomUUID(),
    name,
    level,
    role,
    chara,
    absent: false,
    memo,
    masterySelections,
    buildType,
  }
}

export function encodeMembers(members: Member[]): string {
  return members.map(encodeMember).join(MEMBER_SEPARATOR)
}

export function decodeMembers(code: string): { members: Member[]; errors: string[] } {
  const segments = code.trim().split(MEMBER_SEPARATOR).filter(s => s.length > 0)
  const members: Member[] = []
  const errors: string[] = []

  segments.forEach((segment, i) => {
    try {
      members.push(decodeMember(segment))
    } catch (e) {
      errors.push(`${i + 1}件目: ${e instanceof Error ? e.message : '不正なゼリピッピです'}`)
    }
  })

  return { members, errors }
}
