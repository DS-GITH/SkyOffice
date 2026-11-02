import React from 'react'
import styled from 'styled-components'
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined'

import { useAppSelector, useAppDispatch } from '../hooks'
import { closeWhiteboardDialog } from '../stores/WhiteboardStore'
import DialogFrame from './DialogFrame'

const Board = styled.div`
  flex: 1;
  min-height: 0;
  margin: 16px;
  border-radius: var(--radius-card);
  overflow: hidden;
  border: 1px solid var(--border);

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    background: #fff;
  }
`

export default function WhiteboardDialog() {
  const whiteboardUrl = useAppSelector((state) => state.whiteboard.whiteboardUrl)
  const whiteboardId = useAppSelector((state) => state.whiteboard.whiteboardId)
  const dispatch = useAppDispatch()

  return (
    <DialogFrame
      icon={<BrushOutlinedIcon fontSize="small" />}
      title={`Quadro ${Number(whiteboardId ?? 0) + 1}`}
      subtitle="Quadro colaborativo — todos neste quadro veem as mudanças ao vivo"
      onClose={() => dispatch(closeWhiteboardDialog())}
    >
      {whiteboardUrl && (
        <Board>
          <iframe title="Quadro" src={whiteboardUrl} />
        </Board>
      )}
    </DialogFrame>
  )
}
