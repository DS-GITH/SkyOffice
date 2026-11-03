import React, { useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import KeyboardOutlinedIcon from '@mui/icons-material/KeyboardOutlined'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import LogoutIcon from '@mui/icons-material/Logout'
import FaceRetouchingNaturalOutlinedIcon from '@mui/icons-material/FaceRetouchingNaturalOutlined'
import AvatarDialog from './avatar/AvatarDialog'

import { GlassPanel, InitialsAvatar, Logo, StatusPill, Muted } from './ui/Glass'
import { useAppDispatch, useAppSelector } from '../hooks'
import { toggleBackgroundMode } from '../stores/UserStore'
import { BackgroundMode } from '../../../types/BackgroundMode'
import { logout, switchWorkspace } from '../services/session'
import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const Bar = styled(GlassPanel)`
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  height: var(--topbar-h);
  z-index: 15;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px 0 22px;

  .left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .divider {
    width: 1px;
    height: 24px;
    background: var(--border);
  }

  .workspace {
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  @media (max-width: 640px) {
    .brand,
    .divider {
      display: none;
    }
  }
`

const RoundButton = styled(IconButton)<{ $off?: boolean }>`
  && {
    width: 42px;
    height: 42px;
    border: 1px solid var(--border);
    background: ${(p) => (p.$off ? 'var(--danger-soft)' : 'var(--surface-2)')};
    color: ${(p) => (p.$off ? '#ff8a8d' : 'var(--text)')};
    box-shadow: inset 0 1px 0 var(--glass-edge);

    &:hover {
      background: ${(p) => (p.$off ? 'rgb(233 64 69 / 0.26)' : 'var(--surface-3)')};
    }
  }
`

const Keys = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px 20px;
  align-items: center;
  font-size: 14px;
  padding-top: 4px;

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    margin-right: 4px;
    border-radius: 8px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    box-shadow: inset 0 -2px 0 rgb(255 255 255 / 0.06);
    font-family: var(--font);
    font-size: 12px;
    font-weight: 600;
  }
`

export function ControlsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Controles</DialogTitle>
      <DialogContent>
        <Keys>
          <div>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
          </div>
          <span>Andar (ou as setas)</span>
          <div>
            <kbd>E</kbd>
          </div>
          <span>Sentar / levantar</span>
          <div>
            <kbd>R</kbd>
          </div>
          <span>Usar computador ou quadro</span>
          <div>
            <kbd>Enter</kbd>
          </div>
          <span>Abrir o chat</span>
          <div>
            <kbd>Esc</kbd>
          </div>
          <span>Fechar o chat</span>
        </Keys>
        <Muted style={{ marginTop: 20, fontSize: 13 }}>
          Chegue perto de alguém para abrir áudio e vídeo automaticamente. Um som avisa quando
          vocês entram no alcance.
        </Muted>
      </DialogContent>
    </Dialog>
  )
}

export default function TopBar() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const roomName = useAppSelector((state) => state.room.roomName)
  const onlineCount = useAppSelector((state) => state.room.onlineCount)
  const hasMic = useAppSelector((state) => state.user.hasMic)
  const hasCam = useAppSelector((state) => state.user.hasCam)
  const micOn = useAppSelector((state) => state.user.micOn)
  const camOn = useAppSelector((state) => state.user.camOn)
  const backgroundMode = useAppSelector((state) => state.user.backgroundMode)
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const webRTC = () => (phaserGame.scene.keys.game as Game)?.network?.webRTC

  return (
    <>
      <Bar>
        <div className="left">
          <div className="brand">
            <Logo />
          </div>
          <div className="divider" />
          <div className="workspace">{roomName}</div>
          <StatusPill tone="success">{onlineCount} online</StatusPill>
        </div>

        <div className="right">
          <Tooltip
            title={!hasMic ? 'Permitir microfone' : micOn ? 'Desligar microfone' : 'Ligar microfone'}
          >
            <RoundButton $off={!micOn} onClick={() => webRTC()?.toggleAudio()}>
              {micOn ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
            </RoundButton>
          </Tooltip>
          <Tooltip
            title={!hasCam ? 'Permitir câmera' : camOn ? 'Desligar câmera' : 'Ligar câmera'}
          >
            <RoundButton $off={!camOn} onClick={() => webRTC()?.toggleVideo()}>
              {camOn ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
            </RoundButton>
          </Tooltip>
          <IconButton onClick={(e) => setMenu(e.currentTarget)} sx={{ p: 0.5, ml: 0.5 }}>
            <InitialsAvatar name={user?.name || '?'} size={38} />
          </IconButton>
        </div>
      </Bar>

      <Menu
        anchorEl={menu}
        open={!!menu}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <div style={{ padding: '8px 16px 10px' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
          <Muted style={{ fontSize: 12 }}>{user?.email}</Muted>
        </div>
        <Divider />
        <MenuItem
          onClick={() => {
            setAvatarOpen(true)
            setMenu(null)
          }}
        >
          <ListItemIcon>
            <FaceRetouchingNaturalOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Editar personagem
        </MenuItem>
        <MenuItem
          onClick={() => {
            setControlsOpen(true)
            setMenu(null)
          }}
        >
          <ListItemIcon>
            <KeyboardOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Controles
        </MenuItem>
        <MenuItem onClick={() => dispatch(toggleBackgroundMode())}>
          <ListItemIcon>
            {backgroundMode === BackgroundMode.DAY ? (
              <DarkModeOutlinedIcon fontSize="small" />
            ) : (
              <LightModeOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          {backgroundMode === BackgroundMode.DAY ? 'Céu noturno' : 'Céu diurno'}
        </MenuItem>
        <MenuItem onClick={switchWorkspace}>
          <ListItemIcon>
            <SwapHorizIcon fontSize="small" />
          </ListItemIcon>
          Trocar workspace
        </MenuItem>
        <Divider />
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>

      <ControlsDialog open={controlsOpen} onClose={() => setControlsOpen(false)} />
      <AvatarDialog open={avatarOpen} onClose={() => setAvatarOpen(false)} />
    </>
  )
}
