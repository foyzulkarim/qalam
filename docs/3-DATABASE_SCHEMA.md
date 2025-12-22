# Qalam: Database Schema (Prisma + SQLite)

**Version:** 2.0
**ORM:** Prisma
**Database:** SQLite 3
**Purpose:** Define all models, relations, and database access patterns

---

## Overview

Qalam uses **Prisma ORM** with SQLite as its database. Prisma provides:

- **Type-safe database client** - Auto-generated TypeScript types from schema
- **Declarative schema** - Define models in `schema.prisma`, not raw SQL
- **Migration management** - Track schema changes with versioned migrations
- **Prisma Studio** - Free GUI to browse and edit data during development

The schema is designed around two core entities:

1. **User** - Account information
2. **Attempt** - Every verse practice attempt (the core learning data)

Verse metadata comes from JSON files, not the database.

---

## Prisma Schema

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER
// ============================================================================

model User {
  id                    Int       @id @default(autoincrement())
  email                 String    @unique
  passwordHash          String
  name                  String

  // Preferences
  preferredTranslation  String    @default("sahih-international")

  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  lastLoginAt           DateTime?

  // Relations
  attempts              Attempt[]

  @@map("users")
}

// ============================================================================
// ATTEMPT
// ============================================================================

model Attempt {
  id                    Int       @id @default(autoincrement())

  // User relation
  userId                Int
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Verse identification
  verseId               String    // Format: "1:1", "2:255", etc.
  surahId               Int       // Extracted from verseId for querying
  verseNumber           Int       // Extracted from verseId for querying

  // What was shown to user
  arabicText            String
  correctTranslation    String

  // User's response
  userInput             String    // What user typed (empty string if skipped)
  skipped               Boolean   @default(false)

  // LLM evaluation results
  score                 Int       // 0-100
  feedbackSummary       String
  feedbackCorrect       String    // JSON array stored as string
  feedbackMissed        String    // JSON array stored as string
  feedbackInsight       String?   // Nullable - teaching moment

  // LLM metadata (for debugging and cost tracking)
  llmModel              String
  llmProvider           String    // 'ollama' or 'together'
  llmPromptTokens       Int?
  llmCompletionTokens   Int?
  llmLatencyMs          Int?

  // Timestamp
  createdAt             DateTime  @default(now())

  // Indexes for common queries
  @@index([userId])
  @@index([verseId])
  @@index([userId, verseId])
  @@index([userId, createdAt(sort: Desc)])
  @@index([surahId])

  @@map("attempts")
}
```

---

## Prisma Client Setup

```typescript
// server/src/db/client.ts

import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

---

## Environment Configuration

```bash
# .env
DATABASE_URL="file:./data/qalam.db"

# Production
# DATABASE_URL="file:/var/www/qalam/data/qalam.db"
```

---

## Database Operations

### User Registration

```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword,
    name: 'John Doe',
  },
});
```

### User Login

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});
```

### Update Last Login

```typescript
await prisma.user.update({
  where: { id: userId },
  data: { lastLoginAt: new Date() },
});
```

### Store Verse Attempt

```typescript
const attempt = await prisma.attempt.create({
  data: {
    userId,
    verseId: '1:2',
    surahId: 1,
    verseNumber: 2,
    arabicText: '...',
    correctTranslation: '...',
    userInput: 'All praise belongs to Allah...',
    skipped: false,
    score: 85,
    feedbackSummary: 'Excellent understanding!',
    feedbackCorrect: JSON.stringify(['praise to Allah', 'Lord']),
    feedbackMissed: JSON.stringify(['specific nuance']),
    feedbackInsight: null,  // Insights now come from pre-computed analysis
    llmModel: 'llama3.2',
    llmProvider: 'ollama',
    llmPromptTokens: 150,
    llmCompletionTokens: 80,
    llmLatencyMs: 650,
  },
});
```

### Get Dashboard Stats

```typescript
const [totalAttempts, uniqueVerses, avgScore, lastAttempt] = await Promise.all([
  prisma.attempt.count({ where: { userId } }),
  prisma.attempt.groupBy({
    by: ['verseId'],
    where: { userId },
  }).then(groups => groups.length),
  prisma.attempt.aggregate({
    where: { userId },
    _avg: { score: true },
  }).then(result => result._avg.score ?? 0),
  prisma.attempt.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  }),
]);

const stats = {
  totalAttempts,
  uniqueVerses,
  averageScore: avgScore,
  lastAttemptAt: lastAttempt?.createdAt ?? null,
};
```

### Get Verse Learning History

```typescript
const attempts = await prisma.attempt.findMany({
  where: { userId, verseId },
  orderBy: { createdAt: 'asc' },
  select: {
    id: true,
    userInput: true,
    score: true,
    feedbackSummary: true,
    feedbackCorrect: true,
    feedbackMissed: true,
    feedbackInsight: true,
    createdAt: true,
  },
});

// Parse JSON fields
const parsed = attempts.map(a => ({
  ...a,
  feedbackCorrect: JSON.parse(a.feedbackCorrect),
  feedbackMissed: JSON.parse(a.feedbackMissed),
}));
```

### Get Recent Activity

```typescript
const recentAttempts = await prisma.attempt.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  select: {
    verseId: true,
    score: true,
    createdAt: true,
  },
});
```

### Get Surah Progress

```typescript
const attempts = await prisma.attempt.findMany({
  where: { userId, surahId },
});

const stats = {
  versesAttempted: new Set(attempts.map(a => a.verseId)).size,
  averageScore: attempts.length > 0
    ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
    : 0,
  lastAttemptedAt: attempts.length > 0
    ? attempts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
    : null,
};
```

### Find Verses Needing Review

```typescript
// Get the latest attempt for each verse, filter by score < 70
const latestAttempts = await prisma.$queryRaw<Array<{ verseId: string; score: number }>>`
  SELECT verseId, score
  FROM (
    SELECT verseId, score,
           ROW_NUMBER() OVER (PARTITION BY verseId ORDER BY createdAt DESC) as rn
    FROM attempts
    WHERE userId = ${userId}
  )
  WHERE rn = 1 AND score < 70
`;
```

---

## JSON Fields

Prisma doesn't have native JSON support for SQLite, so we store JSON as strings:

```typescript
// When creating
await prisma.attempt.create({
  data: {
    // ...
    feedbackCorrect: JSON.stringify(['item1', 'item2']),
    feedbackMissed: JSON.stringify(['missed1']),
  },
});

// When reading
const attempt = await prisma.attempt.findUnique({ where: { id } });
const correct = JSON.parse(attempt.feedbackCorrect) as string[];
```

**Why not normalize into separate tables?**
- Feedback is always read as a unit (never queried individually)
- Simpler schema (fewer joins)
- Matches LLM output format naturally

---

## Migrations

Prisma migrations are stored in `server/prisma/migrations/` and tracked in version control.

### Create a Migration

```bash
# After changing schema.prisma
npx prisma migrate dev --name add_new_field
```

### Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

### Reset Database (Development)

```bash
npx prisma migrate reset
```

### Generate Client Without Migration

```bash
npx prisma generate
```

### View Database with Prisma Studio

```bash
npx prisma studio
```

---

## Database File Management

### Location

- **Development:** `./data/qalam.db`
- **Production:** `/var/www/qalam/data/qalam.db`

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

---

## Type Safety Benefits

With Prisma, you get full TypeScript integration:

```typescript
import { User, Attempt } from '@prisma/client';

// Prisma generates these types automatically from schema.prisma
// No need to manually define interfaces!

async function getUser(id: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

async function getUserAttempts(userId: number): Promise<Attempt[]> {
  return prisma.attempt.findMany({ where: { userId } });
}
```

### Autocomplete in IDEs

When writing Prisma queries, your IDE provides autocomplete for:
- Model names (`prisma.user`, `prisma.attempt`)
- Field names in `where`, `select`, `orderBy`
- Available operations (`findUnique`, `findMany`, `create`, etc.)

---

## Migration to PostgreSQL (Future)

If you outgrow SQLite, Prisma makes migration straightforward:

### 1. Update schema.prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Update Environment Variable

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/qalam"
```

### 3. Generate New Migration

```bash
npx prisma migrate dev --name migrate_to_postgres
```

The application code stays **exactly the same** - only the datasource changes!

---

## Performance Notes

SQLite with Prisma can handle:
- Thousands of reads per second
- Hundreds of writes per second

This is sufficient for:
- Hundreds of concurrent users
- Verse evaluation requests (rate-limited by LLM anyway)

Prisma adds minimal overhead (~1-2ms per query) while providing:
- Type safety
- Query validation
- Connection pooling (automatic)

---

## Seed Data (Development)

```typescript
// server/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash,
    },
  });

  console.log('✅ Database seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to package.json:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run with:
```bash
npx prisma db seed
```

---

## npm Scripts

Add these to `server/package.json`:

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "db:generate": "prisma generate",
    "db:seed": "prisma db seed",
    "postinstall": "prisma generate"
  }
}
```

The `postinstall` script ensures the Prisma client is generated after `npm install`.

---

*This schema is production-ready and optimized for the access patterns described in SYSTEM_ARCHITECTURE.md. Prisma handles SQL generation, migrations, and type safety automatically.*
