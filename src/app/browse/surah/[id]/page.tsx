import SurahDetailClient from './SurahDetailClient'

// Use dynamic rendering to avoid Cloudflare's 20k file limit on static generation
// Pages are rendered on-demand instead of being pre-generated at build time
export const dynamic = 'force-dynamic'

export default function SurahDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <SurahDetailClient params={params} />
}
