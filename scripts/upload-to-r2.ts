/**
 * Upload data files to R2
 * Run with: npx tsx scripts/upload-to-r2.ts
 *
 * This script uploads all static data files to Cloudflare R2 bucket.
 * It's typically run once during initial setup.
 */
import { execSync } from 'child_process'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

const BUCKET = 'qalam-data'
const DATA_DIR = 'public/data'

function upload(localPath: string, remotePath: string): boolean {
  console.log(`Uploading ${remotePath}...`)
  try {
    execSync(`npx wrangler r2 object put "${BUCKET}/${remotePath}" --file="${localPath}"`, {
      stdio: 'pipe',
    })
    return true
  } catch (error) {
    console.error(`Failed to upload ${remotePath}:`, error)
    return false
  }
}

async function main() {
  console.log('='.repeat(50))
  console.log('Qalam Data Upload to R2')
  console.log('='.repeat(50))
  console.log()

  let uploaded = 0
  let failed = 0

  // Upload main data files
  const mainFiles = ['quran.json', 'surahs.json']
  for (const file of mainFiles) {
    const localPath = join(DATA_DIR, file)
    if (existsSync(localPath)) {
      if (upload(localPath, file)) {
        uploaded++
      } else {
        failed++
      }
    } else {
      console.warn(`Warning: ${file} not found, skipping`)
    }
  }

  // Upload analysis files
  const analysisDir = join(DATA_DIR, 'analysis')
  if (existsSync(analysisDir)) {
    const analysisFiles = readdirSync(analysisDir).filter(f => f.endsWith('.json'))
    console.log(`\nUploading ${analysisFiles.length} analysis files...`)

    for (const file of analysisFiles) {
      const localPath = join(analysisDir, file)
      if (upload(localPath, `analysis/${file}`)) {
        uploaded++
      } else {
        failed++
      }
    }
  } else {
    console.warn('Warning: analysis directory not found')
  }

  console.log()
  console.log('='.repeat(50))
  console.log(`Upload complete!`)
  console.log(`  Uploaded: ${uploaded} files`)
  console.log(`  Failed: ${failed} files`)
  console.log('='.repeat(50))

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Upload failed:', error)
  process.exit(1)
})
