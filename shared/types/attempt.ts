/**
 * LLM-generated feedback on a verse attempt
 */
export interface Feedback {
  /** Brief summary of the evaluation (1-2 sentences) */
  summary: string;

  /** Parts of the verse meaning the user got correct */
  correct: string[];

  /** Important parts the user missed or got wrong */
  missed: string[];

  /** Optional teaching moment - a pattern, root, or grammatical insight */
  insight: string | null;
}

/**
 * A single verse attempt by a user
 */
export interface Attempt {
  /** Unique attempt identifier */
  id: string;

  /** Which verse was attempted (format: "surahId:verseNumber") */
  verseId: string;

  /** What the user typed as their understanding */
  userInput: string;

  /** Whether the user clicked "I don't know" */
  skipped: boolean;

  /** LLM evaluation score (0-100) */
  score: number;

  /** LLM-generated feedback */
  feedback: Feedback;

  /** When this attempt was made */
  createdAt: string;
}

/**
 * Verse attempt with full verse data (used in history views)
 */
export interface AttemptWithVerse extends Attempt {
  /** The verse that was attempted */
  verse: {
    arabic: string;
    translation: string;
  };
}
