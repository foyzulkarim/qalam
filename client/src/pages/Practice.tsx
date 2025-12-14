import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Verse, EvaluateResponse, Feedback } from '@qalam/shared';
import './Practice.css';

type PracticeState = 'loading' | 'practicing' | 'evaluating' | 'feedback';

export default function Practice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [state, setState] = useState<PracticeState>('loading');
  const [verse, setVerse] = useState<Verse | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<EvaluateResponse | null>(null);
  const [error, setError] = useState('');

  // Load verse on mount
  useEffect(() => {
    async function loadVerse() {
      setState('loading');
      setError('');

      try {
        const verseId = searchParams.get('verseId');

        if (verseId) {
          // Load specific verse
          const [surahId, verseNum] = verseId.split(':');
          const { verse } = await api.getVerse(
            parseInt(surahId, 10),
            parseInt(verseNum, 10)
          );
          setVerse(verse);
        } else {
          // Load next verse
          const { verse } = await api.getNextVerse();
          setVerse(verse);
        }

        setState('practicing');
      } catch (err) {
        console.error('Failed to load verse:', err);
        setError('Failed to load verse. Please try again.');
        setState('practicing');
      }
    }

    loadVerse();
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verse || !userInput.trim()) return;

    setState('evaluating');
    setError('');

    try {
      const result = await api.evaluate({
        verseId: verse.id,
        userInput: userInput.trim(),
        skipped: false,
      });
      setFeedback(result);
      setState('feedback');
    } catch (err) {
      console.error('Evaluation failed:', err);
      setError('Failed to evaluate. Please try again.');
      setState('practicing');
    }
  };

  const handleSkip = async () => {
    if (!verse) return;

    setState('evaluating');
    setError('');

    try {
      const result = await api.evaluate({
        verseId: verse.id,
        userInput: '',
        skipped: true,
      });
      setFeedback(result);
      setState('feedback');
    } catch (err) {
      console.error('Evaluation failed:', err);
      setError('Failed to load feedback. Please try again.');
      setState('practicing');
    }
  };

  const handleNextVerse = () => {
    setUserInput('');
    setFeedback(null);
    navigate('/practice');
    // Force reload by resetting state
    setState('loading');
    api.getNextVerse().then(({ verse }) => {
      setVerse(verse);
      setState('practicing');
    });
  };

  const handleTryAgain = () => {
    setUserInput('');
    setFeedback(null);
    setState('practicing');
  };

  if (state === 'loading') {
    return (
      <div className="page practice-page">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (state === 'feedback' && feedback) {
    return (
      <div className="page practice-page">
        <FeedbackView
          feedback={feedback}
          userInput={userInput}
          onNextVerse={handleNextVerse}
          onTryAgain={handleTryAgain}
        />
      </div>
    );
  }

  return (
    <div className="page practice-page">
      {verse && (
        <div className="practice-card">
          <div className="verse-display">
            <p className="arabic-verse">{verse.arabic}</p>
            <p className="verse-reference">
              Verse {verse.id}
            </p>
          </div>

          {error && <div className="practice-error">{error}</div>}

          <form onSubmit={handleSubmit} className="practice-form">
            <label htmlFor="userInput">
              What does this verse mean? Write your understanding:
            </label>
            <textarea
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type the meaning in your own words..."
              rows={4}
              disabled={state === 'evaluating'}
            />

            <div className="practice-actions">
              <button
                type="button"
                onClick={handleSkip}
                className="btn btn-secondary"
                disabled={state === 'evaluating'}
              >
                I don't know
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!userInput.trim() || state === 'evaluating'}
              >
                {state === 'evaluating' ? 'Evaluating...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

interface FeedbackViewProps {
  feedback: EvaluateResponse;
  userInput: string;
  onNextVerse: () => void;
  onTryAgain: () => void;
}

function FeedbackView({ feedback, userInput, onNextVerse, onTryAgain }: FeedbackViewProps) {
  const { score, feedback: fb, verse } = feedback;

  return (
    <div className="feedback-card">
      <div className="feedback-score">
        <div className={`score-circle ${getScoreClass(score)}`}>
          <span className="score-value">{score}</span>
          <span className="score-label">Score</span>
        </div>
      </div>

      <div className="feedback-summary">
        <p>{fb.summary}</p>
      </div>

      {userInput && (
        <div className="feedback-section">
          <h3>Your Response</h3>
          <p className="user-response">{userInput}</p>
        </div>
      )}

      <div className="feedback-section">
        <h3>Correct Translation</h3>
        <p className="arabic-text verse-arabic-feedback">{verse.arabic}</p>
        <p className="translation-text">{verse.translation}</p>
      </div>

      {fb.correct.length > 0 && (
        <div className="feedback-section">
          <h3 className="feedback-correct-title">What you got right</h3>
          <ul className="feedback-list">
            {fb.correct.map((item, i) => (
              <li key={i} className="feedback-item correct">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {fb.missed.length > 0 && (
        <div className="feedback-section">
          <h3 className="feedback-missed-title">What you missed</h3>
          <ul className="feedback-list">
            {fb.missed.map((item, i) => (
              <li key={i} className="feedback-item missed">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {fb.insight && (
        <div className="feedback-insight">
          <h3>Learning Insight</h3>
          <p>{fb.insight}</p>
        </div>
      )}

      <div className="feedback-actions">
        <button onClick={onTryAgain} className="btn btn-secondary">
          Try Again
        </button>
        <button onClick={onNextVerse} className="btn btn-primary">
          Next Verse
        </button>
      </div>
    </div>
  );
}

function getScoreClass(score: number): string {
  if (score >= 75) return 'score-excellent';
  if (score >= 50) return 'score-good';
  return 'score-needs-work';
}
