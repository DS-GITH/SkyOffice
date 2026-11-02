import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined'
import ReplayIcon from '@mui/icons-material/Replay'

import { Scene, Logo, GlassCard, GlassPanel, InitialsAvatar, StatusPill, Muted, ErrorText } from '../ui/Glass'
import {
  CreateWorkspaceDialog,
  InviteDialog,
  MembersDialog,
  ConfirmDialog,
} from './AdminDialogs'
import { api, AdminUser, Invite, Workspace } from '../../services/api'
import { useAppSelector } from '../../hooks'
import { logout } from '../../services/session'
import phaserGame from '../../PhaserGame'
import Bootstrap from '../../scenes/Bootstrap'

const Page = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 12px 20px 48px;
`

const TopBar = styled(GlassPanel)`
  height: 64px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 22px;
  margin-bottom: 40px;

  .user {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;

    .role {
      color: var(--text-faint);
      font-size: 12px;
    }
  }
`

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  h1 {
    margin: 0 0 6px;
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .actions {
    display: flex;
    gap: 10px;
  }
`

const Tabs = styled.div`
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 20px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);

  button {
    all: unset;
    cursor: pointer;
    height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    font-size: 14px;
    color: var(--text-muted);

    &.active {
      background: var(--nav-active);
      color: var(--text);
      font-weight: 600;
      box-shadow: inset 0 1px 0 var(--glass-edge);
    }
  }
`

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`

const WorkspaceCard = styled(GlassCard)`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 200px;
  transition: border-color 0.15s, transform 0.15s;

  &:hover {
    border-color: var(--border-strong);
    transform: translateY(-2px);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chip {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: var(--brand-soft);
    color: var(--brand-soft-fg);
    box-shadow: inset 0 1px 0 var(--glass-edge);
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  p {
    margin: 4px 0 0;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.5;
    flex: 1;
  }

  .bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
  }
`

const Empty = styled(GlassCard)`
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

const Table = styled(GlassCard)`
  overflow: hidden;
  margin-bottom: 24px;

  .title {
    padding: 18px 20px;
    font-weight: 600;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(200px, 1.3fr) minmax(0, 2fr) auto;
    gap: 16px;
    align-items: center;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    font-size: 14px;

    &:last-child {
      border-bottom: none;
    }
  }

  .person {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;

    small {
      display: block;
      color: var(--text-faint);
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
`

function useAdminData(isAdmin: boolean) {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [{ workspaces }, extra] = await Promise.all([
        api.workspaces(),
        isAdmin ? Promise.all([api.users(), api.invites()]) : Promise.resolve(null),
      ])
      setWorkspaces(workspaces)
      if (extra) {
        setUsers(extra[0].users)
        setInvites(extra[1].invites)
      }
      setError('')
    } catch (err: any) {
      if (err.status === 401) return logout()
      setError(err.message)
    }
  }, [isAdmin])

  useEffect(() => {
    reload()
    // keep the online counters fresh
    const id = window.setInterval(reload, 15000)
    return () => window.clearInterval(id)
  }, [reload])

  return { workspaces, users, invites, error, reload }
}

export default function WorkspaceHome() {
  const user = useAppSelector((state) => state.auth.user)!
  const isAdmin = user.role === 'admin'
  const { workspaces, users, invites, error, reload } = useAdminData(isAdmin)

  const [tab, setTab] = useState<'workspaces' | 'people'>('workspaces')
  const [joining, setJoining] = useState<string | null>(null)
  const [joinError, setJoinError] = useState('')
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null)
  const [cardMenu, setCardMenu] = useState<{ el: HTMLElement; ws: Workspace } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [invite, setInvite] = useState<{ email?: string; workspaceIds?: string[] } | null>(null)
  const [membersOf, setMembersOf] = useState<Workspace | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    message: string
    label: string
    action: () => Promise<void>
  } | null>(null)

  const firstName = user.name.split(' ')[0]
  const workspaceName = (id: string) => workspaces?.find((w) => w.id === id)?.name || '—'

  const enter = async (ws: Workspace) => {
    setJoining(ws.id)
    setJoinError('')
    try {
      const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
      await bootstrap.enterWorkspace(ws.id)
    } catch (err: any) {
      setJoinError(err?.message || 'Não foi possível entrar no workspace')
      setJoining(null)
    }
  }

  const runConfirmed = (title: string, message: string, label: string, action: () => Promise<void>) =>
    setConfirm({ title, message, label, action })

  return (
    <Scene>
      <Page>
        <TopBar>
          <Logo />
          <div className="user">
            <div style={{ textAlign: 'right' }}>
              <div>{user.name}</div>
              <div className="role">{isAdmin ? 'Administrador' : user.email}</div>
            </div>
            <IconButton onClick={(e) => setUserMenu(e.currentTarget)} sx={{ p: 0.5 }}>
              <InitialsAvatar name={user.name} size={36} />
            </IconButton>
          </div>
        </TopBar>
        <Menu anchorEl={userMenu} open={!!userMenu} onClose={() => setUserMenu(null)}>
          <MenuItem onClick={logout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </Menu>

        <Header>
          <div>
            <h1>Olá, {firstName}</h1>
            <Muted>
              {isAdmin
                ? 'Gerencie os workspaces e quem tem acesso a cada um.'
                : 'Escolha um workspace para entrar.'}
            </Muted>
          </div>
          {isAdmin && (
            <div className="actions">
              <Button
                variant="outlined"
                startIcon={<PersonAddAlt1Icon />}
                onClick={() => setInvite({})}
              >
                Convidar pessoa
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                Novo workspace
              </Button>
            </div>
          )}
        </Header>

        {isAdmin && (
          <Tabs>
            <button
              className={tab === 'workspaces' ? 'active' : ''}
              onClick={() => setTab('workspaces')}
            >
              Workspaces
            </button>
            <button className={tab === 'people' ? 'active' : ''} onClick={() => setTab('people')}>
              Pessoas
            </button>
          </Tabs>
        )}

        {(error || joinError) && (
          <div style={{ marginBottom: 16 }}>
            <ErrorText>{joinError || error}</ErrorText>
          </div>
        )}

        {!workspaces ? (
          <CircularProgress size={28} />
        ) : tab === 'workspaces' ? (
          workspaces.length === 0 ? (
            <Empty>
              <MeetingRoomOutlinedIcon sx={{ fontSize: 40, color: 'var(--brand-soft-fg)' }} />
              <h3 style={{ margin: 0 }}>Nenhum workspace ainda</h3>
              <Muted>
                {isAdmin
                  ? 'Crie o primeiro escritório e convide o time.'
                  : 'Você ainda não foi adicionado a nenhum workspace. Fale com o administrador.'}
              </Muted>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateOpen(true)}
                >
                  Novo workspace
                </Button>
              )}
            </Empty>
          ) : (
            <CardGrid>
              {workspaces.map((ws) => (
                <WorkspaceCard key={ws.id}>
                  <div className="top">
                    <div className="chip">
                      <MeetingRoomOutlinedIcon fontSize="small" />
                    </div>
                    {isAdmin && (
                      <IconButton
                        size="small"
                        onClick={(e) => setCardMenu({ el: e.currentTarget, ws })}
                      >
                        <MoreHorizIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
                  <div>
                    <h3>{ws.name}</h3>
                    {ws.description && <p>{ws.description}</p>}
                  </div>
                  <div className="bottom">
                    <StatusPill tone={ws.online > 0 ? 'success' : 'neutral'}>
                      {ws.online > 0 ? `${ws.online} online` : 'Vazio agora'}
                    </StatusPill>
                    <Button
                      variant="contained"
                      endIcon={joining === ws.id ? undefined : <ArrowForwardIcon />}
                      disabled={!!joining}
                      onClick={() => enter(ws)}
                    >
                      {joining === ws.id ? <CircularProgress size={18} color="inherit" /> : 'Entrar'}
                    </Button>
                  </div>
                </WorkspaceCard>
              ))}
            </CardGrid>
          )
        ) : (
          <>
            <Table>
              <div className="title">
                Pessoas
                <Muted>{users.length} contas</Muted>
              </div>
              {users.map((u) => (
                <div className="row" key={u.id}>
                  <div className="person">
                    <InitialsAvatar name={u.name} size={36} />
                    <div style={{ minWidth: 0 }}>
                      {u.name}
                      <small>{u.email}</small>
                    </div>
                  </div>
                  <div className="chips">
                    {u.role === 'admin' ? (
                      <StatusPill tone="brand">Administrador · acesso total</StatusPill>
                    ) : u.workspace_ids.length ? (
                      u.workspace_ids.map((id) => (
                        <StatusPill key={id}>{workspaceName(id)}</StatusPill>
                      ))
                    ) : (
                      <StatusPill>Sem workspace</StatusPill>
                    )}
                  </div>
                  {u.role !== 'admin' ? (
                    <Tooltip title="Remover conta">
                      <IconButton
                        size="small"
                        onClick={() =>
                          runConfirmed(
                            'Remover conta',
                            `${u.name} perderá o acesso a todos os workspaces.`,
                            'Remover',
                            () => api.deleteUser(u.id)
                          )
                        }
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </Table>

            <Table>
              <div className="title">
                Convites pendentes
                <Muted>{invites.length}</Muted>
              </div>
              {invites.length === 0 && (
                <div className="row">
                  <Muted>Nenhum convite pendente.</Muted>
                </div>
              )}
              {invites.map((inv) => (
                <div className="row" key={inv.id}>
                  <div className="person">
                    <InitialsAvatar name={inv.email} size={36} />
                    <div style={{ minWidth: 0 }}>
                      {inv.email}
                      <small>
                        expira em {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                      </small>
                    </div>
                  </div>
                  <div className="chips">
                    {inv.workspace_ids.map((id) => (
                      <StatusPill key={id}>{workspaceName(id)}</StatusPill>
                    ))}
                  </div>
                  <div style={{ display: 'flex' }}>
                    <Tooltip title="Gerar novo link">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setInvite({ email: inv.email, workspaceIds: inv.workspace_ids })
                        }
                      >
                        <ReplayIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Revogar convite">
                      <IconButton
                        size="small"
                        onClick={() => api.deleteInvite(inv.id).then(reload)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </Table>
          </>
        )}
      </Page>

      <Menu anchorEl={cardMenu?.el} open={!!cardMenu} onClose={() => setCardMenu(null)}>
        <MenuItem
          onClick={() => {
            setMembersOf(cardMenu!.ws)
            setCardMenu(null)
          }}
        >
          <ListItemIcon>
            <GroupOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Gerenciar membros
        </MenuItem>
        <MenuItem
          onClick={() => {
            setInvite({ workspaceIds: [cardMenu!.ws.id] })
            setCardMenu(null)
          }}
        >
          <ListItemIcon>
            <PersonAddAlt1Icon fontSize="small" />
          </ListItemIcon>
          Convidar para este workspace
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            const ws = cardMenu!.ws
            setCardMenu(null)
            runConfirmed(
              'Excluir workspace',
              `"${ws.name}" será excluído e ninguém mais conseguirá entrar nele.`,
              'Excluir',
              () => api.deleteWorkspace(ws.id)
            )
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          Excluir workspace
        </MenuItem>
      </Menu>

      <CreateWorkspaceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={reload}
      />
      <InviteDialog
        open={!!invite}
        onClose={() => setInvite(null)}
        onInvited={reload}
        workspaces={workspaces || []}
        initialEmail={invite?.email}
        initialWorkspaceIds={invite?.workspaceIds}
      />
      <MembersDialog
        open={!!membersOf}
        onClose={() => setMembersOf(null)}
        onSaved={reload}
        workspace={membersOf}
        users={users}
      />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.label || ''}
        onConfirm={() => {
          confirm?.action().then(reload, (err) => alert(err.message))
        }}
      />
    </Scene>
  )
}
