import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { SurahMeta, Surah, Verse } from '@qalam/shared';
import './SurahBrowser.css';

export default function SurahBrowser() {
  const { surahId } = useParams<{ surahId: string }>();
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSurahs() {
      try {
        const { surahs } = await api.getSurahs();
        setSurahs(surahs);
      } catch (error) {
        console.error('Failed to load surahs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSurahs();
  }, []);

  useEffect(() => {
    async function loadSurah() {
      if (!surahId) {
        setSelectedSurah(null);
        return;
      }

      try {
        setLoading(true);
        const { surah } = await api.getSurah(parseInt(surahId, 10));
        setSelectedSurah(surah);
      } catch (error) {
        console.error('Failed to load surah:', error);
        navigate('/surahs');
      } finally {
        setLoading(false);
      }
    }
    loadSurah();
  }, [surahId, navigate]);

  const handleSurahClick = (id: number) => {
    navigate(`/surahs/${id}`);
  };

  const handleVerseClick = (verse: Verse) => {
    navigate(`/practice?verseId=${verse.id}`);
  };

  const handleBackClick = () => {
    navigate('/surahs');
  };

  if (loading && surahs.length === 0) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  // Show surah detail view
  if (selectedSurah) {
    return (
      <div className="page surah-browser">
        <div className="surah-detail">
          <button onClick={handleBackClick} className="btn btn-ghost back-button">
            &larr; Back to Surahs
          </button>

          <div className="surah-detail-header">
            <span className="surah-number">{selectedSurah.id}</span>
            <div className="surah-names">
              <h1 className="surah-name-arabic arabic-text">{selectedSurah.name.arabic}</h1>
              <h2 className="surah-name-english">{selectedSurah.name.transliteration}</h2>
              <p className="surah-meaning">{selectedSurah.name.english}</p>
            </div>
            <div className="surah-meta">
              <span className="surah-revelation">{selectedSurah.revelation}</span>
              <span className="surah-verse-count">{selectedSurah.verseCount} verses</span>
            </div>
          </div>

          <div className="verses-list">
            {selectedSurah.verses.map((verse) => (
              <button
                key={verse.id}
                className="verse-card"
                onClick={() => handleVerseClick(verse)}
              >
                <div className="verse-number">{verse.number}</div>
                <div className="verse-content">
                  <p className="verse-arabic arabic-text">{verse.arabic}</p>
                  <p className="verse-translation">{verse.translation}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show surah list view
  return (
    <div className="page surah-browser">
      <div className="page-header">
        <h1 className="page-title">Browse Surahs</h1>
        <p className="page-subtitle">Select a surah to practice its verses</p>
      </div>

      <div className="surahs-grid">
        {surahs.map((surah) => (
          <button
            key={surah.id}
            className="surah-card"
            onClick={() => handleSurahClick(surah.id)}
          >
            <span className="surah-number">{surah.id}</span>
            <div className="surah-info">
              <span className="surah-name-arabic arabic-text">{surah.name.arabic}</span>
              <span className="surah-name-english">{surah.name.transliteration}</span>
            </div>
            <div className="surah-details">
              <span className="surah-verse-count">{surah.verseCount} verses</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
