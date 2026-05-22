import { useState, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Adjustments {
  brightness: number; contrast: number; saturation: number; hue: number
  temperature: number; tint: number; highlights: number; shadows: number
  whites: number; blacks: number
  fade: number; grain: number; vignette: number; sharpness: number
  clarity: number; dehaze: number; vibrance: number
  texture: number; noiseReduction: number
}

export interface HslChannel { hue: number; sat: number; lum: number }
export interface HslMixer {
  red: HslChannel; orange: HslChannel; yellow: HslChannel; green: HslChannel
  aqua: HslChannel; blue: HslChannel; purple: HslChannel; magenta: HslChannel
}

export interface CropState {
  rotation: number; flipH: boolean; flipV: boolean; aspect: string
  x: number; y: number; w: number; h: number
  applied: boolean
}

export interface TextLayer {
  id: string; text: string; x: number; y: number
  color: string; fontSize: number; fontFamily: string
  bold: boolean; italic: boolean; align: 'left' | 'center' | 'right'
  background: string; opacity: number; rotation: number
}

export interface StickerLayer {
  id: string; emoji: string; x: number; y: number; size: number; rotation: number
}

export interface DrawStroke {
  id: string; points: { x: number; y: number }[]
  color: string; width: number; opacity: number; tool: 'pen' | 'brush' | 'marker'
}

export interface FrameSettings {
  type: string; color: string; size: number; cornerRadius: number
}

export interface GeometryState {
  vertical: number; horizontal: number; rotate: number; distortion: number
}

export interface LensBlurSettings {
  enabled: boolean
  type: 'radial' | 'tiltshift'
  amount: number; feather: number
  centerX: number; centerY: number; size: number
}

export interface ProEffects {
  preset: string; grain: number; chromatic: number; lightleak: number; aiBypass: boolean
}

export interface OverlayLayer {
  id: string; src: string
  x: number; y: number; width: number
  opacity: number; blendMode: string; rotation: number
  adjustments: Adjustments; activeFilter: string
}

export interface SelectiveEdit {
  id: string
  strokes: DrawStroke[]
  adjustments: Adjustments
}


export interface EditVersion {
  id: string; label: string; timestamp: number
  adjustments: Adjustments; activeFilter: string
  hslMixer: HslMixer; pro: ProEffects; profile: string
}

export interface CustomPreset {
  id: string; name: string; icon: string; isBuiltIn?: boolean
  adjustments: Partial<Adjustments>; activeFilter?: string; pro?: Partial<ProEffects>
}

// ── Filter Presets ─────────────────────────────────────────────────────────────
export const FILTER_PRESETS = [
  { id: 'none',      label: 'Original',  css: 'none' },
  { id: 'vivid',     label: 'Vivid',     css: 'saturate(160%) contrast(110%) brightness(105%)' },
  { id: 'cool',      label: 'Cool',      css: 'hue-rotate(20deg) saturate(90%) brightness(105%)' },
  { id: 'warm',      label: 'Warm',      css: 'sepia(25%) saturate(130%) brightness(105%)' },
  { id: 'fade',      label: 'Fade',      css: 'contrast(85%) brightness(115%) saturate(80%)' },
  { id: 'bw',        label: 'B&W',       css: 'grayscale(100%) contrast(110%)' },
  { id: 'vintage',   label: 'Vintage',   css: 'sepia(45%) contrast(90%) brightness(88%) saturate(80%)' },
  { id: 'matte',     label: 'Matte',     css: 'contrast(90%) brightness(110%) saturate(90%) sepia(10%)' },
  { id: 'chrome',    label: 'Chrome',    css: 'saturate(130%) contrast(120%) brightness(102%) hue-rotate(-10deg)' },
  { id: 'noir',      label: 'Noir',      css: 'grayscale(100%) brightness(90%) contrast(140%)' },
  { id: 'lush',      label: 'Lush',      css: 'saturate(200%) hue-rotate(10deg) brightness(105%)' },
  { id: 'glow',      label: 'Glow',      css: 'brightness(120%) saturate(110%) contrast(95%)' },
  { id: 'sunset',    label: 'Sunset',    css: 'sepia(30%) saturate(160%) hue-rotate(-20deg) brightness(108%)' },
  { id: 'forest',    label: 'Forest',    css: 'saturate(130%) hue-rotate(60deg) brightness(97%) contrast(105%)' },
  { id: 'icy',       label: 'Icy',       css: 'saturate(60%) brightness(120%) hue-rotate(200deg) contrast(95%)' },
  { id: 'drama',     label: 'Drama',     css: 'contrast(140%) saturate(130%) brightness(90%)' },
  { id: 'golden',    label: 'Golden',    css: 'sepia(40%) saturate(150%) brightness(110%) hue-rotate(-10deg)' },
  { id: 'faded',     label: 'Faded',     css: 'contrast(80%) brightness(120%) saturate(70%) sepia(15%)' },
  { id: 'cinematic', label: 'Cinematic', css: 'contrast(115%) saturate(85%) brightness(95%) sepia(15%)' },
  { id: 'neon',      label: 'Neon',      css: 'saturate(300%) brightness(110%) contrast(120%)' },
]

// ── Profiles ──────────────────────────────────────────────────────────────────
export const PROFILES = [
  { id: 'none',         label: 'None',           adj: {} },
  { id: 'adobe-color',  label: 'Adobe Color',    adj: { contrast: 8, saturation: 10, vibrance: 6 } },
  { id: 'adobe-land',   label: 'Landscape',      adj: { contrast: 10, vibrance: 14, dehaze: 8, clarity: 6 } },
  { id: 'adobe-port',   label: 'Portrait',       adj: { brightness: 4, contrast: 4, vibrance: 8, shadows: 10 } },
  { id: 'adobe-vivid',  label: 'Vivid',          adj: { contrast: 12, saturation: 18, vibrance: 12 } },
  { id: 'adobe-neutral',label: 'Neutral',        adj: { contrast: -8, saturation: -5, brightness: 5 } },
  { id: 'mono',         label: 'Monochrome',     adj: { saturation: -100, contrast: 12 } },
  { id: 'bw-high',      label: 'B&W High',       adj: { saturation: -100, contrast: 28, brightness: -5 } },
  { id: 'cinematic',    label: 'Cinematic',      adj: { contrast: 15, saturation: -12, fade: 10, vignette: 25 } },
  { id: 'flat',         label: 'Flat',           adj: { contrast: -20, brightness: 8, saturation: -8 } },
  { id: 'fuji',         label: 'Fuji Sim.',      adj: { brightness: 4, contrast: 6, saturation: 14, tint: -8 } },
]

// ── Built-in Custom Presets ────────────────────────────────────────────────────
export const BUILTIN_PRESETS: CustomPreset[] = [
  { id: 'bp-1', name: 'Clean Look',  icon: '✨', isBuiltIn: true, adjustments: { brightness: 5, contrast: 8, vibrance: 10 }, activeFilter: 'none' },
  { id: 'bp-2', name: 'Moody',       icon: '🌑', isBuiltIn: true, adjustments: { brightness: -8, contrast: 18, saturation: -15, vignette: 35, fade: 8 }, activeFilter: 'none' },
  { id: 'bp-3', name: 'Airy',        icon: '☁️', isBuiltIn: true, adjustments: { brightness: 14, contrast: -12, saturation: -10, fade: 20, shadows: 15 }, activeFilter: 'none' },
  { id: 'bp-4', name: 'Warm Summer', icon: '🌅', isBuiltIn: true, adjustments: { temperature: 28, saturation: 12, vibrance: 15, highlights: -10 }, activeFilter: 'warm' },
  { id: 'bp-5', name: 'Film Noir',   icon: '🎞', isBuiltIn: true, adjustments: { saturation: -100, contrast: 22, vignette: 50, grain: 25 }, activeFilter: 'none' },
  { id: 'bp-6', name: 'Golden Hour', icon: '🌇', isBuiltIn: true, adjustments: { temperature: 35, saturation: 18, vibrance: 12, highlights: -15, shadows: 10 }, activeFilter: 'golden' },
  { id: 'bp-7', name: 'Faded Film',  icon: '📷', isBuiltIn: true, adjustments: { fade: 28, contrast: -8, saturation: -12, vignette: 30, grain: 18 }, activeFilter: 'none' },
  { id: 'bp-8', name: 'Neon City',   icon: '🌃', isBuiltIn: true, adjustments: { brightness: -6, contrast: 20, saturation: 25, vignette: 40 }, activeFilter: 'neon' },
]

// ── Defaults ──────────────────────────────────────────────────────────────────
export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0, contrast: 0, saturation: 0, hue: 0,
  temperature: 0, tint: 0, highlights: 0, shadows: 0,
  whites: 0, blacks: 0,
  fade: 0, grain: 0, vignette: 0, sharpness: 0,
  clarity: 0, dehaze: 0, vibrance: 0,
  texture: 0, noiseReduction: 0,
}

const DEFAULT_HSL: HslMixer = {
  red:     { hue: 0, sat: 0, lum: 0 },
  orange:  { hue: 0, sat: 0, lum: 0 },
  yellow:  { hue: 0, sat: 0, lum: 0 },
  green:   { hue: 0, sat: 0, lum: 0 },
  aqua:    { hue: 0, sat: 0, lum: 0 },
  blue:    { hue: 0, sat: 0, lum: 0 },
  purple:  { hue: 0, sat: 0, lum: 0 },
  magenta: { hue: 0, sat: 0, lum: 0 },
}

const DEFAULT_CROP: CropState = {
  rotation: 0, flipH: false, flipV: false, aspect: 'free',
  x: 0, y: 0, w: 1, h: 1, applied: false,
}

const DEFAULT_GEO: GeometryState = { vertical: 0, horizontal: 0, rotate: 0, distortion: 0 }

const DEFAULT_LENS_BLUR: LensBlurSettings = {
  enabled: false, type: 'radial', amount: 40, feather: 60, centerX: 50, centerY: 50, size: 30,
}

const DEFAULT_PRO: ProEffects = { preset: 'none', grain: 0, chromatic: 0, lightleak: 0, aiBypass: false }

// ── CSS filter builder ────────────────────────────────────────────────────────
export function buildCSSFilter(adj: Adjustments, filterPreset: string): string {
  const preset = FILTER_PRESETS.find(f => f.id === filterPreset)
  const b  = 1 + (adj.brightness + adj.whites * 0.25) / 100
  const c  = 1 + (adj.contrast + adj.clarity * 0.3 + adj.texture * 0.15) / 100
  const s  = Math.max(0, 1 + (adj.saturation + adj.vibrance * 0.5) / 100)
  const h  = adj.hue
  const sepia    = adj.temperature > 0 ? adj.temperature * 0.003 : 0
  const hueShift = adj.temperature < 0 ? adj.temperature * 0.15  : 0
  const tintHue  = adj.tint !== 0 ? adj.tint * 0.4 : 0
  const fadeB    = 1 + adj.fade * 0.001
  const fadeC    = 1 - adj.fade * 0.002
  const dehazeB  = 1 + adj.dehaze * 0.003
  const dehazeC  = 1 + adj.dehaze * 0.004
  const blur     = adj.noiseReduction > 0 ? (adj.noiseReduction * 0.006).toFixed(2) : null

  const parts = [
    blur ? `blur(${blur}px)` : '',
    `brightness(${(b * fadeB * dehazeB).toFixed(3)})`,
    `contrast(${(c * fadeC * dehazeC).toFixed(3)})`,
    `saturate(${s.toFixed(3)})`,
    `hue-rotate(${(h + hueShift + tintHue).toFixed(1)}deg)`,
    sepia > 0 ? `sepia(${sepia.toFixed(3)})` : '',
  ].filter(Boolean).join(' ')

  if (preset && preset.css !== 'none') return `${preset.css} ${parts}`
  return parts || 'none'
}

export function buildTransform(crop: CropState, geo: GeometryState): string {
  const parts: string[] = []
  if (crop.flipH) parts.push('scaleX(-1)')
  if (crop.flipV) parts.push('scaleY(-1)')
  if (crop.rotation !== 0 || geo.rotate !== 0) parts.push(`rotate(${crop.rotation + geo.rotate}deg)`)
  if (geo.vertical !== 0 || geo.horizontal !== 0) {
    const vd = (geo.vertical * 0.25).toFixed(1)
    const hd = (geo.horizontal * 0.25).toFixed(1)
    return `perspective(1200px) rotateX(${vd}deg) rotateY(${hd}deg) ${parts.join(' ')}`
  }
  return parts.join(' ') || 'none'
}

// ── HSL Utility ───────────────────────────────────────────────────────────────
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0; const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}
function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) t += 1; if (t > 1) t -= 1
  if (t < 1/6) return p + (q - p) * 6 * t
  if (t < 1/2) return q
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
  return p
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hue2rgb(p, q, h + 1/3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1/3)]
}

function getBandWeight(h: number, center: number, width: number): number {
  const diff = Math.abs(((h - center + 0.5) % 1) - 0.5)
  return Math.max(0, 1 - diff / width)
}

export function applyHslMixer(
  ctx: CanvasRenderingContext2D,
  hsl: HslMixer,
  W: number, H: number
) {
  const bands = [
    { ch: hsl.red,     center: 0,      width: 0.08 },
    { ch: hsl.orange,  center: 0.055,  width: 0.06 },
    { ch: hsl.yellow,  center: 0.11,   width: 0.07 },
    { ch: hsl.green,   center: 0.28,   width: 0.1  },
    { ch: hsl.aqua,    center: 0.47,   width: 0.07 },
    { ch: hsl.blue,    center: 0.60,   width: 0.08 },
    { ch: hsl.purple,  center: 0.75,   width: 0.08 },
    { ch: hsl.magenta, center: 0.88,   width: 0.07 },
  ]
  const hasChanges = bands.some(b => b.ch.hue !== 0 || b.ch.sat !== 0 || b.ch.lum !== 0)
  if (!hasChanges) return

  const imgData = ctx.getImageData(0, 0, W, H)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255, g = d[i+1] / 255, b2 = d[i+2] / 255
    const [h, s, l] = rgbToHsl(r, g, b2)
    if (s < 0.05) continue // skip near-gray pixels
    let dh = 0, ds = 0, dl = 0
    for (const band of bands) {
      const w = getBandWeight(h, band.center, band.width)
      if (w > 0) {
        dh += band.ch.hue * w / 360
        ds += band.ch.sat * w / 200
        dl += band.ch.lum * w / 200
      }
    }
    const nh = (h + dh + 1) % 1
    const ns = Math.max(0, Math.min(1, s + ds))
    const nl = Math.max(0, Math.min(1, l + dl))
    const [nr, ng, nb] = hslToRgb(nh, ns, nl)
    d[i] = Math.round(nr * 255)
    d[i+1] = Math.round(ng * 255)
    d[i+2] = Math.round(nb * 255)
  }
  ctx.putImageData(imgData, 0, 0)
}

// ── Offline Healing Algorithm ───────────────────────────────────────────────
async function performHealingOffline(
  sourceImageUrl: string,
  naturalPoints: { x: number; y: number }[],
  brushSizeNatural: number,
  mode: 'spot' | 'clone',
  cloneSourceNatural: { x: number; y: number } | null
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const W = img.naturalWidth
      const H = img.naturalHeight

      // Create main canvas
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // 1. Draw mask on a separate canvas
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = W
      maskCanvas.height = H
      const mctx = maskCanvas.getContext('2d')!
      mctx.fillStyle = '#000000'
      mctx.fillRect(0, 0, W, H)
      
      mctx.strokeStyle = '#ffffff'
      mctx.fillStyle = '#ffffff'
      mctx.lineWidth = brushSizeNatural
      mctx.lineCap = 'round'
      mctx.lineJoin = 'round'

      if (naturalPoints.length === 1) {
        mctx.beginPath()
        mctx.arc(naturalPoints[0].x, naturalPoints[0].y, brushSizeNatural / 2, 0, Math.PI * 2)
        mctx.fill()
      } else {
        mctx.beginPath()
        mctx.moveTo(naturalPoints[0].x, naturalPoints[0].y)
        for (let i = 1; i < naturalPoints.length; i++) {
          const midX = (naturalPoints[i-1].x + naturalPoints[i].x) / 2
          const midY = (naturalPoints[i-1].y + naturalPoints[i].y) / 2
          mctx.quadraticCurveTo(naturalPoints[i-1].x, naturalPoints[i-1].y, midX, midY)
        }
        mctx.lineTo(naturalPoints[naturalPoints.length - 1].x, naturalPoints[naturalPoints.length - 1].y)
        mctx.stroke()
      }

      // 2. Find bounding box of the stroke mask
      let minX = W, minY = H, maxX = 0, maxY = 0
      naturalPoints.forEach(pt => {
        const r = brushSizeNatural / 2
        if (pt.x - r < minX) minX = pt.x - r
        if (pt.x + r > maxX) maxX = pt.x + r
        if (pt.y - r < minY) minY = pt.y - r
        if (pt.y + r > maxY) maxY = pt.y + r
      })

      // Add padding
      const padding = Math.max(20, brushSizeNatural)
      minX = Math.max(0, Math.floor(minX - padding))
      minY = Math.max(0, Math.floor(minY - padding))
      maxX = Math.min(W - 1, Math.ceil(maxX + padding))
      maxY = Math.min(H - 1, Math.ceil(maxY + padding))

      const boxW = maxX - minX
      const boxH = maxY - minY
      if (boxW <= 0 || boxH <= 0) {
        resolve(sourceImageUrl)
        return
      }

      let bestDx = 0
      let bestDy = 0
      let foundValid = false

      if (mode === 'spot') {
        // Find best non-overlapping shifted patch
        let minDifference = Infinity
        const R = Math.max(boxW, boxH)
        const searchRadii = [R * 0.8, R * 1.5, R * 2.2]
        const searchAngles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4]

        for (const rVal of searchRadii) {
          for (const angle of searchAngles) {
            const dx = Math.round(Math.cos(angle) * rVal)
            const dy = Math.round(Math.sin(angle) * rVal)

            const shiftedMinX = minX + dx
            const shiftedMinY = minY + dy
            const shiftedMaxX = maxX + dx
            const shiftedMaxY = maxY + dy

            // Check boundaries
            if (shiftedMinX < 0 || shiftedMinY < 0 || shiftedMaxX >= W || shiftedMaxY >= H) {
              continue
            }

            // Check if shifted area overlaps with mask
            const candMaskData = mctx.getImageData(shiftedMinX, shiftedMinY, boxW, boxH)
            const cmd = candMaskData.data
            let overlapsMask = false
            for (let i = 0; i < cmd.length; i += 4) {
              if (cmd[i] > 50) {
                overlapsMask = true
                break
              }
            }

            if (overlapsMask) continue

            // Rate by comparing borders
            const origImgData = ctx.getImageData(minX, minY, boxW, boxH).data
            const candImgData = ctx.getImageData(shiftedMinX, shiftedMinY, boxW, boxH).data
            
            let diffSum = 0
            let pixelCount = 0

            // Top/bottom rows
            for (let col = 0; col < boxW; col += 2) {
              const idxTop = col * 4
              diffSum += Math.abs(origImgData[idxTop] - candImgData[idxTop])
              diffSum += Math.abs(origImgData[idxTop+1] - candImgData[idxTop+1])
              diffSum += Math.abs(origImgData[idxTop+2] - candImgData[idxTop+2])

              const idxBot = ((boxH - 1) * boxW + col) * 4
              diffSum += Math.abs(origImgData[idxBot] - candImgData[idxBot])
              diffSum += Math.abs(origImgData[idxBot+1] - candImgData[idxBot+1])
              diffSum += Math.abs(origImgData[idxBot+2] - candImgData[idxBot+2])
              pixelCount += 2
            }

            // Left/right columns
            for (let row = 1; row < boxH - 1; row += 2) {
              const idxLeft = (row * boxW) * 4
              diffSum += Math.abs(origImgData[idxLeft] - candImgData[idxLeft])
              diffSum += Math.abs(origImgData[idxLeft+1] - candImgData[idxLeft+1])
              diffSum += Math.abs(origImgData[idxLeft+2] - candImgData[idxLeft+2])

              const idxRight = (row * boxW + (boxW - 1)) * 4
              diffSum += Math.abs(origImgData[idxRight] - candImgData[idxRight])
              diffSum += Math.abs(origImgData[idxRight+1] - candImgData[idxRight+1])
              diffSum += Math.abs(origImgData[idxRight+2] - candImgData[idxRight+2])
              pixelCount += 2
            }

            const avgDiff = diffSum / (pixelCount * 3)
            if (avgDiff < minDifference) {
              minDifference = avgDiff
              bestDx = dx
              bestDy = dy
              foundValid = true
            }
          }
          if (foundValid && minDifference < 25) break
        }

        if (!foundValid) {
          // Fallback simple directions
          const fallbacks = [
            [-brushSizeNatural * 2, 0],
            [brushSizeNatural * 2, 0],
            [0, -brushSizeNatural * 2],
            [0, brushSizeNatural * 2]
          ]
          for (const [fdx, fdy] of fallbacks) {
            if (minX + fdx >= 0 && maxX + fdx < W && minY + fdy >= 0 && maxY + fdy < H) {
              bestDx = fdx
              bestDy = fdy
              foundValid = true
              break
            }
          }
        }
      } else {
        // Clone mode: offset is determined by cloneSource
        if (cloneSourceNatural) {
          bestDx = cloneSourceNatural.x - naturalPoints[0].x
          bestDy = cloneSourceNatural.y - naturalPoints[0].y
          foundValid = true
        }
      }

      if (!foundValid) {
        resolve(sourceImageUrl)
        return
      }

      // 3. Create feathered patch
      const patchCanvas = document.createElement('canvas')
      patchCanvas.width = boxW
      patchCanvas.height = boxH
      const pctx = patchCanvas.getContext('2d')!

      // Draw the mask blurred for perfect feathering!
      pctx.save()
      const blurAmt = Math.max(3, Math.round(brushSizeNatural * 0.25))
      pctx.filter = `blur(${blurAmt}px)`
      pctx.drawImage(maskCanvas, minX, minY, boxW, boxH, 0, 0, boxW, boxH)
      pctx.restore()

      // Keep only source-in
      pctx.globalCompositeOperation = 'source-in'
      
      // Draw source image shifted by bestDx, bestDy
      pctx.drawImage(img, minX + bestDx, minY + bestDy, boxW, boxH, 0, 0, boxW, boxH)

      // 4. Draw patch back onto original canvas
      ctx.drawImage(patchCanvas, minX, minY)

      // Output to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob))
        } else {
          resolve(sourceImageUrl)
        }
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = sourceImageUrl
  })
}

// ── Main Hook ─────────────────────────────────────────────────────────────────
export function useImageEditor() {
  const [sourceImage,    setSourceImage]    = useState<string | null>(null)
  const [imageHistory,   setImageHistory]   = useState<string[]>([])
  const [historyIndex,   setHistoryIndex]   = useState(-1)
  const [adjustments,    setAdjustments]    = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS })
  const [activeFilter,   setActiveFilter]   = useState('none')
  const [profile,        setProfile]        = useState('none')
  const [hslMixer,       setHslMixer]       = useState<HslMixer>({ ...DEFAULT_HSL })
  const [crop,           setCrop]           = useState<CropState>({ ...DEFAULT_CROP })
  const [geometry,       setGeometry]       = useState<GeometryState>({ ...DEFAULT_GEO })
  const [lensBlur,       setLensBlur]       = useState<LensBlurSettings>({ ...DEFAULT_LENS_BLUR })
  const [texts,          setTexts]          = useState<TextLayer[]>([])
  const [stickers,       setStickers]       = useState<StickerLayer[]>([])
  const [strokes,        setStrokes]        = useState<DrawStroke[]>([])
  const [frame,          setFrame]          = useState<FrameSettings>({ type: 'none', color: '#ffffff', size: 20, cornerRadius: 0 })
  const [pro,            setPro]            = useState<ProEffects>({ ...DEFAULT_PRO })
  const [overlayLayers,  setOverlayLayers]  = useState<OverlayLayer[]>([])
  const [selectiveEdits, setSelectiveEdits] = useState<SelectiveEdit[]>([])
  const [versions,       setVersions]       = useState<EditVersion[]>([])
  const [customPresets,  setCustomPresets]  = useState<CustomPreset[]>(BUILTIN_PRESETS)
  const [isProcessingCutout, setIsProcessingCutout] = useState(false)
  const [canvasSize,     setCanvasSize]     = useState({ width: 0, height: 0 })
  const imageRef = useRef<HTMLImageElement>(null) as React.RefObject<HTMLImageElement>
  const drawRef  = useRef<HTMLCanvasElement>(null) as React.RefObject<HTMLCanvasElement>

  const updateSourceImage = useCallback((url: string) => {
    setImageHistory(prev => {
      const next = prev.slice(0, historyIndex + 1)
      next.push(url)
      setHistoryIndex(next.length - 1)
      return next
    })
    setSourceImage(url)
  }, [historyIndex])

  const undoImage = useCallback(() => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1
      setHistoryIndex(nextIdx)
      setSourceImage(imageHistory[nextIdx])
    }
  }, [historyIndex, imageHistory])

  const redoImage = useCallback(() => {
    if (historyIndex < imageHistory.length - 1) {
      const nextIdx = historyIndex + 1
      setHistoryIndex(nextIdx)
      setSourceImage(imageHistory[nextIdx])
    }
  }, [historyIndex, imageHistory])

  // ── Load / Reset ──────────────────────────────────────────────────────────
  const loadImage = useCallback((file: File | null) => {
    if (!file) {
      setSourceImage(null); setImageHistory([]); setHistoryIndex(-1); setAdjustments({ ...DEFAULT_ADJUSTMENTS })
      setActiveFilter('none'); setProfile('none'); setHslMixer({ ...DEFAULT_HSL })
      setCrop({ ...DEFAULT_CROP }); setGeometry({ ...DEFAULT_GEO })
      setLensBlur({ ...DEFAULT_LENS_BLUR })
      setTexts([]); setStickers([]); setStrokes([])
      setFrame({ type: 'none', color: '#ffffff', size: 20, cornerRadius: 0 })
      setPro({ ...DEFAULT_PRO }); setOverlayLayers([]); setVersions([])
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight })
    img.src = url
    setSourceImage(url)
    setImageHistory([url])
    setHistoryIndex(0)
    setAdjustments({ ...DEFAULT_ADJUSTMENTS }); setActiveFilter('none'); setProfile('none')
    setHslMixer({ ...DEFAULT_HSL }); setCrop({ ...DEFAULT_CROP })
    setGeometry({ ...DEFAULT_GEO }); setLensBlur({ ...DEFAULT_LENS_BLUR })
    setTexts([]); setStickers([]); setStrokes([])
    setFrame({ type: 'none', color: '#ffffff', size: 20, cornerRadius: 0 })
    setPro({ ...DEFAULT_PRO }); setOverlayLayers([]); setSelectiveEdits([])
  }, [])

  // ── Adjustments ───────────────────────────────────────────────────────────
  const updateAdjustment = useCallback(<K extends keyof Adjustments>(key: K, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }))
  }, [])
  const updateAdjustmentsBulk = useCallback((ch: Partial<Adjustments>) => {
    setAdjustments(prev => ({ ...prev, ...ch }))
  }, [])
  const resetAdjustments = useCallback(() => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS }); setActiveFilter('none'); setProfile('none')
    setHslMixer({ ...DEFAULT_HSL }); setGeometry({ ...DEFAULT_GEO })
  }, [])
  const applyFilter  = useCallback((id: string) => setActiveFilter(id), [])
  const applyProfile = useCallback((id: string) => {
    const p = PROFILES.find(pr => pr.id === id)
    if (p) { setProfile(id); updateAdjustmentsBulk(p.adj) }
    else setProfile('none')
  }, [updateAdjustmentsBulk])

  // ── HSL ───────────────────────────────────────────────────────────────────
  const updateHsl = useCallback((color: keyof HslMixer, ch: Partial<HslChannel>) => {
    setHslMixer(prev => ({ ...prev, [color]: { ...prev[color], ...ch } }))
  }, [])
  const resetHsl = useCallback(() => setHslMixer({ ...DEFAULT_HSL }), [])

  // ── Crop ──────────────────────────────────────────────────────────────────
  const rotate    = useCallback((delta: number) => setCrop(p => ({ ...p, rotation: (p.rotation + delta + 360) % 360 })), [])
  const flipH     = useCallback(() => setCrop(p => ({ ...p, flipH: !p.flipH })), [])
  const flipV     = useCallback(() => setCrop(p => ({ ...p, flipV: !p.flipV })), [])
  const setAspect = useCallback((aspect: string) => {
    const ratios: Record<string, { w: number; h: number }> = {
      '1:1': { w: 0.8, h: 0.8 }, '16:9': { w: 0.8, h: 0.45 }, '4:3': { w: 0.8, h: 0.6 },
      '3:2': { w: 0.8, h: 0.533 }, '9:16': { w: 0.45, h: 0.8 }, '3:4': { w: 0.6, h: 0.8 },
      '2:1': { w: 0.8, h: 0.4 }, '5:4': { w: 0.8, h: 0.64 }, '21:9': { w: 0.8, h: 0.343 },
    }
    const r = ratios[aspect]
    if (r) setCrop(p => ({ ...p, aspect, x: (1 - r.w) / 2, y: (1 - r.h) / 2, w: r.w, h: r.h }))
    else setCrop(p => ({ ...p, aspect }))
  }, [])
  const setCropRect = useCallback((x: number, y: number, w: number, h: number) => {
    setCrop(p => ({ ...p, x, y, w, h }))
  }, [])
  const applyCrop = useCallback(() => setCrop(p => ({ ...p, applied: true })), [])
  const resetCrop = useCallback(() => setCrop({ ...DEFAULT_CROP }), [])

  // ── Geometry ──────────────────────────────────────────────────────────────
  const updateGeometry = useCallback((ch: Partial<GeometryState>) => {
    setGeometry(prev => ({ ...prev, ...ch }))
  }, [])
  const resetGeometry = useCallback(() => setGeometry({ ...DEFAULT_GEO }), [])

  // ── Lens Blur ─────────────────────────────────────────────────────────────
  const updateLensBlur = useCallback((ch: Partial<LensBlurSettings>) => {
    setLensBlur(prev => ({ ...prev, ...ch }))
  }, [])

  // ── Text ──────────────────────────────────────────────────────────────────
  const addText    = useCallback((l: TextLayer) => setTexts(p => [...p, l]), [])
  const updateText = useCallback((id: string, ch: Partial<TextLayer>) => {
    setTexts(p => p.map(t => t.id === id ? { ...t, ...ch } : t))
  }, [])
  const removeText = useCallback((id: string) => setTexts(p => p.filter(t => t.id !== id)), [])

  // ── Stickers ──────────────────────────────────────────────────────────────
  const addSticker    = useCallback((l: StickerLayer) => setStickers(p => [...p, l]), [])
  const updateSticker = useCallback((id: string, ch: Partial<StickerLayer>) => {
    setStickers(p => p.map(s => s.id === id ? { ...s, ...ch } : s))
  }, [])
  const removeSticker = useCallback((id: string) => setStickers(p => p.filter(s => s.id !== id)), [])

  // ── Drawing ───────────────────────────────────────────────────────────────
  const addStroke    = useCallback((s: DrawStroke) => setStrokes(p => [...p, s]), [])
  const clearStrokes = useCallback(() => setStrokes([]), [])
  const undoStroke   = useCallback(() => setStrokes(p => p.slice(0, -1)), [])

  // ── Frame ─────────────────────────────────────────────────────────────────
  const updateFrame = useCallback((ch: Partial<FrameSettings>) => setFrame(p => ({ ...p, ...ch })), [])

  // ── Pro ───────────────────────────────────────────────────────────────────
  const updatePro = useCallback((ch: Partial<ProEffects>) => setPro(p => ({ ...p, ...ch })), [])

  // ── Overlay Layers ────────────────────────────────────────────────────────
  const addOverlayLayer = useCallback((src: string) => {
    const id = `ol-${Date.now()}`
    setOverlayLayers(p => [...p, { 
      id, src, x: 50, y: 50, width: 60, opacity: 100, blendMode: 'normal', rotation: 0,
      adjustments: { ...DEFAULT_ADJUSTMENTS }, activeFilter: 'none'
    }])
    return id
  }, [])
  const updateOverlayLayer = useCallback((id: string, ch: Partial<OverlayLayer>) => {
    setOverlayLayers(p => p.map(l => l.id === id ? { ...l, ...ch } : l))
  }, [])
  const removeOverlayLayer = useCallback((id: string) => {
    setOverlayLayers(p => p.filter(l => l.id !== id))
  }, [])

  // ── Selective Edits ───────────────────────────────────────────────────────
  const addSelectiveEdit = useCallback(() => {
    const id = `se-${Date.now()}`
    setSelectiveEdits(p => [...p, { id, strokes: [], adjustments: { ...DEFAULT_ADJUSTMENTS } }])
    return id
  }, [])
  const updateSelectiveEdit = useCallback((id: string, ch: Partial<SelectiveEdit>) => {
    setSelectiveEdits(p => p.map(s => s.id === id ? { ...s, ...ch } : s))
  }, [])
  const removeSelectiveEdit = useCallback((id: string) => {
    setSelectiveEdits(p => p.filter(s => s.id !== id))
  }, [])
  const addSelectiveStroke = useCallback((id: string, stroke: DrawStroke) => {
    setSelectiveEdits(p => p.map(s => s.id === id ? { ...s, strokes: [...s.strokes, stroke] } : s))
  }, [])
  const undoSelectiveStroke = useCallback((id: string) => {
    setSelectiveEdits(p => p.map(s => s.id === id ? { ...s, strokes: s.strokes.slice(0, -1) } : s))
  }, [])
  const clearSelectiveStrokes = useCallback((id: string) => {
    setSelectiveEdits(p => p.map(s => s.id === id ? { ...s, strokes: [] } : s))
  }, [])


  // ── Cutout Background ─────────────────────────────────────────────────────
  const cutoutBackground = useCallback(async () => {
    if (!sourceImage) return
    setIsProcessingCutout(true)
    try {
      // Fetch the current image as a Blob so the library can process it directly
      const response = await fetch(sourceImage)
      const imageBlob = await response.blob()
      const { removeBackground } = await import('@imgly/background-removal')
      const resultBlob = await removeBackground(imageBlob, {
        debug: false,
        output: { format: 'image/png', quality: 1.0 },
      })
      const url = URL.createObjectURL(resultBlob)
      updateSourceImage(url)
    } finally {
      setIsProcessingCutout(false)
    }
    // Note: errors are NOT caught here — they propagate to the caller (CutoutPanel) for proper UI handling
  }, [sourceImage, updateSourceImage])

  // ── Apply Healing ─────────────────────────────────────────────────────────
  const applyHealing = useCallback(async (
    points: { x: number; y: number }[],
    brushSize: number,
    mode: 'spot' | 'clone',
    cloneSource: { x: number; y: number } | null
  ) => {
    if (!sourceImage || !imageRef.current || points.length === 0) return

    const img = imageRef.current
    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    const clientW = img.clientWidth
    const clientH = img.clientHeight

    const scaleX = naturalW / clientW
    const scaleY = naturalH / clientH

    // Scale points to natural coordinates
    const naturalPoints = points.map(pt => ({
      x: pt.x * scaleX,
      y: pt.y * scaleY
    }))

    const brushSizeNatural = brushSize * Math.max(scaleX, scaleY)

    let cloneSourceNatural: { x: number; y: number } | null = null
    if (cloneSource) {
      cloneSourceNatural = {
        x: (cloneSource.x / 100) * naturalW,
        y: (cloneSource.y / 100) * naturalH
      }
    }

    try {
      const healedUrl = await performHealingOffline(
        sourceImage,
        naturalPoints,
        brushSizeNatural,
        mode,
        cloneSourceNatural
      )
      updateSourceImage(healedUrl)
    } catch (err) {
      console.error('Healing failed:', err)
    }
  }, [sourceImage, updateSourceImage])

  // ── Versions ──────────────────────────────────────────────────────────────
  const saveVersion = useCallback((label: string) => {
    const v: EditVersion = {
      id: `v-${Date.now()}`, label, timestamp: Date.now(),
      adjustments: { ...adjustments }, activeFilter, hslMixer: { ...hslMixer }, pro: { ...pro }, profile,
    }
    setVersions(p => [...p, v])
  }, [adjustments, activeFilter, hslMixer, pro, profile])

  const restoreVersion = useCallback((v: EditVersion) => {
    setAdjustments({ ...v.adjustments })
    setActiveFilter(v.activeFilter)
    setHslMixer({ ...v.hslMixer })
    setPro({ ...v.pro })
    setProfile(v.profile)
  }, [])

  const deleteVersion = useCallback((id: string) => {
    setVersions(p => p.filter(v => v.id !== id))
  }, [])

  // ── Custom Presets ────────────────────────────────────────────────────────
  const saveCustomPreset = useCallback((name: string, icon = '🎨') => {
    const preset: CustomPreset = {
      id: `cp-${Date.now()}`, name, icon,
      adjustments: { ...adjustments }, activeFilter, pro: { preset: pro.preset, grain: pro.grain, chromatic: pro.chromatic, lightleak: pro.lightleak },
    }
    setCustomPresets(p => [...p, preset])
  }, [adjustments, activeFilter, pro])

  const applyCustomPreset = useCallback((p: CustomPreset) => {
    if (Object.keys(p.adjustments).length > 0) updateAdjustmentsBulk(p.adjustments)
    if (p.activeFilter) setActiveFilter(p.activeFilter)
    if (p.pro) setPro(prev => ({ ...prev, ...p.pro }))
  }, [updateAdjustmentsBulk])

  const deleteCustomPreset = useCallback((id: string) => {
    setCustomPresets(p => p.filter(c => c.id !== id))
  }, [])

  // ── Export ────────────────────────────────────────────────────────────────
  const exportImage = useCallback(async (format: 'png' | 'jpeg' | 'webp' = 'jpeg', quality = 0.95) => {
    const img = imageRef.current
    if (!img || !sourceImage) return

    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d')!
    const sw = img.naturalWidth, sh = img.naturalHeight
    const cx = Math.round(crop.x * sw), cy = Math.round(crop.y * sh)
    const cw = Math.round(crop.w * sw), ch = Math.round(crop.h * sh)
    canvas.width  = crop.applied ? cw : sw
    canvas.height = crop.applied ? ch : sh

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    if (crop.flipH) ctx.scale(-1, 1)
    if (crop.flipV) ctx.scale(1, -1)
    const totalRot = crop.rotation + geometry.rotate
    if (totalRot !== 0) ctx.rotate((totalRot * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)
    ;(ctx as any).filter = buildCSSFilter(adjustments, activeFilter)
    if (crop.applied) ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch)
    else ctx.drawImage(img, 0, 0, sw, sh)
    ctx.restore()

    // ── Lens Blur ───────────────────────────────────────────────────────────
    if (lensBlur.enabled) {
      const blurCanvas = document.createElement('canvas')
      blurCanvas.width = canvas.width; blurCanvas.height = canvas.height
      const bctx = blurCanvas.getContext('2d')!
      
      bctx.filter = `blur(${lensBlur.amount / 10}px)`
      bctx.drawImage(canvas, 0, 0)
      
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = canvas.width; maskCanvas.height = canvas.height
      const mctx = maskCanvas.getContext('2d')!
      
      if (lensBlur.type === 'radial') {
        const r1 = (lensBlur.size / 100) * (Math.max(canvas.width, canvas.height) / 2)
        const r2 = ((lensBlur.size + lensBlur.feather) / 100) * (Math.min(canvas.width, canvas.height) / 2)
        const gcx = (lensBlur.centerX / 100) * canvas.width
        const gcy = (lensBlur.centerY / 100) * canvas.height
        const g = mctx.createRadialGradient(gcx, gcy, r1, gcx, gcy, r2)
        g.addColorStop(0, 'rgba(0,0,0,0)')
        g.addColorStop(1, 'rgba(0,0,0,1)')
        mctx.fillStyle = g
        mctx.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        const g = mctx.createLinearGradient(0, 0, 0, canvas.height)
        const f1 = (30 - lensBlur.feather) / 100
        const f4 = (70 + lensBlur.feather) / 100
        g.addColorStop(0, 'rgba(0,0,0,1)')
        g.addColorStop(Math.max(0, f1), 'rgba(0,0,0,0)')
        g.addColorStop(Math.min(1, f4), 'rgba(0,0,0,0)')
        g.addColorStop(1, 'rgba(0,0,0,1)')
        mctx.fillStyle = g
        mctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      bctx.globalCompositeOperation = 'destination-in'
      bctx.drawImage(maskCanvas, 0, 0)
      
      ctx.drawImage(blurCanvas, 0, 0)
    }

    // HSL Mixer
    applyHslMixer(ctx, hslMixer, canvas.width, canvas.height)

    // Pro pixel effects
    if (pro.grain > 0 || pro.lightleak > 0 || pro.aiBypass || pro.chromatic > 0) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imgData.data
      const W = canvas.width, H = canvas.height

      if (pro.chromatic > 0) {
        const off = Math.round(pro.chromatic * (W / 1000))
        const tmp = new Uint8ClampedArray(d)
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4
            const ri = (y * W + Math.min(W - 1, x + off)) * 4
            const li = (y * W + Math.max(0, x - off)) * 4
            d[i]   = tmp[ri]; d[i+2] = tmp[li+2]
          }
        }
      }
      if (pro.grain > 0 || pro.aiBypass) {
        const intensity = pro.aiBypass ? Math.max(pro.grain, 25) : pro.grain
        for (let i = 0; i < d.length; i += 4) {
          const noise = (Math.random() - 0.5) * intensity
          d[i]   = Math.max(0, Math.min(255, d[i]   + noise))
          d[i+1] = Math.max(0, Math.min(255, d[i+1] + noise * 0.9))
          d[i+2] = Math.max(0, Math.min(255, d[i+2] + noise * 1.1))
        }
      }
      ctx.putImageData(imgData, 0, 0)

      if (pro.lightleak > 0) {
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        const g1 = ctx.createLinearGradient(0, 0, W * 0.45, H * 0.35)
        g1.addColorStop(0, `rgba(255,165,50,${pro.lightleak / 100 * 0.4})`)
        g1.addColorStop(1, 'rgba(255,70,30,0)')
        ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)
        ctx.restore()
      }
    }

    // Selective Edits
    for (const se of selectiveEdits) {
      if (se.strokes.length === 0) continue;
      
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = canvas.width; maskCanvas.height = canvas.height
      const mctx = maskCanvas.getContext('2d')!
      
      se.strokes.forEach(s => {
        if (s.points.length < 2) return
        mctx.save()
        mctx.globalAlpha = s.opacity / 100
        mctx.strokeStyle = 'black'
        mctx.lineWidth = s.width * (canvas.width / img.clientWidth)
        mctx.lineCap = 'round'
        mctx.lineJoin = 'round'
        mctx.shadowBlur = mctx.lineWidth
        mctx.shadowColor = 'black'
        mctx.beginPath()
        mctx.moveTo(s.points[0].x * (canvas.width/img.clientWidth), s.points[0].y * (canvas.height/img.clientHeight))
        for (let i = 1; i < s.points.length; i++) {
          const prevX = s.points[i-1].x * (canvas.width/img.clientWidth)
          const prevY = s.points[i-1].y * (canvas.height/img.clientHeight)
          const curX = s.points[i].x * (canvas.width/img.clientWidth)
          const curY = s.points[i].y * (canvas.height/img.clientHeight)
          const midX = (prevX + curX) / 2
          const midY = (prevY + curY) / 2
          mctx.quadraticCurveTo(prevX, prevY, midX, midY)
        }
        mctx.stroke()
        mctx.restore()
      })

      const adjCanvas = document.createElement('canvas')
      adjCanvas.width = canvas.width; adjCanvas.height = canvas.height
      const actx = adjCanvas.getContext('2d')!
      ;(actx as any).filter = buildCSSFilter(se.adjustments, 'none')
      actx.drawImage(canvas, 0, 0)
      
      actx.globalCompositeOperation = 'destination-in'
      actx.drawImage(maskCanvas, 0, 0)
      
      ctx.drawImage(adjCanvas, 0, 0)
    }

    // Overlay layers
    for (const ol of overlayLayers) {
      const olImg = new Image(); olImg.src = ol.src
      await new Promise(r => { olImg.onload = r })
      ctx.save()
      ctx.globalAlpha = ol.opacity / 100
      ctx.globalCompositeOperation = ol.blendMode as GlobalCompositeOperation
      const olW = (ol.width / 100) * canvas.width
      const olH = olImg.naturalHeight * (olW / olImg.naturalWidth)
      const olX = (ol.x / 100) * canvas.width - olW / 2
      const olY = (ol.y / 100) * canvas.height - olH / 2
      ctx.translate(olX + olW / 2, olY + olH / 2)
      ctx.rotate((ol.rotation * Math.PI) / 180)
      ;(ctx as any).filter = buildCSSFilter(ol.adjustments, ol.activeFilter)
      ctx.drawImage(olImg, -olW / 2, -olH / 2, olW, olH)
      ctx.restore()
    }

    // Draw strokes
    const drawCanvas = drawRef.current
    if (drawCanvas && strokes.length > 0) {
      ctx.drawImage(drawCanvas, 0, 0, canvas.width, canvas.height)
    }

    // Text
    for (const t of texts) {
      ctx.save()
      const fs = t.fontSize * (canvas.width / img.clientWidth)
      ctx.font = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${fs}px ${t.fontFamily}`
      ctx.fillStyle = t.color; ctx.globalAlpha = t.opacity / 100; ctx.textAlign = t.align
      ctx.fillText(t.text, t.x * canvas.width / 100, t.y * canvas.height / 100)
      ctx.restore()
    }

    // Stickers
    for (const s of stickers) {
      ctx.save()
      const fs = s.size * (canvas.width / img.clientWidth)
      ctx.font = `${fs}px sans-serif`; ctx.textAlign = 'center'
      ctx.fillText(s.emoji, s.x * canvas.width / 100, s.y * canvas.height / 100)
      ctx.restore()
    }

    // Frame
    if (frame.type !== 'none') {
      ctx.strokeStyle = frame.color
      ctx.lineWidth = frame.size * (canvas.width / 500)
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
    }

    const link = document.createElement('a')
    link.download = `aetheredit.${format}`
    link.href = canvas.toDataURL(`image/${format}`, quality)
    link.click()
  }, [sourceImage, adjustments, activeFilter, hslMixer, crop, geometry, texts, stickers, strokes, frame, pro, overlayLayers])

  const cssFilter    = buildCSSFilter(adjustments, activeFilter)
  const cssTransform = buildTransform(crop, geometry)

  return {
    sourceImage, adjustments, activeFilter, profile, hslMixer,
    crop, geometry, lensBlur, texts, stickers, strokes,
    frame, pro, overlayLayers, versions, customPresets, canvasSize,
    imageRef, drawRef, cssFilter, cssTransform,
    imageHistory, historyIndex,
    loadImage, updateAdjustment, updateAdjustmentsBulk, resetAdjustments,
    applyFilter, applyProfile, updateHsl, resetHsl,
    rotate, flipH, flipV, setAspect, setCropRect, applyCrop, resetCrop,
    updateGeometry, resetGeometry, updateLensBlur,
    addText, updateText, removeText,
    addSticker, updateSticker, removeSticker,
    addStroke, clearStrokes, undoStroke,
    updateFrame, updatePro, exportImage,
    addOverlayLayer, updateOverlayLayer, removeOverlayLayer,
    selectiveEdits, addSelectiveEdit, updateSelectiveEdit, removeSelectiveEdit,
    addSelectiveStroke, undoSelectiveStroke, clearSelectiveStrokes,
    cutoutBackground, isProcessingCutout,
    saveVersion, restoreVersion, deleteVersion,
    saveCustomPreset, applyCustomPreset, deleteCustomPreset,
    undoImage, redoImage, applyHealing,
  }
}
