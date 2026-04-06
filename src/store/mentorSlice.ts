import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { mentorAPI } from '../core/api';
import { Mentor } from '../types';

interface MentorState {
  mentors: Mentor[];
  loading: boolean;
  error: string | null;
}

const initialState: MentorState = {
  mentors: [],
  loading: false,
  error: null,
};

export const fetchMentors = createAsyncThunk('mentors/fetchMentors', async () => {
  const response = await mentorAPI.getAllMentors();
  return response.data;
});

const mentorSlice = createSlice({
  name: 'mentors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMentors.fulfilled, (state, action: PayloadAction<Mentor[]>) => {
        state.loading = false;
        state.mentors = action.payload;
      })
      .addCase(fetchMentors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch mentors';
      });
  },
});

export default mentorSlice.reducer;
