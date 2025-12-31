/**
 * Sync local analysis files to R2 (delta sync)
 * Run with: npx tsx scripts/sync-to-r2.ts
 *
 * Only uploads new or changed files based on content hash.
 * Uses a manifest file to track what's been uploaded.
 */
import { execSync } from 'child_process'
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

const BUCKET = 'qalam-data'
const LOCAL_DIR = 'public/data/analysis'
const MANIFEST_FILE = 'public/data/analysis/.r2-manifest.json'

interface ManifestEntry {
  hash: string
  uploadedAt: string
}

interface Manifest {
  files: Record<string, ManifestEntry>
}

function getFileHash(filepath: string): string {
  const content = readFileSync(filepath)
  return createHash('md5').update(content).digest('hex')
}

function loadManifest(): Manifest {
  if (existsSync(MANIFEST_FILE)) {
    try {
      return JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8'))
    } catch {
      console.warn('Warning: Could not parse manifest, starting fresh')
    }
  }
  return { files: {} }
}

function saveManifest(manifest: Manifest): void {
  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
}

function uploadFile(localPath: string, remotePath: string): boolean {
  try {
    execSync(`npx wrangler r2 object put "${BUCKET}/${remotePath}" --file="${localPath}"`, {
      stdio: 'pipe',
    })
    return true
  } catch {
    return false
  }
}

async function sync() {
  console.log('='.repeat(50))
  console.log('Qalam R2 Delta Sync')
  console.log('='.repeat(50))
  console.log()

  if (!existsSync(LOCAL_DIR)) {
    console.error(`Error: Directory ${LOCAL_DIR} not found`)
    process.exit(1)
  }

  const manifest = loadManifest()
  const localFiles = readdirSync(LOCAL_DIR).filter(
    (f) => f.endsWith('.json') && !f.startsWith('.')
  )

  console.log(`Found ${localFiles.length} local analysis files`)
  console.log(`Manifest has ${Object.keys(manifest.files).length} tracked files`)
  console.log()

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const file of localFiles) {
    const filepath = join(LOCAL_DIR, file)
    const hash = getFileHash(filepath)

    // Skip if file unchanged
    if (manifest.files[file]?.hash === hash) {
      skipped++
      continue
    }

    // Upload to R2
    process.stdout.write(`Uploading ${file}... `)
    if (uploadFile(filepath, `analysis/${file}`)) {
      manifest.files[file] = {
        hash,
        uploadedAt: new Date().toISOString(),
      }
      uploaded++
      console.log('done')
    } else {
      failed++
      console.log('FAILED')
    }
  }

  saveManifest(manifest)

  console.log()
  console.log('='.repeat(50))
  console.log('Sync complete!')
  console.log(`  Uploaded: ${uploaded} files`)
  console.log(`  Skipped:  ${skipped} files (unchanged)`)
  console.log(`  Failed:   ${failed} files`)
  console.log(`  Total in R2: ${Object.keys(manifest.files).length} files`)

  // Progress report
  const TOTAL_VERSES = 6236
  const done = Object.keys(manifest.files).length
  const percent = ((done / TOTAL_VERSES) * 100).toFixed(1)
  console.log()
  console.log(`Overall progress: ${done}/${TOTAL_VERSES} verses (${percent}%)`)
  console.log('='.repeat(50))

  if (failed > 0) {
    process.exit(1)
  }
}

sync().catch((error) => {
  console.error('Sync failed:', error)
  process.exit(1)
})
