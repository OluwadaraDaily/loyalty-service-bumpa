import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Achievement } from '@/hooks/api/use-dashboard-data';
import { motion } from 'framer-motion';

interface AchievementsListProps {
    achievements: Achievement[];
}

export function AchievementsList({ achievements }: AchievementsListProps) {
    // No longer needed since we get progress_percentage from API
    // const getProgressPercentage = (progress: number, threshold: number) => {
    //     return Math.min((progress / threshold) * 100, 100);
    // };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
                <CardHeader>
                    <CardTitle>All Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-h-96 space-y-4 overflow-y-auto">
                        {achievements.length ? (
                            achievements.map((achievement) => (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`rounded-lg border p-4 ${
                                        achievement.unlocked
                                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                                            : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
                                        }`}
                                    data-cy="achievement-card"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{achievement.name}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                                            <div className="mt-2">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-sm">Progress</span>
                                                    <span className="text-sm font-medium" data-cy="achievement-progress">
                                                        {achievement.progress}/{achievement.points_required} ({achievement.progress_percentage}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${
                                                            achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}
                                                        style={{
                                                            width: `${achievement.progress_percentage}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        {achievement.unlocked && <Badge className="bg-green-500 hover:bg-green-600">✓ Unlocked</Badge>}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">No achievements found</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
