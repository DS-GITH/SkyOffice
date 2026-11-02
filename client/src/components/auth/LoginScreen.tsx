import React, { useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import AuthLayout, { Form } from './AuthLayout'
import { ErrorText } from '../ui/Glass'
import { api, setToken } from '../../services/api'
import { useAppDispatch } from '../../hooks'
import { signedIn } from '../../stores/AuthStore'

export default function LoginScreen() {
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await api.login(email, password)
      setToken(token)
      dispatch(signedIn(user))
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse o escritório virtual da Xpert Dev com a conta que você recebeu por convite."
    >
      <Form onSubmit={handleSubmit}>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          autoFocus
          required
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" variant="contained" size="large" disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Entrar'}
        </Button>
      </Form>
    </AuthLayout>
  )
}
