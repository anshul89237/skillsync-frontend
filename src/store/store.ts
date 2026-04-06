import { configureStore } from '@reduxjs/toolkit';
import mentorReducer from './mentorSlice';
import sessionReducer from './sessionSlice';
import groupReducer from './groupSlice';

export const store = configureStore({
  reducer: {
    mentors: mentorReducer,
    sessions: sessionReducer,
    groups: groupReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
