import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    total_achievements: number;
    unlocked_achievements: number;
    current_badge: {
        id: number;
        name: string;
        icon_url: string | null;
    } | null;
    created_at: string;
}

export interface AdminDashboardData {
    users: AdminUser[];
    total_users: number;
    total_achievements_unlocked: number;
    total_badges_earned: number;
}


export const useAdminDashboardData = () => {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/admin/users/achievements');
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch admin dashboard data'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};
