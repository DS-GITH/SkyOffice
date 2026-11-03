// Color ramps for the avatar generator. Every part is drawn with "roles"
// (base / shade / light / deep / outline) and painted with one of these ramps.

export interface Ramp {
  light: string
  base: string
  shade: string
  deep: string
  outline: string
}

export interface SkinRamp extends Ramp {
  blush: string
}

const NAVY = [38, 38, 58] // outline tint used by the original pixel art

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex([r, g, b]: number[]) {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl([r, g, b]: number[]) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

function hslToRgb([h, s, l]: number[]) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function mix(a: number[], b: number[], t: number) {
  return a.map((v, i) => v + (b[i] - v) * t)
}

/** Builds a ramp from one base color: cooler, darker shades and a warmer highlight. */
export function makeRamp(hex: string): Ramp {
  const rgb = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(rgb)
  const shift = (dl: number, dh: number, ds = 0) =>
    rgbToHex(hslToRgb([h + dh, Math.max(0, Math.min(1, s + ds)), Math.max(0.04, Math.min(0.97, l + dl))]))
  const deep = hexToRgb(shift(-0.26, 10, -0.05))
  return {
    light: shift(0.11, -6, 0.02),
    base: hex,
    shade: shift(-0.12, 8, -0.02),
    deep: rgbToHex(deep),
    outline: rgbToHex(mix(deep, NAVY, 0.6)),
  }
}

function skin(base: string, shade: string, blush: string): SkinRamp {
  const ramp = makeRamp(base)
  return { ...ramp, shade, blush, outline: rgbToHex(mix(hexToRgb(ramp.deep), NAVY, 0.7)) }
}

export const SKIN_TONES: Array<{ label: string; ramp: SkinRamp }> = [
  { label: 'Muito clara', ramp: skin('#ffe0cc', '#f4c2aa', '#f7a593') },
  { label: 'Clara', ramp: skin('#ffcbb0', '#f6ae9f', '#f69784') },
  { label: 'Média clara', ramp: skin('#eebd94', '#d9a07a', '#e98e74') },
  { label: 'Média', ramp: skin('#d6a073', '#bd855b', '#d0775c') },
  { label: 'Morena', ramp: skin('#b97f55', '#9d6743', '#b9624a') },
  { label: 'Morena escura', ramp: skin('#94603d', '#7b4c2f', '#9c4d3a') },
  { label: 'Negra', ramp: skin('#6e4430', '#5a3524', '#7e3c2e') },
  { label: 'Negra retinta', ramp: skin('#4e3024', '#3f251b', '#5f2c22') },
]

export const HAIR_COLORS: Array<{ label: string; hex: string }> = [
  { label: 'Preto', hex: '#2e2c36' },
  { label: 'Castanho escuro', hex: '#4b3429' },
  { label: 'Castanho', hex: '#6e4832' },
  { label: 'Castanho claro', hex: '#93683f' },
  { label: 'Ruivo', hex: '#b5532e' },
  { label: 'Loiro escuro', hex: '#b38c4c' },
  { label: 'Loiro', hex: '#e2c272' },
  { label: 'Platinado', hex: '#ebe5d0' },
  { label: 'Grisalho', hex: '#a7a7b0' },
  { label: 'Branco', hex: '#ecebf2' },
  { label: 'Azul', hex: '#3f6fd8' },
  { label: 'Rosa', hex: '#e07fae' },
  { label: 'Roxo', hex: '#7b57b3' },
  { label: 'Verde', hex: '#6f8f3e' },
]

export const CLOTH_COLORS: Array<{ label: string; hex: string }> = [
  { label: 'Branco', hex: '#ecebf1' },
  { label: 'Cinza claro', hex: '#b9bcc7' },
  { label: 'Cinza', hex: '#7c8191' },
  { label: 'Grafite', hex: '#4a4e5b' },
  { label: 'Preto', hex: '#2b2c35' },
  { label: 'Azul Xpert', hex: '#2b7fff' },
  { label: 'Azul claro', hex: '#7fb3ff' },
  { label: 'Azul marinho', hex: '#2d3f68' },
  { label: 'Jeans', hex: '#4e6b9c' },
  { label: 'Vermelho', hex: '#d4463e' },
  { label: 'Vinho', hex: '#7b2c3c' },
  { label: 'Laranja', hex: '#e8843b' },
  { label: 'Amarelo', hex: '#e9c647' },
  { label: 'Verde', hex: '#4cae6a' },
  { label: 'Verde oliva', hex: '#6b7a3f' },
  { label: 'Roxo', hex: '#7b57b3' },
  { label: 'Rosa', hex: '#e98cb1' },
  { label: 'Bege', hex: '#d8c4a1' },
  { label: 'Marrom', hex: '#7b5337' },
]

export const FIXED = {
  eye: '#272636',
  eye2: '#3d3c56',
  white: '#f4f4f8',
  whiteShade: '#d3d4e0',
  belt: '#2b2a33',
  buckle: '#d8c27a',
  frame: '#2a2a38',
  frameThick: '#141419',
  lensDark: '#1f2030',
  lensShine: '#8fa3c4',
  lensTint: [175, 215, 255, 0.4] as [number, number, number, number],
  sole: '#f1f1f5',
  hairTie: '#2b2a33',
}

export { hexToRgb, rgbToHex }
