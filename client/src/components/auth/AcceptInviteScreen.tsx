import React, { useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import AuthLayout, { Form } from './AuthLayout'
import { ErrorText, StatusPill } from '../ui/Glass'
import { api, setToken } from '../../services/api'
import { useAppDispatch } from '../../hooks'
import { signedIn } from '../../stores/AuthStore'

export default function AcceptInviteScreen({
  token,
  onAccepted,
}: {
  token: string
  onAccepted: () => void
}) {
  const dispatch = useAppDispatch()
  const [info, setInfo] = useState<{ email: string; workspaces: string[] } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api
      .inviteInfo(token)
      .then(setInfo)
      .catch((err) => setLoadError(err.message))
  }, [token])

  const goToLogin = () => {
    window.history.replaceState(null, '', '/')
    window.location.reload()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres')
    if (password !== confirm) return setError('As senhas não conferem')
    setLoading(true)
    try {
      const result = await api.acceptInvite(token, name, password)
      setToken(result.token)
      window.history.replaceState(null, '', '/')
      dispatch(signedIn(result.user))
      onAccepted()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loadError) {
    return (
      <AuthLayout title="Convite indisponível" subtitle={loadError}>
        <Button variant="outlined" onClick={goToLogin}>
          Ir para o login
        </Button>
      </AuthLayout>
    )
  }

  if (!info) {
    return (
      <AuthLayout title="Abrindo convite…" subtitle="Só um instante.">
        <CircularProgress size={24} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Você foi convidado"
      subtitle={
        <>
          Crie sua conta para entrar no escritório virtual da Xpert Dev.
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {info.workspaces.map((w) => (
              <StatusPill key={w} tone="brand">
                {w}
              </StatusPill>
            ))}
          </span>
        </>
      }
    >
      <Form onSubmit={handleSubmit}>
        <TextField label="E-mail" value={info.email} disabled fullWidth />
        <TextField
          label="Seu nome"
          helperText="É assim que o time vai te ver no escritório"
          autoFocus
          required
          fullWidth
          inputProps={{ maxLength: 40 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          helperText="Mínimo de 8 caracteres"
          required
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          required
          fullWidth
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" variant="contained" size="large" disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Criar conta e entrar'}
        </Button>
      </Form>
    </AuthLayout>
  )
}
