-- TopStyle.bg — MySQL schema for the plain-PHP version of the site.
-- Import this once via phpMyAdmin (cPanel → phpMyAdmin → your DB → Import)
-- right after creating the database + user in cPanel's "MySQL Databases" tool.
-- Charset utf8mb4 so Cyrillic (Bulgarian) text and emoji (used in scarcity
-- badges) both store correctly.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS category (
  id VARCHAR(32) PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  parent_id VARCHAR(32) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES category(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product (
  id VARCHAR(32) PRIMARY KEY,
  sku VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  material VARCHAR(191) NOT NULL DEFAULT '',
  color VARCHAR(191) NOT NULL DEFAULT '',
  price_eur DECIMAL(10,2) NOT NULL,
  price_bgn DECIMAL(10,2) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  -- Manual pin position (1-8) - controls display order within the category
  -- page. NULL = no pin, falls back to newest-first.
  category_rank INT NULL,
  -- Comma-separated subset of: bestseller, new, limited, most_popular.
  -- Always set manually from the admin panel, never inferred automatically.
  badges VARCHAR(191) NOT NULL DEFAULT '',
  category_id VARCHAR(32) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES category(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_image (
  id VARCHAR(32) PRIMARY KEY,
  product_id VARCHAR(32) NOT NULL,
  url VARCHAR(500) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_variant (
  id VARCHAR(32) PRIMARY KEY,
  product_id VARCHAR(32) NOT NULL,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(191) NOT NULL DEFAULT '',
  stock INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_variant (product_id, size, color)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS review (
  id VARCHAR(32) PRIMARY KEY,
  product_id VARCHAR(32) NOT NULL,
  author_name VARCHAR(191) NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_user (
  id VARCHAR(32) PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(191) NOT NULL DEFAULT 'Admin',
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customer (
  id VARCHAR(32) PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL DEFAULT '',
  phone VARCHAR(50) NOT NULL DEFAULT '',
  address VARCHAR(500) NOT NULL DEFAULT '',
  city VARCHAR(191) NOT NULL DEFAULT '',
  -- Empty password_hash = record created from a guest order, no login account
  -- yet. Non-empty = the customer has registered and can log in.
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order` (
  id VARCHAR(32) PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id VARCHAR(32) NULL,
  guest_name VARCHAR(191) NOT NULL DEFAULT '',
  guest_email VARCHAR(191) NOT NULL DEFAULT '',
  guest_phone VARCHAR(50) NOT NULL DEFAULT '',
  address VARCHAR(500) NOT NULL DEFAULT '',
  city VARCHAR(191) NOT NULL DEFAULT '',
  delivery_method VARCHAR(50) NOT NULL DEFAULT '',
  office_name VARCHAR(255) NOT NULL DEFAULT '',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_bgn DECIMAL(10,2) NOT NULL,
  total_eur DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customer(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_item (
  id VARCHAR(32) PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  product_id VARCHAR(32) NULL,
  product_name VARCHAR(255) NOT NULL,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(191) NOT NULL DEFAULT '',
  qty INT NOT NULL,
  price_bgn DECIMAL(10,2) NOT NULL,
  price_eur DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES product(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_alert (
  id VARCHAR(32) PRIMARY KEY,
  product_id VARCHAR(32) NOT NULL,
  size VARCHAR(50) NOT NULL,
  color VARCHAR(191) NOT NULL DEFAULT '',
  email VARCHAR(191) NOT NULL,
  notified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
  INDEX idx_stock_alert_lookup (product_id, size, color)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_attempt (
  id VARCHAR(32) PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempt_key (`key`, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed one admin account so you can log in immediately after import.
-- Email: admin@topstyle.bg  Password: ChangeMe123!
-- CHANGE THIS PASSWORD immediately after first login (there's no "forgot
-- password" flow yet, so if you lose it you'd need to re-run an INSERT here).
-- The hash below is a real bcrypt hash of 'ChangeMe123!' (verified working
-- with PHP's password_verify() - bcrypt hashes are cross-compatible
-- regardless of which language generated them).
INSERT IGNORE INTO admin_user (id, email, password_hash, name, role)
VALUES (
  'admin-seed-1',
  'admin@topstyle.bg',
  '$2a$10$/a0OxqSoSeiXcaynCdxe7eee0XL/1eY4Wc7RX.s9kxBodA9CCptj.',
  'Admin',
  'admin'
);
