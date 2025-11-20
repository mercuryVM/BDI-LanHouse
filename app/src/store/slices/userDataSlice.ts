import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { UserData } from '../../API/APIClient';
import type APIClient from '../../API/APIClient';
import type { PayloadAction } from '@reduxjs/toolkit';

// Estado inicial
interface UserDataState {
    userData: UserData | null;
    isLoading: boolean;
    error: string | null;
    isTimerRunning: boolean;
}

const initialState: UserDataState = {
    userData: null,
    isLoading: false,
    error: null,
    isTimerRunning: false,
};

// Async thunk para buscar dados do usuário
export const fetchUserData = createAsyncThunk(
    'userData/fetchUserData',
    async (client: APIClient, { rejectWithValue }) => {
        try {
            const userData = await client.getUserData();
            if (!userData) {
                return rejectWithValue('No user data received');
            }
            return userData;
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            return rejectWithValue(
                error instanceof Error ? error.message : 'Failed to fetch user data'
            );
        }
    }
);

// Slice
const userDataSlice = createSlice({
    name: 'userData',
    initialState,
    reducers: {
        // Atualizar tempo (chamado pelo timer)
        updateTime: (state) => {
            if (!state.userData?.maquina || !state.isTimerRunning) return;

            const { maquina } = state.userData;
            let hasUpdated = false;

            switch (maquina.tipo) {
                case 0: // PC
                    if (state.userData.tempoComputador && state.userData.tempoComputador > 0) {
                        state.userData.tempoComputador -= 1;
                        hasUpdated = true;
                    }
                    break;
                case 1: // Console
                    if (state.userData.tempoConsole && state.userData.tempoConsole > 0) {
                        state.userData.tempoConsole -= 1;
                        hasUpdated = true;
                    }
                    break;
                case 2: // Simulador
                    if (state.userData.tempoSimulador && state.userData.tempoSimulador > 0) {
                        state.userData.tempoSimulador -= 1;
                        hasUpdated = true;
                    }
                    break;
            }

            // Se o tempo acabou, para o timer
            if (!hasUpdated) {
                state.isTimerRunning = false;
            }
        },

        // Controlar timer
        startTimer: (state) => {
            state.isTimerRunning = true;
        },

        stopTimer: (state) => {
            state.isTimerRunning = false;
        },

        // Limpar dados do usuário
        clearUserData: (state) => {
            state.userData = null;
            state.error = 'User logged out';
            state.isTimerRunning = false;
            state.isLoading = false;
        },

        // Atualizar dados específicos do usuário
        updateUserData: (state, action: PayloadAction<Partial<UserData>>) => {
            if (state.userData) {
                state.userData = { ...state.userData, ...action.payload };
            }
        },

        // Limpar erro
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchUserData pending
            .addCase(fetchUserData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            // fetchUserData fulfilled
            .addCase(fetchUserData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userData = action.payload;
                state.error = null;
            })
            // fetchUserData rejected
            .addCase(fetchUserData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.userData = null;
            });
    },
});

export const {
    updateTime,
    startTimer,
    stopTimer,
    clearUserData,
    updateUserData,
    clearError,
} = userDataSlice.actions;

export default userDataSlice.reducer;