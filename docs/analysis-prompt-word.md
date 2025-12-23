# Phase 2: Word Detail Prompt

This prompt generates detailed morphological and grammatical analysis for a single word. It's called once per word after the base analysis is complete.

---

## Prompt

```
You are an expert in Classical Arabic grammar (naḥw and ṣarf). Provide detailed morphological and grammatical analysis for this word from the Quran.

CONTEXT:
Surah: {SURAH_NAME}
Verse Number: {VERSE_NUMBER}
Full Verse: {VERSE_ARABIC}

WORD TO ANALYZE:
Word Number: {WORD_NUMBER} of {TOTAL_WORDS}
Arabic: {WORD_ARABIC}
Transliteration: {WORD_TRANSLITERATION}
Meaning: {WORD_MEANING}

IMPORTANT GUIDELINES:
- Focus ONLY on lexical and morphological analysis
- NO tafsīr, thematic, or theological interpretation
- Use academic transliteration (ḥ, ʿ, ā, ū, ī, etc.)
- Consider the word's role in the sentence context

Return ONLY a valid JSON object with this structure:

{
  "wordNumber": {WORD_NUMBER},
  "root": {
    "letters": "[e.g., ح-م-د]",
    "transliteration": "[e.g., ḥ-m-d]",
    "meaning": "[core root meaning]"
  },
  "grammaticalCategory": "[e.g., definite noun (ism maʿrifa)]",
  "definiteness": "[e.g., definite (by al- prefix)]",
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
    {
      "element": "[Arabic part]",
      "transliteration": "[transliteration]",
      "type": "[e.g., preposition (ḥarf jarr)]",
      "function": "[what it does]"
    }
  ],
  "semanticNote": "[optional: additional meaning context]"
}

NOTES:
- Include "components" ONLY if the word has prefixes/suffixes (like بِسْمِ = بِ + اسْم)
- For particles without roots, omit the "root" field or set letters to "—"
- Use exact grammatical terms from the reference below

Return ONLY the JSON object, no additional text or markdown.
```

---

## Grammatical Terms Reference

### Categories (use exact terms)
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

### Cases (use exact terms)
- `nominative (marfūʿ)`
- `accusative (manṣūb)`
- `genitive (majrūr)`

### Syntactic Functions (use exact terms)
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

### Common Patterns
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

---

## Notes

- This prompt is called once per word in the verse
- The context (full verse, position) helps the LLM determine syntactic function
- Expected response time: 30-60 seconds per word
- Components array should only be included for compound words
