import SurahDetailClient from './SurahDetailClient'

export function generateStaticParams() {
  // Generate paths for all 114 surahs
  return Array.from({ length: 114 }, (_, i) => ({
    id: String(i + 1),
  }))
}

export default function SurahDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <SurahDetailClient params={params} />
}
