import SurahDetailClient from './SurahDetailClient'

// Generate static params for all 114 surahs
export function generateStaticParams() {
  return Array.from({ length: 114 }, (_, i) => ({
    id: String(i + 1),
  }))
}

export default function SurahDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <SurahDetailClient params={params} />
}
