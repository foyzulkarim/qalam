/**
 * Data Handler
 * Serves static data files from R2 bucket
 */

import type { Env } from '../types'

/**
 * Serve data files from R2
 */
export async function handleData(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  // Remove leading slash if present
  const key = path.startsWith('/') ? path.slice(1) : path

  try {
    const object = await env.DATA_BUCKET.get(key)

    if (!object) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Determine cache duration based on file type
    // Analysis files change less frequently, can cache longer
    const isAnalysis = key.startsWith('analysis/')
    const maxAge = isAnalysis ? 86400 : 3600 // 24h for analysis, 1h for others

    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${maxAge}`,
        ETag: object.etag,
      },
    })
  } catch (error) {
    console.error('R2 fetch error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
