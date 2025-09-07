import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CurrentBadge } from '../current-badge';
import { User } from '@/hooks/api/use-dashboard-data';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Star: ({ className }: { className?: string }) => <div data-testid="star-icon" className={className} />,
    Trophy: ({ className }: { className?: string }) => <div data-testid="trophy-icon" className={className} />,
}));

const mockUserWithBadge: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    current_badge: {
        id: 1,
        name: 'Bronze Member',
        icon_url: null,
    },
};

const mockUserWithoutBadge: User = {
    id: 2,
    name: 'Jane Doe',
    email: 'jane@example.com',
    current_badge: null,
};

describe('CurrentBadge', () => {
    it('renders current badge title with star icon', () => {
        render(<CurrentBadge user={mockUserWithBadge} />);
        
        expect(screen.getByText('Current Badge')).toBeInTheDocument();
        expect(screen.getByTestId('star-icon')).toBeInTheDocument();
        expect(screen.getByTestId('star-icon')).toHaveClass('text-yellow-500');
    });

    it('displays user badge when available', () => {
        render(<CurrentBadge user={mockUserWithBadge} />);
        
        expect(screen.getByText('Bronze Member')).toBeInTheDocument();
        expect(screen.getByText('Current Status')).toBeInTheDocument();
        
        const trophyIcon = screen.getByTestId('trophy-icon');
        expect(trophyIcon).toHaveClass('text-white');
    });

    it('displays no badge state when user has no badge', () => {
        render(<CurrentBadge user={mockUserWithoutBadge} />);
        
        expect(screen.getByText('No Badge Yet')).toBeInTheDocument();
        expect(screen.getByText('Complete achievements to unlock')).toBeInTheDocument();
        
        const trophyIcon = screen.getByTestId('trophy-icon');
        expect(trophyIcon).toHaveClass('text-gray-500');
    });

    it('applies correct styling for badge container when badge exists', () => {
        render(<CurrentBadge user={mockUserWithBadge} />);
        
        const badgeContainer = screen.getByText('Bronze Member').closest('div')?.previousElementSibling;
        expect(badgeContainer).toHaveClass('bg-gradient-to-br', 'from-yellow-400', 'to-orange-500');
    });

    it('applies correct styling for no badge container', () => {
        render(<CurrentBadge user={mockUserWithoutBadge} />);
        
        const noBadgeContainer = screen.getByText('No Badge Yet').closest('div')?.previousElementSibling;
        expect(noBadgeContainer).toHaveClass('bg-gray-200');
    });

    it('applies muted styling for no badge text', () => {
        render(<CurrentBadge user={mockUserWithoutBadge} />);
        
        const noBadgeText = screen.getByText('No Badge Yet');
        expect(noBadgeText).toHaveClass('text-muted-foreground');
    });
});