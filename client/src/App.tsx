import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home'
import BrowsePage from './pages/Browse'
import SurahDetailPage from './pages/SurahDetail'
import VersePracticePage from './pages/VersePractice'
import HistoryPage from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/browse/surah/:id" element={<SurahDetailPage />} />
        <Route path="/browse/surah/:id/:verse" element={<VersePracticePage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}
