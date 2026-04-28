-- =========================
-- USER
-- =========================
CREATE TABLE users (
  user_id INT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone_number VARCHAR(15),
  role VARCHAR(20) DEFAULT 'customer',
  status VARCHAR(20) DEFAULT 'active',
  failed_login_attempts INT DEFAULT 0 CHECK (failed_login_attempts >= 0),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  channel VARCHAR(20) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  attempt_count INT DEFAULT 0 CHECK (attempt_count >= 0),
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

ALTER TABLE password_reset_tokens ADD CONSTRAINT chk_password_reset_channel CHECK (
  channel IN ('email','sms')
);

CREATE INDEX idx_password_reset_tokens_user_channel_created_at
  ON password_reset_tokens (user_id, channel, created_at DESC);


-- MULTI AUTH
CREATE TABLE user_auth_provider (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_id VARCHAR(255),
  UNIQUE(provider, provider_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

ALTER TABLE user_auth_provider ADD CONSTRAINT chk_provider CHECK (
  provider IN ('local','google')
);

-- =========================
-- CATEGORY
-- =========================
CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_category_id INT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

CREATE UNIQUE INDEX idx_categories_unique_normalized_name
  ON categories (LOWER(TRIM(category_name)));

-- =========================
-- PRODUCT
-- =========================
CREATE TABLE product_types (
  type_id SERIAL PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE products (
  product_id SERIAL PRIMARY KEY,
  type_id INT,
  category_id INT,
  product_name VARCHAR(150) NOT NULL,
  description TEXT,
  product_status VARCHAR(20) DEFAULT 'active',
  deleted_at TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES product_types(type_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE product_variants (
  variant_id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  color VARCHAR(50),
  size VARCHAR(50),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);



CREATE TABLE inventory (
  inventory_id SERIAL PRIMARY KEY,
  variant_id INT NOT NULL,
  stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
  UNIQUE(variant_id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE variant_images (
  image_id SERIAL PRIMARY KEY,
  variant_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- =========================
-- WORKSHOP
-- =========================
CREATE TABLE workshops (
  workshop_id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

ALTER TABLE workshops ADD CONSTRAINT chk_workshop_status CHECK (
  status IN ('open','closed','cancelled')
);

CREATE TABLE workshop_variants (
  id SERIAL PRIMARY KEY,
  workshop_id INT NOT NULL,
  variant_id INT NOT NULL,
  UNIQUE(workshop_id, variant_id),
  FOREIGN KEY (workshop_id) REFERENCES workshops(workshop_id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- =========================
-- CART
-- =========================
CREATE TABLE cart (
  cart_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  UNIQUE(user_id, variant_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- =========================
-- VOUCHER
-- =========================
CREATE TABLE vouchers (
  voucher_id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  voucher_type VARCHAR(20),
  discount_type VARCHAR(20),
  value NUMERIC(10,2) CHECK (value >= 0),
  minimum_value NUMERIC(10,2),
  max_discount NUMERIC(10,2),
  quantity INT,
  used_count INT DEFAULT 0,
  end_date TIMESTAMP
);

ALTER TABLE vouchers ADD CONSTRAINT chk_discount_type CHECK (
  discount_type IN ('percent','fixed')
);

CREATE TABLE user_vouchers (
  id SERIAL PRIMARY KEY,
  voucher_id INT NOT NULL,
  user_id INT NOT NULL,
  usage_count INT DEFAULT 0,
  UNIQUE(voucher_id, user_id),
  FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE voucher_products (
  id SERIAL PRIMARY KEY,
  voucher_id INT,
  product_id INT,
  variant_id INT,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id)
);

-- =========================
-- PROMOTION (KHUYẾN MÃI)
-- =========================
CREATE TABLE promotions (
  promotion_id SERIAL PRIMARY KEY,
  title VARCHAR(100),
  discount_type VARCHAR(20) DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed')),
  value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promotion_products (
  id SERIAL PRIMARY KEY,
  promotion_id INT NOT NULL,
  product_id INT,
  variant_id INT,
  FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id)
);

-- =========================
-- ORDER
-- =========================
CREATE TABLE orders (
  order_id VARCHAR(25) PRIMARY KEY,
  user_id INT,
  status VARCHAR(20) DEFAULT 'pending',
  total_amount NUMERIC(10,2) CHECK (total_amount >= 0),
  voucher_id INT,
  discount_amount NUMERIC(10,2),
  idempotency_key VARCHAR(100) UNIQUE,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id)
);

ALTER TABLE orders ADD CONSTRAINT chk_order_status CHECK (
  status IN ('pending','processing','shipping','completed','cancelled')
);


CREATE TABLE order_details (
  order_detail_id SERIAL PRIMARY KEY,
  order_id VARCHAR(25) NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE order_status_history (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(25),
  status VARCHAR(20),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- =========================
-- PAYMENT
-- =========================
CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  order_id VARCHAR(25) UNIQUE NOT NULL,
  method VARCHAR(20) DEFAULT 'COD',
  status VARCHAR(20) DEFAULT 'pending',
  reference_code VARCHAR(100),
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- PAYMENT METHOD
ALTER TABLE payments ADD CONSTRAINT chk_payment_method CHECK (
  method IN ('COD','MOMO')
);

-- PAYMENT STATUS
ALTER TABLE payments ADD CONSTRAINT chk_payment_status CHECK (
  status IN ('pending','paid','failed','refunded')
);

-- =========================
-- REFUND (HOÀN TIỀN)
-- =========================
CREATE TABLE refunds (
  refund_id SERIAL PRIMARY KEY,
  order_id VARCHAR(25) NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

ALTER TABLE refunds ADD CONSTRAINT chk_refund_status CHECK (
  status IN ('pending','success','failed')
);

-- =========================
-- CITY
-- =========================
CREATE TABLE cities (
  city_code VARCHAR(10) PRIMARY KEY,
  city_name VARCHAR(100) NOT NULL
);

-- =========================
-- WARD
-- =========================
CREATE TABLE wards (
  ward_id SERIAL PRIMARY KEY,
  ward_name VARCHAR(100) NOT NULL,
  city_code VARCHAR(10),
  FOREIGN KEY (city_code) REFERENCES cities(city_code)
);


-- =========================
-- LOYALTY
-- =========================
CREATE TABLE loyalty_points (
  user_id INT PRIMARY KEY,
  total_points INT DEFAULT 0 CHECK (total_points >= 0),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =========================
-- WISHLIST
-- =========================
CREATE TABLE wishlist (
  wishlist_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  variant_id INT NOT NULL,
  UNIQUE(user_id, variant_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

CREATE TABLE wishlist_notifications (
  id SERIAL PRIMARY KEY,
  user_id INT,
  product_id INT,
  notification_type VARCHAR(20) CHECK (notification_type IN ('price_drop','back_in_stock')),
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SPIN
-- =========================
CREATE TABLE spin_turns (
  user_id INT PRIMARY KEY,
  turn_count INT DEFAULT 0 CHECK (turn_count >= 0),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE spin_reward_config (
  reward_id SERIAL PRIMARY KEY,
  reward_type VARCHAR(20),
  value INT CHECK (value >= 0),
  win_rate NUMERIC(5,2) CHECK (win_rate >= 0 AND win_rate <= 100),
  remaining_quantity INT,
  status VARCHAR(20) DEFAULT 'active'
);

ALTER TABLE spin_reward_config ADD CONSTRAINT chk_spin_reward CHECK (
  reward_type IN ('voucher','point','none')
);

CREATE TABLE spin_history (
  history_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  reward_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (reward_id) REFERENCES spin_reward_config(reward_id)
);
