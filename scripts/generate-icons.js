// Generates placeholder PWA icons using Canvas API (Node.js >= 18 doesn't have Canvas by default)
// This script uses the 'canvas' npm package - run: node scripts/generate-icons.js
// Alternatively, replace the generated PNGs in public/icons/ with your own images.

import { createCanvas } from 'canvas'
import { mkdirSync, writeFileSync } from 'fs'

const sizes = [192, 512]
const bgColor = '#1a1a2e'
const fgColor = '#7ec8e3'

mkdirSync('public/icons', { recursive: true })

for (const size of sizes) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.18)
  ctx.fill()

  // Snowflake ❄ text
  ctx.fillStyle = fgColor
  ctx.font = `bold ${size * 0.55}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('❄', size / 2, size / 2)

  writeFileSync(`public/icons/icon-${size}x${size}.png`, canvas.toBuffer('image/png'))
  console.log(`Created public/icons/icon-${size}x${size}.png`)
}
