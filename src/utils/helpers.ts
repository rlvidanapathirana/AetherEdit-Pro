import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Generate a unique ID */
export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Convert hex color to RGB object */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null
}

/** Convert RGB to hex */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/** Convert hex to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(0,0,0,${alpha})`
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/** Throttle a function */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Read file as data URL */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Read file as array buffer */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/** Download a file in the browser */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Scale value from one range to another */
export function scaleValue(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin
}

/** Get image dimensions from data URL */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.src = dataUrl
  })
}

/** Generate thumbnail from canvas element */
export function generateThumbnail(canvas: HTMLCanvasElement, maxSize = 200): string {
  const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height)
  const w = Math.floor(canvas.width * scale)
  const h = Math.floor(canvas.height * scale)
  const thumbCanvas = document.createElement('canvas')
  thumbCanvas.width = w
  thumbCanvas.height = h
  const ctx = thumbCanvas.getContext('2d')!
  ctx.drawImage(canvas, 0, 0, w, h)
  return thumbCanvas.toDataURL('image/jpeg', 0.7)
}

/** Parse LUT .cube file */
export function parseCubeFile(content: string): Float32Array | null {
  try {
    const lines = content.split('\n')
    let size = 0
    const data: number[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('#') || trimmed === '') continue
      if (trimmed.startsWith('LUT_SIZE')) {
        size = parseInt(trimmed.split(/\s+/)[1])
        continue
      }
      if (trimmed.startsWith('DOMAIN') || trimmed.startsWith('TITLE')) continue
      const parts = trimmed.split(/\s+/).map(Number)
      if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        data.push(...parts)
      }
    }

    if (size === 0 || data.length !== size * size * size * 3) return null
    return new Float32Array(data)
  } catch {
    return null
  }
}

/** Interpolate cubic bezier for smooth curves */
export function interpolateBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

/** Build LUT from curve points (256-entry lookup table) */
export function buildCurveLUT(points: { x: number; y: number }[]): Uint8Array {
  const lut = new Uint8Array(256)
  const sorted = [...points].sort((a, b) => a.x - b.x)

  for (let i = 0; i < 256; i++) {
    // Linear interpolation between control points
    let value = i
    for (let j = 0; j < sorted.length - 1; j++) {
      const p1 = sorted[j]
      const p2 = sorted[j + 1]
      if (i >= p1.x && i <= p2.x) {
        const t = (i - p1.x) / (p2.x - p1.x)
        value = p1.y + t * (p2.y - p1.y)
        break
      }
    }
    lut[i] = clamp(Math.round(value), 0, 255)
  }

  return lut
}

/** Convert data URL to Blob */
export async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const response = await fetch(dataURL)
  return response.blob()
}

/** Load Google Font dynamically */
export async function loadGoogleFont(family: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(family)
    const url = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;600;700;800&display=swap`
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
    await document.fonts.ready
    return true
  } catch {
    return false
  }
}

/** Install a local font from ArrayBuffer */
export async function installLocalFont(name: string, data: ArrayBuffer, format: string): Promise<boolean> {
  try {
    const font = new FontFace(name, data, { style: 'normal' })
    await font.load()
    document.fonts.add(font)
    return true
  } catch {
    return false
  }
}
