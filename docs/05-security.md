# Security Considerations

---

## Password Hashing

NextAuth.js with the Credentials provider uses bcrypt for password hashing.

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### Registration

```typescript
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 12);
// Store hashedPassword in database
```

### Login Validation

```typescript
const isValid = await bcrypt.compare(inputPassword, user.password);
```

---

## Session Management

NextAuth.js uses **HTTP-only session cookies** by default (not localStorage JWT).

This is more secure because:
- Cookies are not accessible via JavaScript (prevents XSS attacks)
- Automatically sent with requests
- Managed server-side

**Do NOT store tokens in localStorage** despite what some tutorials suggest.

---

## Rate Limiting

Add rate limiting middleware for sensitive routes.

> **Note:** This is a simplified example for demonstration. In production, use a library like `express-rate-limit` or store limits in Redis to handle multiple server instances and prevent memory leaks.

```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server';

// Simple in-memory store (for demo only - doesn't scale across instances)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(req: NextRequest, limit = 10, windowMs = 60000) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  return record.count <= limit;
}
```

### Apply to Routes

- `/api/auth/*` - Prevent brute force login attacks (10 req/min)
- `/api/evaluate` - Prevent LLM abuse (20 req/min)

---

## Input Validation with Zod

Use Zod schemas for all API inputs:

```typescript
// lib/validations.ts
import { z } from 'zod';

export const evaluateSchema = z.object({
  surahId: z.number().min(1).max(114),
  verseNum: z.number().min(1),
  userInput: z.string().max(2000),
  skipped: z.boolean().optional().default(false)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
```

### Usage in API Route

```typescript
import { evaluateSchema } from '@/lib/validations';

export async function POST(req: Request) {
  const body = await req.json();

  const result = evaluateSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.issues }, { status: 400 });
  }

  const { surahId, verseNum, userInput, skipped } = result.data;
  // ... proceed with validated data
}
```

---

## Authentication Middleware

Protect API routes that require authentication:

```typescript
// lib/auth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return session.user;
}
```

### Usage

```typescript
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    // ... handle request
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

---

## Environment Variables

Never commit secrets to the repository:

```bash
# .env.local (gitignored)
NEXTAUTH_SECRET="generate-random-32-char-string"
DATABASE_URL="file:./prisma/qalam.db"
```

Generate a secret:
```bash
openssl rand -base64 32
```

---

## What's NOT Implemented (MVP)

Keeping it simple for MVP:
- ❌ CSRF tokens (NextAuth handles this)
- ❌ OAuth providers (just email/password)
- ❌ Email verification
- ❌ Password reset flow
- ❌ Two-factor authentication

These can be added later if needed.
