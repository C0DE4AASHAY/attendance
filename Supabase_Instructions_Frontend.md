# Supabase Frontend Schema Migration 

Since we removed `better-sqlite3`, you need to create these tables in your Supabase database specifically for the Next.js frontend dashboard. 

Go to your Supabase Project -> SQL Editor -> Run these commands:

### 1. Users Table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'teacher',
  created_at timestamptz DEFAULT now()
);
```

### 2. Dashboard Sessions Table
*(We use `sessions_dashboard` to separate the frontend UI tables from the actual Secure Backend validator tables)*
```sql
CREATE TABLE sessions_dashboard (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### 3. Analytics Attendees Table
*(This table stores attendees purely for the dashboard analytics view)*
```sql
CREATE TABLE attendees (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions_dashboard(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_id text NOT NULL,
  marked_at timestamptz DEFAULT now(),
  UNIQUE(session_id, student_id)
);
```
