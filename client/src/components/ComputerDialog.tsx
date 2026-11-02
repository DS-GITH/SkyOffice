import React, { useEffect, useReducer, useRef, useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ComputerIcon from '@mui/icons-material/ComputerOutlined'
import ScreenShareOutlinedIcon from '@mui/icons-material/ScreenShareOutlined'
import StopScreenShareOutlinedIcon from '@mui/icons-material/StopScreenShareOutlined'
import FullscreenIcon from '@mui/icons-material/Fullscreen'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeComputerDialog } from '../stores/ComputerStore'
import { phaserEvents, Event } from '../events/EventCenter'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'
import DialogFrame from './DialogFrame'
import { StatusPill, Muted } from './ui/Glass'
import Video from './Video'

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
`

const Stage = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: var(--radius-card);
  background: #000;
  border: 1px solid var(--border);
  overflow: hidden;

  video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .label {
    position: absolute;
    left: 14px;
    bottom: 14px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgb(0 0 0 / 0.6);
    backdrop-filter: blur(8px);
    font-size: 13px;
    font-weight: 500;
  }

  .fullscreen {
    position: absolute;
    right: 10px;
    bottom: 10px;
    background: rgb(0 0 0 / 0.6);
  }
`

const EmptyStage = styled.div`
  flex: 1;
  border-radius: var(--radius-card);
  border: 1px dashed var(--border-strong);
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 24px;

  .icon {
    width: 64px;
    height: 64px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: var(--brand-soft);
    color: var(--brand-soft-fg);
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`

const Strip = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;

  button {
    all: unset;
    cursor: pointer;
    position: relative;
    flex: none;
    width: 168px;
    aspect-ratio: 16 / 9;
    border-radius: 14px;
    overflow: hidden;
    background: #000;
    border: 1px solid var(--border);

    &.active {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgb(43 127 255 / 0.3);
    }

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      position: absolute;
      left: 6px;
      bottom: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgb(0 0 0 / 0.6);
      font-size: 11px;
    }
  }
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

/** Re-renders when anyone joins/leaves a computer, so the counter stays live. */
function useComputerUsers(computerId: string | null) {
  const [, force] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    phaserEvents.on(Event.ITEM_USER_ADDED, force)
    phaserEvents.on(Event.ITEM_USER_REMOVED, force)
    return () => {
      phaserEvents.off(Event.ITEM_USER_ADDED, force)
      phaserEvents.off(Event.ITEM_USER_REMOVED, force)
    }
  }, [])
  const game = phaserGame.scene.keys.game as Game
  return computerId ? game?.computerMap.get(computerId)?.currentUsers.size ?? 0 : 0
}

export default function ComputerDialog() {
  const dispatch = useAppDispatch()
  const playerNameMap = useAppSelector((state) => state.user.playerNameMap)
  const shareScreenManager = useAppSelector((state) => state.computer.shareScreenManager)
  const computerId = useAppSelector((state) => state.computer.computerId)
  const myStream = useAppSelector((state) => state.computer.myStream)
  const peerStreams = useAppSelector((state) => state.computer.peerStreams)
  const connectedCount = useComputerUsers(computerId)
  const [spotlight, setSpotlight] = useState<string | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  // Everything currently being shared on this computer
  const streams: Array<{ id: string; name: string; stream: MediaStream }> = [
    ...[...peerStreams.entries()].map(([id, { stream }]) => ({
      id,
      name: playerNameMap.get(id) || 'Alguém',
      stream,
    })),
    ...(myStream ? [{ id: 'me', name: 'Sua tela', stream: myStream }] : []),
  ]
  const active = streams.find((s) => s.id === spotlight) || streams[0]

  const toggleShare = () => {
    if (myStream) shareScreenManager?.stopScreenShare()
    else shareScreenManager?.startScreenShare()
  }

  const goFullscreen = () => stageRef.current?.requestFullscreen?.()

  return (
    <DialogFrame
      icon={<ComputerIcon fontSize="small" />}
      title={`Computador ${Number(computerId ?? 0) + 1}`}
      subtitle="Compartilhamento de tela com quem está neste computador"
      extra={
        <StatusPill tone={connectedCount > 1 ? 'success' : 'neutral'}>
          {connectedCount} {connectedCount === 1 ? 'conectado' : 'conectados'}
        </StatusPill>
      }
      onClose={() => dispatch(closeComputerDialog())}
    >
      <Body>
        {active ? (
          <Stage ref={stageRef}>
            <Video srcObject={active.stream} autoPlay muted={active.id === 'me'} playsInline />
            <div className="label">{active.name}</div>
            <Tooltip title="Tela cheia">
              <IconButton className="fullscreen" size="small" onClick={goFullscreen}>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          </Stage>
        ) : (
          <EmptyStage>
            <div className="icon">
              <ScreenShareOutlinedIcon />
            </div>
            <h3>Ninguém está compartilhando ainda</h3>
            <Muted>
              Compartilhe sua tela para quem estiver neste computador, ou aguarde alguém começar.
            </Muted>
          </EmptyStage>
        )}

        {streams.length > 1 && (
          <Strip>
            {streams.map((s) => (
              <button
                key={s.id}
                className={s.id === active?.id ? 'active' : ''}
                onClick={() => setSpotlight(s.id)}
              >
                <Video srcObject={s.stream} autoPlay muted playsInline />
                <span>{s.name}</span>
              </button>
            ))}
          </Strip>
        )}

        <Toolbar>
          <Muted style={{ fontSize: 13 }}>
            {myStream
              ? 'Você está compartilhando sua tela.'
              : `${streams.length} ${streams.length === 1 ? 'tela compartilhada' : 'telas compartilhadas'}`}
          </Muted>
          <Button
            variant="contained"
            color={myStream ? 'error' : 'primary'}
            startIcon={myStream ? <StopScreenShareOutlinedIcon /> : <ScreenShareOutlinedIcon />}
            onClick={toggleShare}
          >
            {myStream ? 'Parar compartilhamento' : 'Compartilhar tela'}
          </Button>
        </Toolbar>
      </Body>
    </DialogFrame>
  )
}
