import VersePracticeClient from './VersePracticeClient'
import fs from 'fs'
import path from 'path'

// Generate static params from available analysis files
export function generateStaticParams() {
  const analysisDir = path.join(process.cwd(), 'public/data/analysis')

  try {
    const files = fs.readdirSync(analysisDir)
    const params: { id: string; verse: string }[] = []

    for (const f of files) {
      // Only process valid verse analysis files (e.g., "1-1.json", "114-6.json")
      if (!f.endsWith('.json') || f.startsWith('_') || f.startsWith('.')) continue

      const match = f.match(/^(\d+)-(\d+)\.json$/)
      if (match) {
        params.push({ id: match[1], verse: match[2] })
      }
    }

    return params
  } catch {
    // Fallback: generate for surah 1 only (7 verses)
    return Array.from({ length: 7 }, (_, i) => ({
      id: '1',
      verse: String(i + 1),
    }))
  }
}

export default function VersePracticePage({ params }: { params: Promise<{ id: string; verse: string }> }) {
  return <VersePracticeClient params={params} />
}
