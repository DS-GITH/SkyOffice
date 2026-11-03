import React, { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import AvatarEditor from './AvatarEditor'
import { ErrorText } from '../ui/Glass'
import { AvatarConfig, decodeAvatar, DEFAULT_AVATAR, encodeAvatar } from '../../avatar/options'
import { ensureAvatarTexture } from '../../avatar/phaser'
import { api } from '../../services/api'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { userUpdated } from '../../stores/AuthStore'
import phaserGame from '../../PhaserGame'
import Game from '../../scenes/Game'

/** Edit the character while in the office; the new look shows up for everyone right away. */
export default function AvatarDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAvatar(decodeAvatar(user?.avatar) || DEFAULT_AVATAR)
    setError('')
    // arrow keys must not move the character while the editor is open
    const game = phaserGame.scene.keys.game as Game
    game?.disableKeys()
    return () => game?.enableKeys()
  }, [open, user?.avatar])

  const save = async () => {
    const code = encodeAvatar(avatar)
    setSaving(true)
    setError('')
    try {
      const { user: updated } = await api.saveAvatar(code)
      dispatch(userUpdated(updated))
      const game = phaserGame.scene.keys.game as Game
      const texture = ensureAvatarTexture(game, code)
      if (texture) game.myPlayer.setPlayerTexture(texture)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar o personagem')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Editar personagem</DialogTitle>
      <DialogContent>
        <AvatarEditor value={avatar} onChange={setAvatar} />
        {error && (
          <div style={{ marginTop: 16 }}>
            <ErrorText>{error}</ErrorText>
          </div>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Salvar personagem'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
