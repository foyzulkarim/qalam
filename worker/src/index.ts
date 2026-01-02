/**
 * Qalam Assessment API - Cloudflare Worker
 *
 * Endpoints:
 *   POST /assess       - Assess a user's translation (with KV caching)
 *   GET  /list-bucket  - List files in R2 bucket (for sync scripts & future UI features)
 *   GET  /health       - Health check
 *
 * Note: Data is served directly from public R2 (https://cdn.versemadeeasy.com)
 */

import type { Env } from './types'
import { handleAssessment } from './handlers/assess'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request, env, new Response(null, { status: 204 }))
    }

    let response: Response

    try {
      // Route requests
      if (path === '/assess' && request.method === 'POST') {
        response = await handleAssessment(request, env)
      } else if (path === '/list-bucket' && request.method === 'GET') {
        response = await handleListBucket(url, env)
      } else if (path === '/health' && request.method === 'GET') {
        response = new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          backend: env.ASSESSMENT_BACKEND || 'together',
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } else {
        response = new Response(JSON.stringify({
          success: false,
          error: 'Not found',
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (error) {
      console.error('Worker error:', error)
      response = new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Add CORS headers to response
    return handleCors(request, env, response)
  },
}

/**
 * List files in R2 bucket
 * Query params:
 *   - prefix: filter by prefix (e.g., "analysis/")
 *   - cursor: pagination cursor for next page
 */
async function handleListBucket(url: URL, env: Env): Promise<Response> {
  const prefix = url.searchParams.get('prefix') || undefined
  const cursor = url.searchParams.get('cursor') || undefined

  const listed = await env.DATA_BUCKET.list({
    prefix,
    cursor,
    limit: 1000,
  })

  return new Response(JSON.stringify({
    success: true,
    data: {
      objects: listed.objects.map(obj => obj.key),
      truncated: listed.truncated,
      cursor: listed.truncated ? listed.cursor : null,
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Add CORS headers to response
 */
function handleCors(request: Request, env: Env, response: Response): Response {
  const origin = request.headers.get('Origin') || ''

  // Parse allowed origins from env (comma-separated)
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)

  // Default allowed origins
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:8788',
    'https://qalam.pages.dev',
  ]

  const allAllowed = [...defaultOrigins, ...allowedOrigins]

  // Check if origin is allowed
  const isAllowed = allAllowed.includes(origin) || allAllowed.includes('*')

  // Clone response and add headers
  const newHeaders = new Headers(response.headers)
  newHeaders.set('Access-Control-Allow-Origin', isAllowed ? origin : defaultOrigins[0])
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type')
  newHeaders.set('Access-Control-Max-Age', '86400')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
