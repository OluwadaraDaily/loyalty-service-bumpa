# Backend Testing Guide - Loyalty Service

## Overview

Comprehensive testing plan for the loyalty service backend based on the Bumpa assessment requirements. The service handles achievement/badge unlocking, cashback processing, API endpoints, and message queue events.

## Testing Strategy

### 1. Unit Tests

Test individual components in isolation with mocked dependencies.

**LoyaltyService Tests:**

- Test purchase event processing succeeds with valid data
- Test achievement unlocking when criteria are met (first purchase, big spender, loyal customer, weekend warrior)
- Test badge unlocking when required achievements are completed  
- Test achievement progress calculation for different types
- Test badge progress percentage calculation
- Test database transaction rollback on errors
- Test user not found scenarios
- Test cashback integration calls

**CashbackService Tests:**

- Test cashback processing for eligible purchases
- Test ineligible purchase handling (returns null)
- Test idempotency key prevents duplicate cashback
- Test payment success and failure scenarios
- Test retry mechanism with max attempts
- Test cashback status retrieval by idempotency key
- Test payment provider integration
- Test error handling and event dispatching

**CashbackCalculationService Tests:**

- Test base cashback percentage calculation (2% of purchase)
- Test achievement bonus additions (50 NGN per new achievement)
- Test badge multiplier applications (bronze 1.1x, silver 1.25x, gold 1.5x)
- Test combined bonuses and multipliers
- Test minimum purchase threshold eligibility
- Test different currency handling

**MockPaymentService Tests:**

- Test successful transfer simulation
- Test various failure scenarios (insufficient funds, network errors, invalid recipient)
- Test retryable vs non-retryable error identification
- Test transaction reference generation
- Test provider name return

### 2. Integration Tests

Test component interactions and API endpoints.

**User API Endpoint Tests:**

- Test GET /api/users/{user}/achievements returns user progress
- Test GET /api/users/{user}/dashboard-stats returns statistics
- Test POST /api/users/{user}/purchase processes purchase events
- Test POST /api/users/{user}/simulate-achievement unlocks achievements
- Test authentication requirements
- Test authorization (users can't access other users' data)
- Test request validation
- Test response structure and data accuracy

**Admin API Endpoint Tests:**

- Test GET /api/admin/users/achievements returns all users' progress
- Test admin role requirement
- Test comprehensive user statistics
- Test summary data aggregation
- Test authentication and authorization

**Database Integration Tests:**

- Test model relationships work correctly
- Test database transactions maintain consistency
- Test migration and seeder functionality
- Test constraint handling

### 3. Event-Driven Tests

Test message queue processing and event handling.

**Queue Processing Tests:**

- Test purchase events are processed from in-memory queue
- Test multiple events processed in batch
- Test queue persistence between requests
- Test invalid event handling
- Test queue clearing after processing
- Test concurrent access scenarios

**Event Listener Tests:**

- Test AchievementUnlocked events are logged correctly
- Test BadgeUnlocked events are logged correctly
- Test CashbackCompleted event handling
- Test CashbackFailed event handling with retry flags
- Test event dispatching occurs at right times

### 4. End-to-End Tests

Test complete user workflows.

**Purchase to Cashback Workflow:**

- Test full purchase flow: purchase → achievement unlock → badge progress → cashback processing
- Test multiple purchases leading to badge unlocking
- Test admin panel visibility of user progress
- Test queue processing under load (stress testing)
- Test error scenarios don't break the workflow
- Test data consistency across all components

**Performance Tests:**

- Test queue processing time with large number of events
- Test concurrent queue access handling
- Test database performance with multiple users
- Test API response times under load

## Test Organization Structure

```bash
tests/
├── Unit/
│   ├── Services/
│   │   ├── LoyaltyServiceTest.php
│   │   ├── CashbackServiceTest.php
│   │   ├── CashbackCalculationServiceTest.php
│   │   └── MockPaymentServiceTest.php
│   └── Models/ (test model methods and relationships)
├── Feature/
│   ├── Api/
│   │   ├── UserAchievementApiTest.php
│   │   └── AdminAchievementApiTest.php
│   ├── Events/
│   │   ├── QueueProcessingTest.php
│   │   └── EventListenerTest.php
│   └── E2E/
│       └── PurchaseToCashbackE2ETest.php
└── Performance/
    └── QueuePerformanceTest.php
```

## Test Data Management

- Use Laravel factories for consistent test data creation
- Use RefreshDatabase trait for clean test state
- Mock external dependencies (payment services)
- Create reusable test utilities in base TestCase
- Use Event::fake() for event testing
- Use database transactions for isolation

## Coverage Goals

- **Overall**: 80%+ code coverage
- **Service Classes**: 90%+ (critical business logic)
- **API Controllers**: 85%+ (user-facing functionality)
- **Models**: 75%+ (relationships and methods)
- **Event Handlers**: 100% (simple but critical)

## Test Execution

- Run all tests: `./vendor/bin/phpunit`
- Run unit tests only: `./vendor/bin/phpunit --testsuite=Unit`
- Run feature tests only: `./vendor/bin/phpunit --testsuite=Feature`
- Generate coverage report: `./vendor/bin/phpunit --coverage-html coverage`
- Run specific test file: `./vendor/bin/phpunit tests/Unit/Services/LoyaltyServiceTest.php`

## CI/CD Integration

- GitHub Actions workflow for automated testing
- MySQL service for realistic database testing
- Code coverage reporting
- Test failure notifications
- Performance monitoring

## Key Testing Principles

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Use descriptive test names** - Should read like specifications
3. **Arrange-Act-Assert pattern** - Clear test structure
4. **One assertion per test** - Keep tests focused
5. **Mock external dependencies** - Isolate units under test
6. **Test edge cases** - Error conditions, boundary values
7. **Maintain test data independence** - Tests shouldn't depend on each other

This testing strategy ensures comprehensive coverage of all assessment requirements while maintaining code quality and reliability.
