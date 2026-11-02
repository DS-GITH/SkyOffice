import { Room, Client, ServerError } from 'colyseus'
import { Dispatcher } from '@colyseus/command'
import { Player, OfficeState, Computer, Whiteboard } from './schema/OfficeState'
import { Message } from '../../types/Messages'
import { IJoinOptions } from '../../types/Rooms'
import { AuthUser, canAccessWorkspace, verifyToken } from '../auth/jwt'
import { query } from '../db/pool'
import { whiteboardRoomIds } from './schema/OfficeState'
import PlayerUpdateCommand from './commands/PlayerUpdateCommand'
import {
  ComputerAddUserCommand,
  ComputerRemoveUserCommand,
} from './commands/ComputerUpdateArrayCommand'
import {
  WhiteboardAddUserCommand,
  WhiteboardRemoveUserCommand,
} from './commands/WhiteboardUpdateArrayCommand'
import ChatMessageUpdateCommand from './commands/ChatMessageUpdateCommand'

export class SkyOffice extends Room<OfficeState> {
  private dispatcher = new Dispatcher(this)
  private workspaceId: string
  private name = ''
  private description = ''
  private pendingNames = new Map<string, string>()

  async onCreate(options: IJoinOptions) {
    // One room per workspace (see filterBy in server/index.ts); it closes when empty.
    this.workspaceId = options?.workspaceId
    const rows = /^[0-9a-f-]{36}$/i.test(this.workspaceId || '')
      ? await query<{ name: string; description: string }>(
          'SELECT name, description FROM workspaces WHERE id = $1',
          [this.workspaceId]
        )
      : []
    if (!rows[0]) throw new ServerError(404, 'Workspace não encontrado')
    this.name = rows[0].name
    this.description = rows[0].description
    this.setMetadata({ workspaceId: this.workspaceId, name: this.name })

    this.setState(new OfficeState())

    // HARD-CODED: Add 5 computers in a room
    for (let i = 0; i < 5; i++) {
      this.state.computers.set(String(i), new Computer())
    }

    // HARD-CODED: Add 3 whiteboards in a room
    for (let i = 0; i < 3; i++) {
      this.state.whiteboards.set(String(i), new Whiteboard())
    }

    // when a player connect to a computer, add to the computer connectedUser array
    this.onMessage(Message.CONNECT_TO_COMPUTER, (client, message: { computerId: string }) => {
      this.dispatcher.dispatch(new ComputerAddUserCommand(), {
        client,
        computerId: message.computerId,
      })
    })

    // when a player disconnect from a computer, remove from the computer connectedUser array
    this.onMessage(Message.DISCONNECT_FROM_COMPUTER, (client, message: { computerId: string }) => {
      this.dispatcher.dispatch(new ComputerRemoveUserCommand(), {
        client,
        computerId: message.computerId,
      })
    })

    // when a player stop sharing screen
    this.onMessage(Message.STOP_SCREEN_SHARE, (client, message: { computerId: string }) => {
      const computer = this.state.computers.get(message.computerId)
      computer.connectedUser.forEach((id) => {
        this.clients.forEach((cli) => {
          if (cli.sessionId === id && cli.sessionId !== client.sessionId) {
            cli.send(Message.STOP_SCREEN_SHARE, client.sessionId)
          }
        })
      })
    })

    // when a player connect to a whiteboard, add to the whiteboard connectedUser array
    this.onMessage(Message.CONNECT_TO_WHITEBOARD, (client, message: { whiteboardId: string }) => {
      this.dispatcher.dispatch(new WhiteboardAddUserCommand(), {
        client,
        whiteboardId: message.whiteboardId,
      })
    })

    // when a player disconnect from a whiteboard, remove from the whiteboard connectedUser array
    this.onMessage(
      Message.DISCONNECT_FROM_WHITEBOARD,
      (client, message: { whiteboardId: string }) => {
        this.dispatcher.dispatch(new WhiteboardRemoveUserCommand(), {
          client,
          whiteboardId: message.whiteboardId,
        })
      }
    )

    // when receiving updatePlayer message, call the PlayerUpdateCommand
    this.onMessage(
      Message.UPDATE_PLAYER,
      (client, message: { x: number; y: number; anim: string }) => {
        this.dispatcher.dispatch(new PlayerUpdateCommand(), {
          client,
          x: message.x,
          y: message.y,
          anim: message.anim,
        })
      }
    )

    // when a player finished picking an avatar: reveal their account name and mark ready
    this.onMessage(Message.READY_TO_CONNECT, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (!player) return
      const name = this.pendingNames.get(client.sessionId)
      if (name) {
        player.name = name
        this.pendingNames.delete(client.sessionId)
      }
      player.readyToConnect = true
    })

    // when a player is ready to connect, call the PlayerReadyToConnectCommand
    this.onMessage(Message.VIDEO_CONNECTED, (client) => {
      const player = this.state.players.get(client.sessionId)
      if (player) player.videoConnected = true
    })

    // when a player disconnect a stream, broadcast the signal to the other player connected to the stream
    this.onMessage(Message.DISCONNECT_STREAM, (client, message: { clientId: string }) => {
      this.clients.forEach((cli) => {
        if (cli.sessionId === message.clientId) {
          cli.send(Message.DISCONNECT_STREAM, client.sessionId)
        }
      })
    })

    // when a player send a chat message, update the message array and broadcast to all connected clients except the sender
    this.onMessage(Message.ADD_CHAT_MESSAGE, (client, message: { content: string }) => {
      // update the message array (so that players join later can also see the message)
      this.dispatcher.dispatch(new ChatMessageUpdateCommand(), {
        client,
        content: message.content,
      })

      // broadcast to all currently connected clients except the sender (to render in-game dialog on top of the character)
      this.broadcast(
        Message.ADD_CHAT_MESSAGE,
        { clientId: client.sessionId, content: message.content },
        { except: client }
      )
    })
  }

  async onAuth(client: Client, options: IJoinOptions) {
    const user = await verifyToken(options?.token)
    if (!user) throw new ServerError(401, 'Sessão inválida ou expirada')
    if (!(await canAccessWorkspace(user, this.workspaceId))) {
      throw new ServerError(403, 'Você não tem acesso a este workspace')
    }
    return user
  }

  onJoin(client: Client, options: IJoinOptions, user: AuthUser) {
    // The display name comes from the account, never from the browser.
    // It is set right away but only becomes visible to others once the player
    // finishes picking an avatar (see READY_TO_CONNECT below).
    const player = new Player()
    this.pendingNames.set(client.sessionId, user.name)
    this.state.players.set(client.sessionId, player)
    client.send(Message.SEND_ROOM_DATA, {
      id: this.roomId,
      workspaceId: this.workspaceId,
      name: this.name,
      description: this.description,
    })
  }

  onLeave(client: Client, consented: boolean) {
    this.pendingNames.delete(client.sessionId)
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId)
    }
    this.state.computers.forEach((computer) => {
      if (computer.connectedUser.has(client.sessionId)) {
        computer.connectedUser.delete(client.sessionId)
      }
    })
    this.state.whiteboards.forEach((whiteboard) => {
      if (whiteboard.connectedUser.has(client.sessionId)) {
        whiteboard.connectedUser.delete(client.sessionId)
      }
    })
  }

  onDispose() {
    this.state.whiteboards.forEach((whiteboard) => {
      if (whiteboardRoomIds.has(whiteboard.roomId)) whiteboardRoomIds.delete(whiteboard.roomId)
    })

    console.log('room', this.roomId, 'disposing...')
    this.dispatcher.stop()
  }
}
