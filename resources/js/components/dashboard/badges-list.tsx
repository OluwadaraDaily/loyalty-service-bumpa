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
                    <CardTitle>Earned Badges</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {badges.length ? (
                            badges.map((badge) => (
                                <motion.div
                                    key={badge.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                        <Trophy className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{badge.name}</h3>
                                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Unlocked: {new Date(badge.unlocked_at).toLocaleDateString()}
                                        </p>
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