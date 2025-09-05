# Docker Infrastructure Setup

This project includes a complete Docker Compose setup for local development and production deployment.

## Services

- **MySQL**: Database server (port 3306)
- **Kafka + Zookeeper**: Message broker for event streaming (port 9092)  
- **Backend**: Laravel API (port 8000)
- **Frontend**: React/Vite development server (port 3000)
- **Nginx**: Reverse proxy (port 80) - *Routes traffic, serves static files, production-ready setup*
- **Redis**: Caching and session storage (port 6379) - *Improves performance, handles sessions*
- **Kafka UI**: Web interface for Kafka management (port 8080)

### Why These Services?

**Nginx**: Acts as a reverse proxy, routing API calls to the backend and frontend requests appropriately. In production, it efficiently serves static files and provides SSL termination.

**Redis**: Provides fast caching and session storage. Much faster than database or file-based sessions, especially important for scalability.

## Quick Start

1. **Copy and configure environment file**:

   ```bash
   cp .env.docker.example .env.docker
   ```

   Then edit `.env.docker` and update the placeholder values:
   - Set secure passwords for `DB_PASSWORD` and `DB_ROOT_PASSWORD`
   - Update other configuration as needed

2. **Build and start all services**:

   ```bash
   docker-compose up -d
   ```

3. **Generate application key** (first time only):

   ```bash
   docker-compose exec backend php artisan key:generate
   ```

4. **Run migrations**:

   ```bash
   docker-compose exec backend php artisan migrate
   ```

## Service Access

- **Application (via Nginx)**: <http://localhost>
- **Backend API**: <http://localhost:8000>
- **Frontend**: <http://localhost:3000>
- **MySQL**: localhost:3306
- **Kafka**: localhost:9092
- **Kafka UI**: <http://localhost:8080>
- **Redis**: localhost:6379

## Development Commands

```bash
# View logs
docker-compose logs -f [service_name]

# Execute commands in containers
docker-compose exec backend php artisan tinker
docker-compose exec backend composer install
docker-compose exec frontend npm install

# Restart services
docker-compose restart [service_name]

# Stop all services
docker-compose down

# Stop and remove volumes (warning: deletes data)
docker-compose down -v
```

## Environment Configuration

- **Setup**: Copy `.env.docker.example` to `.env.docker` and customize
- **Security**: Never commit `.env.docker` to version control - it contains sensitive data
- **Development**: Modify `docker-compose.override.yml` for dev-specific overrides

### Important Files

- `.env.docker.example`: Template file (safe to commit to Git)
- `.env.docker`: Your actual environment (DO NOT commit to Git)  
- `docker-compose.yml`: Main service definitions
- `docker-compose.override.yml`: Development overrides

## Database Credentials

- **Host**: mysql (internal) / localhost:3306 (external)
- **Database**: loyalty_service
- **Username**: loyalty_user
- **Password**: loyalty_password
- **Root Password**: root_password

## Kafka Topics

The Kafka service is ready for event streaming. Common topics for a loyalty service:

- `user.registered`
- `purchase.completed`
- `points.earned`
- `achievement.unlocked`

Create topics using:

```bash
docker-compose exec kafka kafka-topics --create --topic user.registered --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```
