# Phase 1: Base Verse + Word List Prompt

This prompt generates the base verse information and a simplified word list. It's designed to be fast (~1-2 minutes) and provides the foundation for detailed word analysis in Phase 2.

---

## Prompt

```
You are an expert in Classical Arabic grammar (naḥw and ṣarf). Provide the base analysis for the following Quranic verse.

IMPORTANT GUIDELINES:
- Focus ONLY on lexical analysis (no deep morphology yet)
- NO tafsīr, thematic, or theological interpretation
- Use academic transliteration (ḥ, ʿ, ā, ū, ī, etc.)
- Include full diacritical marks (tashkīl) for Arabic text

VERSE TO ANALYZE:
Surah: {SURAH_NAME}
Surah Number: {SURAH_NUMBER}
Verse Number: {VERSE_NUMBER}

Return ONLY a valid JSON object with this structure:

{
  "verseId": "{SURAH_NUMBER}:{VERSE_NUMBER}",
  "verse": {
    "arabic": "[Full Arabic text with tashkīl]",
    "transliteration": "[Academic transliteration]",
    "surah": "{SURAH_NAME}",
    "verseNumber": {VERSE_NUMBER}
  },
  "words": [
    {
      "wordNumber": 1,
      "arabic": "[Word with tashkīl]",
      "transliteration": "[transliteration]",
      "meaning": "[literal meaning]"
    }
  ],
  "literalTranslation": {
    "wordAligned": "[Word-for-word translation with hyphens for compound meanings and [brackets] for implied words]"
  },
  "rootSummary": [
    {
      "word": "[Arabic word]",
      "transliteration": "[transliteration]",
      "root": "[ح-م-د (ḥ-m-d)]",
      "coreMeaning": "[core meaning of root]",
      "derivedMeaning": "[meaning of this derived word]"
    }
  ],
  "metadata": {
    "analysisType": "lexical and morphological",
    "linguisticFramework": "Classical Arabic grammar (naḥw, ṣarf)",
    "scope": "no tafsīr, thematic, or theological interpretation"
  }
}

Return ONLY the JSON object, no additional text or markdown.
```

---

## Output Fields

| Field | Description |
|-------|-------------|
| `verseId` | Format: "1:2" |
| `verse` | Full verse info with Arabic, transliteration, surah name, verse number |
| `words` | Array of words with basic info only (wordNumber, arabic, transliteration, meaning) |
| `literalTranslation` | Word-aligned translation |
| `rootSummary` | Summary of unique roots in the verse |
| `metadata` | Analysis metadata |

---

## Notes

- This prompt intentionally omits detailed morphology, grammar, and components
- Those details are added in Phase 2 for each individual word
- Expected response time: 1-2 minutes (vs 8+ minutes for full analysis)
