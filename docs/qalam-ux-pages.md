# Qalam: UX Page Specifications

**Version:** 2.1 (Consolidated)  
**Last Updated:** December 2025  
**Purpose:** Define all application pages, layouts, and interactions

---

## Page Structure Overview

Qalam is a single-page application with eight main views:

1. **Landing** - Unauthenticated welcome page
2. **Login** - User authentication
3. **Registration** - New account creation
4. **Dashboard** - Authenticated home with stats and quick actions
5. **Practice** - Core learning interface where users attempt verses
6. **Surah Browser** - Browse and select surahs
7. **Progress** - View learning history and statistics
8. **Settings** - User preferences and account management

All authenticated pages share a common navigation structure.

---

## Navigation Structure

### Header (Authenticated Pages)

Present on all pages after login:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Qalam         Dashboard  Browse  Progress          â”‚
â”‚                                        [Profile â–¾]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Elements:**
- **Qalam logo/wordmark** - Clicking returns to dashboard
- **Dashboard link** - Home view with stats
- **Browse link** - Surah browser
- **Progress link** - Learning history
- **Profile menu** - Dropdown with Settings and Logout

**Mobile:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  â˜°  Qalam         [Profile] â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Hamburger menu expands to show navigation links.

---

## Page One: Landing

**Route:** `/`  
**Authentication:** Not required  
**Purpose:** Welcome page explaining Qalam to new visitors

### Layout

**Hero Section:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                     â”‚
â”‚         Learn to Understand the Quran               â”‚
â”‚                                                     â”‚
â”‚    Practice Quranic comprehension with AI-powered   â”‚
â”‚    feedback that teaches you Arabic patterns and    â”‚
â”‚    meanings.                                        â”‚
â”‚                                                     â”‚
â”‚         [Get Started] [Learn More]                  â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**How It Works Section:**

Three cards showing the process:

1. **Read the Arabic**  
   "See verses in beautiful Arabic text with proper diacritical marks"

2. **Write Your Understanding**  
   "Type what you think the verse means in your own words"

3. **Receive Personalized Feedback**  
   "Get AI-powered feedback showing what you got right, what you missed, and teaching insights"

**Features Section:**

- Verse-by-verse learning at your own pace
- AI tutor that meets you where you are
- Track your progress over time
- Practice on any device, anytime

**Call to Action:**

Large "Start Learning" button leading to registration.

### Mobile Adaptation

Stack all sections vertically. Ensure text is readable without zooming. Make CTA buttons large and tappable.

---

## Page Two: Registration

**Route:** `/register`  
**Authentication:** Not required  
**Purpose:** Create new user account

### Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                     â”‚
â”‚         Create Your Account         â”‚
â”‚                                     â”‚
â”‚  Name:     [________________]       â”‚
â”‚                                     â”‚
â”‚  Email:    [________________]       â”‚
â”‚                                     â”‚
â”‚  Password: [________________]       â”‚
â”‚            (minimum 8 characters)   â”‚
â”‚                                     â”‚
â”‚         [Create Account]            â”‚
â”‚                                     â”‚
â”‚  Already have an account? [Login]   â”‚
â”‚                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Validation

**Client-side validation:**
- Name: Required, one to one hundred characters
- Email: Required, valid email format
- Password: Required, minimum eight characters

**Error display:**
Show validation errors inline below each field in red text.

**Server errors:**
If email already exists, show: "This email is already registered. Please login or use a different email."

### Success Flow

After successful registration:
1. User automatically logged in
2. JWT token stored in localStorage
3. Redirect to Dashboard
4. Optional: Show welcome message/tutorial

---

## Page Three: Login

**Route:** `/login`  
**Authentication:** Not required  
**Purpose:** Authenticate existing users

### Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                     â”‚
â”‚           Welcome Back              â”‚
â”‚                                     â”‚
â”‚  Email:    [________________]       â”‚
â”‚                                     â”‚
â”‚  Password: [________________]       â”‚
â”‚                                     â”‚
â”‚         [Login]                     â”‚
â”‚                                     â”‚
â”‚  Don't have an account? [Register]  â”‚
â”‚                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Error Handling

If credentials invalid: "Invalid email or password. Please try again."

Display error message above the form, not inline.

### Success Flow

After successful login:
1. JWT token stored in localStorage
2. Redirect to Dashboard (or return to page they came from if applicable)

---

## Page Four: Dashboard

**Route:** `/dashboard`  
**Authentication:** Required  
**Purpose:** Home page showing stats and quick actions

### Layout

**Welcome Section:**
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  As-salamu alaykum, Ahmed                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Uses user's name from their profile.

**Statistics Cards:**

Four cards showing key metrics:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   47         â”‚ â”‚   15         â”‚ â”‚   73.5%      â”‚ â”‚   8          â”‚
â”‚   Attempts   â”‚ â”‚   Verses     â”‚ â”‚   Avg Score  â”‚ â”‚   Days       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Data source:** GET /api/progress

**Quick Actions:**

Two large action buttons:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                     â”‚
â”‚          [Continue Reading from Beginning]          â”‚
â”‚                                                     â”‚
â”‚          (Next verse: Al-Fatihah â€¢ Verse 3)        â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                     â”‚
â”‚          [Browse Surahs and Choose a Verse]        â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Continue Reading:**
- Calls GET /api/progress/next-verse
- Navigates to `/practice?verseId={verseId}`
- Shows which verse is next as a preview

**Browse Surahs:**
- Navigates to `/browse`

**Recent Activity:**

Shows last five to ten attempts:

```
Recent Practice:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Al-Fatihah â€¢ Verse 2          85%    2 hours ago   â”‚
â”‚  Al-Fatihah â€¢ Verse 1          90%    Yesterday     â”‚
â”‚  Al-Fatihah â€¢ Verse 2          70%    2 days ago    â”‚
â”‚  ...                                                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Data source:** GET /api/progress/history?limit=10

Clicking any attempt navigates to that verse's detail page.

### Mobile Layout

Stack all elements vertically. Statistics cards become two columns instead of four. Recent activity list scrollable.

---

## Page Five: Practice

**Route:** `/practice?verseId={id}`  
**Authentication:** Required  
**Purpose:** Core learning interface where users attempt verses

This is the most important page in the application. The UX here determines the learning experience.

### Initial State (Before Submission)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Al-Fatihah â€¢ Verse 2                     [â† Back]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                     â”‚
â”‚                                                     â”‚
â”‚         Ø§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ø±ÙŽØ¨ÙÙ‘ Ø§Ù„Ù’Ø¹ÙŽØ§Ù„ÙŽÙ…ÙÙŠÙ†ÙŽ          â”‚
â”‚                                                     â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  What does this verse mean?                         â”‚
â”‚                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚                                               â”‚  â”‚
â”‚  â”‚                                               â”‚  â”‚
â”‚  â”‚  Type your understanding here...              â”‚  â”‚
â”‚  â”‚                                               â”‚  â”‚
â”‚  â”‚                                               â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                     â”‚
â”‚            [Submit Answer]  [I Don't Know]          â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Elements:**

**Verse Header:**
- Surah name and verse number
- Back button returns to previous page (dashboard or browse)

**Arabic Text Display:**
- Large, centered, clear font (Amiri or similar)
- Proper RTL text direction
- Adequate spacing
- Beautiful presentation (this is sacred text)
- Font size: twenty-four to thirty-two pixels on desktop, twenty to twenty-four on mobile

**Input Section:**
- Clear label: "What does this verse mean?"
- Large textarea for user input
- Placeholder text: "Type your understanding here..."
- Auto-focus on page load
- Minimum height: one hundred fifty pixels

**Action Buttons:**
- **Submit Answer:** Primary button, large, clear
- **I Don't Know:** Secondary button (different styling, less prominent)

### Loading State (After Submission)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                     â”‚
â”‚         Ø§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ø±ÙŽØ¨ÙÙ‘ Ø§Ù„Ù’Ø¹ÙŽØ§Ù„ÙŽÙ…ÙÙŠÙ†ÙŽ          â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                     â”‚
â”‚              Evaluating your answer...              â”‚
â”‚                    [spinner icon]                   â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Show clear loading indicator. LLM typically takes one to three seconds.

### Feedback State (After Evaluation)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Al-Fatihah â€¢ Verse 2                     [â† Back]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                                                     â”‚
â”‚         Ø§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ø±ÙŽØ¨ÙÙ‘ Ø§Ù„Ù’Ø¹ÙŽØ§Ù„ÙŽÙ…ÙÙŠÙ†ÙŽ          â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Your Answer:                                       â”‚
â”‚  "All praise belongs to Allah, Lord of all worlds"  â”‚
â”‚                                                     â”‚
â”‚  Score: 85%                    [Excellent progress!]â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  âœ“ What You Got Correct:                            â”‚
â”‚    â€¢ Praise to Allah                                â”‚
â”‚    â€¢ Lord of the worlds                             â”‚
â”‚                                                     â”‚
â”‚  âš  What You Missed:                                 â”‚
â”‚    â€¢ The word "due" - all praise is *due* to Allah  â”‚
â”‚                                                     â”‚
â”‚  ðŸ’¡ Teaching Insight:                               â”‚
â”‚  The root Ø­-Ù…-Ø¯ (h-m-d) means praise and appears   â”‚
â”‚  throughout the Quran. Muhammad (Ù…Ø­Ù…Ø¯) means "the   â”‚
â”‚  praised one" from the same root.                   â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Correct Translation:                               â”‚
â”‚  [All] praise is [due] to Allah, Lord of the       â”‚
â”‚  worlds -                                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚         [Try Again]          [Next Verse]           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Feedback Sections:**

**User's Answer Display:**
Show exactly what they typed. This helps them reflect.

**Score Display:**
Show percentage with gentle encouragement:
- Ninety to one hundred percent: "Excellent!"
- Seventy-five to eighty-nine percent: "Great understanding!"
- Sixty to seventy-four percent: "Good progress!"
- Forty to fifty-nine percent: "You're learning!"
- Zero to thirty-nine percent: "Let's learn together!"

**What You Got Correct:**
Green checkmark icon. List items they understood correctly. This builds confidence.

**What You Missed:**
Amber/warning icon (not red/error). List gaps in understanding. Frame as learning opportunities.

**Teaching Insight:**
Light bulb icon. One memorable teaching moment. Two to three sentences max. Focus on transferable knowledge.

**Correct Translation:**
Show the Sahih International translation for comparison.

**Action Buttons:**

**Try Again:**
- Clears the feedback
- Returns to input state for same verse
- User can attempt again with new understanding

**Next Verse:**
- Loads the next verse in sequence
- Navigates to `/practice?verseId={nextVerseId}`
- Determined by GET /api/progress/next-verse

### Mobile Considerations

**Arabic text:**
Ensure it's readable without zooming. Eighteen to twenty-two pixels minimum.

**Textarea:**
Should expand with keyboard. Consider making it take up most of screen height when keyboard is active.

**Feedback sections:**
May need to scroll on mobile. That's okay. Ensure smooth scrolling and clear visual separation between sections.

**Buttons:**
Make large enough to tap easily. Forty-eight pixels minimum height.

---

## Page Six: Surah Browser

**Route:** `/browse`  
**Authentication:** Required  
**Purpose:** Browse and select surahs to practice

### Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Browse Surahs                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  1. Al-Fatihah                           7 verses   â”‚
â”‚     The Opening â€¢ Meccan                            â”‚
â”‚     [View Verses]                                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  2. Al-Baqarah                         286 verses   â”‚
â”‚     The Cow â€¢ Medinan                               â”‚
â”‚     [View Verses]                                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  3. Ali 'Imran                         200 verses   â”‚
â”‚     Family of Imran â€¢ Medinan                       â”‚
â”‚     [View Verses]                                   â”‚
â”‚                                                     â”‚
â”‚  ... (all 114 surahs)                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Data source:** GET /api/surahs

**Each surah card shows:**
- Number and name (Arabic transliteration)
- English meaning
- Revelation location (Meccan/Medinan)
- Verse count
- Button to view verses

**Interaction:**
Clicking "View Verses" navigates to `/browse/surah/{id}` showing all verses in that surah.

### Mobile

Cards stack vertically. Still show all metadata. Ensure tappable areas are large enough.

---

## Page Seven: Surah Detail (Verse Selection)

**Route:** `/browse/surah/{id}`  
**Authentication:** Required  
**Purpose:** Select a specific verse to practice from a surah

### Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  [â† Back]  Al-Fatihah                               â”‚
â”‚            The Opening â€¢ Meccan â€¢ 7 verses          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Verse 1                             [Practice â†’]   â”‚
â”‚  Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø§Ù„Ø±ÙŽÙ‘Ø­Ù’Ù…ÙŽÙ€Ù°Ù†Ù Ø§Ù„Ø±ÙŽÙ‘Ø­ÙÙŠÙ…Ù               â”‚
â”‚                                                     â”‚
â”‚  Your best: 90% (3 attempts)                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Verse 2                             [Practice â†’]   â”‚
â”‚  Ø§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ø±ÙŽØ¨ÙÙ‘ Ø§Ù„Ù’Ø¹ÙŽØ§Ù„ÙŽÙ…ÙÙŠÙ†ÙŽ                 â”‚
â”‚                                                     â”‚
â”‚  Your best: 85% (2 attempts)                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Verse 3                             [Practice â†’]   â”‚
â”‚  Ø§Ù„Ø±ÙŽÙ‘Ø­Ù’Ù…ÙŽÙ€Ù°Ù†Ù Ø§Ù„Ø±ÙŽÙ‘Ø­ÙÙŠÙ…Ù                              â”‚
â”‚                                                     â”‚
â”‚  Not yet attempted                                  â”‚
â”‚                                                     â”‚
â”‚  ... (all verses in surah)                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Data sources:**
- GET /api/surahs/{id} - Verse data
- GET /api/progress/surahs/{id} - User's progress on this surah

**Each verse row shows:**
- Verse number
- Arabic text (smaller than practice page, but readable)
- User's progress with this verse (best score, attempt count)
- Practice button

**Interaction:**
Clicking "Practice" or anywhere on the verse row navigates to `/practice?verseId={id}`

### Progress Indicators

**Not attempted:** Gray text, "Not yet attempted"  
**Attempted:** Show best score and number of attempts  
**Recently practiced:** Could add "2 hours ago" timestamp

---

## Page Eight: Progress Overview

**Route:** `/progress`  
**Authentication:** Required  
**Purpose:** View complete learning history and statistics

### Layout

**Summary Statistics:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Your Learning Journey                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   47         â”‚ â”‚   15         â”‚ â”‚   73.5%      â”‚
â”‚   Total      â”‚ â”‚   Unique     â”‚ â”‚   Average    â”‚
â”‚   Attempts   â”‚ â”‚   Verses     â”‚ â”‚   Score      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Recent Activity List:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Recent Practice                                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Al-Fatihah â€¢ Verse 2          85%    2 hours ago   â”‚
â”‚  "All praise belongs to Allah..."    [View Details] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Al-Fatihah â€¢ Verse 1          90%    Yesterday     â”‚
â”‚  "In the name of God..."             [View Details] â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Al-Fatihah â€¢ Verse 2          70%    2 days ago    â”‚
â”‚  "Praise God"                        [View Details] â”‚
â”‚                                                     â”‚
â”‚  ... (last 20 attempts)                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Data source:** GET /api/progress/history?limit=20

**Each attempt shows:**
- Verse reference
- Score received
- Time ago (relative: "2 hours ago", "Yesterday", "3 days ago")
- Snippet of what user wrote
- Link to view full details

**Interaction:**
Clicking "View Details" navigates to `/progress/verse/{verseId}` to see complete history with that verse.

---

## Page Nine: Verse Progress Detail

**Route:** `/progress/verse/{verseId}`  
**Authentication:** Required  
**Purpose:** See complete learning journey with a specific verse

### Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  [â† Back]  Al-Fatihah â€¢ Verse 2                     â”‚
â”‚                                                     â”‚
â”‚  Ø§Ù„Ù’Ø­ÙŽÙ…Ù’Ø¯Ù Ù„ÙÙ„ÙŽÙ‘Ù‡Ù Ø±ÙŽØ¨ÙÙ‘ Ø§Ù„Ù’Ø¹ÙŽØ§Ù„ÙŽÙ…ÙÙŠÙ†ÙŽ                 â”‚
â”‚  [All] praise is [due] to Allah, Lord of the       â”‚
â”‚  worlds -                                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Your Progress with This Verse                      â”‚
â”‚                                                     â”‚
â”‚  Total Attempts: 3                                  â”‚
â”‚  Average Score: 81.7%                               â”‚
â”‚  First Attempt: December 10, 2024                   â”‚
â”‚  Last Attempt: December 14, 2024                    â”‚
â”‚                                                     â”‚
â”‚            [Practice This Verse Again]              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Attempt History                                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  December 14, 2024 â€¢ 10:35 AM          Score: 85%  â”‚
â”‚                                                     â”‚
â”‚  Your answer:                                       â”‚
â”‚  "All praise belongs to Allah, Lord of all worlds"  â”‚
â”‚                                                     â”‚
â”‚  Feedback: Excellent - you captured the core        â”‚
â”‚  meaning accurately                                 â”‚
â”‚                                                     â”‚
â”‚  [View Full Feedback]                               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  December 12, 2024 â€¢ 2:15 PM           Score: 80%  â”‚
â”‚                                                     â”‚
â”‚  Your answer:                                       â”‚
â”‚  "Praise to Allah, master of everything"            â”‚
â”‚                                                     â”‚
â”‚  [View Full Feedback]                               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  December 10, 2024 â€¢ 9:00 AM           Score: 70%  â”‚
â”‚                                                     â”‚
â”‚  Your answer:                                       â”‚
â”‚  "Praise God"                                       â”‚
â”‚                                                     â”‚
â”‚  [View Full Feedback]                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Data source:** GET /api/progress/verses/{verseId}

**Verse Display:**
Show the Arabic and translation at the top for reference.

**Statistics:**
Aggregate stats for this specific verse.

**Quick Action:**
Button to practice this verse again (navigates to `/practice?verseId={id}`)

**Attempt History:**
All attempts in reverse chronological order (newest first). Show:
- Date and time
- Score received
- What user wrote
- Feedback summary
- Button to expand and see full feedback (correct/missed/insight)

**Growth Visualization:**
This is where users see their learning journey. First attempt: seventy percent. Third attempt: eighty-five percent. Clear evidence of improvement.

---

## Page Ten: Settings

**Route:** `/settings`  
**Authentication:** Required  
**Purpose:** User preferences and account management

### Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Settings                                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Profile                                            â”‚
â”‚                                                     â”‚
â”‚  Name:  [Ahmed Khan____________]                    â”‚
â”‚  Email: ahmed@example.com (cannot be changed)       â”‚
â”‚                                                     â”‚
â”‚         [Update Profile]                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Change Password                                    â”‚
â”‚                                                     â”‚
â”‚  Current Password:  [________________]              â”‚
â”‚  New Password:      [________________]              â”‚
â”‚  Confirm Password:  [________________]              â”‚
â”‚                                                     â”‚
â”‚         [Change Password]                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Preferences                                        â”‚
â”‚                                                     â”‚
â”‚  Translation: [Sahih International â–¾]               â”‚
â”‚  (Future: Add more translation options)             â”‚
â”‚                                                     â”‚
â”‚         [Save Preferences]                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Account Actions                                    â”‚
â”‚                                                     â”‚
â”‚         [Logout]                                    â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Profile Section:**
- Update name
- Email shown but not editable (requires separate flow for security)

**Password Section:**
- Requires current password for security
- Validates new password (minimum eight characters)
- Confirms new password matches

**Preferences:**
- Translation choice (for future when multiple available)
- Could add: preferred font size, dark mode, etc.

**Logout:**
- Clear JWT from localStorage
- Redirect to landing page

---

## Design System

### Colors

**Primary:**
- Brand color: Deep teal/green (Islamic aesthetic)
- Use for: Primary buttons, links, active navigation

**Neutral:**
- Background: Clean white or very light gray
- Text: Dark gray (not pure black, easier on eyes)
- Borders: Light gray

**Semantic:**
- Success/Correct: Soft green
- Warning/Missed: Amber (not red - less harsh)
- Error: Red (only for actual errors)

**Arabic Text:**
- Use slightly darker color than body text for emphasis
- Ensure sufficient contrast for accessibility

### Typography

**Arabic:**
- Font: Amiri, Scheherazade New, or similar
- Size: twenty-four to thirty-two pixels (desktop), twenty to twenty-four (mobile)
- Line height: one point six to one point eight (generous spacing)

**English:**
- Font: System fonts (San Francisco, Segoe UI, Roboto)
- Headings: Medium weight
- Body: Regular weight
- Size: sixteen pixels base (responsive scaling)

### Spacing

Use an eight-pixel grid system:
- Small spacing: eight pixels
- Medium: sixteen pixels
- Large: twenty-four pixels
- Extra large: thirty-two pixels

Consistent spacing creates visual rhythm and professionalism.

### Components

**Buttons:**
- Large tap targets (minimum forty-eight pixels height)
- Clear labels (no ambiguous icons)
- Loading states (show spinner when processing)

**Forms:**
- Clear labels above inputs
- Helpful placeholder text
- Inline validation
- Error messages in context

**Cards:**
- Subtle shadows for depth
- Rounded corners (four to eight pixels)
- Adequate padding (sixteen to twenty-four pixels)

---

## Responsive Breakpoints

**Mobile:** Zero to six hundred forty pixels  
**Tablet:** Six hundred forty-one to one thousand twenty-four pixels  
**Desktop:** One thousand twenty-five pixels and above

Prioritize mobile experience. Most users will practice on phones.

---

## Accessibility

**Semantic HTML:**
Use proper heading hierarchy, landmark elements, and ARIA labels where needed.

**Keyboard Navigation:**
All interactive elements must be keyboard accessible. Clear focus indicators.

**Color Contrast:**
Ensure all text meets WCAG AA standards (four point five to one ratio for normal text).

**Screen Readers:**
Arabic text should be marked with `lang="ar"` for proper pronunciation.

---

## Loading States

**Page Load:**
Show skeleton screens rather than blank pages. Indicate content is loading.

**Data Fetch:**
Show spinners or progress indicators. Never leave users wondering if something is happening.

**LLM Evaluation:**
Explicit "Evaluating your answer..." message with spinner. This sets expectations for the one to three second wait.

---

*These page specifications define the complete user experience of Qalam. Every interaction, every screen, every element is documented here. Implement them as specified to ensure a consistent, high-quality experience.*
