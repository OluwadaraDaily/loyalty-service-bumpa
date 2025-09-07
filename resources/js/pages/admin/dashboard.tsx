import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Users, Trophy, Award, UserCheck } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/api/use-admin-data';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin',
    },
];

export default function AdminDashboard() {
    const { data: adminData, isLoading, error } = useAdminDashboardData();

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Admin Dashboard" />
                <div className="flex h-full flex-1 items-center justify-center">
                    <div className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 h-12 w-12"></div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Admin Dashboard" />
                <div className="flex h-full flex-1 items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">Failed to load admin dashboard data</p>
                        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Retry
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-300">Manage loyalty program users and track achievements</p>
                </div>

                {/* Stats Overview */}
                {adminData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{adminData.total_users}</div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Achievements Unlocked</CardTitle>
                                    <Trophy className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">{adminData.total_achievements_unlocked}</div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-600">{adminData.total_badges_earned}</div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {adminData.total_users > 0 
                                            ? Math.round((adminData.users.filter(u => u.unlocked_achievements > 0).length / adminData.total_users) * 100)
                                            : 0
                                        }%
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}

                {/* Users List */}
                {adminData && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>User Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {adminData.users.length ? (
                                        adminData.users.map((user) => (
                                            <motion.div
                                                key={user.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center justify-between p-4 rounded-lg border bg-card"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-semibold text-sm">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">{user.name}</h3>
                                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Joined: {new Date(user.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {user.unlocked_achievements}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            / {user.total_achievements} Achievements
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        {user.current_badge ? (
                                                            <Badge className="bg-yellow-500 hover:bg-yellow-600">
                                                                🏆 {user.current_badge.name}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">
                                                                No Badge
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <Badge 
                                                            variant={user.unlocked_achievements > 0 ? "default" : "secondary"}
                                                            className={user.unlocked_achievements > 0 ? "bg-green-500 hover:bg-green-600" : ""}
                                                        >
                                                            {user.unlocked_achievements > 0 ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No users found</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </AppLayout>
    );
}