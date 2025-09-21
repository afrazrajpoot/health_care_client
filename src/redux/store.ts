import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { employeeApi } from './api';
// import { employeePythonApi } from './employee-python-api/employee-python-api';

import counterReducer from './reducerState/globalState';
// import { hrApi } from './hr-api';
// import { retentionApi } from './hr-python-api/intervation';
// import { adminApi } from './admin-api';
export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    // [hrApi.reducerPath]: hrApi.reducer,
    // [employeePythonApi.reducerPath]: employeePythonApi.reducer,
    // [retentionApi.reducerPath]: retentionApi.reducer,
    // [adminApi.reducerPath]: adminApi.reducer

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(employeeApi.middleware)
    //   .concat(hrApi.middleware)// ✅ add this line
    //   .concat(employeePythonApi.middleware)
    //   .concat(retentionApi.middleware)
    //   .concat(adminApi.middleware)

});


// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
