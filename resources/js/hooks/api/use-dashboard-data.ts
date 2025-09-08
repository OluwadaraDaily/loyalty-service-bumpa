import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@/constants/products';
import api from '@/lib/axios';

export interface Achievement {
    id: number;
    name: string;
    description: string;
    points_required: number;
    progress: number;
    progress_percentage: number;
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
    type: string;
    points_required: number;
    progress: number;
    progress_percentage: number;
    unlocked: boolean;
    unlocked_at: string | null;
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


export const useDashboardData = (userId: number) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/users/${userId}/achievements`);
            console.log('RESPONSE [Dashboard Data] =>', response);
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading: loading, error, refetch: fetchData };
};

export const useDashboardStats = (userId: number) => {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/users/${userId}/dashboard-stats`);
            console.log('RESPONSE [Dashboard Stats] =>', response);
            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch dashboard stats'));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading: loading, error, refetch: fetchData };
};

export const useSimulateAchievement = (userId: number, onSuccess?: () => void) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post(`/users/${userId}/simulate-achievement`);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            onSuccess?.();
            return response.data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to simulate achievement');
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [userId, onSuccess]);

    return { mutate, loading, error };
};

export const usePurchaseProduct = (userId: number, onSuccess?: () => void) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [success, setSuccess] = useState(false);

    const mutate = useCallback(async (product: Product) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            const purchaseData = {
                user_id: userId,
                amount: product.amount,
                currency: product.currency,
                payment_method: 'credit_card',
                payment_reference: `purchase_${product.id}_${Date.now()}`,
                status: 'completed',
                timestamp: new Date().toISOString(),
                metadata: {
                    product_id: product.id,
                    product_name: product.name,
                    product_category: product.category,
                    product_description: product.description,
                    source: 'frontend_purchase',
                },
            };

            const response = await api.post(`/users/${userId}/purchase`, purchaseData);
            setSuccess(true);
            onSuccess?.();
            return response.data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to process purchase');
            console.error('Purchase error:', error);
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [userId, onSuccess]);

    return { mutate, isPending: loading, isError: !!error, isSuccess: success, error };
};
