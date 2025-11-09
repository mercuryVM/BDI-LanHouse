import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../Hooks/reduxHooks';
import { 
    fetchUserData, 
    startTimer, 
    stopTimer, 
    updateTime 
} from '../store/slices/userDataSlice';
import type APIClient from '../API/APIClient';

export function useUserDataRedux(client: APIClient, enableTimer: boolean = false) {
    const dispatch = useAppDispatch();
    const { userData, isLoading, error, isTimerRunning } = useAppSelector((state) => state.userData);

    // Fetch user data on mount
    useEffect(() => {
        if (!userData && !isLoading) {
            dispatch(fetchUserData(client));
        }
    }, [client, dispatch, userData, isLoading]);

    // Start/stop timer based on enableTimer prop
    useEffect(() => {
        if (userData && enableTimer && !isTimerRunning) {
            dispatch(startTimer());
        } else if (!enableTimer && isTimerRunning) {
            dispatch(stopTimer());
        }
    }, [enableTimer, isTimerRunning, userData, dispatch]);

    // Timer effect
    useEffect(() => {
        if (!isTimerRunning || !userData?.maquina) return;

        const interval = setInterval(() => {
            dispatch(updateTime());
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, [isTimerRunning, userData?.maquina, dispatch]);

    return {
        userData,
        isLoading,
        error,
        isTimerRunning,
        refetch: () => dispatch(fetchUserData(client)),
    };
}