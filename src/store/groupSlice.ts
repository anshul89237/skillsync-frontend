import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { groupAPI } from '../core/api';

interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  category: string;
}

interface GroupState {
  groups: Group[];
  loading: boolean;
  error: string | null;
}

const initialState: GroupState = {
  groups: [],
  loading: false,
  error: null,
};

export const fetchGroups = createAsyncThunk('groups/fetchGroups', async () => {
  const response = await groupAPI.getAllGroups();
  return response.data;
});

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGroups.fulfilled, (state, action: PayloadAction<Group[]>) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch groups';
      });
  },
});

export default groupSlice.reducer;
