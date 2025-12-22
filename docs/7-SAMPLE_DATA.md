# Qalam: Sample Data & Examples

**Version:** 1.0
**Purpose:** Comprehensive examples of data structures used throughout Qalam

---

## Overview

This document provides complete, realistic examples of the data structures defined in `2-SHARED_TYPES.md`. Use these as reference when:

- Implementing API endpoints
- Writing tests
- Seeding development databases
- Understanding how types work together

---

## Verse Analysis Examples

### Example 1: Al-Qalam 68:2

A complete `VerseAnalysisDoc` demonstrating all fields:

```json
{
  "schemaVersion": 1,
  "verseId": "68:2",
  "surahId": 68,
  "verseNumber": 2,
  "arabic": {
    "uthmani": "مَآ أَنتَ بِنِعۡمَةِ رَبِّكَ بِمَجۡنُونࣲ"
  },
  "reference": {
    "translationId": "sahih-international",
    "translationText": "You are not, [O Muḥammad], by the favor of your Lord, a madman.",
    "source": "Sahih International"
  },
  "analysis": {
    "words": [
      {
        "index": 0,
        "arabic": "مَآ",
        "transliteration": "mā",
        "category": "particle",
        "posDetail": "ḥarf (negation particle)",
        "root": null,
        "coreRootMeaning": null,
        "pattern": null,
        "literalMeaning": "not",
        "notes": ["Negates the nominal sentence that follows."]
      },
      {
        "index": 1,
        "arabic": "أَنتَ",
        "transliteration": "anta",
        "category": "pronoun",
        "posDetail": "independent pronoun (2ms)",
        "root": null,
        "coreRootMeaning": null,
        "pattern": null,
        "literalMeaning": "you",
        "features": {
          "person": 2,
          "gender": "m",
          "number": "sg"
        }
      },
      {
        "index": 2,
        "arabic": "بِ",
        "transliteration": "bi",
        "category": "particle",
        "posDetail": "ḥarf jarr (preposition)",
        "root": null,
        "coreRootMeaning": null,
        "pattern": null,
        "literalMeaning": "by / with"
      },
      {
        "index": 3,
        "arabic": "نِعۡمَةِ",
        "transliteration": "niʿmati",
        "category": "noun",
        "posDetail": "noun (ism)",
        "root": "ن-ع-م",
        "coreRootMeaning": "softness, ease, pleasantness",
        "pattern": "فِعْلَة",
        "literalMeaning": "a favor / a blessing",
        "features": {
          "case": "gen",
          "number": "sg",
          "gender": "f"
        }
      },
      {
        "index": 4,
        "arabic": "رَبِّكَ",
        "transliteration": "rabbika",
        "category": "noun",
        "posDetail": "noun with attached pronoun",
        "root": "ر-ب-ب",
        "coreRootMeaning": "to nurture, sustain, regulate",
        "pattern": null,
        "literalMeaning": "your lord / sustainer",
        "features": {
          "case": "gen",
          "state": "construct",
          "attachedPronoun": {
            "person": 2,
            "gender": "m",
            "number": "sg"
          }
        }
      },
      {
        "index": 5,
        "arabic": "بِ",
        "transliteration": "bi",
        "category": "particle",
        "posDetail": "ḥarf jarr (preposition)",
        "root": null,
        "coreRootMeaning": null,
        "pattern": null,
        "literalMeaning": "by",
        "notes": ["Often used for emphatic negation in nominal sentences."]
      },
      {
        "index": 6,
        "arabic": "مَجۡنُونࣲ",
        "transliteration": "majnūn",
        "category": "noun",
        "posDetail": "passive participle (ism mafʿūl)",
        "root": "ج-ن-ن",
        "coreRootMeaning": "to cover, conceal",
        "pattern": "مَفْعُول",
        "literalMeaning": "one whose reason is covered",
        "features": {
          "case": "gen",
          "definiteness": "indef"
        },
        "notes": ["Derived meaning: mad, insane (mind is veiled/covered)"]
      }
    ],
    "literalAligned": [
      "Not",
      "you",
      "by",
      "favor-of",
      "your-Lord",
      "by",
      "one-whose-mind-is-covered"
    ],
    "roots": [
      {
        "word": "نِعۡمَة",
        "root": "ن-ع-م",
        "coreRootMeaning": "softness, ease",
        "derivedMeaning": "favor, blessing"
      },
      {
        "word": "رَبّ",
        "root": "ر-ب-ب",
        "coreRootMeaning": "nurture, sustain",
        "derivedMeaning": "lord, sustainer"
      },
      {
        "word": "مَجْنُون",
        "root": "ج-ن-ن",
        "coreRootMeaning": "cover, conceal",
        "derivedMeaning": "mind covered → mad"
      }
    ],
    "grammarNotes": [
      "Nominal sentence structure.",
      "Double use of بِ creates emphatic negation.",
      "مَجْنُون is not merely 'crazy' lexically; it is someone whose intellect is obscured."
    ]
  },
  "render": {
    "markdown": "## Verse (Arabic)\n\n**مَآ أَنتَ بِنِعۡمَةِ رَبِّكَ بِمَجۡنُونࣲ**\n\n## Literal (word-aligned)\n\nNot — you — by — a favor — of your Lord — by — one whose mind is covered.\n"
  },
  "provenance": {
    "generatedAt": "2025-12-22T00:00:00.000Z",
    "generator": "llm",
    "model": "together:meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    "promptId": "lex-morph-v1",
    "promptHash": "sha256:abc123...",
    "temperature": 0
  }
}
```

---

### Example 2: Al-Fatihah 1:2

A simpler verse showing common patterns:

```json
{
  "schemaVersion": 1,
  "verseId": "1:2",
  "surahId": 1,
  "verseNumber": 2,
  "arabic": {
    "uthmani": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"
  },
  "reference": {
    "translationId": "sahih-international",
    "translationText": "[All] praise is [due] to Allah, Lord of the worlds -"
  },
  "analysis": {
    "words": [
      {
        "index": 0,
        "arabic": "الْحَمْدُ",
        "transliteration": "al-ḥamdu",
        "category": "noun",
        "posDetail": "definite noun",
        "root": "ح-م-د",
        "coreRootMeaning": "praise, commendation",
        "pattern": "فَعْل",
        "literalMeaning": "the praise",
        "features": {
          "case": "nom",
          "definiteness": "def"
        },
        "notes": ["Subject of nominal sentence", "Definite article indicates totality of praise"]
      },
      {
        "index": 1,
        "arabic": "لِلَّهِ",
        "transliteration": "lillāhi",
        "category": "noun",
        "posDetail": "preposition + proper noun",
        "root": "أ-ل-ه",
        "coreRootMeaning": "deity, god",
        "pattern": null,
        "literalMeaning": "to/for Allah",
        "features": {
          "case": "gen"
        },
        "notes": ["لِ indicates possession/attribution"]
      },
      {
        "index": 2,
        "arabic": "رَبِّ",
        "transliteration": "rabbi",
        "category": "noun",
        "posDetail": "noun in construct state",
        "root": "ر-ب-ب",
        "coreRootMeaning": "to nurture, sustain, regulate",
        "pattern": null,
        "literalMeaning": "Lord / Master",
        "features": {
          "case": "gen",
          "state": "construct"
        }
      },
      {
        "index": 3,
        "arabic": "الْعَالَمِينَ",
        "transliteration": "al-ʿālamīn",
        "category": "noun",
        "posDetail": "plural noun",
        "root": "ع-ل-م",
        "coreRootMeaning": "to know",
        "pattern": "فَاعَل",
        "literalMeaning": "the worlds / all creation",
        "features": {
          "case": "gen",
          "number": "pl",
          "definiteness": "def"
        },
        "notes": ["Plural of عَالَم (world/realm)", "Refers to all of creation"]
      }
    ],
    "literalAligned": [
      "The-praise",
      "to-Allah",
      "Lord",
      "the-worlds"
    ],
    "roots": [
      {
        "word": "الحمد",
        "root": "ح-م-د",
        "coreRootMeaning": "praise, commendation",
        "derivedMeaning": "the praise"
      },
      {
        "word": "الله",
        "root": "أ-ل-ه",
        "coreRootMeaning": "deity, god",
        "derivedMeaning": "Allah (the God)"
      },
      {
        "word": "رب",
        "root": "ر-ب-ب",
        "coreRootMeaning": "nurture, sustain",
        "derivedMeaning": "lord, master, sustainer"
      },
      {
        "word": "العالمين",
        "root": "ع-ل-م",
        "coreRootMeaning": "to know",
        "derivedMeaning": "the worlds (all that is known/exists)"
      }
    ],
    "grammarNotes": [
      "Nominal sentence (no verb).",
      "الحمد is the subject (mubtada'), لله is the predicate (khabar).",
      "رب العالمين is in apposition to الله."
    ]
  },
  "provenance": {
    "generatedAt": "2025-12-22T00:00:00.000Z",
    "generator": "llm",
    "model": "together:meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    "promptId": "lex-morph-v1"
  }
}
```

---

## API Response Examples

### POST /api/evaluate - Success Response

Complete response including runtime feedback and pre-computed analysis:

```json
{
  "attemptId": "att_abc123",
  "verseId": "1:2",
  "score": 85,
  "feedback": {
    "summary": "Excellent - you captured the core meaning accurately.",
    "correct": [
      "praise to Allah",
      "Lord of the worlds"
    ],
    "missed": [
      "The word 'due' - all praise is *due* to Allah"
    ],
    "insight": null
  },
  "analysis": {
    "words": [
      {
        "index": 0,
        "arabic": "الْحَمْدُ",
        "transliteration": "al-ḥamdu",
        "category": "noun",
        "root": "ح-م-د",
        "coreRootMeaning": "praise, commendation",
        "literalMeaning": "the praise"
      },
      {
        "index": 1,
        "arabic": "لِلَّهِ",
        "transliteration": "lillāhi",
        "category": "noun",
        "literalMeaning": "to/for Allah"
      },
      {
        "index": 2,
        "arabic": "رَبِّ",
        "transliteration": "rabbi",
        "category": "noun",
        "root": "ر-ب-ب",
        "coreRootMeaning": "nurture, sustain",
        "literalMeaning": "Lord"
      },
      {
        "index": 3,
        "arabic": "الْعَالَمِينَ",
        "transliteration": "al-ʿālamīn",
        "category": "noun",
        "root": "ع-ل-م",
        "coreRootMeaning": "to know",
        "literalMeaning": "the worlds"
      }
    ],
    "literalAligned": ["The-praise", "to-Allah", "Lord", "the-worlds"],
    "roots": [
      {
        "word": "الحمد",
        "root": "ح-م-د",
        "coreRootMeaning": "praise",
        "derivedMeaning": "the praise"
      },
      {
        "word": "رب",
        "root": "ر-ب-ب",
        "coreRootMeaning": "nurture, sustain",
        "derivedMeaning": "lord, master"
      }
    ],
    "grammarNotes": [
      "Nominal sentence",
      "Definite article indicates totality of praise"
    ]
  },
  "verse": {
    "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "translation": "[All] praise is [due] to Allah, Lord of the worlds -"
  },
  "createdAt": "2025-12-22T10:35:00.000Z"
}
```

### POST /api/evaluate - Without Analysis (Fallback)

When pre-computed analysis is not available:

```json
{
  "attemptId": "att_def456",
  "verseId": "2:255",
  "score": 70,
  "feedback": {
    "summary": "Good understanding of the main concepts.",
    "correct": [
      "Allah is the one God",
      "He is ever-living"
    ],
    "missed": [
      "The concept of 'self-sustaining'",
      "Neither slumber nor sleep"
    ],
    "insight": null
  },
  "verse": {
    "arabic": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...",
    "translation": "Allah - there is no deity except Him, the Ever-Living, the Self-Sustaining..."
  },
  "createdAt": "2025-12-22T10:40:00.000Z"
}
```

Note: `analysis` field is absent - UI should handle this gracefully.

---

## User Progress Examples

### GET /api/progress - Response

```json
{
  "totalAttempts": 47,
  "uniqueVerses": 15,
  "averageScore": 73.5,
  "lastAttemptAt": "2025-12-22T10:35:00.000Z",
  "daysActive": 8
}
```

### GET /api/progress/verses/1:2 - Response

```json
{
  "verseId": "1:2",
  "attempts": [
    {
      "id": "att_003",
      "userInput": "All praise belongs to Allah, the Lord of all worlds",
      "score": 85,
      "feedback": {
        "summary": "Excellent - you captured the core meaning accurately",
        "correct": ["praise to Allah", "Lord of the worlds"],
        "missed": ["The word 'due'"],
        "insight": null
      },
      "createdAt": "2025-12-22T10:35:00.000Z"
    },
    {
      "id": "att_002",
      "userInput": "Praise to Allah, master of everything",
      "score": 70,
      "feedback": {
        "summary": "Good understanding, minor details missed",
        "correct": ["praise to Allah"],
        "missed": ["Lord of the worlds (not 'everything')"],
        "insight": null
      },
      "createdAt": "2025-12-20T09:00:00.000Z"
    },
    {
      "id": "att_001",
      "userInput": "Praise God",
      "score": 50,
      "feedback": {
        "summary": "Partial understanding - you got the basic idea",
        "correct": ["praise to Allah"],
        "missed": ["Lord of the worlds", "completeness of praise"],
        "insight": null
      },
      "createdAt": "2025-12-18T14:00:00.000Z"
    }
  ],
  "stats": {
    "totalAttempts": 3,
    "averageScore": 68.3,
    "bestScore": 85,
    "firstAttemptAt": "2025-12-18T14:00:00.000Z",
    "lastAttemptAt": "2025-12-22T10:35:00.000Z"
  }
}
```

---

## Analysis Pipeline Examples

### data/analysis/index.json

Progress tracking for the analysis pipeline:

```json
{
  "totalVerses": 6236,
  "analyzedVerses": 357,
  "completionPercentage": 5.7,
  "surahs": [
    {
      "surahId": 1,
      "name": "Al-Fatihah",
      "totalVerses": 7,
      "analyzedVerses": 7,
      "status": "completed",
      "lastUpdated": "2025-12-21T10:30:00.000Z"
    },
    {
      "surahId": 2,
      "name": "Al-Baqarah",
      "totalVerses": 286,
      "analyzedVerses": 0,
      "status": "pending",
      "lastUpdated": null
    },
    {
      "surahId": 68,
      "name": "Al-Qalam",
      "totalVerses": 52,
      "analyzedVerses": 52,
      "status": "completed",
      "lastUpdated": "2025-12-21T12:00:00.000Z"
    },
    {
      "surahId": 114,
      "name": "An-Nas",
      "totalVerses": 6,
      "analyzedVerses": 6,
      "status": "completed",
      "lastUpdated": "2025-12-21T11:00:00.000Z"
    }
  ],
  "lastUpdated": "2025-12-21T12:00:00.000Z",
  "promptVersion": "lex-morph-v1"
}
```

---

## Source Verse Data Examples

### data/surahs/001.json

Source verse file (input to analysis pipeline):

```json
{
  "id": 1,
  "name": {
    "arabic": "الفاتحة",
    "transliteration": "Al-Fatihah",
    "english": "The Opening"
  },
  "revelation": "meccan",
  "verseCount": 7,
  "verses": [
    {
      "id": "1:1",
      "number": 1,
      "arabic": "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ",
      "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful."
    },
    {
      "id": "1:2",
      "number": 2,
      "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      "translation": "[All] praise is [due] to Allah, Lord of the worlds -"
    },
    {
      "id": "1:3",
      "number": 3,
      "arabic": "الرَّحْمَـٰنِ الرَّحِيمِ",
      "translation": "The Entirely Merciful, the Especially Merciful,"
    },
    {
      "id": "1:4",
      "number": 4,
      "arabic": "مَـٰلِكِ يَوْمِ الدِّينِ",
      "translation": "Sovereign of the Day of Recompense."
    },
    {
      "id": "1:5",
      "number": 5,
      "arabic": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      "translation": "It is You we worship and You we ask for help."
    },
    {
      "id": "1:6",
      "number": 6,
      "arabic": "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
      "translation": "Guide us to the straight path -"
    },
    {
      "id": "1:7",
      "number": 7,
      "arabic": "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      "translation": "The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray."
    }
  ]
}
```

---

## Database Record Examples

### attempts table

```sql
INSERT INTO attempts (id, userId, verseId, surahId, verseNumber, userInput, score, feedback, skipped, createdAt)
VALUES (
  'att_abc123',
  'usr_xyz789',
  '1:2',
  1,
  2,
  'All praise belongs to Allah, the Lord of all worlds',
  85,
  '{"summary":"Excellent - you captured the core meaning accurately","correct":["praise to Allah","Lord of the worlds"],"missed":["The word due"],"insight":null}',
  0,
  '2025-12-22T10:35:00.000Z'
);
```

---

*These examples represent realistic data that flows through Qalam. Use them as references for implementation, testing, and validation.*
