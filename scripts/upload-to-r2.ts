/**
 * Upload data files to R2 (smart sync)
 * Run with: npm run upload:r2
 *
 * Algorithm:
 * 1. List existing files in R2 via Worker /list-bucket endpoint
 * 2. Compare with local files
 * 3. Upload only missing files using wrangler
 *
 * Prerequisites:
 * - Worker must be deployed with /list-bucket endpoint
 * - wrangler must be authenticated
 */
import { execSync } from 'child_process'
import { readdirSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { buildManifest, R2_ANALYSIS_PATH_PATTERN } from './lib/manifest-utils'

const BUCKET = 'qalam-data'
const DATA_DIR = 'data'
const UPLOADED_PATH = join(DATA_DIR, 'uploaded.json')

// Upload uploaded.json every N successful file uploads
const BATCH_SIZE = 10

// Worker API URL - use local for dev, production for deployed
const WORKER_URL = process.env.WORKER_URL || 'https://qalam-api.foyzul.workers.dev'

interface ListBucketResponse {
  success: boolean
  data: {
    objects: string[]
    truncated: boolean
    cursor: string | null
  }
}

/**
 * List all objects in R2 bucket via Worker API
 */
async function listR2Objects(): Promise<Set<string>> {
  console.log('Fetching existing files from R2 via Worker...')
  const objects = new Set<string>()

  let cursor: string | null = null

  do {
    const url = new URL(`${WORKER_URL}/list-bucket`)
    if (cursor) url.searchParams.set('cursor', cursor)

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to list bucket: ${response.status} ${response.statusText}`)
    }

    const result: ListBucketResponse = await response.json()
    if (!result.success) {
      throw new Error('Worker returned unsuccessful response')
    }

    for (const key of result.data.objects) {
      objects.add(key)
    }

    cursor = result.data.truncated ? result.data.cursor : null
  } while (cursor)

  return objects
}

/**
 * Upload a file to R2 using wrangler
 */
function uploadFile(localPath: string, remotePath: string): boolean {
  try {
    execSync(
      `npx wrangler r2 object put "${BUCKET}/${remotePath}" --file="${localPath}" --remote`,
      { stdio: 'pipe' }
    )
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`✗ Failed: ${message}`)
    return false
  }
}

/**
 * Update local uploaded.json with current R2 state
 * Called after each successful upload (matching seed-analysis pattern)
 */
function updateUploaded(currentR2State: Set<string>): void {
  const manifest = buildManifest(currentR2State, R2_ANALYSIS_PATH_PATTERN)
  writeFileSync(UPLOADED_PATH, JSON.stringify(manifest, null, 2))
}

async function main() {
  console.log('='.repeat(50))
  console.log('Qalam Data Sync to R2')
  console.log('='.repeat(50))
  console.log()

  // Step 1: List what's already in R2
  let existingInR2: Set<string>
  try {
    existingInR2 = await listR2Objects()
    console.log(`Found ${existingInR2.size} files already in R2\n`)
  } catch (error) {
    console.error('Failed to list R2 bucket:', error)
    console.error('\nMake sure the Worker is deployed with /list-bucket endpoint.')
    console.error('Run: npm run worker:deploy')
    process.exit(1)
  }

  // Step 2: Collect local files
  const filesToProcess: { localPath: string; remotePath: string }[] = []

  // Main data files
  for (const file of ['quran.json', 'surahs.json']) {
    const localPath = join(DATA_DIR, file)
    if (existsSync(localPath)) {
      filesToProcess.push({ localPath, remotePath: file })
    }
  }

  // Analysis files (exclude manifest.json - it's for local seeding only)
  const analysisDir = join(DATA_DIR, 'analysis')
  if (existsSync(analysisDir)) {
    const analysisFiles = readdirSync(analysisDir)
      .filter(f => f.endsWith('.json') && !f.startsWith('_') && !f.startsWith('.'))
      .filter(f => f !== 'manifest.json')  // Exclude local manifest

    for (const file of analysisFiles) {
      filesToProcess.push({
        localPath: join(analysisDir, file),
        remotePath: `analysis/${file}`,
      })
    }
  }

  // Calculate how many files need uploading
  const toUpload = filesToProcess.filter(f => !existingInR2.has(f.remotePath)).length
  console.log(`Found ${filesToProcess.length} local files`)
  console.log(`Need to upload ${toUpload} files (${existingInR2.size} already in R2)\n`)

  // Step 3: Generate and upload uploaded.json immediately (safety net)
  // This ensures R2 has accurate state even if we cancel mid-upload
  console.log('Generating uploaded.json from current R2 state...')
  updateUploaded(existingInR2)
  console.log('Uploading uploaded.json to R2 (initial sync)...')
  if (uploadFile(UPLOADED_PATH, 'uploaded.json')) {
    console.log('✓ uploaded.json synced to R2\n')
  } else {
    console.error('✗ Failed to upload initial uploaded.json')
  }

  // Step 4: Upload missing files with batched uploaded.json syncs
  let uploaded = 0
  let skipped = 0
  let failed = 0
  let uploadedSinceLastSync = 0

  // Track current R2 state (starts with existing, grows with uploads)
  const currentR2State = new Set(existingInR2)

  for (let i = 0; i < filesToProcess.length; i++) {
    const { localPath, remotePath } = filesToProcess[i]

    // Skip if already in R2
    if (existingInR2.has(remotePath)) {
      skipped++
      continue
    }

    // Show meaningful progress: [current/total to upload]
    const progress = `[${uploaded + 1}/${toUpload}]`
    console.log(`${progress} Uploading ${remotePath}...`)

    if (uploadFile(localPath, remotePath)) {
      uploaded++
      currentR2State.add(remotePath)
      updateUploaded(currentR2State)  // Update local file
      uploadedSinceLastSync++
      console.log(`✓ Done`)

      // Batch upload: sync uploaded.json to R2 every N files
      if (uploadedSinceLastSync >= BATCH_SIZE) {
        console.log(`  → Syncing uploaded.json to R2 (${uploaded} files uploaded)...`)
        uploadFile(UPLOADED_PATH, 'uploaded.json')
        uploadedSinceLastSync = 0
      }
    } else {
      failed++
    }
  }

  // Step 5: Final upload of uploaded.json to R2
  console.log('\nUploading final uploaded.json to R2...')
  if (uploadFile(UPLOADED_PATH, 'uploaded.json')) {
    console.log('✓ Final uploaded.json synced to R2')
  } else {
    console.error('✗ Failed to upload final uploaded.json')
  }

  console.log()
  console.log('='.repeat(50))
  console.log('Summary')
  console.log('='.repeat(50))
  console.log(`  Uploaded: ${uploaded}`)
  console.log(`  Skipped:  ${skipped} (already in R2)`)
  console.log(`  Failed:   ${failed}`)
  console.log(`  Total in R2: ${existingInR2.size + uploaded}`)
  console.log(`  Verses in uploaded.json: ${buildManifest(currentR2State, R2_ANALYSIS_PATH_PATTERN).verses.length}`)
  console.log('='.repeat(50))

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Upload failed:', error)
  process.exit(1)
})
