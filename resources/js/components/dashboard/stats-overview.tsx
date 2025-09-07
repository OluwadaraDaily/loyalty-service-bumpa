import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { DashboardStats } from '@/hooks/api/use-dashboard-data';

interface StatsOverviewProps {
    stats: DashboardStats['statistics'];
}

export function StatsOverview({ stats }: StatsOverviewProps) {
    const statItems = [
        {
            title: 'Total Purchases',
            value: stats.total_purchases,
            icon: ShoppingBag,
            delay: 0.1,
        },
        {
            title: 'Total Spent',
            value: `$${stats.total_spent}`,
            icon: DollarSign,
            delay: 0.2,
        },
        {
            title: 'Total Cashback',
            value: `$${stats.total_cashback}`,
            icon: TrendingUp,
            delay: 0.3,
            className: 'text-green-600',
        },
        {
            title: 'Pending Cashback',
            value: `$${stats.pending_cashback}`,
            icon: Clock,
            delay: 0.4,
            className: 'text-orange-600',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((item, index) => (
                <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: item.delay }}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${item.className || ''}`}>
                                {item.value}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}