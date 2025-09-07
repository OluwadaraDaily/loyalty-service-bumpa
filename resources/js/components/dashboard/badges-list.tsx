import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeType } from '@/hooks/api/use-dashboard-data';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface BadgesListProps {
    badges: BadgeType[];
}

export function BadgesList({ badges }: BadgesListProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card>
                <CardHeader>
                    <CardTitle>All Badges</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-96 space-y-4 overflow-y-auto">
                        {badges.length ? (
                            badges.map((badge) => (
                                <motion.div
                                    key={badge.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`rounded-lg border p-4 ${
                                        badge.unlocked
                                            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                                            : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                                badge.unlocked ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        >
                                            <Trophy className={`h-5 w-5 ${badge.unlocked ? 'text-white' : 'text-gray-500'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-start justify-between">
                                                <h3 className="font-semibold">{badge.name}</h3>
                                                {badge.unlocked && (
                                                    <span className="rounded bg-green-500 px-2 py-1 text-xs text-white">Unlocked</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                                            <div className="mt-2">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">Progress</span>
                                                    <span className="text-xs font-medium">
                                                        {badge.progress}/{badge.points_required} ({badge.progress_percentage}%)
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all duration-500 ${
                                                            badge.unlocked ? 'bg-yellow-500' : 'bg-blue-500'
                                                        }`}
                                                        style={{
                                                            width: `${badge.progress_percentage}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            {badge.unlocked && badge.unlocked_at && (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    Unlocked: {new Date(badge.unlocked_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-8 text-center">
                                <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No badges earned yet</p>
                                <p className="mt-2 text-sm text-muted-foreground">Complete achievements to earn your first badge!</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
