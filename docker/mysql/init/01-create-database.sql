-- Create the loyalty service database if it doesn't exist
CREATE DATABASE IF NOT EXISTS loyalty_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges to the loyalty_user
GRANT ALL PRIVILEGES ON loyalty_service.* TO 'loyalty_user'@'%';
FLUSH PRIVILEGES;