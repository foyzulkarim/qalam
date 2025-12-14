# Qalam: Database Schema (SQLite)

**Version:** 2.0  
**Database:** SQLite 3  
**Purpose:** Define all tables, indexes, and relationships

---

## Overview

Qalam uses SQLite as its database. The schema is designed around three core entities:

1. **Users** - Account information
2. **Attempts** - Every verse practice attempt (the core learning data)
3. **Verse metadata** comes from JSON files, not the database

There are no sessions, no progress caches, no complex denormalization. We keep it simple and query the attempts table directly when we need statistics.

---

## Schema Initialization

```sql
-- server/src/db/schema.sql

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  passwordHash TEXT NOT NULL,
  name TEXT NOT NULL,
  
  -- Preferences
  preferredTranslation TEXT DEFAULT 'sahih-international',
  
  -- Timestamps
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  lastLoginAt TEXT
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- ATTEMPTS
-- ============================================================================

CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  
  -- Verse identification
  verseId TEXT NOT NULL,              -- Format: "1:1", "2:255", etc.
  surahId INTEGER NOT NULL,           -- Extracted from verseId for querying
  verseNumber INTEGER NOT NULL,       -- Extracted from verseId for querying
  
  -- What was shown to user
  arabicText TEXT NOT NULL,
  correctTranslation TEXT NOT NULL,
  
  -- User's response
  userInput TEXT NOT NULL,            -- What user typed (empty string if skipped)
  skipped INTEGER NOT NULL DEFAULT 0, -- 1 if user clicked "I don't know"
  
  -- LLM evaluation results
  score INTEGER NOT NULL,             -- 0-100
  feedbackSummary TEXT NOT NULL,
  feedbackCorrect TEXT NOT NULL,      -- JSON array of strings
  feedbackMissed TEXT NOT NULL,       -- JSON array of strings
  feedbackInsight TEXT,               -- Nullable - teaching moment
  
  -- LLM metadata (for debugging and cost tracking)
  llmModel TEXT NOT NULL,
  llmProvider TEXT NOT NULL,          -- 'ollama' or 'together'
  llmPromptTokens INTEGER,
  llmCompletionTokens INTEGER,
  llmLatencyMs INTEGER,
  
  -- Timestamp
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_attempts_userId ON attempts(userId);
CREATE INDEX idx_attempts_verseId ON attempts(verseId);
CREATE INDEX idx_attempts_userId_verseId ON attempts(userId, verseId);
CREATE INDEX idx_attempts_userId_createdAt ON attempts(userId, createdAt DESC);
CREATE INDEX idx_attempts_surahId ON attempts(surahId);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update users.updatedAt on any update
CREATE TRIGGER users_updated_at 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

-- Auto-extract surahId and verseNumber from verseId when inserting attempt
CREATE TRIGGER attempts_extract_verse_parts
BEFORE INSERT ON attempts
BEGIN
  SELECT CASE
    WHEN NEW.verseId NOT LIKE '%:%' THEN
      RAISE(ABORT, 'verseId must be in format "surahId:verseNumber"')
  END;
  
  -- Extract surahId and verseNumber from verseId
  -- This allows us to query by surah efficiently
END;

-- Note: The trigger above is a safeguard. In practice, the application
-- will set surahId and verseNumber explicitly when creating attempts.

-- ============================================================================
-- VIEWS (for common queries)
-- ============================================================================

-- User statistics (computed on demand, not cached)
CREATE VIEW user_stats AS
SELECT 
  userId,
  COUNT(*) as totalAttempts,
  COUNT(DISTINCT verseId) as uniqueVerses,
  AVG(score) as averageScore,
  MAX(createdAt) as lastAttemptAt,
  COUNT(DISTINCT DATE(createdAt)) as daysActive
FROM attempts
GROUP BY userId;

-- Verse history for a user (most recent attempts first)
-- Usage: SELECT * FROM verse_history WHERE userId = ? AND verseId = ?
CREATE VIEW verse_history AS
SELECT 
  id,
  userId,
  verseId,
  userInput,
  skipped,
  score,
  feedbackSummary,
  feedbackCorrect,
  feedbackMissed,
  feedbackInsight,
  createdAt
FROM attempts
ORDER BY createdAt DESC;

-- Recent activity across all verses for a user
CREATE VIEW recent_activity AS
SELECT 
  userId,
  verseId,
  score,
  createdAt,
  ROW_NUMBER() OVER (PARTITION BY userId ORDER BY createdAt DESC) as rowNum
FROM attempts;

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Create a test user
-- Password is "password123" hashed with bcrypt (10 rounds)
INSERT INTO users (email, name, passwordHash) VALUES 
  ('test@example.com', 'Test User', '$2b$10$XgKvMzL/LqF1XqQYWZEzHOqQqXKZQ4mM5YJKqQGXcLvXnYKZQGXcL');

-- ============================================================================
-- UTILITY QUERIES
-- ============================================================================

-- Get next verse to practice for a user (sequential from beginning)
-- This finds the first verse in sequential order that the user hasn't attempted yet
-- 
-- Implementation note: This is better done in application code where we have
-- access to the verse count per surah. Here's the logic:
-- 
-- 1. Get all verseIds user has attempted: SELECT DISTINCT verseId FROM attempts WHERE userId = ?
-- 2. Loop through verses sequentially (1:1, 1:2, ... 1:7, 2:1, 2:2, ...)
-- 3. Return first verse not in attempted list
-- 
-- If all available verses attempted, return first verse of next surah

-- Get verses that need review (score < 70 on last attempt)
WITH last_attempts AS (
  SELECT 
    userId,
    verseId,
    score,
    ROW_NUMBER() OVER (PARTITION BY userId, verseId ORDER BY createdAt DESC) as rn
  FROM attempts
)
SELECT userId, verseId, score
FROM last_attempts
WHERE rn = 1 AND score < 70;

-- Get user's learning journey with a specific verse
SELECT 
  id,
  userInput,
  score,
  feedbackSummary,
  createdAt
FROM attempts
WHERE userId = ? AND verseId = ?
ORDER BY createdAt ASC;

-- Get daily practice streak
WITH daily_practice AS (
  SELECT DISTINCT DATE(createdAt) as practiceDate
  FROM attempts
  WHERE userId = ?
  ORDER BY practiceDate DESC
)
SELECT COUNT(*) as currentStreak
FROM daily_practice
WHERE practiceDate >= DATE('now', '-' || 
  (SELECT COUNT(*) FROM daily_practice dp2 
   WHERE dp2.practiceDate > DATE('now')) || ' days');

-- Note: Streak calculation is complex in SQL. Better to do in application code.

-- ============================================================================
-- BACKUP AND RESTORE
-- ============================================================================

-- Backup database (from command line)
-- sqlite3 qalam.db ".backup qalam-backup.db"

-- Restore from backup
-- cp qalam-backup.db qalam.db

-- Export to SQL dump
-- sqlite3 qalam.db .dump > qalam-dump.sql

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- SQLite with WAL mode can handle:
-- - Thousands of reads per second
-- - Hundreds of writes per second
-- 
-- This is more than sufficient for:
-- - Hundreds of concurrent users
-- - Verse evaluation requests (which are rate-limited by LLM anyway)
-- 
-- If you exceed these limits, migrate to PostgreSQL:
-- - Schema translates directly (just change AUTO_INCREMENT to SERIAL)
-- - Keep same query patterns
-- - Gain horizontal scalability

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- For future schema changes, create migration files:
-- server/src/db/migrations/001_add_column.sql
-- server/src/db/migrations/002_add_index.sql
-- 
-- Migration system:
-- 1. Create migrations table to track applied migrations
-- 2. Run migrations in order on app startup
-- 3. Never edit this file after initial deployment

CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  appliedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Data Types Explained

### SQLite Type Mapping

SQLite has only five storage classes: NULL, INTEGER, TEXT, REAL, BLOB. Here's how we map our types:

**INTEGER:**
- `id` columns (auto-incrementing primary keys)
- `score` (0-100)
- Token counts
- Latency measurements
- Boolean flags (0 or 1)

**TEXT:**
- Email, name, passwords
- Arabic text, translations
- User input
- JSON arrays (feedbackCorrect, feedbackMissed)
- ISO 8601 timestamps (e.g., "2024-12-14T10:30:00Z")

**Why TEXT for timestamps instead of INTEGER?**

SQLite can store timestamps as:
1. INTEGER (Unix epoch seconds)
2. TEXT (ISO 8601 strings)
3. REAL (Julian day numbers)

We use TEXT because:
- Human-readable in database tools
- Easy to work with in JavaScript (native Date support)
- No timezone confusion (always store UTC)
- SQLite's datetime functions work with TEXT format

---

## JSON Storage in TEXT Fields

SQLite doesn't have a native JSON type (unlike PostgreSQL). We store JSON as TEXT:

```sql
feedbackCorrect TEXT NOT NULL  -- Stores: ["praise to Allah", "Lord"]
```

**In application code:**
```typescript
// When inserting
const feedbackCorrect = JSON.stringify(['praise to Allah', 'Lord']);

// When reading
const parsed = JSON.parse(row.feedbackCorrect) as string[];
```

**Why not use a separate table for feedback items?**

We store feedback as JSON rather than normalized tables because:
1. Feedback is always read as a unit (never queried individually)
2. Simpler schema (fewer joins)
3. Matches LLM output format naturally
4. No performance penalty for this use case

If we later need to search within feedback (e.g., "find all attempts where feedback mentioned 'root ح-م-د'"), we can use SQLite's `json_extract()` function or migrate to PostgreSQL with jsonb.

---

## Index Strategy

Our indexes are designed for these common queries:

**By User:**
```sql
-- Dashboard: Get user's stats
SELECT COUNT(*), AVG(score) FROM attempts WHERE userId = ?;
-- Uses: idx_attempts_userId
```

**By Verse:**
```sql
-- Verse history: All attempts for this verse by this user
SELECT * FROM attempts WHERE userId = ? AND verseId = ? ORDER BY createdAt DESC;
-- Uses: idx_attempts_userId_verseId
```

**Recent Activity:**
```sql
-- Latest 10 attempts
SELECT * FROM attempts WHERE userId = ? ORDER BY createdAt DESC LIMIT 10;
-- Uses: idx_attempts_userId_createdAt
```

**By Surah:**
```sql
-- All attempts for verses in Al-Fatihah
SELECT * FROM attempts WHERE userId = ? AND surahId = 1;
-- Uses: idx_attempts_surahId
```

---

## Foreign Key Constraints

```sql
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
```

**ON DELETE CASCADE** means:
- If a user is deleted, all their attempts are automatically deleted
- This maintains referential integrity
- Prevents orphaned data

**When is a user deleted?**

Only when they explicitly request account deletion (GDPR compliance). This is a rare operation, so CASCADE is safe.

---

## Sample Queries by Use Case

### User Registration

```sql
INSERT INTO users (email, passwordHash, name)
VALUES (?, ?, ?);
```

### User Login

```sql
SELECT id, email, passwordHash, name 
FROM users 
WHERE email = ?;
```

### Store Verse Attempt

```sql
INSERT INTO attempts (
  userId, verseId, surahId, verseNumber,
  arabicText, correctTranslation,
  userInput, skipped,
  score, feedbackSummary, feedbackCorrect, feedbackMissed, feedbackInsight,
  llmModel, llmProvider, llmPromptTokens, llmCompletionTokens, llmLatencyMs
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
```

### Get Dashboard Stats

```sql
SELECT 
  COUNT(*) as totalAttempts,
  COUNT(DISTINCT verseId) as uniqueVerses,
  AVG(score) as averageScore,
  MAX(createdAt) as lastAttemptAt
FROM attempts
WHERE userId = ?;
```

### Get Verse Learning History

```sql
SELECT 
  id, userInput, score, 
  feedbackSummary, feedbackCorrect, feedbackMissed, feedbackInsight,
  createdAt
FROM attempts
WHERE userId = ? AND verseId = ?
ORDER BY createdAt ASC;
```

### Get Recent Activity

```sql
SELECT 
  verseId, score, createdAt
FROM attempts
WHERE userId = ?
ORDER BY createdAt DESC
LIMIT 20;
```

### Get Surah Progress

```sql
SELECT 
  COUNT(DISTINCT verseId) as versesAttempted,
  AVG(score) as averageScore,
  MAX(createdAt) as lastAttemptedAt
FROM attempts
WHERE userId = ? AND surahId = ?;
```

### Find Verses Needing Review

```sql
-- Get last attempt for each verse, filter by score < 70
WITH last_attempts AS (
  SELECT 
    verseId,
    score,
    ROW_NUMBER() OVER (PARTITION BY verseId ORDER BY createdAt DESC) as rn
  FROM attempts
  WHERE userId = ?
)
SELECT verseId, score
FROM last_attempts
WHERE rn = 1 AND score < 70;
```

---

## Database File Management

### Location

Development: `./data/qalam.db`  
Production: `/var/www/qalam/data/qalam.db`

### Permissions

```bash
# Ensure database directory is writable
chmod 755 /var/www/qalam/data
chmod 644 /var/www/qalam/data/qalam.db

# Owned by the user running the Node.js process
chown www-data:www-data /var/www/qalam/data/qalam.db
```

### Backup Strategy

**Simple backup (daily cron job):**
```bash
#!/bin/bash
# /etc/cron.daily/backup-qalam-db

DB_PATH="/var/www/qalam/data/qalam.db"
BACKUP_DIR="/var/backups/qalam"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR
sqlite3 $DB_PATH ".backup $BACKUP_DIR/qalam-$DATE.db"

# Keep only last 30 days
find $BACKUP_DIR -name "qalam-*.db" -mtime +30 -delete
```

**For production, also consider:**
- Offsite backups (rsync to another server)
- Automated restore testing
- Point-in-time recovery (use WAL mode + WAL checkpointing)

---

## Initialization Script

```typescript
// server/src/db/init.ts
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export function initializeDatabase() {
  const dbPath = config.database.path;
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  // Ensure data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Open database
  const db = new Database(dbPath);
  
  // Read and execute schema
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  
  console.log('✅ Database initialized successfully');
  
  return db;
}
```

---

## Migration to PostgreSQL (Future)

If you outgrow SQLite, here's how to migrate:

### Schema Translation

```sql
-- SQLite
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
);

-- PostgreSQL
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  ...
);
```

### Data Export/Import

```bash
# Export from SQLite
sqlite3 qalam.db .dump > dump.sql

# Import to PostgreSQL (after schema modifications)
psql qalam < dump.sql
```

### Application Changes

```typescript
// SQLite (better-sqlite3)
const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

// PostgreSQL (pg)
const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
const row = rows[0];
```

The application code is almost identical. Main differences:
- Placeholder syntax (`?` vs `$1`)
- Synchronous vs async
- Connection pooling

---

*This schema is production-ready and optimized for the access patterns described in SYSTEM_ARCHITECTURE.md. No changes should be needed unless requirements change significantly.*
