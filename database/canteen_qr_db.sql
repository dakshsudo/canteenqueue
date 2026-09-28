-- ============================================================================
--  CanteenQ  -  Canteen Token QR Queue Tracker
--  Database file : canteen_qr_db.sql
--  Target        : XAMPP MariaDB 10.4.x / MySQL 5.7+ / 8.x  (phpMyAdmin import)
--  Charset       : utf8mb4 / utf8mb4_unicode_ci   Engine: InnoDB
--
--  HOW TO IMPORT (phpMyAdmin):
--    1. Start Apache + MySQL in XAMPP.
--    2. Open http://localhost/phpmyadmin
--    3. Click the "Import" tab (top menu, no database needs to be selected).
--    4. Choose this file -> Format: SQL -> click "Import".
--    The script creates the database `canteen_qr_db` itself.
--
--  DEFAULT LOGINS (CHANGE AFTER FIRST LOGIN / BEFORE DEMO):
--    admin    : admin@canteen.local    / Admin@123
--    staff    : staff@canteen.local    / Staff@123
--    student  : student@college.local  / Student@123
--  Passwords are stored as bcrypt hashes (PHP password_hash / password_verify).
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+05:30';
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE IF NOT EXISTS `canteen_qr_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `canteen_qr_db`;

-- ----------------------------------------------------------------------------
-- Drop in reverse dependency order so the file can be re-imported safely
-- ----------------------------------------------------------------------------
DROP VIEW  IF EXISTS `v_daily_sales`;
DROP VIEW  IF EXISTS `v_live_queue`;
DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `token_counters`;
DROP TABLE IF EXISTS `menu_items`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `auth_tokens`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `users`;

-- ============================================================================
-- 1. users
-- ============================================================================
CREATE TABLE `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100) NOT NULL,
  `email`         VARCHAR(150) NOT NULL,
  `phone`         VARCHAR(20)  DEFAULT NULL,
  `college_id`    VARCHAR(50)  DEFAULT NULL COMMENT 'Roll number / staff ID',
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('student','staff','admin') NOT NULL DEFAULT 'student',
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `last_login_at` DATETIME     DEFAULT NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. auth_tokens  (API bearer tokens; only the SHA-256 hash is stored)
-- ============================================================================
CREATE TABLE `auth_tokens` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64)     NOT NULL COMMENT 'sha256 of the raw bearer token',
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(45)  DEFAULT NULL,
  `expires_at` DATETIME     NOT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_auth_token_hash` (`token_hash`),
  KEY `idx_auth_user` (`user_id`),
  KEY `idx_auth_expires` (`expires_at`),
  CONSTRAINT `fk_auth_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. categories
-- ============================================================================
CREATE TABLE `categories` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(80)  NOT NULL,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. menu_items
-- ============================================================================
CREATE TABLE `menu_items` (
  `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`        INT UNSIGNED NOT NULL,
  `name`               VARCHAR(120) NOT NULL,
  `description`        VARCHAR(255) DEFAULT NULL,
  `price`              DECIMAL(8,2) NOT NULL,
  `image_url`          VARCHAR(255) DEFAULT NULL,
  `is_veg`             TINYINT(1)   NOT NULL DEFAULT 1,
  `prep_time_minutes`  SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  `is_available`       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'Sold-out toggle',
  `is_active`          TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'Soft delete flag',
  `created_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_menu_category` (`category_id`),
  KEY `idx_menu_available` (`is_active`,`is_available`),
  CONSTRAINT `chk_menu_price` CHECK (`price` >= 0),
  CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. token_counters  (one row per day; guarantees unique, race-free tokens)
--    Usage in PHP (inside ONE transaction, so the row stays locked):
--      INSERT INTO token_counters (token_date, last_token) VALUES (CURDATE(), 1)
--        ON DUPLICATE KEY UPDATE last_token = last_token + 1;
--      SELECT last_token FROM token_counters WHERE token_date = CURDATE();
--    The first order of the day gets token 1, the next 2, and so on.
-- ============================================================================
CREATE TABLE `token_counters` (
  `token_date` DATE         NOT NULL,
  `last_token` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`token_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. orders
-- ============================================================================
CREATE TABLE `orders` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED NOT NULL,
  `token_date`    DATE         NOT NULL,
  `token_no`      INT UNSIGNED NOT NULL COMMENT 'Resets to 1 every day',
  `qr_code`       CHAR(32)     NOT NULL COMMENT 'Random hex string encoded in the QR image',
  `status`        ENUM('Placed','Preparing','Ready','Collected','Cancelled') NOT NULL DEFAULT 'Placed',
  `total_amount`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `note`          VARCHAR(255) DEFAULT NULL,
  `est_ready_at`  DATETIME     DEFAULT NULL COMMENT 'Estimated ready time',
  `preparing_at`  DATETIME     DEFAULT NULL,
  `ready_at`      DATETIME     DEFAULT NULL,
  `collected_at`  DATETIME     DEFAULT NULL,
  `collected_by`  INT UNSIGNED DEFAULT NULL COMMENT 'Staff user who scanned the QR',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_token_per_day` (`token_date`,`token_no`),
  UNIQUE KEY `uq_orders_qr` (`qr_code`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status_date` (`status`,`token_date`),
  KEY `idx_orders_created` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_collected_by` FOREIGN KEY (`collected_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. order_items  (name and price are snapshots so old orders never change)
-- ============================================================================
CREATE TABLE `order_items` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`     INT UNSIGNED NOT NULL,
  `menu_item_id` INT UNSIGNED DEFAULT NULL,
  `item_name`    VARCHAR(120) NOT NULL,
  `unit_price`   DECIMAL(8,2) NOT NULL,
  `quantity`     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `line_total`   DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  KEY `idx_oi_menu` (`menu_item_id`),
  CONSTRAINT `chk_oi_qty` CHECK (`quantity` > 0),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_oi_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. order_status_history  (audit trail of every status change)
-- ============================================================================
CREATE TABLE `order_status_history` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`   INT UNSIGNED NOT NULL,
  `old_status` ENUM('Placed','Preparing','Ready','Collected','Cancelled') DEFAULT NULL,
  `new_status` ENUM('Placed','Preparing','Ready','Collected','Cancelled') NOT NULL,
  `changed_by` INT UNSIGNED DEFAULT NULL,
  `changed_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_osh_order` (`order_id`),
  KEY `idx_osh_changed_by` (`changed_by`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_osh_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. settings  (key/value application configuration, editable by admin)
-- ============================================================================
CREATE TABLE `settings` (
  `setting_key`   VARCHAR(60)  NOT NULL,
  `setting_value` VARCHAR(255) NOT NULL,
  `description`   VARCHAR(255) DEFAULT NULL,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Live queue: all of today's orders that are still active, oldest token first,
-- with the number of active orders ahead of each one.
CREATE VIEW `v_live_queue` AS
SELECT
  o.`id`           AS order_id,
  o.`token_no`     AS token_no,
  o.`status`       AS status,
  o.`user_id`      AS user_id,
  o.`total_amount` AS total_amount,
  o.`est_ready_at` AS est_ready_at,
  o.`created_at`   AS created_at,
  (SELECT COUNT(*)
     FROM `orders` o2
    WHERE o2.`token_date` = o.`token_date`
      AND o2.`token_no`   < o.`token_no`
      AND o2.`status` IN ('Placed','Preparing')) AS orders_ahead
FROM `orders` o
WHERE o.`token_date` = CURDATE()
  AND o.`status` IN ('Placed','Preparing','Ready')
ORDER BY o.`token_no`;

-- Daily sales report (collected orders only).
CREATE VIEW `v_daily_sales` AS
SELECT
  o.`token_date`             AS sale_date,
  COUNT(*)                   AS orders_count,
  SUM(o.`total_amount`)      AS revenue
FROM `orders` o
WHERE o.`status` = 'Collected'
GROUP BY o.`token_date`
ORDER BY o.`token_date` DESC;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Users (bcrypt hashes: Admin@123 / Staff@123 / Student@123)
INSERT INTO `users` (`id`,`name`,`email`,`phone`,`college_id`,`password_hash`,`role`,`is_active`) VALUES
(1,'Canteen Admin','admin@canteen.local','9000000001','ADM001','$2y$10$VV0c6jQwvcDy1k7y1TR38.N9QbtIGg1yPIPCmg0qcGaohydZKtfnW','admin',1),
(2,'Canteen Staff','staff@canteen.local','9000000002','STF001','$2y$10$bNlCzj8k5KTatsFIZYgpuOlQKpCAGmZrSZxxSKa9zig6X086eB4Yu','staff',1),
(3,'Demo Student','student@college.local','9000000003','CSE2026001','$2y$10$UHGSkaFvIDYg..AhVW2wH.IQaXTidzhZKSr13payYDW3GUaMfpQsS','student',1);

-- Categories
INSERT INTO `categories` (`id`,`name`,`sort_order`,`is_active`) VALUES
(1,'Breakfast',1,1),
(2,'Snacks',2,1),
(3,'Meals',3,1),
(4,'Beverages',4,1),
(5,'Desserts',5,1);

-- Menu items
INSERT INTO `menu_items` (`id`,`category_id`,`name`,`description`,`price`,`is_veg`,`prep_time_minutes`,`is_available`,`is_active`) VALUES
(1,1,'Poha','Flattened rice with peanuts and lemon',25.00,1,4,1,1),
(2,1,'Idli Sambar (2 pcs)','Steamed rice cakes with sambar and chutney',35.00,1,5,1,1),
(3,1,'Aloo Paratha','Stuffed paratha with curd and pickle',40.00,1,8,1,1),
(4,2,'Samosa (2 pcs)','Crispy potato samosa with chutney',20.00,1,3,1,1),
(5,2,'Veg Sandwich','Grilled sandwich with veggies and cheese',35.00,1,6,1,1),
(6,2,'French Fries','Salted crispy fries',45.00,1,7,1,1),
(7,2,'Veg Burger','Aloo tikki burger',50.00,1,8,1,1),
(8,3,'Veg Thali','Roti, sabzi, dal, rice, salad',70.00,1,10,1,1),
(9,3,'Chole Bhature','Two bhature with spicy chole',60.00,1,10,1,1),
(10,3,'Veg Fried Rice','Wok tossed rice with vegetables',65.00,1,9,1,1),
(11,3,'Egg Curry Rice','Egg curry served with steamed rice',75.00,0,10,1,1),
(12,4,'Masala Chai','Hot Indian spiced tea',10.00,1,2,1,1),
(13,4,'Cold Coffee','Chilled coffee with ice cream',40.00,1,4,1,1),
(14,4,'Lemon Soda','Fresh lime soda',20.00,1,2,1,1),
(15,5,'Gulab Jamun (2 pcs)','Warm milk dumplings in syrup',30.00,1,2,1,1),
(16,5,'Ice Cream Cup','Vanilla or chocolate',25.00,1,1,0,1);

-- Application settings
INSERT INTO `settings` (`setting_key`,`setting_value`,`description`) VALUES
('canteen_name','College Canteen','Display name shown in the app'),
('orders_open','1','1 = accepting orders, 0 = closed'),
('max_items_per_order','15','Maximum total quantity in one order'),
('avg_minutes_per_order','3','Used for estimated wait time = orders ahead x this value'),
('currency_symbol','Rs.','Currency prefix shown on prices'),
('poll_interval_seconds','5','Frontend queue polling interval'),
('auth_token_ttl_hours','12','Bearer token lifetime');

-- Demo orders for today (so the queue screen is not empty on first run)
INSERT INTO `token_counters` (`token_date`,`last_token`) VALUES (CURDATE(), 3);

INSERT INTO `orders`
(`id`,`user_id`,`token_date`,`token_no`,`qr_code`,`status`,`total_amount`,`note`,`est_ready_at`,`preparing_at`,`ready_at`,`collected_at`,`collected_by`) VALUES
(1,3,CURDATE(),1,'a1b2c3d4e5f60718293a4b5c6d7e8f90','Collected',55.00,NULL,NOW(),NOW(),NOW(),NOW(),2),
(2,3,CURDATE(),2,'0f9e8d7c6b5a49382716f5e4d3c2b1a0','Preparing',70.00,'Less spicy please',DATE_ADD(NOW(), INTERVAL 10 MINUTE),NOW(),NULL,NULL,NULL),
(3,3,CURDATE(),3,'1234567890abcdef1234567890abcdef','Placed',45.00,NULL,DATE_ADD(NOW(), INTERVAL 15 MINUTE),NULL,NULL,NULL,NULL);

INSERT INTO `order_items` (`order_id`,`menu_item_id`,`item_name`,`unit_price`,`quantity`,`line_total`) VALUES
(1,4,'Samosa (2 pcs)',20.00,1,20.00),
(1,5,'Veg Sandwich',35.00,1,35.00),
(2,8,'Veg Thali',70.00,1,70.00),
(3,6,'French Fries',45.00,1,45.00);

INSERT INTO `order_status_history` (`order_id`,`old_status`,`new_status`,`changed_by`) VALUES
(1,NULL,'Placed',3),
(1,'Placed','Preparing',2),
(1,'Preparing','Ready',2),
(1,'Ready','Collected',2),
(2,NULL,'Placed',3),
(2,'Placed','Preparing',2),
(3,NULL,'Placed',3);

SET FOREIGN_KEY_CHECKS = 1;
-- ============================== END OF FILE =================================
