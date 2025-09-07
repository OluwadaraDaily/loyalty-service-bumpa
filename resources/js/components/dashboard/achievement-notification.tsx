import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AchievementNotificationProps {
    notification: {
        achievement: { id: number; name: string; description: string };
        badges: Array<{ id: number; name: string; description: string; icon_url: string | null }>;
    } | null;
}

export function AchievementNotification({ notification }: AchievementNotificationProps) {
    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -100, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -100, scale: 0.8 }}
                    className="fixed top-4 right-4 z-50 max-w-sm rounded-lg bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 p-6 text-white shadow-2xl"
                >
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-8 w-8 animate-pulse" />
                        <div>
                            <h3 className="text-lg font-bold">Achievement Unlocked!</h3>
                            <p className="text-sm opacity-90">{notification.achievement.name}</p>
                            {notification.badges.length > 0 && (
                                <p className="mt-1 text-xs opacity-80">🏆 {notification.badges.map((b) => b.name).join(', ')}</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
