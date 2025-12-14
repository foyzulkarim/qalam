import type { EvaluationInput } from './types.js';

export function buildEvaluationPrompt(input: EvaluationInput): string {
  if (input.skipped) {
    return buildSkippedPrompt(input);
  }

  return `You are evaluating a student's understanding of a Quranic verse.

VERSE INFORMATION:
Verse ID: ${input.verseId}
Arabic Text: ${input.arabic}
Correct Translation (Sahih International): ${input.translation}

STUDENT'S RESPONSE:
"${input.userInput}"

EVALUATION TASK:
Assess how well the student understood the verse meaning. Focus on:
1. Did they capture the core spiritual/theological message?
2. Did they identify the key concepts and actors?
3. Did they understand the general meaning, even if wording differs?

SCORING RUBRIC:
90-100: Captured core meaning and all key concepts accurately
75-89:  Understood main message, minor details missed
60-74:  Got the general idea but missed significant concepts
40-59:  Partial understanding with major gaps
0-39:   Minimal comprehension or major misunderstanding

IMPORTANT GUIDELINES:
- Accept paraphrasing: "God" = "Allah", "merciful" = "compassionate", etc.
- Prioritize meaning over exact wording
- Be encouraging but accurate with scoring
- If student clearly understands but uses different words, that's correct
- Focus on theological and spiritual accuracy

TEACHING MOMENT:
Provide ONE brief insight that will help future learning:
- Arabic root patterns (if relevant)
- Grammatical structure (if it unlocks meaning)
- Connection to other verses (if it reinforces understanding)
- Theological context (if it deepens comprehension)

Keep the insight brief (2-3 sentences max) and memorable.

RESPONSE FORMAT:
Respond with ONLY valid JSON in this exact structure:
{
  "score": <number 0-100>,
  "feedback": {
    "summary": "<1-2 sentence assessment>",
    "correct": ["<concept 1>", "<concept 2>", ...],
    "missed": ["<concept 1>", "<concept 2>", ...],
    "insight": "<optional teaching moment or null>"
  }
}

Now evaluate the student's response.`;
}

function buildSkippedPrompt(input: EvaluationInput): string {
  return `The student clicked "I don't know" for this verse.

Verse ID: ${input.verseId}
Arabic: ${input.arabic}
Translation: ${input.translation}

Provide encouraging feedback that teaches them the verse meaning.

Respond with valid JSON:
{
  "score": 0,
  "feedback": {
    "summary": "That's okay! Let's learn this verse together.",
    "correct": [],
    "missed": ["<all key concepts from the verse>"],
    "insight": "<a helpful teaching moment about this verse>"
  }
}`;
}
