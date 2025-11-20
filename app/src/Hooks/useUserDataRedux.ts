import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../Hooks/reduxHooks';
import { 
    fetchUserData, 
    startTimer, 
    stopTimer, 
    updateTime,
    clearUserData 
} from '../store/slices/userDataSlice';
import type APIClient from '../API/APIClient';
import { useNavigate } from 'react-router';

export function useUserDataRedux(client: APIClient, enableTimer: boolean = false) {
    const dispatch = useAppDispatch();
    const { userData, isLoading, error, isTimerRunning } = useAppSelector((state) => state.userData);
    const navigate = useNavigate()

    // Fetch user data on mount
    useEffect(() => {
        if (!userData && !isLoading && !error) {
            console.log('Fetching user data...');
            dispatch(fetchUserData(client));
        }
    }, [client, dispatch, userData, isLoading, error]);

    // Redirect to login if there's an authentication error
    useEffect(() => {
        console.log('Error state:', { error, isLoading, userData });
        
        if (error && !isLoading) {
            console.error('Authentication error detected:', error);
            
            // Clear client token
            try {
                client.token = null as any;
                localStorage.removeItem('api_token');
            } catch (e) {
                console.error('Error clearing token:', e);
            }
            
            // Redirect to login
            console.log('Redirecting to login...');
            navigate('/', { replace: true });
        }
    }, [error, isLoading, navigate, client]);

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