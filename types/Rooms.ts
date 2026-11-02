export enum RoomType {
  WORKSPACE = 'workspace',
}

/** Options sent by the client when joining a workspace room. */
export interface IJoinOptions {
  workspaceId: string
  token: string
}

/** Room info sent by the server right after joining. */
export interface IRoomData {
  id: string
  workspaceId: string
  name: string
  description: string
}
