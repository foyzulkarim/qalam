# Quranic Verse Analysis Prompt

Use this prompt template to generate word-by-word analysis for Quranic verses.

---

## Prompt

```
You are an expert in Classical Arabic grammar (naḥw and ṣarf). Analyze the following Quranic verse word-by-word and return a JSON object following the exact schema below.

IMPORTANT GUIDELINES:
- Focus ONLY on lexical and morphological analysis
- NO tafsīr, thematic, or theological interpretation
- Use academic transliteration (ḥ, ʿ, ā, ū, ī, etc.)
- Include full diacritical marks (tashkīl) for Arabic text
- Analyze compound words by listing their components

VERSE TO ANALYZE:
Surah: [SURAH_NAME]
Verse Number: [VERSE_NUMBER]
Arabic Text: [ARABIC_TEXT]

REQUIRED JSON STRUCTURE:

{
  "verseId": "[SURAH_NUMBER]:[VERSE_NUMBER]",

  "verse": {
    "arabic": "[Full Arabic text with tashkīl]",
    "transliteration": "[Academic transliteration]",
    "surah": "[Surah name in English]",
    "verseNumber": [number]
  },

  "words": [
    {
      "wordNumber": 1,
      "arabic": "[Word with tashkīl]",
      "transliteration": "[transliteration]",
      "meaning": "[literal meaning]",
      "grammaticalCategory": "[e.g., definite noun (ism maʿrifa)]",
      "definiteness": "[e.g., definite (by al- prefix)]",
      "root": {
        "letters": "[e.g., ح-م-د]",
        "transliteration": "[e.g., ḥ-m-d]",
        "meaning": "[core root meaning]"
      },
      "morphology": {
        "pattern": "[Arabic pattern, e.g., فَعْل]",
        "patternTransliteration": "[e.g., faʿl]",
        "wordType": "[e.g., maṣdar (verbal noun)]",
        "note": "[optional additional info]"
      },
      "grammar": {
        "case": "[nominative (marfūʿ) | accusative (manṣūb) | genitive (majrūr)]",
        "caseMarker": "[e.g., ḍamma (ُ)]",
        "caseReason": "[why this case]",
        "gender": "[masculine | feminine]",
        "number": "[singular | dual | plural]"
      },
      "syntacticFunction": "[role in sentence, e.g., mubtadaʾ (subject)]",
      "components": [
        // ONLY for compound words like لِلَّهِ or بِسْمِ
        {
          "element": "[Arabic part]",
          "transliteration": "[transliteration]",
          "type": "[e.g., preposition (ḥarf jarr)]",
          "function": "[what it does]"
        }
      ],
      "semanticNote": "[optional: additional meaning context]"
    }
    // ... more words
  ],

  "literalTranslation": {
    "wordAligned": "[Word-for-word with hyphens and [brackets] for implied words]",
    "preservingSyntax": "[Keeping Arabic order with transliterated terms]"
  },

  "rootSummary": [
    {
      "word": "[Arabic word]",
      "transliteration": "[transliteration]",
      "root": "[ح-م-د (ḥ-m-d)]",
      "coreMeaning": "[core meaning of root]",
      "derivedMeaning": "[meaning of this derived word]"
    }
    // ... one entry per unique root
  ],

  "grammarObservations": {
    "sentenceType": {
      "classification": "[jumla ismiyya (nominal) | jumla fiʿliyya (verbal)]",
      "mubtada": "[subject if nominal]",
      "khabar": "[predicate if nominal]"
    },
    "idafaConstructions": [
      {
        "description": "[describe the construct]",
        "mudaf": "[first term]",
        "mudafIlayhi": "[second term]"
      }
    ],
    "notes": [
      "[grammatical observations about the verse]"
    ]
  },

  "metadata": {
    "analysisType": "lexical and morphological",
    "linguisticFramework": "Classical Arabic grammar (naḥw, ṣarf)",
    "scope": "no tafsīr, thematic, or theological interpretation"
  }
}

Return ONLY the JSON object, no additional text.
```

---

## Example Input

```
Surah: Al-Fatihah
Verse Number: 2
Arabic Text: الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
```

---

## Field Requirements

### Required Fields (must always include)
| Field | Description |
|-------|-------------|
| `verseId` | Format: "1:2" |
| `verse` | Full verse info |
| `words[].wordNumber` | Position (1-indexed) |
| `words[].arabic` | With tashkīl |
| `words[].transliteration` | Academic |
| `words[].meaning` | Literal meaning |
| `literalTranslation.wordAligned` | Word-for-word |
| `rootSummary` | All unique roots |

### Recommended Fields (include when applicable)
| Field | When to Include |
|-------|-----------------|
| `words[].root` | For words with identifiable roots |
| `words[].grammaticalCategory` | Always helpful |
| `words[].grammar` | For nouns/adjectives with case |
| `words[].morphology` | For derived forms |
| `words[].syntacticFunction` | When sentence role is clear |
| `words[].components` | ONLY for compound words |
| `grammarObservations` | For sentence-level insights |

### Grammatical Categories (use these exact terms)
- `definite noun (ism maʿrifa)`
- `indefinite noun (ism nakira)`
- `proper noun (ism ʿalam)`
- `pronoun (ḍamīr)`
- `verb (fiʿl)`
- `active participle (ism fāʿil)`
- `passive participle (ism mafʿūl)`
- `prepositional phrase (jār wa-majrūr)`
- `particle (ḥarf)`
- `adjective (ṣifa)`
- `adverb (ẓarf)`

### Case Terms (use these exact terms)
- `nominative (marfūʿ)`
- `accusative (manṣūb)`
- `genitive (majrūr)`

### Syntactic Functions (use these exact terms)
- `mubtadaʾ (subject)` - subject of nominal sentence
- `khabar (predicate)` - predicate of nominal sentence
- `fāʿil (doer)` - subject of verb
- `mafʿūl bihi (direct object)`
- `muḍāf` - first term of iḍāfa
- `muḍāf ilayhi` - second term of iḍāfa
- `ṣifa (attributive adjective)`
- `badal (appositive)`
- `ḥāl (circumstantial accusative)`
- `tamyīz (specification)`

---

## Common Patterns Reference

| Pattern | Transliteration | Common Usage |
|---------|-----------------|--------------|
| فَعَلَ | faʿala | Past tense verb (form I) |
| يَفْعَلُ | yafʿalu | Present tense verb |
| فَاعِل | fāʿil | Active participle |
| مَفْعُول | mafʿūl | Passive participle |
| فَعْل | faʿl | Verbal noun (maṣdar) |
| فَعِيل | faʿīl | Intensive adjective |
| فَعْلَان | faʿlān | Intensive adjective |
| أَفْعَل | afʿal | Comparative/superlative |
| مَفْعَل | mafʿal | Noun of place/time |
| تَفْعِيل | tafʿīl | Verbal noun (form II) |

---

## File Naming Convention

Save output as: `{surah_number}-{verse_number}.json`

Examples:
- `1-1.json` (Al-Fatihah verse 1)
- `1-2.json` (Al-Fatihah verse 2)
- `112-1.json` (Al-Ikhlas verse 1)
