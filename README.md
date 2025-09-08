# Loyalty Service

A robust, event-driven loyalty program service built with Laravel backend and React frontend, featuring achievement tracking, badge unlocking, and cashback processing.

## Quick Start

**Non-Docker Setup:**
```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate
php artisan db:seed --class=LoyaltySystemSeeder
composer run dev
```

**Docker Setup:**
```bash
cp .env.docker.example .env.docker
docker-compose up -d
docker-compose exec backend php artisan key:generate
docker-compose exec backend php artisan migrate
```

**Access:**
- Application: http://localhost:5173 (non-Docker) or http://localhost (Docker)
- API: http://localhost:8000

**Test Credentials:**
- Admin: admin@loyalty.com / password
- User: user1@test.com / password

## Documentation

### Setup & Deployment
- **[Backend Setup](README-Backend.md)** - Laravel API setup, testing, and architecture
- **[API Documentation](API-DOCUMENTATION.md)** - Complete REST API reference with examples
- **[Frontend Setup](README-Frontend.md)** - React application setup, testing, and features  
- **[Docker Infrastructure](README-Docker.md)** - Complete Docker setup with MySQL, Kafka, Redis, and Nginx

### Key Features
- Event-driven architecture with achievement/badge unlocking
- Real-time cashback processing with mock payment integration
- Comprehensive test suites (Unit, Integration, E2E)
- Responsive React frontend with dark/light theme support
- Token-based authentication with Laravel Sanctum

### Testing
```bash
# Backend tests
composer test

# Frontend tests  
npm test
npm run test:e2e
```

## Architecture

**Backend:** Laravel with event-driven services, MySQL/SQLite database
**Frontend:** React + TypeScript with Shadcn/ui components
**Infrastructure:** Docker with Nginx, Redis, Kafka for production scalability

For detailed setup instructions, testing guides, and architecture decisions, see the individual documentation files above.