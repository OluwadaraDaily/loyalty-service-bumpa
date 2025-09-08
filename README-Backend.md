# Loyalty Service - Backend API

Documentation for Backend

## Design Choices

### Architecture Overview

- **Event-Driven Architecture**: As requested in the assessment, I implemented an event-driven architecture where purchase events trigger achievement/badge unlocking and cashback processing through Laravel's event system
- **Service Layer Pattern**: I ensured that dedicated services (LoyaltyService, CashbackService, MockPaymentService) encapsulate business logic and that they were separated to make sure concerns are separate.
- **Laravel Sanctum**: Token-based authentication for both session and API authentication. This is the recommended way to handle auth in Laravel, I went with it.
- **MySQL Database**: I used MySQL because of scalability in the design.
- **Nginx**: I added Nginx in the Docker to help with security concerns in production (if it ever gets there...)

### Core Services

1. **LoyaltyService**: Processes purchase events, evaluates achievements, unlocks badges, and triggers cashback
2. **CashbackService**: Handles cashback calculations and mock payment processing with retry mechanisms
3. **MockPaymentService**: Simulates real payment provider with configurable success/failure rates. I opted for this rather than integration to Paystack/Flutterwave because of time constraints
4. **InMemoryQueueService**: Manages event queue processing for testing purposes. Like above, I had issues inetgrating with Kafka, as such, I implemented an in-memory queue.

### Badge-Achievement Relationship

I came up with this relationship between badges and achievements. Badges are unlocked when users complete specific combinations of achievements. Each badge requires a set of achievements to be completed, creating a progression system where individual achievements lead to badge rewards:

- **Bronze Badge**: Requires 1 achievement
- **Silver Badge**: Requires 2 achievements  
- **Gold Badge**: Requires all 4 achievements

### Purchase Flow

1. User makes purchase → Purchase record created
2. System evaluates all achievements against user's progress
3. Newly unlocked achievements trigger badge evaluation
4. Eligible cashback calculated based on achievements/badges unlocked
5. Events fired (AchievementUnlocked, BadgeUnlocked)
6. Cashback payment initiated through mock payment service

## How to Setup Project

### Prerequisites

- PHP 8.2+
- Composer
- Node.js & npm
- SQLite (default) or MySQL

### Non-Docker Setup

1. **Install Dependencies**

```bash
composer install
npm install
```

2. **Environment Setup**

```bash
cp .env.example .env
php artisan key:generate
```

3. **Database Setup**

```bash
# Create SQLite database
touch database/database.sqlite

# Run migrations
php artisan migrate

# Seed with sample data (admin user, test users, achievements, badges)
php artisan db:seed --class=LoyaltySystemSeeder
```

4. **Start Development Server**

```bash
# Option 1: All services (recommended)
composer run dev

# Option 2: Manual startup
php artisan serve &
php artisan queue:listen &
npm run dev
```

**Application URLs:**

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8000>

### Docker Setup

For complete Docker setup instructions including all services (MySQL, Kafka, Redis, Nginx), see [README-Docker.md](README-Docker.md).

### Sample Data Created

- **Admin User**: <admin@loyalty.com> / password
- **Test Users**: <user1@test.com>, <user2@test.com> / password
- **4 Achievements**: First Purchase, Big Spender, Loyal Customer, Weekend Warrior
- **3 Badges**: Bronze, Silver, Gold with different achievement requirements

## How to Run Tests

### Running Tests

```bash
# Run all tests
composer test

# Run specific test suites
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Run with coverage
php artisan test --coverage

# Run specific test files
php artisan test tests/Feature/Api/UserAchievementApiTest.php
php artisan test tests/Unit/Services/LoyaltyServiceTest.php
```

### Test Structure

**Unit Tests** (`tests/Unit/`)

- Service layer business logic
- Model relationships and methods
- Cashback calculation logic

**Feature Tests** (`tests/Feature/`)

- API endpoint functionality
- Authentication and authorization
- Database integration

**E2E Tests** (`tests/Feature/E2E/`)

- Complete purchase-to-cashback workflows
- Event processing validation
