# Loyalty Service Architecture

## Overview

This is an event-driven microservice for handling loyalty program rewards, achievements, and badges.

## Core Components

### 1. Services

- **LoyaltyService** - Main business logic for processing purchase events
- **InMemoryQueueService** - File-based queue for handling purchase events (can be replaced with real message queues)

### 2. Events

- **AchievementUnlocked** - Broadcasted when a user unlocks an achievement
- **BadgeUnlocked** - Broadcasted when a user unlocks a badge

### 3. Models

- **Achievement** - Individual accomplishments (e.g., "First Purchase")
- **Badge** - Collection-based rewards requiring multiple achievements
- **UserAchievement** - User progress on achievements
- **UserBadge** - User's unlocked badges
- **Purchase** - Purchase records that trigger loyalty events

## Event Flow

1. Purchase events are added to the queue via `InMemoryQueueService::addPurchaseEvent()`
2. Queue is processed via `loyalty:process-queue` command
3. `LoyaltyService` processes each event:
   - Creates purchase record
   - Updates achievement progress
   - Checks for unlocked achievements
   - Updates badge progress based on completed achievements
   - Broadcasts events when achievements/badges are unlocked

## Achievement & Badge System

### Sample Achievements

These are present currently in the system via the *LoyaltySystemSeeder*.

- **First Purchase** - Make 1 purchase
- **Loyal Customer** - Make 5 purchases  
- **Big Spender** - Spend $100+ total
- **Weekend Warrior** - Make 3 weekend purchases
- **Shopaholic** - Make 10 purchases

### Sample Badges (based on achievement combinations)

- **Shopping Newbie** - First Purchase only
- **Regular Shopper** - First Purchase + Loyal Customer
- **VIP Customer** - Loyal Customer + Big Spender  
- **Shopping Champion** - All required achievements

## Console Commands

```bash
# Send test purchase event
php artisan loyalty:send-test-purchase {user_id} {amount} [--currency=NGN] [--method=credit_card]

# Process queued events
php artisan loyalty:process-queue

# Seed badges and achievements data to the DB
php artisan db:seed --class=LoyaltySystemSeeder
```

## Usage Example

```bash
# Add purchase events for user with ID of 1
php artisan loyalty:send-test-purchase 1 25.50
php artisan loyalty:send-test-purchase 1 35.00

# Process events to trigger loyalty system
php artisan loyalty:process-queue
```

## Extending the System

### Adding New Achievements

1. Create achievement in `LoyaltySystemSeeder`
2. Add logic in `LoyaltyService::calculateAchievementProgress()`

### Adding New Badge Types

1. Create badge in `LoyaltySystemSeeder`
2. Link to required achievements via pivot table

### Replacing Queue System

The `InMemoryQueueService` can be easily replaced with:

- Laravel Queues (Redis, Database, SQS)
- Apache Kafka
- RabbitMQ
- Any other message queue system

## Database Schema

The system uses the existing Laravel migrations in `database/migrations/` for:

- achievements
- badges  
- user_achievements (with progress tracking)
- user_badges
- achievement_badge (pivot table)
- purchases
