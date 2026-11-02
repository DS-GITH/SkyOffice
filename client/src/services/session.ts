import { clearToken } from './api'
import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'

function leaveRoom() {
  const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap | undefined
  bootstrap?.network?.leave()
}

/** Leaves the current workspace and goes back to the workspace list (full reset of the game). */
export function switchWorkspace() {
  leaveRoom()
  window.location.assign('/')
}

export function logout() {
  leaveRoom()
  clearToken()
  window.location.assign('/')
}
