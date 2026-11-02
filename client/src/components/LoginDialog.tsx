import React, { useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined'
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

import Adam from '../images/login/Adam_login.png'
import Ash from '../images/login/Ash_login.png'
import Lucy from '../images/login/Lucy_login.png'
import Nancy from '../images/login/Nancy_login.png'
import { useAppSelector, useAppDispatch } from '../hooks'
import { setLoggedIn } from '../stores/UserStore'
import { GlassPanel, Muted, StatusPill } from './ui/Glass'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const AVATAR_KEY = 'xpert-office-avatar'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(3 4 7 / 0.55);
  backdrop-filter: blur(6px);
`

const Card = styled(GlassPanel)`
  width: 100%;
  max-width: 560px;
  padding: 32px;

  .eyebrow {
    font-size: 13px;
    color: var(--text-faint);
    margin-bottom: 6px;
  }

  h2 {
    margin: 0 0 6px;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .label {
    margin: 28px 0 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
  }

  .devices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  }

  .device {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: var(--radius-card);
    background: var(--surface-2);
    border: 1px solid var(--border);
    font-size: 14px;

    &.ready {
      border-color: rgb(85 205 10 / 0.35);
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
  }

  .hint {
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-faint);
  }

  .actions {
    margin-top: 28px;
    display: flex;
    justify-content: flex-end;
  }
`

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  button {
    all: unset;
    cursor: pointer;
    aspect-ratio: 3 / 4;
    border-radius: var(--radius-card);
    background: var(--surface-2);
    border: 1px solid var(--border);
    display: grid;
    place-items: center;
    transition: border-color 0.15s, background 0.15s, transform 0.15s;

    img {
      width: 60%;
      image-rendering: pixelated;
    }

    &:hover {
      border-color: var(--border-strong);
      transform: translateY(-2px);
    }

    &.selected {
      background: var(--brand-soft);
      border-color: var(--brand);
      box-shadow: 0 0 0 4px rgb(43 127 255 / 0.2);
    }

    &:focus-visible {
      outline: 2px solid var(--brand);
    }
  }
`

const avatars = [
  { name: 'adam', label: 'Adam', img: Adam },
  { name: 'ash', label: 'Ash', img: Ash },
  { name: 'lucy', label: 'Lucy', img: Lucy },
  { name: 'nancy', label: 'Nancy', img: Nancy },
]

function DeviceCard({
  icon,
  name,
  ready,
  readyLabel,
  allowLabel,
  onAllow,
}: {
  icon: React.ReactNode
  name: string
  ready: boolean
  readyLabel: string
  allowLabel: string
  onAllow: () => void
}) {
  return (
    <div className={`device ${ready ? 'ready' : ''}`}>
      <div className="head">
        <div className="name">
          {icon}
          {name}
        </div>
        <StatusPill tone={ready ? 'success' : 'neutral'}>{ready ? readyLabel : 'Desligado'}</StatusPill>
      </div>
      {!ready && (
        <Button variant="outlined" fullWidth onClick={onAllow}>
          {allowLabel}
        </Button>
      )}
    </div>
  )
}

/** Shown after entering a workspace: pick an avatar and allow camera / microphone separately. */
export default function LoginDialog() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const hasCam = useAppSelector((state) => state.user.hasCam)
  const hasMic = useAppSelector((state) => state.user.hasMic)
  const roomName = useAppSelector((state) => state.room.roomName)
  const [avatar, setAvatar] = useState(() => {
    const saved = localStorage.getItem(AVATAR_KEY)
    return avatars.some((a) => a.name === saved) ? saved! : avatars[0].name
  })
  const game = phaserGame.scene.keys.game as Game

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    localStorage.setItem(AVATAR_KEY, avatar)
    game.registerKeys()
    game.myPlayer.setPlayerName(user.name)
    game.myPlayer.setPlayerTexture(avatar)
    game.network.readyToConnect()
    // Calls work even without devices (others are heard/seen); devices can be allowed later.
    game.network.videoConnected()
    dispatch(setLoggedIn(true))
  }

  return (
    <Overlay>
      <Card as="form" onSubmit={handleSubmit}>
        <div className="eyebrow">Entrando em</div>
        <h2>{roomName || 'Workspace'}</h2>
        <Muted>
          Você aparecerá como <strong style={{ color: 'var(--text)' }}>{user?.name}</strong>.
        </Muted>

        <div className="label">Escolha seu personagem</div>
        <AvatarGrid role="radiogroup">
          {avatars.map((a) => (
            <button
              type="button"
              role="radio"
              aria-checked={avatar === a.name}
              aria-label={a.label}
              key={a.name}
              className={avatar === a.name ? 'selected' : ''}
              onClick={() => setAvatar(a.name)}
            >
              <img src={a.img} alt="" />
            </button>
          ))}
        </AvatarGrid>

        <div className="label">Câmera e microfone</div>
        <div className="devices">
          <DeviceCard
            icon={<VideocamOutlinedIcon fontSize="small" />}
            name="Câmera"
            ready={hasCam}
            readyLabel="Pronta"
            allowLabel="Permitir câmera"
            onAllow={() => game.network.webRTC?.enableDevice('video')}
          />
          <DeviceCard
            icon={<MicNoneOutlinedIcon fontSize="small" />}
            name="Microfone"
            ready={hasMic}
            readyLabel="Pronto"
            allowLabel="Permitir microfone"
            onAllow={() => game.network.webRTC?.enableDevice('audio')}
          />
        </div>
        <div className="hint">
          Opcional: você pode entrar sem eles e ativar depois pela barra superior.
        </div>

        <div className="actions">
          <Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
            Entrar no escritório
          </Button>
        </div>
      </Card>
    </Overlay>
  )
}
