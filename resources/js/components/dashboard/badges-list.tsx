import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Badge as BadgeType } from '@/hooks/api/use-dashboard-data';

interface BadgesListProps {
    badges: BadgeType[];
}

export function BadgesList({ badges }: BadgesListProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>All Badges</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {badges.length ? (
                            badges.map((badge) => (
                                <motion.div
                                    key={badge.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-4 rounded-lg border ${
                                        badge.unlocked
                                            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                                            : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            badge.unlocked 
                                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}>
                                            <Trophy className={`h-5 w-5 ${badge.unlocked ? 'text-white' : 'text-gray-500'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold">{badge.name}</h3>
                                                {badge.unlocked && (
                                                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Unlocked</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                                            <div className="mt-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-muted-foreground">Progress</span>
                                                    <span className="text-xs font-medium">
                                                        {badge.progress}/{badge.points_required} ({badge.progress_percentage}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
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
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Unlocked: {new Date(badge.unlocked_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No badges earned yet</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Complete achievements to earn your first badge!
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}