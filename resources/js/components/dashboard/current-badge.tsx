import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Star, Trophy } from 'lucide-react';
import { User } from '@/hooks/api/use-dashboard-data';

interface CurrentBadgeProps {
    user: User;
}

export function CurrentBadge({ user }: CurrentBadgeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Current Badge
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {user.current_badge ? (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{user.current_badge.name}</h3>
                                <p className="text-sm text-muted-foreground">Current Status</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-muted-foreground">No Badge Yet</h3>
                                <p className="text-sm text-muted-foreground">Complete achievements to unlock</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}