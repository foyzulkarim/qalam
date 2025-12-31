import VersePracticeClient from './VersePracticeClient'

// Use dynamic rendering to avoid Cloudflare's 20k file limit on static generation
// Pages are rendered on-demand instead of being pre-generated at build time
export const dynamic = 'force-dynamic'

export default function VersePracticePage({ params }: { params: Promise<{ id: string; verse: string }> }) {
  return <VersePracticeClient params={params} />
}
