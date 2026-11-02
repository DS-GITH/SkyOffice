import './env'
import http from 'http'
import fs from 'fs'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { Server } from 'colyseus'
import { monitor } from '@colyseus/monitor'
import { RoomType } from '../types/Rooms'
import { SkyOffice } from './rooms/SkyOffice'
import { migrate } from './db/migrate'
import { bootstrapAdmin } from './bootstrapAdmin'
import authRoutes from './api/auth'
import workspaceRoutes from './api/workspaces'
import userRoutes from './api/users'
import inviteRoutes from './api/invites'

const port = Number(process.env.PORT || 2567)
const app = express()

app.set('trust proxy', 1)
app.use(cors())
app.use(express.json())

// REST API
app.use('/api/auth', authRoutes)
app.use('/api/workspaces', workspaceRoutes)
app.use('/api/users', userRoutes)
app.use('/api/invites', inviteRoutes)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada' }))
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Erro interno do servidor' })
})

const server = http.createServer(app)
const gameServer = new Server({ server })

// One Colyseus room per workspace: joinOrCreate with the same workspaceId lands in the same room.
gameServer.define(RoomType.WORKSPACE, SkyOffice).filterBy(['workspaceId'])

// Colyseus monitor: dev only (it has no authentication)
if (process.env.NODE_ENV !== 'production') {
  app.use('/colyseus', monitor())
}

// In production the built client (client/dist) is served by this same server.
const clientDist = path.resolve(process.cwd(), 'client', 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  // SPA fallback so links like /convite/<token> open the app
  app.get(/^\/(?!api|matchmake|colyseus).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

async function start() {
  await migrate()
  await bootstrapAdmin()
  gameServer.listen(port)
  console.log(`Xpert Office ouvindo em http://localhost:${port}`)
}

start().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err)
  process.exit(1)
})
