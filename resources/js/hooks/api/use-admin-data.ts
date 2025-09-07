import { useQuery } from '@tanstack/react-query';

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

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    'Content-Type': 'application/json',
});

export const useAdminDashboardData = () => {
    return useQuery<AdminDashboardData>({
        queryKey: ['admin-dashboard-data'],
        queryFn: async () => {
            const response = await fetch('/api/admin/users/achievements', {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error('Failed to fetch admin dashboard data');
            }
            return response.json();
        },
    });
};
