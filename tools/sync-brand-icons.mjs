/**
 * Synchronizes and generates all application brand icons (.png, .ico, .icns)
 * from https://soffice.caqa.io.vn/logo.jpg across the entire sOffice monorepo.
 *
 * Usage:
 *   node tools/sync-brand-icons.mjs
 */

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const LOGO_URL = 'https://soffice.caqa.io.vn/logo.jpg'
const LOCAL_CACHE = path.join(rootDir, 'apps/shell/build/logo.jpg')

// Target output paths
const SHELL_BUILD = path.join(rootDir, 'apps/shell/build')
const SHELL_ICONS = path.join(SHELL_BUILD, 'icons')
const DOCS_BUILD = path.join(rootDir, 'apps/docs/build')

const IN_APP_TARGETS = [
  path.join(rootDir, 'apps/shell/src/renderer/src/assets/app-icon.png'),
  path.join(rootDir, 'apps/docs/src/renderer/assets/app-icon.png'),
  path.join(rootDir, 'apps/sheets/src/renderer/assets/app-icon.png'),
  path.join(rootDir, 'apps/slides/src/renderer/assets/app-icon.png'),
]

// All Linux raster resolutions
const LINUX_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024]
// Windows ICO resolutions
const WIN_ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

/** Packs multiple PNGs into a Windows ICO container */
function buildIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = header.length + dir.length
  entries.forEach(({ size, png }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o)
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt8(0, o + 2)
    dir.writeUInt8(0, o + 3)
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(png.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += png.length
  })
  return Buffer.concat([header, dir, ...entries.map(e => e.png)])
}

/** Packs multiple PNGs into an Apple ICNS container */
function buildIcns(pngMap) {
  const tags = [
    ['ic11', 32],
    ['ic12', 64],
    ['ic07', 128],
    ['ic08', 256],
    ['ic13', 256],
    ['ic09', 512],
    ['ic14', 512],
    ['ic10', 1024]
  ]
  const chunks = []
  let bodyLen = 0
  for (const [tag, size] of tags) {
    const png = pngMap[size]
    if (!png) continue
    const chunk = Buffer.alloc(8 + png.length)
    chunk.write(tag, 0, 4, 'ascii')
    chunk.writeUInt32BE(8 + png.length, 4)
    png.copy(chunk, 8)
    chunks.push(chunk)
    bodyLen += chunk.length
  }
  const header = Buffer.alloc(8)
  header.write('icns', 0, 4, 'ascii')
  header.writeUInt32BE(8 + bodyLen, 4)
  return Buffer.concat([header, ...chunks])
}

async function main() {
  console.log('1. Fetching sOffice master logo...')
  let logoBuffer
  try {
    const res = await fetch(LOGO_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    logoBuffer = Buffer.from(await res.arrayBuffer())
    fs.mkdirSync(SHELL_BUILD, { recursive: true })
    fs.writeFileSync(LOCAL_CACHE, logoBuffer)
    console.log(`Downloaded ${LOGO_URL} (${logoBuffer.length} bytes)`)
  } catch (err) {
    if (fs.existsSync(LOCAL_CACHE)) {
      console.warn(`Fetch failed (${err.message}). Using local cache at ${LOCAL_CACHE}`)
      logoBuffer = fs.readFileSync(LOCAL_CACHE)
    } else {
      throw err
    }
  }

  const dataUrl = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`

  console.log('2. Launching headless browser for rasterization...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ deviceScaleFactor: 1 })

  const allSizes = Array.from(new Set([...LINUX_SIZES, ...WIN_ICO_SIZES, 1024]))
  const rendered = {}

  for (const s of allSizes) {
    await page.setViewportSize({ width: s, height: s })
    await page.setContent(
      `<body style="margin:0;padding:0;overflow:hidden;background:transparent;">` +
      `<img src="${dataUrl}" style="width:${s}px;height:${s}px;display:block;border-radius:${Math.round(s * 0.18)}px;" />` +
      `</body>`
    )
    rendered[s] = await page.screenshot({ omitBackground: true })
    console.log(`Rendered ${s}x${s} PNG: ${rendered[s].length} bytes`)
  }
  await browser.close()

  console.log('3. Writing Linux desktop icon suite...')
  fs.mkdirSync(SHELL_ICONS, { recursive: true })
  for (const s of LINUX_SIZES) {
    fs.writeFileSync(path.join(SHELL_ICONS, `${s}x${s}.png`), rendered[s])
  }

  console.log('4. Generating Windows ICO container...')
  const icoEntries = WIN_ICO_SIZES.map(s => ({ size: s, png: rendered[s] }))
  const icoBuf = buildIco(icoEntries)
  fs.mkdirSync(SHELL_BUILD, { recursive: true })
  fs.mkdirSync(DOCS_BUILD, { recursive: true })
  fs.writeFileSync(path.join(SHELL_BUILD, 'icon.ico'), icoBuf)
  fs.writeFileSync(path.join(DOCS_BUILD, 'icon.ico'), icoBuf)

  console.log('5. Generating macOS ICNS container...')
  const icnsBuf = buildIcns(rendered)
  fs.writeFileSync(path.join(SHELL_BUILD, 'icon.icns'), icnsBuf)
  fs.writeFileSync(path.join(DOCS_BUILD, 'icon.icns'), icnsBuf)

  console.log('6. Writing high-res master raster icons...')
  const master1024 = rendered[1024]
  fs.writeFileSync(path.join(SHELL_BUILD, 'icon.png'), master1024)
  fs.writeFileSync(path.join(SHELL_BUILD, 'icon-mac.png'), master1024)
  fs.writeFileSync(path.join(DOCS_BUILD, 'icon.png'), master1024)
  fs.writeFileSync(path.join(DOCS_BUILD, 'icon-mac.png'), master1024)

  console.log('7. Synchronizing in-app renderer assets...')
  for (const target of IN_APP_TARGETS) {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, master1024)
    console.log(`Updated ${target}`)
  }

  console.log('Brand asset synchronization completed successfully!')
}

main().catch(err => {
  console.error('Fatal error during asset generation:', err)
  process.exit(1)
})
