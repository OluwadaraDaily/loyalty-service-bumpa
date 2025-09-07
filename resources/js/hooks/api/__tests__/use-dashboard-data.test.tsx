import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData, useDashboardStats } from '../use-dashboard-data';
import { ReactNode } from 'react';

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useDashboardData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock document.cookie
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: 'XSRF-TOKEN=mock-csrf-token',
        });
    });

    it('fetches dashboard data successfully', async () => {
        const mockData = {
            user: { id: 1, name: 'John Doe', email: 'john@example.com', current_badge: null },
            achievements: [],
            badges: [],
        };

        (fetch as any)
            .mockResolvedValueOnce({ ok: true }) // CSRF cookie call
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });

        const { result } = renderHook(() => useDashboardData(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockData);
    });

    it('handles fetch error', async () => {
        (fetch as any)
            .mockResolvedValueOnce({ ok: true }) // CSRF cookie call
            .mockResolvedValueOnce({ ok: false });

        const { result } = renderHook(() => useDashboardData(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('includes correct headers in request', async () => {
        (fetch as any)
            .mockResolvedValueOnce({ ok: true }) // CSRF cookie call
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

        renderHook(() => useDashboardData(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/sanctum/csrf-cookie', {
                credentials: 'include',
            });
            expect(fetch).toHaveBeenCalledWith('/api/users/1/achievements', {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': 'mock-csrf-token',
                },
                credentials: 'include',
            });
        });
    });
});

describe('useDashboardStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: 'XSRF-TOKEN=mock-csrf-token',
        });
    });

    it('fetches dashboard stats successfully', async () => {
        const mockStats = {
            statistics: {
                total_purchases: 5,
                total_spent: '500.00',
                total_cashback: '25.00',
                pending_cashback: '10.00',
            },
            recent_activity: {
                purchases: [],
                cashbacks: [],
            },
        };

        (fetch as any)
            .mockResolvedValueOnce({ ok: true }) // CSRF cookie call
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockStats),
            });

        const { result } = renderHook(() => useDashboardStats(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockStats);
    });

    it('uses correct API endpoint for stats', async () => {
        (fetch as any)
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

        renderHook(() => useDashboardStats(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/users/1/dashboard-stats', {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': 'mock-csrf-token',
                },
                credentials: 'include',
            });
        });
    });
});

describe('Cookie parsing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles missing CSRF token', async () => {
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: '',
        });

        (fetch as any)
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

        renderHook(() => useDashboardData(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            const lastCall = (fetch as any).mock.calls[1];
            expect(lastCall[1].headers).not.toHaveProperty('X-CSRF-TOKEN');
        });
    });
});