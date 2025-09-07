import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AchievementsList } from '../achievements-list';
import { Achievement } from '@/hooks/api/use-dashboard-data';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

const mockAchievements: Achievement[] = [
    {
        id: 1,
        name: 'First Purchase',
        description: 'Make your first purchase',
        points_required: 100,
        progress: 100,
        progress_percentage: 100,
        unlocked: true,
        unlocked_at: '2024-01-01T00:00:00Z',
        badges: [],
    },
    {
        id: 2,
        name: 'Spender',
        description: 'Spend $500',
        points_required: 500,
        progress: 250,
        progress_percentage: 50,
        unlocked: false,
        unlocked_at: null,
        badges: [],
    },
];

describe('AchievementsList', () => {
    it('renders achievements list title', () => {
        render(<AchievementsList achievements={mockAchievements} />);
        expect(screen.getByText('All Achievements')).toBeInTheDocument();
    });

    it('renders achievement details correctly', () => {
        render(<AchievementsList achievements={mockAchievements} />);
        
        expect(screen.getByText('First Purchase')).toBeInTheDocument();
        expect(screen.getByText('Make your first purchase')).toBeInTheDocument();
        expect(screen.getByText('Spender')).toBeInTheDocument();
        expect(screen.getByText('Spend $500')).toBeInTheDocument();
    });

    it('displays progress information correctly', () => {
        render(<AchievementsList achievements={mockAchievements} />);
        
        expect(screen.getByText('100/100 (100%)')).toBeInTheDocument();
        expect(screen.getByText('250/500 (50%)')).toBeInTheDocument();
    });

    it('shows unlocked badge for completed achievements', () => {
        render(<AchievementsList achievements={mockAchievements} />);
        
        expect(screen.getByText('✓ Unlocked')).toBeInTheDocument();
    });

    it('applies correct styling for unlocked achievements', () => {
        render(<AchievementsList achievements={mockAchievements} />);
        
        const firstAchievement = screen.getByText('First Purchase').closest('.rounded-lg');
        expect(firstAchievement).toHaveClass('border-green-200', 'bg-green-50');
    });

    it('applies correct styling for locked achievements', () => {
        render(<AchievementsList achievements={mockAchievements} />);
        
        const secondAchievement = screen.getByText('Spender').closest('.rounded-lg');
        expect(secondAchievement).toHaveClass('border-gray-200', 'bg-gray-50');
    });

    it('renders empty state when no achievements', () => {
        render(<AchievementsList achievements={[]} />);
        
        expect(screen.getByText('No achievements found')).toBeInTheDocument();
    });

    it('sets progress bar width based on progress percentage', () => {
        render(<AchievementsList achievements={mockAchievements} />);
        
        const progressBars = screen.getAllByRole('generic').filter(el => 
            el.style.width && el.className.includes('rounded-full')
        );
        
        expect(progressBars[0]).toHaveStyle('width: 100%');
        expect(progressBars[1]).toHaveStyle('width: 50%');
    });

    it('applies green color for unlocked achievement progress bar', () => {
        render(<AchievementsList achievements={mockAchievements} />);
        
        const progressBars = screen.getAllByRole('generic').filter(el => 
            el.className.includes('h-2 rounded-full')
        );
        
        expect(progressBars[0]).toHaveClass('bg-green-500');
        expect(progressBars[1]).toHaveClass('bg-blue-500');
    });
});