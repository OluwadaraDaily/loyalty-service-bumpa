import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Gift, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDashboardData, useDashboardStats, useSimulateAchievement, usePurchaseProduct } from '@/hooks/api/use-dashboard-data';
import { getRandomProduct } from '@/constants/products';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { CurrentBadge } from '@/components/dashboard/current-badge';
import { AchievementsList } from '@/components/dashboard/achievements-list';
import { BadgesList } from '@/components/dashboard/badges-list';
import { AchievementNotification } from '@/components/dashboard/achievement-notification';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface AchievementNotificationType {
    achievement: { id: number; name: string; description: string };
    badges: Array<{ id: number; name: string; description: string; icon_url: string | null }>;
}

export default function Dashboard() {
    const { auth } = usePage().props as any;
    const [achievementNotification, setAchievementNotification] = useState<AchievementNotificationType | null>(null);

    const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardData(auth.user.id);
    const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useDashboardStats(auth.user.id);

    const simulateAchievementMutation = useSimulateAchievement(auth.user.id);
    const purchaseProductMutation = usePurchaseProduct(auth.user.id);

    const handleSimulateAchievement = async () => {
        try {
            const result = await simulateAchievementMutation.mutateAsync();
            if (result.success) {
                setAchievementNotification({
                    achievement: result.achievement,
                    badges: result.badges,
                });
                setTimeout(() => setAchievementNotification(null), 5000);
            } else {
                toast.info(result.message);
            }
        } catch (error) {
            console.error('Failed to simulate achievement:', error);
            toast.error('Failed to simulate achievement');
        }
    };

    const handleRandomPurchase = async () => {
        try {
            const randomProduct = getRandomProduct();
            const result = await purchaseProductMutation.mutateAsync(randomProduct);
            if (result.success) {
                toast.success(`Successfully purchased ${randomProduct.name}!`, {
                    description: `Amount: ₦${randomProduct.amount.toLocaleString()}`
                });

                // Check if any achievements or badges were unlocked
                if (result.newly_unlocked_achievements && result.newly_unlocked_achievements.length > 0) {
                    const achievement = result.newly_unlocked_achievements[0];
                    const badges = result.newly_unlocked_badges || [];
                    
                    setAchievementNotification({
                        achievement: {
                            id: achievement.id,
                            name: achievement.name,
                            description: achievement.description
                        },
                        badges: badges.map((badge: any) => ({
                            id: badge.id,
                            name: badge.name,
                            description: badge.description,
                            icon_url: badge.icon_url
                        }))
                    });
                    setTimeout(() => setAchievementNotification(null), 5000);
                } else if (result.newly_unlocked_badges && result.newly_unlocked_badges.length > 0) {
                    // Show badge notification even if no achievement was unlocked
                    const badges = result.newly_unlocked_badges;
                    toast.success(`New badge unlocked: ${badges[0].name}!`, {
                        description: badges[0].description
                    });
                }
            } else {
                toast.error(result.message || 'Failed to process purchase');
            }
        } catch (error) {
            console.error('Failed to process purchase:', error);
            toast.error('Failed to process purchase');
        }
    };

    if (dashboardLoading || statsLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 items-center justify-center">
                    <div className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 h-12 w-12"></div>
                </div>
            </AppLayout>
        );
    }

    if (dashboardError || statsError) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">Failed to load dashboard data</p>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            
            {/* Achievement Notification */}
            <AchievementNotification notification={achievementNotification} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Welcome back, {dashboardData?.user.name}!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">Here's your loyalty program progress</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={handleRandomPurchase} 
                            disabled={purchaseProductMutation.isPending}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {purchaseProductMutation.isPending ? 'Processing...' : 'Random Purchase'}
                        </Button>
                        <Button 
                            onClick={handleSimulateAchievement} 
                            disabled={simulateAchievementMutation.isPending}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                            <Gift className="mr-2 h-4 w-4" />
                            {simulateAchievementMutation.isPending ? 'Simulating...' : 'Simulate Achievement'}
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                {dashboardStats && <StatsOverview stats={dashboardStats.statistics} />}

                {/* Current Badge */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    {dashboardData && <CurrentBadge user={dashboardData.user} />}
                </div>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* All Achievements */}
                    {dashboardData && <AchievementsList achievements={dashboardData.achievements} />}

                    {/* Earned Badges */}
                    {dashboardData && <BadgesList badges={dashboardData.badges} />}
                </div>
            </div>
        </AppLayout>
    );
}