import { readdir } from 'fs/promises'
import path from 'path'
import VersePracticeClient from './VersePracticeClient'

export async function generateStaticParams() {
  const analysisDir = path.join(process.cwd(), 'public', 'data', 'analysis')
  try {
    const entries = await readdir(analysisDir, { withFileTypes: true })
    const params: { id: string; verse: string }[] = []

    for (const entry of entries) {
      // Only process numbered directories (surah folders)
      if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) continue

      const surahDir = path.join(analysisDir, entry.name)
      const files = await readdir(surahDir)

      for (const file of files) {
        if (!file.endsWith('.json')) continue
        const [surah, verse] = file.replace('.json', '').split('-')
        params.push({ id: surah, verse })
      }
    }

    return params
  } catch {
    return []
  }
}

export default function VersePracticePage({ params }: { params: Promise<{ id: string; verse: string }> }) {
  return <VersePracticeClient params={params} />
}
