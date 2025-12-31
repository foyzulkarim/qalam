import VersePracticeClient from './VersePracticeClient'

// Use Edge Runtime for Cloudflare Pages compatibility
export const runtime = 'edge'

export default function VersePracticePage({ params }: { params: Promise<{ id: string; verse: string }> }) {
  return <VersePracticeClient params={params} />
}
