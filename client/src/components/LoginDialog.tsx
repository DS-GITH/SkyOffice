import React, { useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined'
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

import { useAppSelector, useAppDispatch } from '../hooks'
import { setLoggedIn } from '../stores/UserStore'
import { userUpdated } from '../stores/AuthStore'
import { GlassPanel, Muted, StatusPill, ErrorText } from './ui/Glass'
import AvatarEditor from './avatar/AvatarEditor'
import { AvatarConfig, decodeAvatar, DEFAULT_AVATAR, encodeAvatar, randomAvatar } from '../avatar/options'
import { ensureAvatarTexture } from '../avatar/phaser'
import { api } from '../services/api'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

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
  max-width: 880px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 28px 32px;

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
    margin: 22px 0 12px;
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

/** Shown after entering a workspace: create/adjust the character and allow camera / microphone. */
export default function LoginDialog() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const hasCam = useAppSelector((state) => state.user.hasCam)
  const hasMic = useAppSelector((state) => state.user.hasMic)
  const roomName = useAppSelector((state) => state.room.roomName)
  // Saved character, or a random one the first time
  const [avatar, setAvatar] = useState<AvatarConfig>(
    () => decodeAvatar(user?.avatar) || (user?.avatar === null ? randomAvatar() : DEFAULT_AVATAR)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const game = phaserGame.scene.keys.game as Game

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || saving) return
    const code = encodeAvatar(avatar)
    if (code !== user.avatar) {
      setSaving(true)
      setError('')
      try {
        const { user: updated } = await api.saveAvatar(code)
        dispatch(userUpdated(updated))
      } catch (err: any) {
        setSaving(false)
        setError(err.message || 'Não foi possível salvar o personagem')
        return
      }
    }
    const texture = ensureAvatarTexture(game, code)
    game.registerKeys()
    game.myPlayer.setPlayerName(user.name)
    if (texture) game.myPlayer.setPlayerTexture(texture)
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

        <div className="label">Seu personagem</div>
        <AvatarEditor value={avatar} onChange={setAvatar} />

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

        {error && (
          <div style={{ marginTop: 16 }}>
            <ErrorText>{error}</ErrorText>
          </div>
        )}

        <div className="actions">
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            endIcon={saving ? undefined : <ArrowForwardIcon />}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Entrar no escritório'}
          </Button>
        </div>
      </Card>
    </Overlay>
  )
}
