import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminDashboardData } from '@/hooks/api/use-admin-data';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Award, Trophy, UserCheck, Users } from 'lucide-react';

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
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
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
                        <p className="mb-4 text-red-600">Failed to load admin dashboard data</p>
                        <button onClick={() => window.location.reload()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                                            ? Math.round(
                                                  (adminData.users.filter((u) => u.unlocked_achievements > 0).length / adminData.total_users) * 100,
                                              )
                                            : 0}
                                        %
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
                                <div className="max-h-96 space-y-4 overflow-y-auto">
                                    {adminData.users.length ? (
                                        adminData.users.map((user) => (
                                            <motion.div
                                                key={user.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center justify-between rounded-lg border bg-card p-4"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                                            <span className="text-sm font-semibold text-white">
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
                                                        <div className="text-lg font-bold text-blue-600">{user.unlocked_achievements}</div>
                                                        <div className="text-xs text-muted-foreground">/ {user.total_achievements} Achievements</div>
                                                    </div>
                                                    <div className="text-center">
                                                        {user.current_badge ? (
                                                            <Badge className="bg-yellow-500 hover:bg-yellow-600">🏆 {user.current_badge.name}</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">No Badge</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <Badge
                                                            variant={user.unlocked_achievements > 0 ? 'default' : 'secondary'}
                                                            className={user.unlocked_achievements > 0 ? 'bg-green-500 hover:bg-green-600' : ''}
                                                        >
                                                            {user.unlocked_achievements > 0 ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <p className="py-8 text-center text-muted-foreground">No users found</p>
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
