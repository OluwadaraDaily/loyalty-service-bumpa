# Testing Guide

This project uses a comprehensive testing strategy with both **unit/integration tests (Vitest)** and **end-to-end tests (Cypress)**.

## Testing Stack

- **Vitest** - Fast unit and integration tests
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking for integration tests
- **Cypress** - End-to-end testing for full user workflows

## Running Tests

### Unit & Integration Tests (Vitest)
```bash
# Run all unit/integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Open test UI
npm run test:ui
```

### End-to-End Tests (Cypress)
```bash
# Run E2E tests headlessly
npm run test:e2e

# Open Cypress interactive mode
npm run test:e2e:open
```

## Test Structure

### Unit Tests (`**/__tests__/**` or `**.test.*`)
- ✅ **35 tests passing**
- Test individual components and hooks in isolation
- Fast execution with comprehensive mocking

**Test Files:**
- `resources/js/hooks/__tests__/use-initials.test.tsx` - Utility hook tests
- `resources/js/components/__tests__/user-menu-content.test.tsx` - Component tests  
- `resources/js/components/dashboard/__tests__/achievements-list.test.tsx` - Dashboard component tests
- `resources/js/components/dashboard/__tests__/current-badge.test.tsx` - Badge component tests

### Integration Tests (`**/__tests__/integration/**`)
- ✅ **7 tests passing**
- Test how multiple components work together
- Use MSW for realistic API mocking

**Test Files:**
- `resources/js/__tests__/integration/hooks-components.integration.test.tsx` - Component integration tests

### End-to-End Tests (`cypress/e2e/**`)
- Test complete user workflows in real browser
- Cover authentication, dashboard, and purchase flows

**Test Files:**
- `cypress/e2e/authentication.cy.ts` - Login, registration, logout flows
- `cypress/e2e/dashboard.cy.ts` - Dashboard loading, display, interactions
- `cypress/e2e/purchase-flow.cy.ts` - Purchase workflows and achievement unlocking

## Test Coverage

### Unit Tests Cover:
- ✅ Component rendering and props handling
- ✅ User interactions (clicks, form submissions)
- ✅ Conditional rendering based on state
- ✅ CSS class applications and styling
- ✅ Hook behavior and return values
- ✅ Error boundary handling

### Integration Tests Cover:
- ✅ API data flow to multiple components
- ✅ Component state synchronization
- ✅ Error handling across component boundaries
- ✅ Loading states and async behavior
- ✅ Purchase flow with API integration
- ✅ Error recovery and retry mechanisms

### E2E Tests Cover:
- 🚀 Full authentication flows (login, registration, logout)
- 🚀 Complete dashboard experience with real data
- 🚀 Purchase workflows with achievement notifications
- 🚀 Cross-browser compatibility testing
- 🚀 Responsive design testing (mobile, tablet, desktop)
- 🚀 Error handling and network failure scenarios
- 🚀 Session management and route protection

## Key Testing Features

### Realistic API Mocking
- **MSW** intercepts actual HTTP requests
- Tests use real network calls (just mocked responses)
- Supports error scenarios, delays, and edge cases

### Comprehensive Component Testing
```typescript
// Example: Testing component with API integration
function TestComponent() {
    const { data, isLoading, error } = useDashboardData(1);
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading data</div>;
    return <AchievementsList achievements={data.achievements} />;
}
```

### Real Browser E2E Testing
```typescript
// Example: Testing purchase flow
cy.get('button').contains('Random Purchase').click();
cy.wait('@purchase');
cy.contains('Achievement Unlocked!').should('be.visible');
```

## Test Data Management

### Fixtures for E2E Tests
- `cypress/fixtures/dashboard-data.json` - Mock dashboard data
- `cypress/fixtures/dashboard-stats.json` - Mock statistics data

### MSW Handlers for Integration Tests
- `resources/js/__tests__/setup/msw-handlers.ts` - API response definitions
- Covers success scenarios, error cases, and edge conditions

## Custom Testing Utilities

### Vitest Test Utils
- `resources/js/__tests__/setup/test-utils.tsx` - Custom render function with providers
- Pre-configured React Query client for tests
- Comprehensive mocking setup

### Cypress Commands
- `cypress/support/commands.ts` - Custom Cypress commands
- `cy.login()` - Authenticate users
- `cy.waitForInertia()` - Wait for page transitions
- `cy.mobile()`, `cy.tablet()`, `cy.desktop()` - Viewport helpers

## Debugging Tests

### Vitest Debugging
```bash
# Run specific test file
npm test -- hooks-components.integration.test.tsx

# Debug with UI
npm run test:ui
```

### Cypress Debugging
```bash
# Open interactive mode for debugging
npm run test:e2e:open

# Run specific spec
npx cypress run --spec "cypress/e2e/dashboard.cy.ts"
```

## Test Environment Setup

### Prerequisites for E2E Tests
1. Laravel app running on `http://localhost:8000`
2. Database seeded with test data
3. All API endpoints functional

### Environment Variables
```bash
# Cypress configuration
CYPRESS_baseUrl=http://localhost:8000
```

## Best Practices

### Unit Tests
- Mock external dependencies
- Test component behavior, not implementation
- Use descriptive test names
- Group related tests with `describe` blocks

### Integration Tests  
- Use MSW for realistic API mocking
- Test component interactions and data flow
- Verify error handling and loading states
- Keep tests focused on specific integration scenarios

### E2E Tests
- Test complete user workflows
- Use data attributes for element selection
- Handle async operations with `cy.wait()`
- Test responsive behavior across viewports
- Include error scenarios and edge cases

## CI/CD Integration

```bash
# Add to CI pipeline
npm test                    # Run unit/integration tests
npm run test:e2e           # Run E2E tests (requires running app)
```

## Troubleshooting

### Common Issues
1. **Inertia.js mocking** - Use integration tests for complex components
2. **API timing** - Use MSW delays for testing loading states  
3. **Test isolation** - Each test should be independent
4. **Cypress waiting** - Always wait for API calls and page loads

### Performance Tips
- Use `vi.mock()` for heavy dependencies
- Limit E2E test scope to critical user flows
- Run unit tests frequently, E2E tests on deployment
- Use Cypress component testing for isolated component E2E tests

This testing setup provides comprehensive coverage from unit level to full end-to-end user workflows, ensuring reliable and maintainable code.