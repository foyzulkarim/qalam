import VersePracticeClient from './VersePracticeClient'

// Generate only ONE static page (the shell)
// All other verse URLs are rewritten to this page by Cloudflare _redirects
// The client component reads the actual URL params via useParams() and fetches data from R2
export function generateStaticParams() {
  return [{ id: '1', verse: '1' }]
}

export default function VersePracticePage() {
  return <VersePracticeClient />
}
