import SurahDetailClient from './SurahDetailClient'

// Use Edge Runtime for Cloudflare Pages compatibility
export const runtime = 'edge'

export default function SurahDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <SurahDetailClient params={params} />
}
