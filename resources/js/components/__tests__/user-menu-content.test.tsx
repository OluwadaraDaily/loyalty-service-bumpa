import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserMenuContent } from '../user-menu-content';
import { router } from '@inertiajs/react';
import type { User } from '@/types';

// Mock InertiaJS
vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href, method, as, onClick, className }: any) => (
        <button 
            data-testid="logout-button" 
            onClick={onClick}
            className={className}
        >
            {children}
        </button>
    ),
    router: {
        flushAll: vi.fn(),
    },
}));

// Mock hooks
vi.mock('@/hooks/use-mobile-navigation', () => ({
    useMobileNavigation: () => vi.fn(),
}));

// Mock UserInfo component
vi.mock('@/components/user-info', () => ({
    UserInfo: ({ user, showEmail }: { user: User; showEmail: boolean }) => (
        <div data-testid="user-info">
            {user.name} {showEmail && user.email}
        </div>
    ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
    LogOut: ({ className }: { className?: string }) => (
        <div data-testid="logout-icon" className={className} />
    ),
}));

const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'customer',
};

// Mock the dropdown menu components
vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenuLabel: ({ children, className }: any) => <div className={className}>{children}</div>,
    DropdownMenuSeparator: () => <div data-testid="separator" />,
    DropdownMenuItem: ({ children, asChild, ...props }: any) => 
        asChild ? children : <div {...props}>{children}</div>,
}));

describe('UserMenuContent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders user info with email', () => {
        render(<UserMenuContent user={mockUser} />);
        
        expect(screen.getByTestId('user-info')).toBeInTheDocument();
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe john@example.com');
    });

    it('renders logout button with icon', () => {
        render(<UserMenuContent user={mockUser} />);
        
        expect(screen.getByTestId('logout-button')).toBeInTheDocument();
        expect(screen.getByText('Log out')).toBeInTheDocument();
        expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });

    it('calls cleanup when logout is clicked', () => {
        const mockCleanup = vi.fn();
        vi.mocked(require('@/hooks/use-mobile-navigation').useMobileNavigation).mockReturnValue(mockCleanup);
        
        render(<UserMenuContent user={mockUser} />);
        
        fireEvent.click(screen.getByTestId('logout-button'));
        
        expect(mockCleanup).toHaveBeenCalled();
    });

    it('applies correct styling classes', () => {
        render(<UserMenuContent user={mockUser} />);
        
        const logoutButton = screen.getByTestId('logout-button');
        expect(logoutButton).toHaveClass('block', 'w-full');
    });

    it('renders with proper menu structure', () => {
        render(<UserMenuContent user={mockUser} />);
        
        // Should have user info section
        expect(screen.getByTestId('user-info')).toBeInTheDocument();
        
        // Should have logout section
        expect(screen.getByText('Log out')).toBeInTheDocument();
    });
});