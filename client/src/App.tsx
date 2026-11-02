import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import CircularProgress from '@mui/material/CircularProgress'

import { useAppDispatch, useAppSelector } from './hooks'
import { api, clearToken, getToken } from './services/api'
import { signedIn, signedOut } from './stores/AuthStore'

import LoginScreen from './components/auth/LoginScreen'
import AcceptInviteScreen from './components/auth/AcceptInviteScreen'
import WorkspaceHome from './components/home/WorkspaceHome'
import LoginDialog from './components/LoginDialog'
import ComputerDialog from './components/ComputerDialog'
import WhiteboardDialog from './components/WhiteboardDialog'
import Chat from './components/Chat'
import TopBar from './components/TopBar'
import MobileVirtualJoystick from './components/MobileVirtualJoystick'
import { Scene } from './components/ui/Glass'

const Backdrop = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
`

const Center = styled(Scene)`
  display: grid;
  place-items: center;
`

const initialInviteToken = window.location.pathname.match(/^\/convite\/([\w-]+)/)?.[1] || null

function App() {
  const dispatch = useAppDispatch()
  const [inviteToken, setInviteToken] = useState(initialInviteToken)
  const authStatus = useAppSelector((state) => state.auth.status)
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const computerDialogOpen = useAppSelector((state) => state.computer.computerDialogOpen)
  const whiteboardDialogOpen = useAppSelector((state) => state.whiteboard.whiteboardDialogOpen)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)

  // Validate a saved session on page load
  useEffect(() => {
    if (!getToken()) {
      dispatch(signedOut())
      return
    }
    api
      .me()
      .then(({ user }) => dispatch(signedIn(user)))
      .catch(() => {
        clearToken()
        dispatch(signedOut())
      })
  }, [dispatch])

  let ui: JSX.Element
  if (inviteToken && !roomJoined) {
    ui = <AcceptInviteScreen token={inviteToken} onAccepted={() => setInviteToken(null)} />
  } else if (authStatus === 'checking') {
    ui = (
      <Center>
        <CircularProgress size={28} />
      </Center>
    )
  } else if (authStatus === 'signedOut') {
    ui = <LoginScreen />
  } else if (!roomJoined) {
    ui = <WorkspaceHome />
  } else if (!loggedIn) {
    /* Entered a workspace: pick an avatar */
    ui = <LoginDialog />
  } else if (computerDialogOpen) {
    ui = <ComputerDialog />
  } else if (whiteboardDialogOpen) {
    ui = <WhiteboardDialog />
  } else {
    ui = (
      <>
        <TopBar />
        <Chat />
        <MobileVirtualJoystick />
      </>
    )
  }

  return <Backdrop>{ui}</Backdrop>
}

export default App
