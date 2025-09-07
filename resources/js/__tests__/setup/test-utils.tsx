import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// Mock Inertia components and hooks globally
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
    usePage: vi.fn(() => ({
        props: {
            auth: {
                user: {
                    id: 1,
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: 'customer',
                },
            },
        },
        url: '/dashboard',
        component: 'Dashboard',
    })),
    router: {
        flushAll: vi.fn(),
    },
}));

// Mock toast notifications
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Gift: () => <div data-testid="gift-icon" />,
    ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
    Star: () => <div data-testid="star-icon" />,
    Trophy: () => <div data-testid="trophy-icon" />,
    TrendingUp: () => <div data-testid="trending-up-icon" />,
    DollarSign: () => <div data-testid="dollar-sign-icon" />,
    CreditCard: () => <div data-testid="credit-card-icon" />,
    Clock: () => <div data-testid="clock-icon" />,
    ShoppingBag: () => <div data-testid="shopping-bag-icon" />,
    Sparkles: ({ className }: { className?: string }) => <div data-testid="sparkles-icon" className={className} />,
}));

// Mock layouts
vi.mock('@/layouts/app-layout', () => ({
    default: ({ children, breadcrumbs }: { children: ReactNode; breadcrumbs?: any }) => (
        <div data-testid="app-layout">
            <div data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</div>
            {children}
        </div>
    ),
}));

// Mock routes
vi.mock('@/routes', () => ({
    dashboard: () => ({ url: '/dashboard' }),
}));

// Mock products
vi.mock('@/constants/products', () => ({
    getRandomProduct: vi.fn(() => ({
        id: 'prod_test',
        name: 'Test Product',
        category: 'Test Category',
        amount: 1000,
        currency: 'NGN',
        description: 'Test product description',
    })),
}));

// Create a custom render function that includes providers
function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    queryClient?: QueryClient;
}

function customRender(ui: ReactElement, options: CustomRenderOptions = {}) {
    const { queryClient = createTestQueryClient(), ...renderOptions } = options;

    const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
        queryClient,
    };
}

export * from '@testing-library/react';
export { customRender as render, createTestQueryClient };