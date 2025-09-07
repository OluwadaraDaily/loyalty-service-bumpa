import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Achievement } from '@/hooks/api/use-dashboard-data';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface AchievementsOverviewProps {
    achievements: Achievement[];
}

export function AchievementsOverview({ achievements }: AchievementsOverviewProps) {
    const getProgressPercentage = (progress: number, threshold: number) => {
        return Math.min((progress / threshold) * 100, 100);
    };

    const displayAchievements = achievements.slice(0, 3);

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-blue-500" />
                        Achievements Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {displayAchievements.length ? (
                        <div className="space-y-4">
                            {displayAchievements.map((achievement) => (
                                <div key={achievement.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{achievement.title}</span>
                                        <Badge variant={achievement.unlocked ? 'default' : 'secondary'}>
                                            {achievement.unlocked ? 'Unlocked' : `${achievement.progress}/${achievement.threshold}`}
                                        </Badge>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                achievement.unlocked ? 'bg-green-500' : 'bg-blue-500'
                                            }`}
                                            style={{
                                                width: `${getProgressPercentage(achievement.progress, achievement.threshold)}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {achievements.length > 3 && <p className="text-sm text-muted-foreground">+{achievements.length - 3} more achievements</p>}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No achievements found</p>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
