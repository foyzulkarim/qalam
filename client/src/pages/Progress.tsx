import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ProgressStats, AttemptSummary } from '@qalam/shared';
import './Progress.css';

export default function Progress() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [history, setHistory] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [progressRes, historyRes] = await Promise.all([
          api.getProgress(),
          api.getHistory(50),
        ]);
        setStats(progressRes.stats);
        setHistory(historyRes.attempts);
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page progress-page">
      <div className="page-header">
        <h1 className="page-title">Your Progress</h1>
        <p className="page-subtitle">Track your Quran learning journey</p>
      </div>

      {stats && (
        <div className="progress-stats">
          <div className="stat-card large">
            <div className="stat-value">{stats.totalAttempts}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
          <div className="stat-card large">
            <div className="stat-value">{stats.uniqueVerses}</div>
            <div className="stat-label">Unique Verses</div>
          </div>
          <div className="stat-card large">
            <div className="stat-value">{stats.averageScore}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card large">
            <div className="stat-value">{stats.daysActive}</div>
            <div className="stat-label">Days Active</div>
          </div>
        </div>
      )}

      <div className="progress-section">
        <h2>Attempt History</h2>

        {history.length === 0 ? (
          <div className="empty-state">
            <p>No practice history yet.</p>
            <Link to="/practice" className="btn btn-primary">
              Start Practicing
            </Link>
          </div>
        ) : (
          <div className="history-table">
            <div className="history-header">
              <span>Verse</span>
              <span>Score</span>
              <span>Date</span>
              <span></span>
            </div>
            {history.map((attempt) => (
              <div key={attempt.id} className="history-row">
                <span className="history-verse">{attempt.verseId}</span>
                <span className={`score-badge ${getScoreClass(attempt.score)}`}>
                  {attempt.score}%
                </span>
                <span className="history-date">{formatDate(attempt.createdAt)}</span>
                <Link
                  to={`/practice?verseId=${attempt.verseId}`}
                  className="btn btn-ghost btn-sm"
                >
                  Practice
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getScoreClass(score: number): string {
  if (score >= 75) return 'score-excellent';
  if (score >= 50) return 'score-good';
  return 'score-needs-work';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
