import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'

import {
  AvatarConfig,
  BOTTOMS,
  encodeAvatar,
  FACIAL_HAIR,
  GLASSES,
  HAIR_STYLES,
  randomAvatar,
  SHOES,
  TOPS,
} from '../../avatar/options'
import { CLOTH_COLORS, HAIR_COLORS, SKIN_TONES } from '../../avatar/palette'
import { renderPose, renderSheet, W, H, FRAME_W, FRAME_H } from '../../avatar/render'

// ------------------------------------------------------------------ animated preview

const DIRECTIONS = [
  { label: 'frente', idle: 18, run: 42 },
  { label: 'lado', idle: 0, run: 24 },
  { label: 'costas', idle: 6, run: 30 },
  { label: 'lado', idle: 12, run: 36 },
]

const PreviewBox = styled.div`
  position: relative;
  border-radius: var(--radius-card);
  background: radial-gradient(120% 90% at 50% 100%, rgb(43 127 255 / 0.22), transparent 60%),
    var(--surface-2);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  padding: 18px 12px 12px;
  cursor: pointer;
  user-select: none;

  canvas {
    image-rendering: pixelated;
    filter: drop-shadow(0 10px 10px rgb(0 0 0 / 0.35));
  }

  .hint {
    margin-top: 8px;
    font-size: 11px;
    color: var(--text-faint);
  }
`

/** Walks around in all four directions; click to toggle walking/standing. */
export function AvatarPreview({ config, scale = 3 }: { config: AvatarConfig; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const sheet = useMemo(() => renderSheet(config), [config])
  const [walking, setWalking] = useState(true)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    let tick = 0
    const id = window.setInterval(() => {
      const dir = DIRECTIONS[Math.floor(tick / 18) % DIRECTIONS.length]
      const frame = (walking ? dir.run : dir.idle) + (tick % 6)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(sheet, frame * FRAME_W, 0, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height)
      tick++
    }, walking ? 110 : 160)
    return () => window.clearInterval(id)
  }, [sheet, walking])

  return (
    <PreviewBox onClick={() => setWalking((w) => !w)}>
      <canvas ref={ref} width={(FRAME_W / 2) * scale * 2} height={(FRAME_H / 2) * scale * 2} />
      <div className="hint">{walking ? 'Clique para parar' : 'Clique para andar'}</div>
    </PreviewBox>
  )
}

// ------------------------------------------------------------------ thumbnails

const thumbCache = new Map<string, string>()

type Crop = 'head' | 'torso' | 'legs' | 'feet'
const CROPS: Record<Crop, [number, number]> = {
  head: [0, 16],
  torso: [9, 13],
  legs: [13, 11],
  feet: [16, 8],
}

function thumbnail(config: AvatarConfig, crop: Crop) {
  const key = `${encodeAvatar(config)}|${crop}`
  const cached = thumbCache.get(key)
  if (cached) return cached
  const [y0, h] = CROPS[crop]
  const frame = renderPose(config, { view: 'front' })
  const small = document.createElement('canvas')
  small.width = W
  small.height = H
  small.getContext('2d')!.putImageData(new ImageData(frame.data, W, H), 0, 0)
  const scale = 4
  const out = document.createElement('canvas')
  out.width = W * scale
  out.height = h * scale
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(small, 0, y0, W, h, 0, 0, out.width, out.height)
  const url = out.toDataURL()
  thumbCache.set(key, url)
  return url
}

// ------------------------------------------------------------------ editor

const Layout = styled.div`
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 20px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }

  .left {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`

const Tabs = styled.div`
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);

  button {
    all: unset;
    cursor: pointer;
    height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 13px;
    color: var(--text-muted);

    &.active {
      background: var(--nav-active);
      color: var(--text);
      font-weight: 600;
      box-shadow: inset 0 1px 0 var(--glass-edge);
    }
  }
`

const Panel = styled.div`
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
`

const Section = styled.div`
  margin-bottom: 16px;

  .title {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(66px, 1fr));
  gap: 8px;
`

const Option = styled.button<{ $selected: boolean }>`
  all: unset;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  border-radius: 14px;
  background: ${(p) => (p.$selected ? 'var(--brand-soft)' : 'var(--surface-2)')};
  border: 1px solid ${(p) => (p.$selected ? 'var(--brand)' : 'var(--border)')};
  transition: border-color 0.12s, background 0.12s;

  &:hover {
    border-color: ${(p) => (p.$selected ? 'var(--brand)' : 'var(--border-strong)')};
  }

  &:focus-visible {
    outline: 2px solid var(--brand);
  }

  img {
    height: 48px;
    image-rendering: pixelated;
  }

  span {
    font-size: 11px;
    color: ${(p) => (p.$selected ? 'var(--text)' : 'var(--text-muted)')};
    text-align: center;
    line-height: 1.2;
  }
`

const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Swatch = styled.button<{ $color: string; $selected: boolean }>`
  all: unset;
  cursor: pointer;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: ${(p) => p.$color};
  box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.18), 0 0 0 1px rgb(255 255 255 / 0.18);
  outline: ${(p) => (p.$selected ? '2px solid var(--brand)' : 'none')};
  outline-offset: 2px;

  &:focus-visible {
    outline: 2px solid var(--brand);
  }
`

type TabId = 'cabelo' | 'rosto' | 'roupa' | 'calcados'
const TAB_LABELS: Record<TabId, string> = {
  cabelo: 'Cabelo',
  rosto: 'Rosto',
  roupa: 'Roupa',
  calcados: 'Calçados',
}

const ACCENT_LABEL: Record<string, string> = {
  terno: 'Cor da gravata',
  jaqueta: 'Cor da camiseta por baixo',
}

interface Props {
  value: AvatarConfig
  onChange: (config: AvatarConfig) => void
}

export default function AvatarEditor({ value, onChange }: Props) {
  const [tab, setTab] = useState<TabId>('cabelo')
  const set = (patch: Partial<AvatarConfig>) => onChange({ ...value, ...patch })

  const styleOptions = (
    list: ReadonlyArray<{ id: string; label: string }>,
    field: keyof AvatarConfig,
    crop: Crop
  ) => (
    <Grid>
      {list.map((opt, i) => (
        <Option
          key={opt.id}
          type="button"
          $selected={value[field] === i}
          aria-pressed={value[field] === i}
          onClick={() => set({ [field]: i } as Partial<AvatarConfig>)}
        >
          <img src={thumbnail({ ...value, [field]: i }, crop)} alt="" />
          <span>{opt.label}</span>
        </Option>
      ))}
    </Grid>
  )

  const colorOptions = (
    list: ReadonlyArray<{ label: string; hex?: string; ramp?: { base: string } }>,
    field: keyof AvatarConfig
  ) => (
    <Swatches>
      {list.map((c, i) => (
        <Tooltip key={c.label} title={c.label}>
          <Swatch
            type="button"
            aria-label={c.label}
            $color={c.hex || c.ramp!.base}
            $selected={value[field] === i}
            onClick={() => set({ [field]: i } as Partial<AvatarConfig>)}
          />
        </Tooltip>
      ))}
    </Swatches>
  )

  const topId = TOPS[value.top].id

  return (
    <Layout>
      <div className="left">
        <AvatarPreview config={value} />
        <Button
          variant="outlined"
          startIcon={<CasinoOutlinedIcon />}
          onClick={() => onChange(randomAvatar())}
          size="small"
        >
          Aleatório
        </Button>
      </div>

      <div>
        <Tabs role="tablist">
          {(Object.keys(TAB_LABELS) as TabId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
            >
              {TAB_LABELS[id]}
            </button>
          ))}
        </Tabs>

        <Panel>
          {tab === 'cabelo' && (
            <>
              <Section>
                <div className="title">Corte</div>
                {styleOptions(HAIR_STYLES, 'hair', 'head')}
              </Section>
              <Section>
                <div className="title">Cor do cabelo</div>
                {colorOptions(HAIR_COLORS, 'hairColor')}
              </Section>
            </>
          )}

          {tab === 'rosto' && (
            <>
              <Section>
                <div className="title">Tom de pele</div>
                {colorOptions(SKIN_TONES, 'skin')}
              </Section>
              <Section>
                <div className="title">Barba (usa a cor do cabelo)</div>
                {styleOptions(FACIAL_HAIR, 'facial', 'head')}
              </Section>
              <Section>
                <div className="title">Óculos</div>
                {styleOptions(GLASSES, 'glasses', 'head')}
              </Section>
            </>
          )}

          {tab === 'roupa' && (
            <>
              <Section>
                <div className="title">Parte de cima</div>
                {styleOptions(TOPS, 'top', 'torso')}
              </Section>
              <Section>
                <div className="title">Cor</div>
                {colorOptions(CLOTH_COLORS, 'topColor')}
              </Section>
              {ACCENT_LABEL[topId] && (
                <Section>
                  <div className="title">{ACCENT_LABEL[topId]}</div>
                  {colorOptions(CLOTH_COLORS, 'accentColor')}
                </Section>
              )}
              <Section>
                <div className="title">Parte de baixo</div>
                {styleOptions(BOTTOMS, 'bottom', 'legs')}
              </Section>
              <Section>
                <div className="title">Cor</div>
                {colorOptions(CLOTH_COLORS, 'bottomColor')}
              </Section>
            </>
          )}

          {tab === 'calcados' && (
            <>
              <Section>
                <div className="title">Tipo</div>
                {styleOptions(SHOES, 'shoes', 'feet')}
              </Section>
              <Section>
                <div className="title">Cor</div>
                {colorOptions(CLOTH_COLORS, 'shoesColor')}
              </Section>
            </>
          )}
        </Panel>
      </div>
    </Layout>
  )
}
