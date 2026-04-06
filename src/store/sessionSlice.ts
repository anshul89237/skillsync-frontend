import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { sessionAPI } from '../core/api';
import { Session } from '../types';

interface SessionState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  sessions: [],
  loading: false,
  error: null,
};

// Async thunk to fetch all sessions
export const fetchSessions = createAsyncThunk('sessions/fetchSessions', async () => {
  const response = await sessionAPI.getAllSessions();
  return response.data;
});

// Async thunk to create a new session
export const createSession = createAsyncThunk('sessions/createSession', async (data: any) => {
  const response = await sessionAPI.createSession(data);
  return response.data;
});

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action: PayloadAction<Session[]>) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sessions';
      })
      // Create Session
      .addCase(createSession.fulfilled, (state, action: PayloadAction<Session>) => {
        state.sessions.push(action.payload);
      });
  },
});

export default sessionSlice.reducer;
