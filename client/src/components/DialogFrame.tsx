import React from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CloseIcon from '@mui/icons-material/Close'
import { GlassPanel } from './ui/Glass'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 4; /* below the webcam tiles (.video-grid) so they stay visible */
  padding: 16px;
  background: rgb(3 4 7 / 0.55);
  backdrop-filter: blur(6px);

  @media (min-width: 900px) {
    padding-right: 200px; /* room for the webcam column */
  }
`

const Panel = styled(GlassPanel)`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: pop 0.18s ease-out;

  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.985);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
`

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 14px 14px 20px;
  border-bottom: 1px solid var(--border);

  .icon {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: var(--brand-soft);
    color: var(--brand-soft-fg);
    box-shadow: inset 0 1px 0 var(--glass-edge);
  }

  .titles {
    flex: 1;
    min-width: 0;

    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    small {
      color: var(--text-faint);
      font-size: 12px;
    }
  }

  .extra {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

interface Props {
  icon: React.ReactNode
  title: string
  subtitle?: string
  extra?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
}

/** Shared full-screen frame for the computer (screen share) and whiteboard dialogs. */
export default function DialogFrame({ icon, title, subtitle, extra, onClose, children }: Props) {
  return (
    <Backdrop>
      <Panel>
        <Header>
          <div className="icon">{icon}</div>
          <div className="titles">
            <h2>{title}</h2>
            {subtitle && <small>{subtitle}</small>}
          </div>
          <div className="extra">
            {extra}
            <Tooltip title="Fechar">
              <IconButton aria-label="Fechar" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </div>
        </Header>
        {children}
      </Panel>
    </Backdrop>
  )
}
