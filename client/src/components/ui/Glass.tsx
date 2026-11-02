import React from 'react'
import styled, { css } from 'styled-components'

/** Frosted glass surface used by every panel (Xpert Dev "Spatial Glass"). */
export const glass = css`
  background: var(--surface-overlay);
  backdrop-filter: blur(var(--glass-blur)) saturate(170%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(170%);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-float);
`

export const GlassPanel = styled.div`
  ${glass};
  border-radius: var(--radius-panel);
  color: var(--text);
`

export const GlassCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-card);
  color: var(--text);
`

/** Full-screen branded background (covers the game while signing in / choosing a workspace). */
export const Scene = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  overflow-y: auto;
  background-color: var(--scene);
  background-image: radial-gradient(
      60vw 60vw at 85% -10%,
      var(--scene-glow-1),
      transparent 60%
    ),
    radial-gradient(50vw 50vw at -10% 110%, var(--scene-glow-2), transparent 60%),
    radial-gradient(40vw 40vw at 50% 50%, var(--scene-glow-3), transparent 70%);
  font-family: var(--font);
`

const LogoWrap = styled.div<{ size: number }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  letter-spacing: -0.01em;
  font-size: ${(p) => p.size}px;
  color: var(--text);
  white-space: nowrap;

  img {
    height: ${(p) => Math.round(p.size * 1.6)}px;
    width: auto;
  }

  span {
    color: var(--text-muted);
  }
`

export function Logo({ size = 15 }: { size?: number }) {
  return (
    <LogoWrap size={size}>
      <img src="/brand/logo-mark.webp" alt="" />
      <div>
        Xpert <span>Office</span>
      </div>
    </LogoWrap>
  )
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

const AvatarCircle = styled.div<{ size: number }>`
  flex: none;
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--brand-soft);
  color: var(--brand-soft-fg);
  font-size: ${(p) => Math.round(p.size * 0.38)}px;
  font-weight: 600;
  box-shadow: inset 0 1px 0 var(--glass-edge);
  user-select: none;
`

export function InitialsAvatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <AvatarCircle size={size} title={name}>
      {initials(name)}
    </AvatarCircle>
  )
}

/** Small pill with a colored dot (e.g. "3 online"). */
export const StatusPill = styled.span<{ tone?: 'success' | 'neutral' | 'brand' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  background: ${(p) =>
    p.tone === 'success'
      ? 'var(--success-soft)'
      : p.tone === 'brand'
      ? 'var(--brand-soft)'
      : 'var(--surface-2)'};
  color: ${(p) =>
    p.tone === 'success'
      ? 'var(--success)'
      : p.tone === 'brand'
      ? 'var(--brand-soft-fg)'
      : 'var(--text-muted)'};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
    display: ${(p) => (p.tone === 'success' ? 'block' : 'none')};
  }
`

export const Muted = styled.p`
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.5;
`

export const ErrorText = styled.div`
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--danger-soft);
  color: #ff8a8d;
  font-size: 13px;
`
