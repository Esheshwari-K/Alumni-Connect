-- Neon Serverless PostgreSQL Schema for Alumni Connect
-- RV University Alumni Mentorship & Networking Platform

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'alumni', 'admin')),
  account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS student_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usn VARCHAR(50),
  programme VARCHAR(100),
  department VARCHAR(100),
  semester_or_year VARCHAR(50),
  skills TEXT,
  interests TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumni_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  headline VARCHAR(255),
  company VARCHAR(150),
  job_title VARCHAR(150),
  graduation_year INT,
  department VARCHAR(100),
  skills TEXT,
  bio TEXT,
  linkedin_url VARCHAR(255),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alumni_verification ON alumni_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_alumni_company ON alumni_profiles(company);

CREATE TABLE IF NOT EXISTS admin_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentorship_requests (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alumni_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  topics TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentorship_student ON mentorship_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_alumni ON mentorship_requests(alumni_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_status ON mentorship_requests(status);

CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id VARCHAR(36) PRIMARY KEY,
  alumni_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  meeting_link VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_alumni ON mentorship_sessions(alumni_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON mentorship_sessions(scheduled_at);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alumni_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_alumni ON bookings(alumni_id);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);

CREATE TABLE IF NOT EXISTS opportunities (
  id VARCHAR(36) PRIMARY KEY,
  posted_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  opportunity_type VARCHAR(50) NOT NULL CHECK (opportunity_type IN ('internship', 'full-time', 'part-time', 'event', 'referral', 'other')),
  company VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  required_skills TEXT,
  application_url VARCHAR(255),
  deadline TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);

CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(36) PRIMARY KEY,
  opportunity_id VARCHAR(36) NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  student_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_url VARCHAR(500),
  cover_letter TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'selected', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(36),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE TABLE IF NOT EXISTS user_settings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
