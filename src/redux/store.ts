import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { employeeApi } from './api';
import { staffApi } from './staffApi';
import { pythonApi } from './pythonApi';
import counterReducer from './reducerState/globalState';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [staffApi.reducerPath]: staffApi.reducer,
    [pythonApi.reducerPath]: pythonApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(employeeApi.middleware)
      .concat(staffApi.middleware)
      .concat(pythonApi.middleware)
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
