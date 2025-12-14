import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <h1 className="landing-title">Qalam</h1>
        <p className="landing-subtitle">
          Learn Quran comprehension through active practice
        </p>
        <p className="landing-description">
          Practice understanding Arabic verses by writing their meaning.
          Get personalized feedback powered by AI to deepen your comprehension.
        </p>
        <div className="landing-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </div>

      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">
            <span role="img" aria-label="book">&#128214;</span>
          </div>
          <h3 className="feature-title">Active Recall</h3>
          <p className="feature-description">
            Strengthen your memory by actively recalling verse meanings instead of passive reading.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <span role="img" aria-label="light">&#128161;</span>
          </div>
          <h3 className="feature-title">AI Feedback</h3>
          <p className="feature-description">
            Get instant, personalized feedback on your understanding with insights into Arabic patterns.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <span role="img" aria-label="chart">&#128200;</span>
          </div>
          <h3 className="feature-title">Track Progress</h3>
          <p className="feature-description">
            See your learning journey unfold as you practice verses across the Quran.
          </p>
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; 2024 Qalam. Built with love for Quran learners.</p>
      </footer>
    </div>
  );
}
