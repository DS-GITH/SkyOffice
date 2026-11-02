import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'

import { api, AdminUser, Workspace } from '../../services/api'
import { ErrorText, InitialsAvatar, Muted } from '../ui/Glass'

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 6px;
`

const CheckList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 280px;
  overflow-y: auto;

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px 6px 4px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: var(--surface-2);
    }

    small {
      display: block;
      color: var(--text-faint);
      font-size: 12px;
    }
  }
`

const LinkBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface-2);

  code {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--brand-soft-fg);
  }
`

const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
`

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <LinkBox>
      <code title={url}>{url}</code>
      <Button
        size="small"
        variant="contained"
        onClick={copy}
        startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
        sx={{ height: 32, flex: 'none' }}
      >
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </LinkBox>
  )
}

interface DialogProps {
  open: boolean
  onClose: () => void
}

export function CreateWorkspaceDialog({
  open,
  onClose,
  onCreated,
}: DialogProps & { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.createWorkspace(name, description)
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Novo workspace</DialogTitle>
        <DialogContent>
          <Stack>
            <TextField
              label="Nome"
              placeholder="Ex.: Escritório Principal"
              autoFocus
              required
              fullWidth
              inputProps={{ maxLength: 60 }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Descrição (opcional)"
              multiline
              rows={3}
              fullWidth
              inputProps={{ maxLength: 280 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {error && <ErrorText>{error}</ErrorText>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Criar workspace'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export function InviteDialog({
  open,
  onClose,
  onInvited,
  workspaces,
  initialEmail = '',
  initialWorkspaceIds = [],
}: DialogProps & {
  onInvited: () => void
  workspaces: Workspace[]
  initialEmail?: string
  initialWorkspaceIds?: string[]
}) {
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail(initialEmail)
      setSelected(
        initialWorkspaceIds.length
          ? initialWorkspaceIds
          : workspaces.length === 1
          ? [workspaces[0].id]
          : []
      )
      setLink('')
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { path } = await api.createInvite(email, selected)
      setLink(`${window.location.origin}${path}`)
      onInvited()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {link ? (
        <>
          <DialogTitle>Convite criado</DialogTitle>
          <DialogContent>
            <Stack>
              <Muted>
                Envie este link para <strong>{email}</strong>. Ele vale por 7 dias e só pode ser
                usado uma vez. Por segurança, ele não fica salvo: copie agora.
              </Muted>
              <CopyLink url={link} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="contained" onClick={onClose}>
              Concluir
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <DialogTitle>Convidar pessoa</DialogTitle>
          <DialogContent>
            <Stack>
              <TextField
                label="E-mail"
                type="email"
                autoFocus
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <SectionLabel>Workspaces que a pessoa poderá acessar</SectionLabel>
              {workspaces.length === 0 ? (
                <Muted>Crie um workspace primeiro.</Muted>
              ) : (
                <CheckList>
                  {workspaces.map((w) => (
                    <label key={w.id}>
                      <Checkbox
                        size="small"
                        checked={selected.includes(w.id)}
                        onChange={() => toggle(w.id)}
                      />
                      <div>
                        {w.name}
                        {w.description && <small>{w.description}</small>}
                      </div>
                    </label>
                  ))}
                </CheckList>
              )}
              {error && <ErrorText>{error}</ErrorText>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="outlined" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || selected.length === 0}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : 'Gerar link de convite'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  )
}

export function MembersDialog({
  open,
  onClose,
  onSaved,
  workspace,
  users,
}: DialogProps & { onSaved: () => void; workspace: Workspace | null; users: AdminUser[] }) {
  const members = users.filter((u) => u.role !== 'admin')
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && workspace) {
      setSelected(workspace.member_ids || [])
      setError('')
    }
  }, [open, workspace])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const save = async () => {
    if (!workspace) return
    setLoading(true)
    setError('')
    try {
      await api.setWorkspaceMembers(workspace.id, selected)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Membros · {workspace?.name}</DialogTitle>
      <DialogContent>
        <Stack>
          <Muted>Quem pode entrar neste workspace. O admin sempre tem acesso.</Muted>
          {members.length === 0 ? (
            <Muted>Ninguém foi convidado ainda.</Muted>
          ) : (
            <CheckList>
              {members.map((u) => (
                <label key={u.id}>
                  <Checkbox
                    size="small"
                    checked={selected.includes(u.id)}
                    onChange={() => toggle(u.id)}
                  />
                  <InitialsAvatar name={u.name} size={28} />
                  <div>
                    {u.name}
                    <small>{u.email}</small>
                  </div>
                </label>
              ))}
            </CheckList>
          )}
          {error && <ErrorText>{error}</ErrorText>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={save} disabled={loading}>
          {loading ? <CircularProgress size={18} color="inherit" /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
}: DialogProps & { onConfirm: () => void; title: string; message: string; confirmLabel: string }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Muted>{message}</Muted>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
