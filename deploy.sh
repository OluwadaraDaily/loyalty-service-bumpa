#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Install Node.js dependencies
npm ci

# Build frontend assets
npm run build

# Create storage directories and set permissions
mkdir -p storage/logs
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p bootstrap/cache

# Generate application key if not exists
php artisan key:generate --force

# Clear and optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run database migrations
php artisan migrate --force

# Seed the database (optional - remove if you don't want to seed in production)
php artisan db:seed --class=LoyaltySystemSeeder --force

echo "Deployment completed successfully!"