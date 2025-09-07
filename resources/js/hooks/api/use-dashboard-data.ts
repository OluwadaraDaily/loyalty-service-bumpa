import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Achievement {
    id: number;
    title: string;
    description: string;
    type: string;
    threshold: number;
    progress: number;
    unlocked: boolean;
    unlocked_at: string | null;
    badges: Array<{
        id: number;
        name: string;
        description: string;
        icon_url: string | null;
    }>;
}

export interface Badge {
    id: number;
    name: string;
    description: string;
    icon_url: string | null;
    unlocked_at: string;
}

export interface DashboardStats {
    statistics: {
        total_purchases: number;
        total_spent: string;
        total_cashback: string;
        pending_cashback: string;
    };
    recent_activity: {
        purchases: Array<{ id: number; amount: number; created_at: string }>;
        cashbacks: Array<{ id: number; amount: number; status: string; created_at: string }>;
    };
}

export interface User {
    id: number;
    name: string;
    email: string;
    current_badge: {
        id: number;
        name: string;
        icon_url: string | null;
    } | null;
}

export interface DashboardData {
    user: User;
    achievements: Achievement[];
    badges: Badge[];
}

const getAuthHeaders = () => {
    // Get CSRF token from XSRF-TOKEN cookie (set by Sanctum)
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        }
        return null;
    };

    const token = getCookie('XSRF-TOKEN');
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token && { 'X-CSRF-TOKEN': token })
    };
};


export const useDashboardData = (userId: number) => {
    return useQuery<DashboardData>({
        queryKey: ['dashboard-data', userId],
        queryFn: async () => {
            // First ensure CSRF cookie
            await fetch('/sanctum/csrf-cookie', { 
                credentials: 'include' 
            });
            
            const response = await fetch(`/api/users/${userId}/achievements`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            console.log("RESPONSE [Dashboard Data] =>", response);
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
            return response.json();
        },
    });
};

export const useDashboardStats = (userId: number) => {
    return useQuery<DashboardStats>({
        queryKey: ['dashboard-stats', userId],
        queryFn: async () => {
            // First ensure CSRF cookie
            await fetch('/sanctum/csrf-cookie', { 
                credentials: 'include' 
            });
            
            const response = await fetch(`/api/users/${userId}/dashboard-stats`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            console.log("RESPONSE [Dashboard Stats] =>", response);
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }
            return response.json();
        },
    });
};

export const useSimulateAchievement = (userId: number) => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async () => {
            // First ensure CSRF cookie
            await fetch('/sanctum/csrf-cookie', { 
                credentials: 'include' 
            });
            
            const headers = getAuthHeaders();
            console.log('Request headers:', headers);
            
            const response = await fetch(`/api/users/${userId}/simulate-achievement`, {
                method: 'POST',
                headers,
                credentials: 'include',
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Failed to simulate achievement');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-data', userId] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats', userId] });
        },
    });
};