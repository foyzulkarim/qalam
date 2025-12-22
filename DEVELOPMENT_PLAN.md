# Qalam Development Plan

**Version:** 1.0
**Created:** December 2025
**Purpose:** Step-by-step development roadmap with AI-assisted task execution

---

## Plan Structure

```
Phase [X]: Title
├── Deliverable: What is complete at the end of this phase
├── Branch: feature/phase-x-description
│
├── Step [N]: Title
│   ├── Task [N.1]: Specific action
│   ├── Task [N.2]: Specific action
│   └── Task [N.3]: Specific action
```

---

## Phase 1: Project Foundation

**Deliverable:** A running Next.js application with database schema, configured authentication, and basic project structure.

**Branch:** `feature/phase-1-foundation`

### Step 1.1: Initialize Next.js Project

- **Task 1.1.1:** Create Next.js 14+ project with App Router
  ```bash
  npx create-next-app@latest qalam --typescript --tailwind --eslint --app --src-dir=false
  ```
- **Task 1.1.2:** Configure project structure following the documented layout (app/, components/, lib/, data/, scripts/)
- **Task 1.1.3:** Set up path aliases in tsconfig.json (`@/` prefix)
- **Task 1.1.4:** Create `.env.local` with placeholder environment variables
- **Task 1.1.5:** Add `.gitignore` entries for database files and environment files

### Step 1.2: Configure Database with Prisma

- **Task 1.2.1:** Install Prisma and initialize
  ```bash
  npm install prisma @prisma/client
  npx prisma init --datasource-provider sqlite
  ```
- **Task 1.2.2:** Create Prisma schema with User and Attempt models (from docs/02-database.md)
- **Task 1.2.3:** Create `lib/db.ts` with Prisma client singleton
- **Task 1.2.4:** Add npm scripts for database commands (db:migrate, db:push, db:studio, db:generate)
- **Task 1.2.5:** Run initial migration to create database
- **Task 1.2.6:** Test database connection with Prisma Studio

### Step 1.3: Set Up NextAuth.js Authentication

- **Task 1.3.1:** Install NextAuth.js v5 and bcryptjs
  ```bash
  npm install next-auth@beta bcryptjs
  npm install -D @types/bcryptjs
  ```
- **Task 1.3.2:** Create `lib/auth.ts` with NextAuth configuration using Credentials provider
- **Task 1.3.3:** Create `app/api/auth/[...nextauth]/route.ts` API route
- **Task 1.3.4:** Set up session strategy with HTTP-only cookies
- **Task 1.3.5:** Create `requireAuth()` helper function for protected routes
- **Task 1.3.6:** Generate NEXTAUTH_SECRET and add to environment

### Step 1.4: Create TypeScript Type Definitions

- **Task 1.4.1:** Create `types/index.ts` with all interfaces (User, Attempt, Verse, Surah, WordAnalysis, VerseAnalysis)
- **Task 1.4.2:** Create `types/api.ts` with API request/response types
- **Task 1.4.3:** Create `types/auth.ts` with NextAuth session extension types

### Step 1.5: Set Up Input Validation

- **Task 1.5.1:** Install Zod
  ```bash
  npm install zod
  ```
- **Task 1.5.2:** Create `lib/validations.ts` with schemas for:
  - registerSchema (email, password, name)
  - loginSchema (email, password)
  - evaluateSchema (surahId, verseNum, userInput, skipped)

### Step 1.6: Create Basic Layout Structure

- **Task 1.6.1:** Create `app/layout.tsx` root layout with basic HTML structure
- **Task 1.6.2:** Create `app/(public)/layout.tsx` for unauthenticated routes
- **Task 1.6.3:** Create `app/(protected)/layout.tsx` with auth check and redirect
- **Task 1.6.4:** Set up Tailwind configuration with custom colors and fonts
- **Task 1.6.5:** Add Arabic font (Amiri) via Google Fonts

---

## Phase 2: Data Acquisition & Seeding

**Deliverable:** Complete Quran data in `/data/surahs/` and LLM-generated verse analysis in `/data/analysis/`

**Branch:** `feature/phase-2-data`

### Step 2.1: Create Data Directory Structure

- **Task 2.1.1:** Create `data/surahs/` directory
- **Task 2.1.2:** Create `data/analysis/` directory
- **Task 2.1.3:** Add data directories to `.gitignore` with exclusions for committed analysis files

### Step 2.2: Build Quran Data Fetch Script

- **Task 2.2.1:** Install tsx for running TypeScript scripts
  ```bash
  npm install -D tsx
  ```
- **Task 2.2.2:** Create `scripts/fetch-quran-data.ts` script that:
  - Fetches data from quran-json repository
  - Transforms to required format (id, name, revelation, verses)
  - Saves `index.json` with surah metadata
  - Saves `001.json` through `114.json` with full surah data
- **Task 2.2.3:** Add `fetch-quran` npm script
- **Task 2.2.4:** Run script and verify data integrity
- **Task 2.2.5:** Validate verse count matches expectations (6,236 total verses)

### Step 2.3: Configure LLM Integration

- **Task 2.3.1:** Create `lib/llm.ts` with callLLM function supporting Ollama
- **Task 2.3.2:** Add LLM environment variables (LLM_PROVIDER, LLM_API_URL, LLM_MODEL)
- **Task 2.3.3:** Create prompt templates for verse analysis
- **Task 2.3.4:** Implement response validation for LLM output
- **Task 2.3.5:** Add retry logic with exponential backoff

### Step 2.4: Build Seed Script for Verse Analysis

- **Task 2.4.1:** Create `scripts/seed.ts` with:
  - Surah iteration (001 → 114)
  - Resume support (skip completed surahs)
  - Per-verse LLM analysis calls
  - JSON parsing and validation
  - Progress logging
- **Task 2.4.2:** Implement VerseAnalysis validation function
- **Task 2.4.3:** Add retry logic (3 attempts per verse)
- **Task 2.4.4:** Save analysis to `data/analysis/{surahId}.json`
- **Task 2.4.5:** Add `seed` npm script
- **Task 2.4.6:** Test with single surah (Al-Fatihah)
- **Task 2.4.7:** Document expected runtime (~2 hours for all verses)

### Step 2.5: Create Data Loading Utilities

- **Task 2.5.1:** Create `lib/data.ts` with functions:
  - `getSurahIndex()` - Load surah list
  - `getSurah(id)` - Load single surah data
  - `getVerseAnalysis(surahId, verseNum)` - Load pre-computed analysis
- **Task 2.5.2:** Add caching for frequently accessed data
- **Task 2.5.3:** Add error handling for missing files

---

## Phase 3: Authentication UI

**Deliverable:** Complete authentication flow with landing, login, and registration pages.

**Branch:** `feature/phase-3-auth-ui`

### Step 3.1: Create Shared UI Components

- **Task 3.1.1:** Create `components/ui/Button.tsx` with variants (primary, secondary)
- **Task 3.1.2:** Create `components/ui/Input.tsx` with label and error support
- **Task 3.1.3:** Create `components/ui/Card.tsx` for content containers
- **Task 3.1.4:** Create `components/ui/Spinner.tsx` for loading states
- **Task 3.1.5:** Create `components/ui/Alert.tsx` for error/success messages

### Step 3.2: Build Landing Page

- **Task 3.2.1:** Create `app/(public)/page.tsx` landing page
- **Task 3.2.2:** Build hero section with headline and CTA buttons
- **Task 3.2.3:** Build "How It Works" section with 3 cards
- **Task 3.2.4:** Build features section
- **Task 3.2.5:** Add responsive styling for mobile
- **Task 3.2.6:** Create simple header with Qalam logo and Login link

### Step 3.3: Build Registration Page

- **Task 3.3.1:** Create `app/(public)/register/page.tsx`
- **Task 3.3.2:** Build registration form with name, email, password fields
- **Task 3.3.3:** Add client-side validation with Zod
- **Task 3.3.4:** Create `app/api/auth/register/route.ts` API endpoint
- **Task 3.3.5:** Implement password hashing with bcrypt
- **Task 3.3.6:** Handle duplicate email error
- **Task 3.3.7:** Auto-login after successful registration
- **Task 3.3.8:** Redirect to dashboard after login

### Step 3.4: Build Login Page

- **Task 3.4.1:** Create `app/(public)/login/page.tsx`
- **Task 3.4.2:** Build login form with email and password fields
- **Task 3.4.3:** Add client-side validation
- **Task 3.4.4:** Implement signIn with NextAuth
- **Task 3.4.5:** Handle invalid credentials error
- **Task 3.4.6:** Redirect to dashboard after login

### Step 3.5: Create Protected Layout

- **Task 3.5.1:** Create `app/(protected)/layout.tsx` with session check
- **Task 3.5.2:** Redirect unauthenticated users to login
- **Task 3.5.3:** Create `components/Navbar.tsx` for authenticated pages
- **Task 3.5.4:** Add navigation links (Dashboard, Browse, Progress)
- **Task 3.5.5:** Add profile dropdown with Settings and Logout
- **Task 3.5.6:** Implement mobile hamburger menu

---

## Phase 4: Surah API & Browse Feature

**Deliverable:** Working surah browser where users can view all surahs and their verses.

**Branch:** `feature/phase-4-browse`

### Step 4.1: Create Surah API Routes

- **Task 4.1.1:** Create `app/api/surahs/route.ts` - GET list of all surahs
- **Task 4.1.2:** Create `app/api/surahs/[id]/route.ts` - GET single surah with verses
- **Task 4.1.3:** Load data from JSON files in /data/surahs/
- **Task 4.1.4:** Return proper error responses (404 for invalid surah)

### Step 4.2: Build Surah Browser Page

- **Task 4.2.1:** Create `app/(protected)/browse/page.tsx`
- **Task 4.2.2:** Fetch surah list from API
- **Task 4.2.3:** Display all 114 surahs in card list
- **Task 4.2.4:** Show surah metadata (number, name, Arabic name, verse count, revelation)
- **Task 4.2.5:** Add loading state with skeleton cards
- **Task 4.2.6:** Add responsive grid layout

### Step 4.3: Build Surah Detail Page

- **Task 4.3.1:** Create `app/(protected)/browse/surah/[id]/page.tsx`
- **Task 4.3.2:** Fetch surah data with all verses
- **Task 4.3.3:** Display surah header (name, revelation, verse count)
- **Task 4.3.4:** List all verses with Arabic text
- **Task 4.3.5:** Add "Practice" button for each verse
- **Task 4.3.6:** Show user's progress per verse (to be implemented in Phase 6)
- **Task 4.3.7:** Add back navigation to browse page

### Step 4.4: Create Verse Display Component

- **Task 4.4.1:** Create `components/VerseDisplay.tsx`
- **Task 4.4.2:** Render Arabic text with proper RTL direction
- **Task 4.4.3:** Use Amiri font with appropriate sizing
- **Task 4.4.4:** Add proper spacing between words
- **Task 4.4.5:** Handle lang="ar" for screen readers

---

## Phase 5: Core Practice Feature

**Deliverable:** Complete practice workflow where users can attempt translations and receive AI feedback.

**Branch:** `feature/phase-5-practice`

### Step 5.1: Create Practice Page UI

- **Task 5.1.1:** Create `app/(protected)/practice/page.tsx`
- **Task 5.1.2:** Parse verseId from query params (?verseId=1:2)
- **Task 5.1.3:** Fetch verse data (Arabic text, translation)
- **Task 5.1.4:** Display Arabic verse with VerseDisplay component
- **Task 5.1.5:** Create textarea for user input
- **Task 5.1.6:** Add "Submit Answer" button
- **Task 5.1.7:** Add "I Don't Know" button
- **Task 5.1.8:** Implement loading state while evaluating

### Step 5.2: Build Evaluation API Route

- **Task 5.2.1:** Create `app/api/evaluate/route.ts`
- **Task 5.2.2:** Require authentication
- **Task 5.2.3:** Validate request body with Zod
- **Task 5.2.4:** Handle "skipped" case (no LLM call, return 0 score)
- **Task 5.2.5:** Load verse data and pre-computed analysis
- **Task 5.2.6:** Call LLM with evaluation prompt (from docs/04-llm-integration.md)
- **Task 5.2.7:** Parse and validate LLM response
- **Task 5.2.8:** Save attempt to database
- **Task 5.2.9:** Return evaluation result with analysis

### Step 5.3: Create Runtime LLM Evaluation

- **Task 5.3.1:** Create `lib/evaluate.ts` with evaluateTranslation function
- **Task 5.3.2:** Build evaluation prompt with user input, correct translation, and analysis
- **Task 5.3.3:** Parse score, summary, gotCorrect, missed, insight from response
- **Task 5.3.4:** Clamp score to 0-100 range
- **Task 5.3.5:** Add fallback for LLM unavailability (basic keyword matching)

### Step 5.4: Build Feedback Display Component

- **Task 5.4.1:** Create `components/FeedbackCard.tsx`
- **Task 5.4.2:** Display user's answer
- **Task 5.4.3:** Show score with encouraging message based on range
- **Task 5.4.4:** Show "What You Got Correct" list with green checkmarks
- **Task 5.4.5:** Show "What You Missed" list with amber warning icons
- **Task 5.4.6:** Show teaching insight with lightbulb icon (if present)
- **Task 5.4.7:** Show correct translation for comparison

### Step 5.5: Build Analysis Display Component

- **Task 5.5.1:** Create `components/AnalysisView.tsx`
- **Task 5.5.2:** Display word-by-word breakdown table
- **Task 5.5.3:** Show Arabic word, transliteration, meaning, root, grammar
- **Task 5.5.4:** Display grammar notes list
- **Task 5.5.5:** Style for readability with proper RTL alignment

### Step 5.6: Implement Practice Flow Navigation

- **Task 5.6.1:** Add "Try Again" button - clears feedback, resets to input state
- **Task 5.6.2:** Add "Next Verse" button - navigates to next verse in sequence
- **Task 5.6.3:** Add "Back" button - returns to previous page
- **Task 5.6.4:** Implement keyboard shortcut (Enter to submit)
- **Task 5.6.5:** Auto-focus textarea on page load

---

## Phase 6: Progress Tracking

**Deliverable:** Complete progress tracking with statistics, history, and verse-specific progress views.

**Branch:** `feature/phase-6-progress`

### Step 6.1: Create Progress API Routes

- **Task 6.1.1:** Create `app/api/progress/route.ts` - GET summary stats
  - totalAttempts, uniqueVerses, averageScore, daysActive
- **Task 6.1.2:** Create `app/api/progress/next-verse/route.ts` - GET next unattempted verse
- **Task 6.1.3:** Create `app/api/progress/history/route.ts` - GET paginated attempt history
- **Task 6.1.4:** Create `app/api/progress/surahs/[id]/route.ts` - GET surah-specific progress
- **Task 6.1.5:** Create `app/api/progress/verses/[verseId]/route.ts` - GET verse-specific attempts

### Step 6.2: Build Dashboard Page

- **Task 6.2.1:** Create `app/(protected)/dashboard/page.tsx`
- **Task 6.2.2:** Display greeting with user's name
- **Task 6.2.3:** Show 4 statistics cards (attempts, verses, avg score, days)
- **Task 6.2.4:** Add "Continue Reading" button with next verse preview
- **Task 6.2.5:** Add "Browse Surahs" button
- **Task 6.2.6:** Show recent activity list (last 10 attempts)
- **Task 6.2.7:** Link attempts to verse detail page

### Step 6.3: Build Progress Overview Page

- **Task 6.3.1:** Create `app/(protected)/progress/page.tsx`
- **Task 6.3.2:** Display summary statistics (same as dashboard)
- **Task 6.3.3:** Show complete attempt history with pagination
- **Task 6.3.4:** Display verse reference, score, time ago, user input snippet
- **Task 6.3.5:** Add "View Details" link for each attempt

### Step 6.4: Build Verse Progress Detail Page

- **Task 6.4.1:** Create `app/(protected)/progress/verse/[verseId]/page.tsx`
- **Task 6.4.2:** Display verse Arabic and translation
- **Task 6.4.3:** Show aggregate stats (total attempts, average, best score)
- **Task 6.4.4:** Add "Practice This Verse Again" button
- **Task 6.4.5:** List all attempts in reverse chronological order
- **Task 6.4.6:** Expandable feedback for each attempt

### Step 6.5: Integrate Progress into Browse

- **Task 6.5.1:** Update surah detail page to show user's best score per verse
- **Task 6.5.2:** Show attempt count per verse
- **Task 6.5.3:** Indicate unattempted verses differently
- **Task 6.5.4:** Add visual progress indicator (e.g., percentage complete)

### Step 6.6: Create Stats Components

- **Task 6.6.1:** Create `components/ProgressStats.tsx` for stat cards
- **Task 6.6.2:** Create `components/AttemptList.tsx` for history lists
- **Task 6.6.3:** Add relative time formatting ("2 hours ago", "Yesterday")
- **Task 6.6.4:** Add score color coding (green for high, amber for medium)

---

## Phase 7: Settings & User Management

**Deliverable:** Settings page with profile management and password change functionality.

**Branch:** `feature/phase-7-settings`

### Step 7.1: Create Settings Page

- **Task 7.1.1:** Create `app/(protected)/settings/page.tsx`
- **Task 7.1.2:** Build profile section with name field (email read-only)
- **Task 7.1.3:** Build password change section
- **Task 7.1.4:** Add logout button
- **Task 7.1.5:** Add loading states for form submissions

### Step 7.2: Create Settings API Routes

- **Task 7.2.1:** Create `app/api/user/profile/route.ts` - PATCH to update name
- **Task 7.2.2:** Create `app/api/user/password/route.ts` - POST to change password
- **Task 7.2.3:** Validate current password before allowing change
- **Task 7.2.4:** Hash new password with bcrypt
- **Task 7.2.5:** Return success/error responses

### Step 7.3: Implement Logout

- **Task 7.3.1:** Add signOut from NextAuth on logout click
- **Task 7.3.2:** Redirect to landing page after logout
- **Task 7.3.3:** Clear any client-side state

---

## Phase 8: Security & Rate Limiting

**Deliverable:** Production-ready security measures including rate limiting and input validation.

**Branch:** `feature/phase-8-security`

### Step 8.1: Implement Rate Limiting

- **Task 8.1.1:** Create `lib/rate-limit.ts` with in-memory rate limiter
- **Task 8.1.2:** Apply to `/api/auth/*` routes (10 req/min)
- **Task 8.1.3:** Apply to `/api/evaluate` route (20 req/min)
- **Task 8.1.4:** Return 429 Too Many Requests when exceeded
- **Task 8.1.5:** Add rate limit headers to responses

### Step 8.2: Harden API Routes

- **Task 8.2.1:** Ensure all protected routes check authentication
- **Task 8.2.2:** Validate all inputs with Zod schemas
- **Task 8.2.3:** Sanitize error messages (don't leak internal details)
- **Task 8.2.4:** Add try-catch wrappers to all API routes

### Step 8.3: Security Audit

- **Task 8.3.1:** Verify no secrets in codebase
- **Task 8.3.2:** Check all database queries use Prisma (no raw SQL injection risk)
- **Task 8.3.3:** Verify HTTPS-only cookies for sessions
- **Task 8.3.4:** Review OWASP top 10 against implementation

---

## Phase 9: Polish & UX Enhancement

**Deliverable:** Production-quality user experience with loading states, error handling, and responsive design.

**Branch:** `feature/phase-9-polish`

### Step 9.1: Implement Loading States

- **Task 9.1.1:** Create skeleton components for cards, lists, text
- **Task 9.1.2:** Add skeleton loading to browse page
- **Task 9.1.3:** Add skeleton loading to dashboard
- **Task 9.1.4:** Add skeleton loading to progress pages
- **Task 9.1.5:** Add "Evaluating your answer..." state with spinner

### Step 9.2: Implement Error Handling

- **Task 9.2.1:** Create `components/ErrorBoundary.tsx` for React errors
- **Task 9.2.2:** Create `components/ErrorMessage.tsx` for API errors
- **Task 9.2.3:** Add error handling to all data fetching
- **Task 9.2.4:** Add retry buttons where appropriate
- **Task 9.2.5:** Handle LLM unavailability gracefully with fallback

### Step 9.3: Mobile Responsiveness

- **Task 9.3.1:** Audit all pages on mobile viewport (375px)
- **Task 9.3.2:** Fix hamburger menu functionality
- **Task 9.3.3:** Ensure Arabic text readable without zooming
- **Task 9.3.4:** Make buttons minimum 48px tap target
- **Task 9.3.5:** Fix textarea behavior with mobile keyboard
- **Task 9.3.6:** Test on actual mobile devices

### Step 9.4: Accessibility

- **Task 9.4.1:** Add proper heading hierarchy (h1, h2, h3)
- **Task 9.4.2:** Add ARIA labels to interactive elements
- **Task 9.4.3:** Add lang="ar" to Arabic text elements
- **Task 9.4.4:** Ensure keyboard navigation works
- **Task 9.4.5:** Check color contrast ratios
- **Task 9.4.6:** Test with screen reader

### Step 9.5: Visual Polish

- **Task 9.5.1:** Refine color palette (deep teal/green primary)
- **Task 9.5.2:** Add subtle shadows and depth to cards
- **Task 9.5.3:** Ensure consistent spacing (8px grid)
- **Task 9.5.4:** Add transitions/animations for state changes
- **Task 9.5.5:** Polish Arabic font sizing and line height

---

## Phase 10: Testing & Documentation

**Deliverable:** Test coverage for critical paths and deployment-ready documentation.

**Branch:** `feature/phase-10-testing`

### Step 10.1: Set Up Testing Infrastructure

- **Task 10.1.1:** Install Jest and React Testing Library
  ```bash
  npm install -D jest @testing-library/react @testing-library/jest-dom
  ```
- **Task 10.1.2:** Configure Jest for Next.js
- **Task 10.1.3:** Add test npm scripts

### Step 10.2: Write Unit Tests

- **Task 10.2.1:** Test Zod validation schemas
- **Task 10.2.2:** Test data loading utilities
- **Task 10.2.3:** Test LLM response validation
- **Task 10.2.4:** Test score clamping logic

### Step 10.3: Write Integration Tests

- **Task 10.3.1:** Test registration flow
- **Task 10.3.2:** Test login flow
- **Task 10.3.3:** Test evaluation API
- **Task 10.3.4:** Test progress API routes

### Step 10.4: Update Documentation

- **Task 10.4.1:** Update README.md with setup instructions
- **Task 10.4.2:** Document environment variables
- **Task 10.4.3:** Add contribution guidelines
- **Task 10.4.4:** Document API endpoints

---

## Phase 11: Deployment

**Deliverable:** Deployed application accessible on the web.

**Branch:** `feature/phase-11-deployment`

### Step 11.1: Prepare for Production

- **Task 11.1.1:** Run production build (`npm run build`)
- **Task 11.1.2:** Fix any build errors
- **Task 11.1.3:** Verify all analysis JSON files are committed
- **Task 11.1.4:** Set NODE_ENV=production

### Step 11.2: Deploy to Vercel

- **Task 11.2.1:** Create Vercel account and link GitHub repo
- **Task 11.2.2:** Configure environment variables in Vercel dashboard
- **Task 11.2.3:** Deploy and verify functionality
- **Task 11.2.4:** Set up custom domain (optional)

### Step 11.3: Production LLM Configuration

- **Task 11.3.1:** Choose LLM provider (self-hosted Ollama or OpenAI)
- **Task 11.3.2:** Configure production LLM_API_URL
- **Task 11.3.3:** Test evaluation in production
- **Task 11.3.4:** Monitor LLM costs and performance

---

## Appendix: Quick Reference

### Branch Naming Convention

```
feature/phase-{N}-{short-description}
```

### Commit Message Format

```
{type}: {short description}

- {detail 1}
- {detail 2}

{Phase/Step reference if applicable}
```

Types: feat, fix, docs, style, refactor, test, chore

### Development Workflow

1. Create branch from main
2. Complete all tasks in the step
3. Test functionality
4. Create PR with step summary
5. Merge to main
6. Repeat for next step

### Task Status Legend

- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked

---

## Summary

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 1 | Foundation | Running Next.js app with auth |
| 2 | Data | Quran data + verse analysis |
| 3 | Auth UI | Landing, login, register pages |
| 4 | Browse | Surah browser and verse selection |
| 5 | Practice | Core learning interface |
| 6 | Progress | Statistics and history tracking |
| 7 | Settings | User profile management |
| 8 | Security | Rate limiting and hardening |
| 9 | Polish | UX, loading states, mobile |
| 10 | Testing | Test coverage and docs |
| 11 | Deployment | Live production app |

---

*This plan provides a complete roadmap for building Qalam. Each phase results in a working increment of the application. Work through phases sequentially, completing all steps and tasks before moving to the next phase.*
