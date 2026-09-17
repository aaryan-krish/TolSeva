-- TolSeva Database Schema
-- Legal Metrology Department Platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ADMINS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VENDORS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gstin VARCHAR(15) UNIQUE NOT NULL,
  business_name VARCHAR(300) NOT NULL,
  owner_name VARCHAR(200) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  otp VARCHAR(6),
  otp_expires_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INSPECTORS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gov_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  department VARCHAR(200),
  designation VARCHAR(200),
  zone VARCHAR(100),
  phone VARCHAR(15),
  email VARCHAR(200),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INSTRUMENTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instruments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  make VARCHAR(200) NOT NULL,
  model VARCHAR(200) NOT NULL,
  serial_no VARCHAR(200) UNIQUE NOT NULL,
  instrument_type VARCHAR(100) NOT NULL,
  capacity VARCHAR(100),
  unit VARCHAR(50),
  manufacture_year INTEGER,
  installation_date DATE,
  last_verified_at TIMESTAMPTZ,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','ACTIVE','EXPIRED','SUSPENDED')),
  location_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instruments_vendor ON instruments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_instruments_expiry ON instruments(expiry_date);
CREATE INDEX IF NOT EXISTS idx_instruments_status ON instruments(status);

-- ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  instrument_id UUID REFERENCES instruments(id) ON DELETE SET NULL,
  inspector_id UUID REFERENCES inspectors(id) ON DELETE SET NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  purpose VARCHAR(50) NOT NULL
    CHECK (purpose IN ('NEW_REGISTRATION','RENEWAL','COMPLAINT','RE_INSPECTION')),
  status VARCHAR(50) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','COMPLETED','CANCELLED','RESCHEDULED')),
  vendor_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_vendor ON appointments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_inspector ON appointments(inspector_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(preferred_date);

-- ─── VERIFICATION LOGS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES inspectors(id),
  test_result VARCHAR(50) NOT NULL
    CHECK (test_result IN ('PASS','FAIL','CONDITIONAL_PASS')),
  observations TEXT,
  error_percentage NUMERIC(6,3),
  photo_url TEXT,
  qr_payload TEXT,
  certificate_no VARCHAR(100) UNIQUE,
  valid_until DATE,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_instrument ON verification_logs(instrument_id);
CREATE INDEX IF NOT EXISTS idx_verification_inspector ON verification_logs(inspector_id);

-- ─── SEED ADMIN ───────────────────────────────────────────────────────────────
-- Default admin password: Admin@123 (bcrypt hash)
INSERT INTO admins (username, password_hash, full_name)
VALUES (
  'admin',
  '$2a$10$ZQuVDPiEwciGG7F2Kc/qMuGkOeiXBPirNxpQSNg2o32i6jjW4nmDS',
  'System Administrator'
) ON CONFLICT (username) DO UPDATE
  SET password_hash = '$2a$10$ZQuVDPiEwciGG7F2Kc/qMuGkOeiXBPirNxpQSNg2o32i6jjW4nmDS';
