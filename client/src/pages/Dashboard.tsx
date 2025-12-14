import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { ProgressStats, AttemptSummary } from '@qalam/shared';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [progressRes, historyRes] = await Promise.all([
          api.getProgress(),
          api.getHistory(5),
        ]);
        setStats(progressRes.stats);
        setRecentAttempts(historyRes.attempts);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStartPractice = () => {
    navigate('/practice');
  };

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
    <div className="page dashboard">
      <div className="dashboard-welcome">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Continue your Quran learning journey</p>
      </div>

      <div className="dashboard-cta">
        <button onClick={handleStartPractice} className="btn btn-primary btn-lg">
          Start Practice
        </button>
        <Link to="/surahs" className="btn btn-secondary btn-lg">
          Browse Surahs
        </Link>
      </div>

      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalAttempts}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.uniqueVerses}</div>
            <div className="stat-label">Verses Practiced</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.averageScore}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.daysActive}</div>
            <div className="stat-label">Days Active</div>
          </div>
        </div>
      )}

      {recentAttempts.length > 0 && (
        <div className="dashboard-recent">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <Link to="/progress">View All</Link>
          </div>
          <div className="recent-list">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="recent-item">
                <div className="recent-verse">Verse {attempt.verseId}</div>
                <div className="recent-meta">
                  <span className={`score-badge ${getScoreClass(attempt.score)}`}>
                    {attempt.score}%
                  </span>
                  <span className="recent-date">
                    {formatDate(attempt.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.totalAttempts === 0 && (
        <div className="dashboard-empty">
          <h2>Ready to begin?</h2>
          <p>
            Start practicing verses to build your understanding of the Quran.
            Each verse you practice helps strengthen your comprehension.
          </p>
        </div>
      )}
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
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
}
