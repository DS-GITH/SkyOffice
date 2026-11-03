import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../services/api'

interface AuthState {
  /** 'checking' while validating a saved token on page load */
  status: 'checking' | 'signedOut' | 'signedIn'
  user: User | null
}

const initialState: AuthState = {
  status: 'checking',
  user: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn: (state, action: PayloadAction<User>) => {
      state.status = 'signedIn'
      state.user = action.payload
    },
    userUpdated: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
    signedOut: (state) => {
      state.status = 'signedOut'
      state.user = null
    },
  },
})

export const { signedIn, signedOut, userUpdated } = authSlice.actions

export default authSlice.reducer
