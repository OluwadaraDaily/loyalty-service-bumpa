import { http, HttpResponse } from 'msw';

// Mock data
export const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    current_badge: {
        id: 1,
        name: 'Bronze Member',
        icon_url: null,
    },
};

export const mockAchievements = [
    {
        id: 1,
        name: 'First Purchase',
        description: 'Make your first purchase',
        points_required: 100,
        progress: 100,
        progress_percentage: 100,
        unlocked: true,
        unlocked_at: '2024-01-01T00:00:00Z',
        badges: [],
    },
    {
        id: 2,
        name: 'Big Spender',
        description: 'Spend ₦10,000',
        points_required: 1000,
        progress: 500,
        progress_percentage: 50,
        unlocked: false,
        unlocked_at: null,
        badges: [],
    },
];

export const mockBadges = [
    {
        id: 1,
        name: 'Bronze Member',
        description: 'Welcome to the loyalty program',
        icon_url: null,
        type: 'membership',
        points_required: 0,
        progress: 100,
        progress_percentage: 100,
        unlocked: true,
        unlocked_at: '2024-01-01T00:00:00Z',
    },
];

export const mockStats = {
    statistics: {
        total_purchases: 15,
        total_spent: '15000.00',
        total_cashback: '750.00',
        pending_cashback: '50.00',
    },
    recent_activity: {
        purchases: [
            { id: 1, amount: 1000, created_at: '2024-01-01T00:00:00Z' },
            { id: 2, amount: 2000, created_at: '2024-01-02T00:00:00Z' },
        ],
        cashbacks: [
            { id: 1, amount: 50, status: 'pending', created_at: '2024-01-01T00:00:00Z' },
            { id: 2, amount: 100, status: 'completed', created_at: '2024-01-02T00:00:00Z' },
        ],
    },
};

export const handlers = [
    // CSRF cookie endpoint
    http.get('/sanctum/csrf-cookie', () => {
        return HttpResponse.json({}, { status: 200 });
    }),

    // Dashboard data endpoint
    http.get('/api/users/:userId/achievements', ({ params }) => {
        return HttpResponse.json({
            user: mockUser,
            achievements: mockAchievements,
            badges: mockBadges,
        });
    }),

    // Dashboard stats endpoint
    http.get('/api/users/:userId/dashboard-stats', ({ params }) => {
        return HttpResponse.json(mockStats);
    }),

    // Simulate achievement endpoint
    http.post('/api/users/:userId/simulate-achievement', ({ params }) => {
        return HttpResponse.json({
            success: true,
            achievement: {
                id: 3,
                name: 'Achievement Simulator',
                description: 'You used the achievement simulator',
            },
            badges: [
                {
                    id: 2,
                    name: 'Tester Badge',
                    description: 'Awarded for testing features',
                    icon_url: null,
                },
            ],
        });
    }),

    // Purchase product endpoint
    http.post('/api/users/:userId/purchase', async ({ request, params }) => {
        const body = await request.json();
        return HttpResponse.json({
            success: true,
            message: 'Purchase processed successfully',
            purchase_id: 123,
            cashback_amount: 25.00,
            newly_unlocked_achievements: [
                {
                    id: 4,
                    name: 'Random Shopper',
                    description: 'Made a random purchase',
                },
            ],
            newly_unlocked_badges: [
                {
                    id: 3,
                    name: 'Shopping Badge',
                    description: 'Awarded for making purchases',
                    icon_url: null,
                },
            ],
        });
    }),

    // Error cases for testing
    http.get('/api/users/999/achievements', () => {
        return HttpResponse.json(
            { message: 'User not found' },
            { status: 404 }
        );
    }),
];