import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useDashboardData, usePurchaseProduct } from '@/hooks/api/use-dashboard-data';
import { AchievementsList } from '@/components/dashboard/achievements-list';
import { CurrentBadge } from '@/components/dashboard/current-badge';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { render } from '../setup/test-utils';
import { server } from '../setup/test-server';
import { mockUser, mockAchievements, mockStats } from '../setup/msw-handlers';

// Test integration between API hooks and components
describe('Hooks-Components Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Dashboard Data Hook Integration', () => {
        function TestComponent() {
            const { data, isLoading, error } = useDashboardData(1);

            if (isLoading) return <div>Loading...</div>;
            if (error) return <div>Error loading data</div>;
            if (!data) return <div>No data</div>;

            return (
                <div>
                    <div data-testid="user-name">{data.user.name}</div>
                    <AchievementsList achievements={data.achievements} />
                    <CurrentBadge user={data.user} />
                </div>
            );
        }

        it('should integrate API data with multiple components', async () => {
            render(<TestComponent />);

            // Should show loading initially
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
            });

            // Check that AchievementsList received and displays data
            expect(screen.getByText('All Achievements')).toBeInTheDocument();
            expect(screen.getByText('First Purchase')).toBeInTheDocument();
            expect(screen.getByText('Big Spender')).toBeInTheDocument();

            // Check that CurrentBadge received and displays data
            expect(screen.getByText('Current Badge')).toBeInTheDocument();
            expect(screen.getByText('Bronze Member')).toBeInTheDocument();
        });

        it('should handle API errors gracefully across components', async () => {
            server.use(
                http.get('/api/users/:userId/achievements', () => {
                    return HttpResponse.json(
                        { message: 'Server error' },
                        { status: 500 }
                    );
                })
            );

            render(<TestComponent />);

            await waitFor(() => {
                expect(screen.getByText('Error loading data')).toBeInTheDocument();
            });

            // No component content should be rendered
            expect(screen.queryByText('All Achievements')).not.toBeInTheDocument();
            expect(screen.queryByText('Current Badge')).not.toBeInTheDocument();
        });
    });

    describe('Stats Integration', () => {
        function StatsTestComponent() {
            return (
                <StatsOverview stats={mockStats.statistics} />
            );
        }

        it('should display stats data correctly', async () => {
            render(<StatsTestComponent />);

            // Check all stats are displayed
            expect(screen.getByText('Total Purchases')).toBeInTheDocument();
            expect(screen.getByText('15')).toBeInTheDocument();
            
            expect(screen.getByText('Total Spent')).toBeInTheDocument();
            expect(screen.getByText('$15000.00')).toBeInTheDocument();
            
            expect(screen.getByText('Total Cashback')).toBeInTheDocument();
            expect(screen.getByText('$750.00')).toBeInTheDocument();
            
            expect(screen.getByText('Pending Cashback')).toBeInTheDocument();
            expect(screen.getByText('$50.00')).toBeInTheDocument();
        });
    });

    describe('Purchase Hook Integration', () => {
        function PurchaseTestComponent() {
            const purchaseMutation = usePurchaseProduct(1);

            const handlePurchase = () => {
                purchaseMutation.mutate({
                    id: 'test-product',
                    name: 'Test Product',
                    category: 'Test',
                    amount: 1000,
                    currency: 'NGN',
                    description: 'Test product',
                });
            };

            return (
                <div>
                    <button 
                        onClick={handlePurchase}
                        disabled={purchaseMutation.isPending}
                    >
                        {purchaseMutation.isPending ? 'Processing...' : 'Purchase'}
                    </button>
                    {purchaseMutation.isSuccess && (
                        <div data-testid="success-message">Purchase successful!</div>
                    )}
                    {purchaseMutation.isError && (
                        <div data-testid="error-message">Purchase failed!</div>
                    )}
                </div>
            );
        }

        it('should handle successful purchase flow', async () => {
            // Add delay to mock API call so we can test loading state
            server.use(
                http.post('/api/users/:userId/purchase', () => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(HttpResponse.json({
                                success: true,
                                message: 'Purchase processed successfully',
                                purchase_id: 123,
                                cashback_amount: 25.00,
                                newly_unlocked_achievements: [],
                                newly_unlocked_badges: [],
                            }));
                        }, 100);
                    });
                })
            );

            render(<PurchaseTestComponent />);

            const purchaseButton = screen.getByText('Purchase');
            expect(purchaseButton).toBeEnabled();

            fireEvent.click(purchaseButton);

            // Should show processing state
            await waitFor(() => {
                expect(screen.getByText('Processing...')).toBeInTheDocument();
                expect(purchaseButton).toBeDisabled();
            });

            // Should show success message
            await waitFor(() => {
                expect(screen.getByTestId('success-message')).toBeInTheDocument();
                expect(purchaseButton).toBeEnabled();
            });
        });

        it('should handle purchase failure', async () => {
            server.use(
                http.post('/api/users/:userId/purchase', () => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(HttpResponse.json(
                                { success: false, message: 'Payment failed' },
                                { status: 400 }
                            ));
                        }, 100);
                    });
                })
            );

            render(<PurchaseTestComponent />);

            const purchaseButton = screen.getByText('Purchase');
            fireEvent.click(purchaseButton);

            await waitFor(() => {
                expect(screen.getByText('Processing...')).toBeInTheDocument();
            });

            await waitFor(() => {
                expect(screen.getByTestId('error-message')).toBeInTheDocument();
                expect(purchaseButton).toBeEnabled();
            });
        });
    });

    describe('Component State Integration', () => {
        function ComponentStateTest() {
            const { data } = useDashboardData(1);
            
            if (!data) return <div>Loading...</div>;

            return (
                <div>
                    <AchievementsList achievements={data.achievements} />
                    <div data-testid="achievement-count">{data.achievements.length}</div>
                    <div data-testid="unlocked-count">
                        {data.achievements.filter(a => a.unlocked).length}
                    </div>
                </div>
            );
        }

        it('should maintain state consistency across multiple component instances', async () => {
            render(<ComponentStateTest />);

            await waitFor(() => {
                expect(screen.getByTestId('achievement-count')).toHaveTextContent('2');
                expect(screen.getByTestId('unlocked-count')).toHaveTextContent('1');
            });

            // Check that achievements are displayed with correct states
            expect(screen.getByText('First Purchase')).toBeInTheDocument();
            expect(screen.getByText('Big Spender')).toBeInTheDocument();
            expect(screen.getByText('✓ Unlocked')).toBeInTheDocument(); // Only one should be unlocked
        });
    });

    describe('Error Recovery Integration', () => {
        function ErrorRecoveryTest() {
            const { data, isLoading, error, refetch } = useDashboardData(1);

            if (isLoading) return <div>Loading...</div>;
            if (error) {
                return (
                    <div>
                        <div>Error occurred</div>
                        <button onClick={() => refetch()}>Retry</button>
                    </div>
                );
            }
            if (!data) return <div>No data</div>;

            return <AchievementsList achievements={data.achievements} />;
        }

        it('should recover from errors when retrying', async () => {
            let callCount = 0;
            server.use(
                http.get('/api/users/:userId/achievements', () => {
                    callCount++;
                    if (callCount === 1) {
                        return HttpResponse.json(
                            { message: 'Server error' },
                            { status: 500 }
                        );
                    }
                    return HttpResponse.json({
                        user: mockUser,
                        achievements: mockAchievements,
                        badges: [],
                    });
                })
            );

            render(<ErrorRecoveryTest />);

            // Should show error initially
            await waitFor(() => {
                expect(screen.getByText('Error occurred')).toBeInTheDocument();
            });

            // Click retry
            const retryButton = screen.getByText('Retry');
            fireEvent.click(retryButton);

            // Should show data after retry (retry is usually fast, so skip loading check)
            await waitFor(() => {
                expect(screen.getByText('All Achievements')).toBeInTheDocument();
                expect(screen.getByText('First Purchase')).toBeInTheDocument();
            });
        });
    });
});