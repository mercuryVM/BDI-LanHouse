import { configureStore } from '@reduxjs/toolkit';
import userDataReducer from './slices/userDataSlice';

export const store = configureStore({
    reducer: {
        userData: userDataReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignorar essas actions para verificação de serialização
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;