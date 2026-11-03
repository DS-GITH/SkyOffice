import {
  FACIAL,
  GLASSES_ART,
  HAIR,
  HEAD,
  Rows,
  SIDE_ARM,
  sym,
  TORSO,
  View,
} from './art'
import { AvatarConfig, BOTTOMS, FACIAL_HAIR, GLASSES, HAIR_STYLES, SHOES, TOPS } from './options'
import {
  CLOTH_COLORS,
  FIXED,
  hexToRgb,
  HAIR_COLORS,
  makeRamp,
  Ramp,
  SKIN_TONES,
  SkinRamp,
} from './palette'

export const W = 16
export const H = 24
/** Final frame size in the game (2x). */
export const FRAME_W = 32
export const FRAME_H = 48
export const FRAME_COUNT = 52

type RGBA = [number, number, number, number]
type Color = string | RGBA | null

class Frame {
  data = new Uint8ClampedArray(W * H * 4)

  put(x: number, y: number, color: Color) {
    if (!color || x < 0 || y < 0 || x >= W || y >= H) return
    const i = (y * W + x) * 4
    if (typeof color === 'string') {
      const [r, g, b] = hexToRgb(color)
      this.data[i] = r
      this.data[i + 1] = g
      this.data[i + 2] = b
      this.data[i + 3] = 255
    } else {
      // alpha blend over what's there (used for glasses lenses)
      const a = color[3]
      for (let c = 0; c < 3; c++) this.data[i + c] = this.data[i + c] * (1 - a) + color[c] * a
      if (!this.data[i + 3]) this.data[i + 3] = Math.round(a * 255)
    }
  }

  clear(x: number, y: number) {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    this.data.fill(0, (y * W + x) * 4, (y * W + x) * 4 + 4)
  }

  /** Copies pixels of `from` rows [y0, y1] and cols [x0, x1] shifted by dy (used for arm swing). */
  shiftRegion(x0: number, x1: number, y0: number, y1: number, dy: number) {
    const copy = new Uint8ClampedArray(this.data)
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) this.data.fill(0, (y * W + x) * 4, (y * W + x) * 4 + 4)
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const ty = y + dy
        if (ty < 0 || ty >= H) continue
        const s = (y * W + x) * 4
        if (!copy[s + 3]) continue
        const t = (ty * W + x) * 4
        this.data.set(copy.subarray(s, s + 4), t)
      }
  }

  flipped() {
    const out = new Frame()
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const s = (y * W + x) * 4
        const t = (y * W + (W - 1 - x)) * 4
        out.data.set(this.data.subarray(s, s + 4), t)
      }
    return out
  }
}

function draw(frame: Frame, rows: Rows, x0: number, y0: number, paint: (ch: string) => Color) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x]
      if (ch === '.') continue
      if (ch === ' ') {
        frame.clear(x0 + x, y0 + y)
        continue
      }
      frame.put(x0 + x, y0 + y, paint(ch))
    }
  })
}

// ------------------------------------------------------------------ colors

interface Look {
  skin: SkinRamp
  hair: Ramp
  top: Ramp
  accent: Ramp
  bottom: Ramp
  shoes: Ramp
  hairStyle: string
  facial: string
  glasses: string
  topStyle: string
  bottomStyle: string
  shoeStyle: string
}

function lookOf(c: AvatarConfig): Look {
  return {
    skin: SKIN_TONES[c.skin].ramp,
    hair: makeRamp(HAIR_COLORS[c.hairColor].hex),
    top: makeRamp(CLOTH_COLORS[c.topColor].hex),
    accent: makeRamp(CLOTH_COLORS[c.accentColor].hex),
    bottom: makeRamp(CLOTH_COLORS[c.bottomColor].hex),
    shoes: makeRamp(CLOTH_COLORS[c.shoesColor].hex),
    hairStyle: HAIR_STYLES[c.hair].id,
    facial: FACIAL_HAIR[c.facial].id,
    glasses: GLASSES[c.glasses].id,
    topStyle: TOPS[c.top].id,
    bottomStyle: BOTTOMS[c.bottom].id,
    shoeStyle: SHOES[c.shoes].id,
  }
}

const SHORT_SLEEVES = new Set(['camiseta', 'polo', 'regata'])
const TUCKED = new Set(['social', 'terno'])

function skinPaint(s: SkinRamp, blink = false) {
  return (ch: string): Color => {
    switch (ch) {
      case 'o': return s.outline
      case 's': case 'k': return s.base
      case 'S': case 'K': return s.shade
      case 'b': return s.blush
      case 'e': return blink ? s.base : FIXED.eye
      case 'E': return blink ? FIXED.eye : FIXED.eye2
      default: return null
    }
  }
}

function hairPaint(r: Ramp) {
  return (ch: string): Color => {
    switch (ch) {
      case 'o': return r.outline
      case 'a': return r.base
      case 'A': return r.shade
      case 'l': return r.light
      case 'D': return r.deep
      case 'x': return FIXED.hairTie
      default: return null
    }
  }
}

function clothPaint(look: Look) {
  const t = look.top
  const s = look.skin
  const sleeveless = look.topStyle === 'regata'
  const shortSleeve = SHORT_SLEEVES.has(look.topStyle)
  return (ch: string): Color => {
    switch (ch) {
      case 'o': return t.outline
      case '1': return t.base
      case '2': return t.shade
      case '3': return t.light
      case '4': return t.deep
      case 'u': return sleeveless ? s.base : t.base
      case 'v': return shortSleeve ? s.base : t.base
      case 'k': return s.base
      case 'K': return s.shade
      case 'w': return FIXED.white
      case 'W': return FIXED.whiteShade
      case 'x': return look.accent.base
      case 'X': return look.accent.shade
      default: return null
    }
  }
}

function glassesPaint(style: string) {
  return (ch: string): Color => {
    switch (ch) {
      case 'f': return style === 'grau-grossa' ? FIXED.frameThick : FIXED.frame
      case 'g': return FIXED.lensTint
      case 'G': return FIXED.lensDark
      case 'h': return FIXED.lensShine
      default: return null
    }
  }
}

// ------------------------------------------------------------------ top details (overlays on TORSO)

const TOP_DETAIL: Record<string, Partial<Record<View, Rows>>> = {
  polo: {
    front: sym(['...33o..', '.......2', '.......2', '........', '........']),
    back: sym(['....3333', '........', '........', '........', '........']),
    side: ['.........33.....', '................', '................', '................', '................'],
  },
  social: {
    front: sym(['...33o..', '.......2', '.......2', '.......2', '....    ']),
    back: sym(['....3333', '........', '........', '........', '....    ']),
    side: ['.........33.....', '..........2.....', '..........2.....', '................', '.....      .....'],
  },
  moletom: {
    front: sym(['..422oo.', '......w.', '......w.', '.....222', '....4444']),
    back: sym(['...42222', '....4444', '........', '........', '....4444']),
    side: ['...o42..........', '...o4...........', '................', '........22......', '.....444444.....'],
  },
  jaqueta: {
    front: sym(['.....3xx', '.....3xx', '.....3xx', '.....3xx', '.....3XX']),
    side: ['..........x.....', '..........x.....', '..........x.....', '..........x.....', '..........X.....'],
  },
  blazer: {
    front: sym(['.....3ww', '......3w', '.......3', '.......4', '........']),
    back: sym(['....2222', '........', '.......2', '.......2', '........']),
    side: ['.........ww.....', '..........w.....', '................', '................', '................'],
  },
  terno: {
    front: sym(['.....3wX', '......3x', '.......x', '.......X', '....    ']),
    back: sym(['....2222', '........', '.......2', '.......2', '....    ']),
    side: ['.........wX.....', '..........x.....', '..........x.....', '..........X.....', '.....      .....'],
  },
}

// ------------------------------------------------------------------ legs (procedural)

interface FrontLegs {
  liftL: number
  liftR: number
  sit?: boolean
}
interface SideLegs {
  stride: 0 | 1 | 2
  nearFront: boolean
  sit?: boolean
}

function drawWaist(frame: Frame, look: Look, x0: number, x1: number, buckleX: number[]) {
  const b = look.bottom
  const belt = TUCKED.has(look.topStyle) && look.bottomStyle !== 'saia'
  frame.put(x0, 19, b.outline)
  frame.put(x1, 19, b.outline)
  for (let x = x0 + 1; x < x1; x++) frame.put(x, 19, belt ? FIXED.belt : b.shade)
  if (belt) buckleX.forEach((x) => frame.put(x, 19, FIXED.buckle))
}

/** Shoe drawn with its top row at `y` for a leg occupying cols [x, x+3]. */
function drawShoeFront(frame: Frame, look: Look, x: number, y: number) {
  const r = look.shoes
  const s = look.skin
  switch (look.shoeStyle) {
    case 'tenis':
      frame.put(x, y, r.outline)
      frame.put(x + 1, y, r.light)
      frame.put(x + 2, y, r.base)
      frame.put(x + 3, y, r.outline)
      frame.put(x + 1, y + 1, FIXED.sole)
      frame.put(x + 2, y + 1, FIXED.sole)
      break
    case 'social':
      frame.put(x, y, r.outline)
      frame.put(x + 1, y, r.shade)
      frame.put(x + 2, y, r.light)
      frame.put(x + 3, y, r.outline)
      frame.put(x + 1, y + 1, r.outline)
      frame.put(x + 2, y + 1, r.outline)
      break
    case 'bota':
      for (const yy of [y - 1, y]) {
        frame.put(x, yy, r.outline)
        frame.put(x + 1, yy, yy === y - 1 ? r.light : r.base)
        frame.put(x + 2, yy, r.shade)
        frame.put(x + 3, yy, r.outline)
      }
      frame.put(x + 1, y + 1, r.deep)
      frame.put(x + 2, y + 1, r.deep)
      break
    case 'chinelo':
      frame.put(x, y, s.outline)
      frame.put(x + 1, y, s.base)
      frame.put(x + 2, y, r.base)
      frame.put(x + 3, y, s.outline)
      frame.put(x + 1, y + 1, r.shade)
      frame.put(x + 2, y + 1, r.shade)
      break
  }
}

function drawLegsFront(frame: Frame, look: Look, pose: FrontLegs) {
  const b = look.bottom
  const s = look.skin
  const skirt = look.bottomStyle === 'saia'
  const shorts = look.bottomStyle === 'short'
  drawWaist(frame, look, 3, 12, [7, 8])

  // row 20: hips (both legs joined); skirt flares out
  const hx0 = skirt ? 2 : 3
  const hx1 = skirt ? 13 : 12
  frame.put(hx0, 20, b.outline)
  frame.put(hx1, 20, b.outline)
  for (let x = hx0 + 1; x < hx1; x++) frame.put(x, 20, x === 7 || x === 8 ? b.shade : b.base)
  if (pose.sit) {
    // knees towards the viewer
    frame.put(4, 20, b.light)
    frame.put(11, 20, b.light)
  }
  if (skirt) for (let x = 3; x <= 12; x++) frame.put(x, 21, x === 3 || x === 12 ? b.outline : b.shade)

  const legs: Array<[number, number]> = [
    [3, pose.sit ? 1 : pose.liftL],
    [9, pose.sit ? 1 : pose.liftR],
  ]
  for (const [x, lift] of legs) {
    const shoeY = 22 - lift
    // leg rows between hips and shoe
    for (let y = skirt ? 22 : 21; y < shoeY; y++) {
      const bare = skirt || shorts
      frame.put(x, y, bare ? s.outline : b.outline)
      frame.put(x + 1, y, bare ? s.base : b.base)
      frame.put(x + 2, y, bare ? s.shade : b.shade)
      frame.put(x + 3, y, bare ? s.outline : b.outline)
    }
    drawShoeFront(frame, look, x, shoeY)
  }
}

function drawSideLeg(frame: Frame, look: Look, x: number, far: boolean, lift = 0) {
  const b = look.bottom
  const s = look.skin
  const r = look.shoes
  const bare = look.bottomStyle !== 'calca'
  const base = far ? (bare ? s.shade : b.shade) : bare ? s.base : b.base
  const out = bare ? s.outline : b.outline
  const top = look.bottomStyle === 'calca' ? 20 : 21
  const shoeY = 22 - lift
  for (let y = top; y < shoeY; y++) {
    frame.put(x, y, out)
    frame.put(x + 1, y, base)
    frame.put(x + 2, y, base)
    frame.put(x + 3, y, out)
  }
  // shoe pointing right
  const shoeBase = far ? r.shade : r.base
  if (look.shoeStyle === 'chinelo') {
    frame.put(x, shoeY, s.outline)
    frame.put(x + 1, shoeY, s.base)
    frame.put(x + 2, shoeY, r.base)
    frame.put(x + 3, shoeY, s.base)
    frame.put(x + 4, shoeY, s.outline)
    for (let k = 1; k <= 3; k++) frame.put(x + k, shoeY + 1, r.shade)
    return
  }
  if (look.shoeStyle === 'bota') {
    frame.put(x, shoeY - 1, r.outline)
    frame.put(x + 1, shoeY - 1, r.light)
    frame.put(x + 2, shoeY - 1, shoeBase)
    frame.put(x + 3, shoeY - 1, r.outline)
  }
  frame.put(x, shoeY, r.outline)
  for (let k = 1; k <= 3; k++) frame.put(x + k, shoeY, k === 3 && look.shoeStyle === 'social' ? r.light : shoeBase)
  frame.put(x + 4, shoeY, r.outline)
  const sole = look.shoeStyle === 'tenis' ? FIXED.sole : r.outline
  for (let k = 1; k <= 3; k++) frame.put(x + k, shoeY + 1, sole)
}

function drawLegsSide(frame: Frame, look: Look, pose: SideLegs) {
  const b = look.bottom
  const s = look.skin
  drawWaist(frame, look, 4, 11, [10])

  if (pose.sit) {
    // thigh forward (horizontal), shin down
    const bare = look.bottomStyle !== 'calca'
    for (let x = 5; x <= 13; x++) frame.put(x, 20, x === 5 || x === 13 ? b.outline : b.base)
    if (look.bottomStyle === 'saia') for (let x = 4; x <= 10; x++) frame.put(x, 20, x === 4 ? b.outline : b.shade)
    for (let x = 5; x <= 10; x++) frame.put(x, 21, b.outline)
    for (const y of [21]) {
      frame.put(10, y, bare ? s.outline : b.outline)
      frame.put(11, y, bare ? s.base : b.base)
      frame.put(12, y, bare ? s.shade : b.shade)
      frame.put(13, y, bare ? s.outline : b.outline)
    }
    const r = look.shoes
    frame.put(10, 22, r.outline)
    for (let k = 11; k <= 13; k++) frame.put(k, 22, look.shoeStyle === 'chinelo' ? s.base : r.base)
    frame.put(14, 22, r.outline)
    for (let k = 11; k <= 13; k++) frame.put(k, 23, look.shoeStyle === 'tenis' ? FIXED.sole : r.outline)
    return
  }

  if (look.bottomStyle === 'saia') {
    for (let x = 4; x <= 11; x++) frame.put(x, 20, x === 4 || x === 11 ? b.outline : b.base)
    for (let x = 3; x <= 11; x++) frame.put(x, 21, x === 3 || x === 11 ? b.outline : b.shade)
  } else {
    // hips
    for (let x = 5; x <= 10; x++) frame.put(x, 20, x === 5 || x === 10 ? b.outline : b.base)
  }

  if (pose.stride === 0) {
    drawSideLeg(frame, look, 5, false)
    return
  }
  const spread = pose.stride
  const backX = 5 - spread
  const frontX = 5 + spread
  // the far leg is drawn first and darker
  if (pose.nearFront) {
    drawSideLeg(frame, look, backX, true)
    drawSideLeg(frame, look, frontX, false, spread === 2 ? 0 : 1)
  } else {
    drawSideLeg(frame, look, frontX, true, spread === 2 ? 0 : 1)
    drawSideLeg(frame, look, backX, false)
  }
}

// ------------------------------------------------------------------ frame composition

interface Pose {
  view: View
  /** head bob (idle breathing) */
  headDy?: number
  /** upper body bob (running) */
  bodyDy?: number
  blink?: boolean
  front?: FrontLegs
  side?: SideLegs
  /** front view: raise one hand while walking (-1 = left, 1 = right) */
  swingHand?: -1 | 0 | 1
  /** side view arm offset */
  armDx?: number
}

function composeTorso(look: Look, view: View): Rows {
  const base = TORSO[view]
  const detail = TOP_DETAIL[look.topStyle]?.[view]
  if (!detail) return base
  return base.map((row, y) => {
    const d = detail[y] || ''
    let out = ''
    for (let x = 0; x < row.length; x++) {
      const ch = d[x]
      // '.' keeps the base pixel, ' ' clears it (tucked shirts show the belt), anything else overrides
      out += !ch || ch === '.' ? row[x] : ch
    }
    return out
  })
}

export function renderPose(config: AvatarConfig, pose: Pose): Frame {
  const look = lookOf(config)
  const frame = new Frame()
  const view = pose.view
  const headDy = (pose.headDy || 0) + (pose.bodyDy || 0)
  const bodyDy = pose.bodyDy || 0

  // 1. legs
  if (view === 'side') drawLegsSide(frame, look, pose.side || { stride: 0, nearFront: true })
  else drawLegsFront(frame, look, pose.front || { liftL: 0, liftR: 0 })

  // 2. torso (+ arms)
  const torso = new Frame()
  draw(torso, composeTorso(look, view), 0, 15 + bodyDy, clothPaint(look))
  if (view !== 'side' && pose.swingHand) {
    const left = pose.swingHand === -1
    torso.shiftRegion(left ? 0 : 13, left ? 2 : 15, 16 + bodyDy, 19 + bodyDy, -1)
  }
  mergeInto(frame, torso)

  // long hair falls behind the head in the back view: drawn with the rest of the hair below

  // 3. head
  draw(frame, HEAD[view], 0, headDy, skinPaint(look.skin, pose.blink))

  // 4. facial hair (front/side)
  if (view !== 'back') {
    const facial = FACIAL[look.facial]?.[view]
    if (facial) draw(frame, facial, 0, headDy, hairPaint(look.hair))
  }

  // 5. hair
  const hair = HAIR[look.hairStyle]?.[view]
  if (hair) draw(frame, hair, 0, headDy, hairPaint(look.hair))

  // 6. glasses
  if (view !== 'back') {
    const glasses = GLASSES_ART[look.glasses]?.[view]
    if (glasses) draw(frame, glasses, 0, headDy, glassesPaint(look.glasses))
  }

  // 7. side arm on top of body
  if (view === 'side') draw(frame, SIDE_ARM, 6 + (pose.armDx || 0), 16 + bodyDy, clothPaint(look))

  return frame
}

function mergeInto(target: Frame, src: Frame) {
  for (let i = 0; i < src.data.length; i += 4) {
    if (src.data[i + 3]) target.data.set(src.data.subarray(i, i + 4), i)
  }
}

// ------------------------------------------------------------------ sheet (same layout as the original characters)
// 0-5 idle right | 6-11 idle up | 12-17 idle left | 18-23 idle down
// 24-29 run right | 30-35 run up | 36-41 run left | 42-47 run down
// 48 sit down | 49 sit left | 50 sit right | 51 sit up

const IDLE_HEAD = [0, 0, 0, 1, 1, 0]
const RUN_FRONT: Array<FrontLegs & { hand: -1 | 0 | 1; bob: number }> = [
  { liftL: 1, liftR: 0, hand: 1, bob: 0 },
  { liftL: 1, liftR: 0, hand: 1, bob: -1 },
  { liftL: 0, liftR: 0, hand: 0, bob: 0 },
  { liftL: 0, liftR: 1, hand: -1, bob: 0 },
  { liftL: 0, liftR: 1, hand: -1, bob: -1 },
  { liftL: 0, liftR: 0, hand: 0, bob: 0 },
]
const RUN_SIDE: Array<SideLegs & { armDx: number; bob: number }> = [
  { stride: 2, nearFront: true, armDx: -1, bob: 0 },
  { stride: 1, nearFront: true, armDx: 0, bob: -1 },
  { stride: 0, nearFront: true, armDx: 0, bob: 0 },
  { stride: 2, nearFront: false, armDx: 1, bob: 0 },
  { stride: 1, nearFront: false, armDx: 0, bob: -1 },
  { stride: 0, nearFront: false, armDx: 0, bob: 0 },
]

export function sheetFrames(config: AvatarConfig): Frame[] {
  const frames: Frame[] = []
  const idle = (view: View, i: number) =>
    renderPose(config, { view, headDy: IDLE_HEAD[i], blink: i === 5 && view !== 'back' })
  const runFront = (view: View, i: number) => {
    const r = RUN_FRONT[i]
    return renderPose(config, { view, front: r, swingHand: r.hand, bodyDy: r.bob })
  }
  const runSide = (i: number) => {
    const r = RUN_SIDE[i]
    return renderPose(config, { view: 'side', side: r, armDx: r.armDx, bodyDy: r.bob })
  }

  for (let i = 0; i < 6; i++) frames.push(idle('side', i))
  for (let i = 0; i < 6; i++) frames.push(idle('back', i))
  for (let i = 0; i < 6; i++) frames.push(idle('side', i).flipped())
  for (let i = 0; i < 6; i++) frames.push(idle('front', i))
  for (let i = 0; i < 6; i++) frames.push(runSide(i))
  for (let i = 0; i < 6; i++) frames.push(runFront('back', i))
  for (let i = 0; i < 6; i++) frames.push(runSide(i).flipped())
  for (let i = 0; i < 6; i++) frames.push(runFront('front', i))

  const sitSide = renderPose(config, { view: 'side', side: { stride: 0, nearFront: true, sit: true } })
  frames.push(renderPose(config, { view: 'front', front: { liftL: 0, liftR: 0, sit: true } }))
  frames.push(sitSide.flipped())
  frames.push(sitSide)
  frames.push(renderPose(config, { view: 'back', front: { liftL: 0, liftR: 0, sit: true } }))
  return frames
}

/** Full spritesheet at game scale: 52 frames of 32x48 in one row (1664x48). */
export function renderSheet(config: AvatarConfig): HTMLCanvasElement {
  const frames = sheetFrames(config)
  const small = document.createElement('canvas')
  small.width = W * frames.length
  small.height = H
  const sctx = small.getContext('2d')!
  frames.forEach((f, i) => sctx.putImageData(new ImageData(f.data, W, H), i * W, 0))

  const big = document.createElement('canvas')
  big.width = FRAME_W * frames.length
  big.height = FRAME_H
  const bctx = big.getContext('2d')!
  bctx.imageSmoothingEnabled = false
  bctx.drawImage(small, 0, 0, big.width, big.height)
  return big
}

/** Single frame scaled up, for previews/thumbnails. */
export function renderPreview(config: AvatarConfig, pose: Pose = { view: 'front' }, scale = 4) {
  const f = renderPose(config, pose)
  const small = document.createElement('canvas')
  small.width = W
  small.height = H
  small.getContext('2d')!.putImageData(new ImageData(f.data, W, H), 0, 0)
  const big = document.createElement('canvas')
  big.width = W * scale
  big.height = H * scale
  const ctx = big.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(small, 0, 0, big.width, big.height)
  return big
}

export type { Pose }
