import { CLOTH_COLORS, HAIR_COLORS, SKIN_TONES } from './palette'

export const HAIR_STYLES = [
  { id: 'careca', label: 'Careca' },
  { id: 'raspado', label: 'Raspado' },
  { id: 'curto', label: 'Curto' },
  { id: 'social', label: 'Social' },
  { id: 'topete', label: 'Topete' },
  { id: 'chanel', label: 'Liso médio' },
  { id: 'longo', label: 'Longo' },
  { id: 'cacheado', label: 'Cacheado' },
  { id: 'rabo', label: 'Rabo de cavalo' },
  { id: 'coque', label: 'Coque' },
] as const

export const FACIAL_HAIR = [
  { id: 'nenhuma', label: 'Nenhuma' },
  { id: 'bigode', label: 'Bigode' },
  { id: 'cavanhaque', label: 'Cavanhaque' },
  { id: 'barba-curta', label: 'Barba curta' },
  { id: 'barba', label: 'Barba cheia' },
] as const

export const GLASSES = [
  { id: 'nenhum', label: 'Sem óculos' },
  { id: 'grau', label: 'De grau' },
  { id: 'grau-grossa', label: 'Armação grossa' },
  { id: 'sol', label: 'De sol' },
] as const

export const TOPS = [
  { id: 'camiseta', label: 'Camiseta' },
  { id: 'regata', label: 'Regata' },
  { id: 'manga-longa', label: 'Manga longa' },
  { id: 'polo', label: 'Polo' },
  { id: 'social', label: 'Camisa social' },
  { id: 'moletom', label: 'Moletom' },
  { id: 'jaqueta', label: 'Jaqueta' },
  { id: 'blazer', label: 'Blazer' },
  { id: 'terno', label: 'Terno e gravata' },
] as const

export const BOTTOMS = [
  { id: 'calca', label: 'Calça' },
  { id: 'short', label: 'Short' },
  { id: 'saia', label: 'Saia' },
] as const

export const SHOES = [
  { id: 'tenis', label: 'Tênis' },
  { id: 'social', label: 'Sapato social' },
  { id: 'bota', label: 'Bota' },
  { id: 'chinelo', label: 'Chinelo' },
] as const

export type HairStyle = typeof HAIR_STYLES[number]['id']
export type FacialHair = typeof FACIAL_HAIR[number]['id']
export type Glasses = typeof GLASSES[number]['id']
export type Top = typeof TOPS[number]['id']
export type Bottom = typeof BOTTOMS[number]['id']
export type Shoes = typeof SHOES[number]['id']

/** Indices into the option lists above (kept small so it encodes to a short string). */
export interface AvatarConfig {
  skin: number
  hair: number
  hairColor: number
  facial: number
  glasses: number
  top: number
  topColor: number
  accentColor: number
  bottom: number
  bottomColor: number
  shoes: number
  shoesColor: number
}

const FIELDS: Array<[keyof AvatarConfig, number]> = [
  ['skin', SKIN_TONES.length],
  ['hair', HAIR_STYLES.length],
  ['hairColor', HAIR_COLORS.length],
  ['facial', FACIAL_HAIR.length],
  ['glasses', GLASSES.length],
  ['top', TOPS.length],
  ['topColor', CLOTH_COLORS.length],
  ['accentColor', CLOTH_COLORS.length],
  ['bottom', BOTTOMS.length],
  ['bottomColor', CLOTH_COLORS.length],
  ['shoes', SHOES.length],
  ['shoesColor', CLOTH_COLORS.length],
]

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: 1,
  hair: 2,
  hairColor: 2,
  facial: 0,
  glasses: 0,
  top: 0,
  topColor: 5,
  accentColor: 0,
  bottom: 0,
  bottomColor: 8,
  shoes: 0,
  shoesColor: 0,
}

const VERSION = 'v1'
export const AVATAR_CODE_PATTERN = /^v1(-[0-9a-z]{1,2}){12}$/

/** Compact, URL/texture-key safe code. No "_" on purpose: animation keys are "<texture>_<state>_<dir>". */
export function encodeAvatar(config: AvatarConfig) {
  return [VERSION, ...FIELDS.map(([key]) => config[key].toString(36))].join('-')
}

export function decodeAvatar(code: string | null | undefined): AvatarConfig | null {
  if (!code || !AVATAR_CODE_PATTERN.test(code)) return null
  const parts = code.split('-').slice(1).map((p) => parseInt(p, 36))
  const config = {} as AvatarConfig
  for (let i = 0; i < FIELDS.length; i++) {
    const [key, size] = FIELDS[i]
    if (!(parts[i] >= 0 && parts[i] < size)) return null
    config[key] = parts[i]
  }
  return config
}

export function randomAvatar(): AvatarConfig {
  const pick = (n: number) => Math.floor(Math.random() * n)
  const config = {} as AvatarConfig
  FIELDS.forEach(([key, size]) => (config[key] = pick(size)))
  // keep it tasteful: most people without beard/glasses
  if (Math.random() < 0.55) config.facial = 0
  if (Math.random() < 0.55) config.glasses = 0
  return config
}
