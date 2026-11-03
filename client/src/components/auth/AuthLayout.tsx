import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Scene, Logo, GlassPanel } from '../ui/Glass'
import { renderPreview } from '../../avatar/render'
import { AvatarConfig } from '../../avatar/options'

// A few characters made with our own generator (see client/src/avatar)
const SHOWCASE: AvatarConfig[] = [
  { skin: 1, hair: 4, hairColor: 1, facial: 0, glasses: 0, top: 8, topColor: 7, accentColor: 5, bottom: 0, bottomColor: 7, shoes: 1, shoesColor: 4 },
  { skin: 5, hair: 7, hairColor: 0, facial: 0, glasses: 1, top: 0, topColor: 5, accentColor: 0, bottom: 0, bottomColor: 8, shoes: 0, shoesColor: 0 },
  { skin: 2, hair: 6, hairColor: 4, facial: 0, glasses: 0, top: 5, topColor: 15, accentColor: 0, bottom: 2, bottomColor: 4, shoes: 2, shoesColor: 18 },
  { skin: 3, hair: 3, hairColor: 2, facial: 4, glasses: 3, top: 6, topColor: 3, accentColor: 12, bottom: 1, bottomColor: 17, shoes: 3, shoesColor: 9 },
]

const Grid = styled.div`
  min-height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 24px;
  padding: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const FormSide = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 24px;

  .form {
    width: 100%;
    max-width: 400px;
    margin: auto;
    padding: 48px 0;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 0 0 32px;
    color: var(--text-muted);
    font-size: 15px;
    line-height: 1.5;
  }

  footer {
    color: var(--text-faint);
    font-size: 12px;
  }
`

const ShowcasePanel = styled(GlassPanel)`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 48px;
  min-height: 560px;

  @media (max-width: 900px) {
    display: none;
  }

  .blob {
    position: absolute;
    width: 520px;
    height: 520px;
    border-radius: 999px;
    background: var(--brand);
    filter: blur(120px);
    opacity: 0.18;
    top: -120px;
    right: -120px;
    pointer-events: none;
  }

  .avatars {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding-bottom: 120px;

    img {
      height: 150px;
      image-rendering: pixelated;
      filter: drop-shadow(0 24px 24px rgb(0 0 0 / 0.45));
      animation: float 4s ease-in-out infinite;
    }
    img:nth-child(2) {
      animation-delay: -1s;
    }
    img:nth-child(3) {
      animation-delay: -2s;
    }
    img:nth-child(4) {
      animation-delay: -3s;
    }
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  h2 {
    position: relative;
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  p {
    position: relative;
    margin: 0;
    max-width: 420px;
    color: var(--text-muted);
    line-height: 1.6;
  }
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

interface Props {
  title: string
  subtitle: React.ReactNode
  children: React.ReactNode
}

export default function AuthLayout({ title, subtitle, children }: Props) {
  const showcase = useMemo(
    () => SHOWCASE.map((c) => renderPreview(c, { view: 'front' }, 6).toDataURL()),
    []
  )
  return (
    <Scene>
      <Grid>
        <FormSide>
          <Logo />
          <div className="form">
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
            {children}
          </div>
          <footer>© {new Date().getFullYear()} Xpert Dev · Uso interno</footer>
        </FormSide>
        <ShowcasePanel>
          <div className="blob" />
          <div className="avatars">
            {showcase.map((src, i) => (
              <img key={i} src={src} alt="" />
            ))}
          </div>
          <h2>O escritório da Xpert Dev, onde você estiver.</h2>
          <p>
            Ande pelo escritório, sente perto do time e converse por vídeo — é só se aproximar.
          </p>
        </ShowcasePanel>
      </Grid>
    </Scene>
  )
}
