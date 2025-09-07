import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Achievement } from '@/hooks/api/use-dashboard-data';

interface AchievementsListProps {
    achievements: Achievement[];
}

export function AchievementsList({ achievements }: AchievementsListProps) {
    const getProgressPercentage = (progress: number, threshold: number) => {
        return Math.min((progress / threshold) * 100, 100);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>All Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {achievements.length ? (
                            achievements.map((achievement) => (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`p-4 rounded-lg border ${
                                        achievement.unlocked
                                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                                            : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{achievement.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {achievement.description}
                                            </p>
                                            <div className="mt-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm">Progress</span>
                                                    <span className="text-sm font-medium">
                                                        {achievement.progress}/{achievement.threshold}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${
                                                            achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}
                                                        style={{
                                                            width: `${getProgressPercentage(
                                                                achievement.progress,
                                                                achievement.threshold
                                                            )}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        {achievement.unlocked && (
                                            <Badge className="bg-green-500 hover:bg-green-600">
                                                ✓ Unlocked
                                            </Badge>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center py-8">No achievements found</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}