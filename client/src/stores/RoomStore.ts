import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IRoomData } from '../../../types/Rooms'

export const roomSlice = createSlice({
  name: 'room',
  initialState: {
    roomJoined: false,
    roomId: '',
    workspaceId: '',
    roomName: '',
    roomDescription: '',
    onlineCount: 0,
  },
  reducers: {
    setRoomJoined: (state, action: PayloadAction<boolean>) => {
      state.roomJoined = action.payload
    },
    setJoinedRoomData: (state, action: PayloadAction<IRoomData>) => {
      state.roomId = action.payload.id
      state.workspaceId = action.payload.workspaceId
      state.roomName = action.payload.name
      state.roomDescription = action.payload.description
    },
    setOnlineCount: (state, action: PayloadAction<number>) => {
      state.onlineCount = action.payload
    },
  },
})

export const { setRoomJoined, setJoinedRoomData, setOnlineCount } = roomSlice.actions

export default roomSlice.reducer
