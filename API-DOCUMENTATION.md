# Loyalty Service API Documentation

A comprehensive REST API for managing loyalty programs, achievements, badges, and cashback processing.

## Base URL

**Development:** `http://localhost:8000/api`  
**Docker:** `http://localhost/api`

## Authentication

All protected endpoints require authentication using Laravel Sanctum. Include the token in the Authorization header:

```http
Authorization: Bearer {token}
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/register` | Register new user | No | - |
| POST | `/login` | User login | No | - |
| POST | `/logout` | User logout | Yes | user/admin |
| GET | `/user` | Get current user | Yes | user/admin |
| GET | `/users/{user}/achievements` | Get user achievements | Yes | user |
| GET | `/users/{user}/dashboard-stats` | Get user statistics | Yes | user |
| POST | `/users/{user}/simulate-achievement` | Simulate achievement unlock | Yes | user |
| POST | `/users/{user}/purchase` | Process purchase event | Yes | user |
| GET | `/admin/users/achievements` | Get all users achievements | Yes | admin |

---

## Authentication Endpoints

### Register User

```http
POST /api/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "token": "1|abc123def456..."
}
```

**Error Response (422):**
```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

### Login User

```http
POST /api/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "1|abc123def456..."
}
```

**Error Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

### Logout User

```http
POST /api/logout
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User

```http
GET /api/user
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

## User Achievement Endpoints

### Get User Achievements

```http
GET /api/users/{user}/achievements
Authorization: Bearer {token}
```

**Path Parameters:**
- `user` (integer) - User ID

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "current_badge": {
      "id": 1,
      "name": "Bronze",
      "description": "Your first achievement badge",
      "icon_url": "https://example.com/bronze.png"
    }
  },
  "achievements": [
    {
      "id": 1,
      "name": "First Purchase",
      "description": "Make your first purchase",
      "points_required": 1,
      "progress": 1,
      "progress_percentage": 100,
      "unlocked": true,
      "unlocked_at": "2025-01-15T10:30:00Z",
      "badges": [
        {
          "id": 1,
          "name": "Bronze",
          "description": "Your first achievement badge",
          "icon_url": "https://example.com/bronze.png"
        }
      ]
    }
  ],
  "badges": [
    {
      "id": 1,
      "name": "Bronze",
      "description": "Your first achievement badge",
      "icon_url": "https://example.com/bronze.png",
      "type": "achievement",
      "points_required": 1,
      "progress": 1,
      "progress_percentage": 100,
      "unlocked": true,
      "unlocked_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Get User Dashboard Statistics

```http
GET /api/users/{user}/dashboard-stats
Authorization: Bearer {token}
```

**Path Parameters:**
- `user` (integer) - User ID

**Response (200):**
```json
{
  "statistics": {
    "total_purchases": 5,
    "total_spent": "12,500.00",
    "total_cashback": "625.00",
    "pending_cashback": "125.00"
  },
  "recent_activity": {
    "purchases": [
      {
        "id": 1,
        "amount": 2500,
        "created_at": "2025-01-15T10:00:00Z"
      }
    ],
    "cashbacks": [
      {
        "id": 1,
        "amount": 125,
        "status": "completed",
        "created_at": "2025-01-15T10:05:00Z"
      }
    ]
  }
}
```

### Simulate Achievement Unlock

```http
POST /api/users/{user}/simulate-achievement
Authorization: Bearer {token}
```

**Path Parameters:**
- `user` (integer) - User ID

**Response (200) - Success:**
```json
{
  "success": true,
  "message": "Achievement unlocked successfully!",
  "achievement": {
    "id": 2,
    "name": "Loyal Customer",
    "description": "Make 5 purchases"
  },
  "badges": [
    {
      "id": 2,
      "name": "Silver",
      "description": "Advanced customer badge",
      "icon_url": "https://example.com/silver.png"
    }
  ],
  "should_refresh": true
}
```

**Response (200) - No achievements available:**
```json
{
  "success": false,
  "message": "No achievements available to unlock"
}
```

### Process Purchase Event

```http
POST /api/users/{user}/purchase
Authorization: Bearer {token}
```

**Path Parameters:**
- `user` (integer) - User ID

**Request Body:**
```json
{
  "user_id": 1,
  "amount": 2500,
  "currency": "NGN",
  "payment_method": "card",
  "payment_reference": "TXN_ABC123DEF456",
  "status": "completed",
  "timestamp": "2025-01-15T10:00:00Z",
  "metadata": {
    "product_name": "Premium Subscription",
    "product_id": "prod_123",
    "category": "subscription"
  }
}
```

**Response (200) - Success:**
```json
{
  "success": true,
  "message": "Purchase processed successfully",
  "purchase_reference": "TXN_ABC123DEF456",
  "should_refresh": true,
  "newly_unlocked_achievements": [
    {
      "id": 3,
      "name": "Big Spender",
      "description": "Spend over ₦2,000 in a single purchase"
    }
  ],
  "newly_unlocked_badges": [
    {
      "id": 3,
      "name": "Gold",
      "description": "Premium customer badge",
      "icon_url": "https://example.com/gold.png"
    }
  ],
  "show_unlock_animation": true
}
```

**Response (500) - Error:**
```json
{
  "success": false,
  "message": "Failed to process purchase"
}
```

---

## Admin Endpoints

### Get All Users Achievements

```http
GET /api/admin/users/achievements
Authorization: Bearer {token}
```

**Headers:**
- `Authorization: Bearer {admin_token}` - Admin role required

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "total_achievements": 5,
      "unlocked_achievements": 3,
      "current_badge": {
        "id": 2,
        "name": "Silver",
        "description": "Advanced customer badge",
        "icon_url": "https://example.com/silver.png"
      },
      "created_at": "2025-01-15"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "total_achievements": 5,
      "unlocked_achievements": 1,
      "current_badge": {
        "id": 1,
        "name": "Bronze",
        "description": "Your first achievement badge",
        "icon_url": "https://example.com/bronze.png"
      },
      "created_at": "2025-01-16"
    }
  ],
  "total_users": 2,
  "total_achievements_unlocked": 4,
  "total_badges_earned": 4
}
```

---

## Error Responses

### Authentication Errors

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated"
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied. Admin role required."
}
```

### Validation Errors

**422 Unprocessable Entity:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Server Errors

**500 Internal Server Error:**
```json
{
  "message": "Internal server error"
}
```

---

## Rate Limiting

API endpoints are rate-limited:
- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 60 requests per minute per user
- **Admin endpoints**: 100 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642617600
```

---

## Event System

The API implements an event-driven architecture:

### Purchase Event Flow

1. **Purchase Request** → `POST /api/users/{user}/purchase`
2. **Queue Processing** → Events added to in-memory queue
3. **Achievement Processing** → `LoyaltyService::processLoyaltyRewards()`
4. **Badge Unlocking** → Automatic badge assignment
5. **Cashback Processing** → `CashbackService::processCashback()`

### Events Triggered

- `AchievementUnlocked` - When user unlocks an achievement
- `BadgeUnlocked` - When user earns a new badge
- `CashbackInitiated` - When cashback processing starts
- `CashbackCompleted` - When cashback payment succeeds
- `CashbackFailed` - When cashback payment fails

---

## Testing the API

### Using cURL

```bash
# Register a new user
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'

# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get user achievements (replace TOKEN and USER_ID)
curl -X GET http://localhost:8000/api/users/1/achievements \
  -H "Authorization: Bearer TOKEN"
```

### Test Credentials

**Admin User:**
- Email: `admin@loyalty.com`
- Password: `password`

**Regular User:**
- Email: `user1@test.com` 
- Password: `password`

---

## Implementation Notes

### Queue System
The API uses an in-memory file-based queue system (`InMemoryQueueService`) that simulates real message queue behavior for development and testing.

### Payment Integration
Cashback processing uses `MockPaymentService` which simulates real payment provider responses with configurable success/failure rates.

### Database Relationships
- Users have many Achievements (pivot: progress, unlocked, unlocked_at)
- Users have many Badges (pivot: progress, unlocked, unlocked_at)  
- Achievements have many Badges (many-to-many relationship)
- Users have many Purchases and Cashbacks

### Security Features
- CSRF protection via Laravel Sanctum
- Role-based access control (user/admin)
- Request validation and sanitization
- Rate limiting on all endpoints

---

## Support

For API support and questions:
- Check the main [README.md](README.md) for setup instructions
- Review [Backend Documentation](README-Backend.md) for development details
- See [Testing Guide](TESTING.md) for test execution