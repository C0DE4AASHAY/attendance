# Supabase SQL Schema Commands

Since we moved to Supabase, we need to manually create the tables in the Supabase Dashboard SQL Editor. Copy and paste the below commands into your Supabase project to generate the required tables.

### 1. Sessions Table
```sql
CREATE TABLE sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "sessionId" text UNIQUE NOT NULL,
  "classTopic" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

-- Optional index for faster lookups
CREATE INDEX idx_sessions_sessionId ON sessions ("sessionId");
```

### 2. Attendance Table
```sql
CREATE TABLE attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "studentId" text NOT NULL,
  "studentName" text NOT NULL,
  "sessionId" text NOT NULL REFERENCES sessions("sessionId") ON DELETE CASCADE,
  "ipAddress" text NOT NULL,
  "userAgent" text NOT NULL,
  "deviceFingerprint" text,
  "timestamp" timestamptz DEFAULT now()
);

-- 2️⃣ Duplicate Student ID Protection: Unique constraint
CREATE UNIQUE INDEX unique_student_session ON attendance ("studentId", "sessionId");

-- 1️⃣ IP-Based Restriction: Unique constraint per IP per session
CREATE UNIQUE INDEX unique_ip_session ON attendance ("ipAddress", "sessionId");
```
