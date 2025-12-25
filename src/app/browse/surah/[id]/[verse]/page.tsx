import { readdir } from 'fs/promises'
import path from 'path'
import VersePracticeClient from './VersePracticeClient'

export async function generateStaticParams() {
  const analysisDir = path.join(process.cwd(), 'public', 'data', 'analysis')
  try {
    const files = await readdir(analysisDir)
    return files
      .filter(f => f.endsWith('.json') && f !== 'manifest.json')
      .map(f => {
        const [surah, verse] = f.replace('.json', '').split('-')
        return { id: surah, verse }
      })
  } catch {
    return []
  }
}

export default function VersePracticePage({ params }: { params: Promise<{ id: string; verse: string }> }) {
  return <VersePracticeClient params={params} />
}
