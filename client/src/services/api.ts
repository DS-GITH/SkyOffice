const TOKEN_KEY = 'xpert-office-token'

/** In dev the API runs on the Colyseus server (:2567); in production it's the same origin. */
export const SERVER_HTTP_URL =
  process.env.NODE_ENV === 'production'
    ? import.meta.env.VITE_SERVER_URL?.replace(/^ws/, 'http') || window.location.origin
    : `${window.location.protocol}//${window.location.hostname}:2567`

export const SERVER_WS_URL = SERVER_HTTP_URL.replace(/^http/, 'ws')

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export type Role = 'admin' | 'member'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

export interface Workspace {
  id: string
  name: string
  description: string
  online: number
  member_ids?: string[]
}

export interface AdminUser extends User {
  workspace_ids: string[]
}

export interface Invite {
  id: string
  email: string
  workspace_ids: string[]
  expires_at: string
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${SERVER_HTTP_URL}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).catch(() => {
    throw new ApiError('Não foi possível falar com o servidor', 0)
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'Algo deu errado', res.status)
  return data as T
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/auth/login', { email, password }),
  me: () => request<{ user: User }>('GET', '/auth/me'),

  workspaces: () => request<{ workspaces: Workspace[] }>('GET', '/workspaces'),
  createWorkspace: (name: string, description: string) =>
    request<{ workspace: Workspace }>('POST', '/workspaces', { name, description }),
  deleteWorkspace: (id: string) => request<void>('DELETE', `/workspaces/${id}`),
  setWorkspaceMembers: (id: string, userIds: string[]) =>
    request<void>('PUT', `/workspaces/${id}/members`, { userIds }),

  users: () => request<{ users: AdminUser[] }>('GET', '/users'),
  deleteUser: (id: string) => request<void>('DELETE', `/users/${id}`),

  invites: () => request<{ invites: Invite[] }>('GET', '/invites'),
  createInvite: (email: string, workspaceIds: string[]) =>
    request<{ invite: Invite; path: string }>('POST', '/invites', { email, workspaceIds }),
  deleteInvite: (id: string) => request<void>('DELETE', `/invites/${id}`),
  inviteInfo: (token: string) =>
    request<{ email: string; workspaces: string[] }>('GET', `/invites/token/${token}`),
  acceptInvite: (token: string, name: string, password: string) =>
    request<{ token: string; user: User }>('POST', `/invites/token/${token}/accept`, {
      name,
      password,
    }),
}
