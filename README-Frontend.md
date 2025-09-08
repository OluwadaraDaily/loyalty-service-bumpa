# Loyalty Service - Frontend Application

Documentation for frontend.

## Design Choices

### Technology Stack

- **React**: As required for the assessment, I used React on the frontend.
- **TypeScript**: Type-safe development with full IntelliSense support
- **Shadcn/ui**: High-quality, accessible component library for rapid prototyping and inbuilt responsiveness.

### Architecture Patterns

- **Custom Hooks Pattern**: API logic encapsulated in reusable hooks (`useDashboardData`, `usePurchaseProduct`)
- **Component Composition**: Flexible UI built with composable components
- **Layout System**: Consistent page structure with `AppLayout` wrapper
- **Server State Management**: TanStack Query for caching and synchronization

### Testing Strategy

- **Vitest**: I chose Vitest for unit testing because it requires little to no config, it fits in seamlessly since I am running a Vite-powered application and it is quite easier to get up to speed.
- **Cypress**: Selected for E2E testing due to familiarity and ability to run headless or with browser UI
- **MSW (Mock Service Worker)**: API mocking for isolated testing
- **Testing Library**: Component testing with user-centric approach

### Key Features

- **Real-time Updates**: Achievement notifications with animations using Framer Motion
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Theme Support**: Dark/light mode switching with persistent preferences
- **Performance**: Code splitting, lazy loading, and optimized bundle sizes

## How to Setup Project

### Prerequisites

- Node.js 18+
- npm or yarn

### Non-Docker Setup

1. **Install Dependencies**

```bash
npm install
```

2. **Start Development Server**

```bash
# Full stack (recommended - starts both backend and frontend)
composer run dev

# Frontend only
npm run dev
```

**Application URLs:**

- Application URL: <http://localhost:8000>

### Docker Setup

For complete Docker setup instructions including all services (MySQL, Kafka, Redis, Nginx), see [README-Docker.md](README-Docker.md).

## How to Run Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Interactive UI mode
npm run test:ui
```

### End-to-End Tests (Cypress)

```bash
# Run E2E tests headless
npm run test:e2e

# Open Cypress UI for debugging
npm run test:e2e:open
```

### Test Structure

**Unit Tests**

- Component behavior testing
- Custom hook logic validation
- Utility function testing

**Integration Tests**

- API hook integration with mock server
- Component interaction testing
- Data flow validation

**E2E Tests**

- Authentication flow (login/register/logout)
- Dashboard interactions (purchase simulation, achievements)
- Admin panel functionality (user management)
