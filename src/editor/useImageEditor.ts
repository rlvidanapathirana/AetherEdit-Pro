import { useState, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Adjustments {
  brightness: number; contrast: number; saturation: number; hue: number
  temperature: number; tint: number; highlights: number; shadows: number
  fade: number; grain: number; vignette: number; sharpness: number
  clarity: number; dehaze: number; vibrance: number
}

export interface CropState {
  rotation: number; flipH: boolean; flipV: boolean; aspect: string
  x: number; y: number; w: number; h: number  // normalized 0-1
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

export interface BlurSettings {
  type: 'none' | 'tiltshift' | 'radial' | 'linear'
  intensity: number; position: number; size: number
}

export interface ProEffects {
  preset: string
  grain: number
  chromatic: number
  lightleak: number
  aiBypass: boolean
}

export const FILTER_PRESETS = [
  { id: 'none',     label: 'Original',  css: 'none' },
  { id: 'vivid',    label: 'Vivid',     css: 'saturate(160%) contrast(110%) brightness(105%)' },
  { id: 'cool',     label: 'Cool',      css: 'hue-rotate(20deg) saturate(90%) brightness(105%)' },
  { id: 'warm',     label: 'Warm',      css: 'sepia(25%) saturate(130%) brightness(105%)' },
  { id: 'fade',     label: 'Fade',      css: 'contrast(85%) brightness(115%) saturate(80%)' },
  { id: 'bw',       label: 'B&W',       css: 'grayscale(100%) contrast(110%)' },
  { id: 'vintage',  label: 'Vintage',   css: 'sepia(45%) contrast(90%) brightness(88%) saturate(80%)' },
  { id: 'matte',    label: 'Matte',     css: 'contrast(90%) brightness(110%) saturate(90%) sepia(10%)' },
  { id: 'chrome',   label: 'Chrome',    css: 'saturate(130%) contrast(120%) brightness(102%) hue-rotate(-10deg)' },
  { id: 'noir',     label: 'Noir',      css: 'grayscale(100%) brightness(90%) contrast(140%)' },
  { id: 'lush',     label: 'Lush',      css: 'saturate(200%) hue-rotate(10deg) brightness(105%)' },
  { id: 'glow',     label: 'Glow',      css: 'brightness(120%) saturate(110%) contrast(95%)' },
  { id: 'sunset',   label: 'Sunset',    css: 'sepia(30%) saturate(160%) hue-rotate(-20deg) brightness(108%)' },
  { id: 'forest',   label: 'Forest',    css: 'saturate(130%) hue-rotate(60deg) brightness(97%) contrast(105%)' },
  { id: 'icy',      label: 'Icy',       css: 'saturate(60%) brightness(120%) hue-rotate(200deg) contrast(95%)' },
  { id: 'drama',    label: 'Drama',     css: 'contrast(140%) saturate(130%) brightness(90%)' },
  { id: 'golden',   label: 'Golden',    css: 'sepia(40%) saturate(150%) brightness(110%) hue-rotate(-10deg)' },
  { id: 'faded',    label: 'Faded',     css: 'contrast(80%) brightness(120%) saturate(70%) sepia(15%)' },
  { id: 'cinematic',label: 'Cinematic', css: 'contrast(115%) saturate(85%) brightness(95%) sepia(15%)' },
  { id: 'neon',     label: 'Neon',      css: 'saturate(300%) brightness(110%) contrast(120%)' },
]

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0, contrast: 0, saturation: 0, hue: 0,
  temperature: 0, tint: 0, highlights: 0, shadows: 0,
  fade: 0, grain: 0, vignette: 0, sharpness: 0,
  clarity: 0, dehaze: 0, vibrance: 0,
}

const DEFAULT_CROP: CropState = {
  rotation: 0, flipH: false, flipV: false, aspect: 'free',
  x: 0, y: 0, w: 1, h: 1, applied: false,
}

const DEFAULT_PRO: ProEffects = {
  preset: 'none', grain: 0, chromatic: 0, lightleak: 0, aiBypass: false
}

// ── CSS filter builder ────────────────────────────────────────────────────────
export function buildCSSFilter(adj: Adjustments, filterPreset: string): string {
  const preset = FILTER_PRESETS.find(f => f.id === filterPreset)
  const b  = 1 + adj.brightness / 100
  const c  = 1 + adj.contrast / 100
  const s  = Math.max(0, 1 + (adj.saturation + adj.vibrance * 0.5) / 100)
  const h  = adj.hue
  const sepia    = adj.temperature > 0 ? adj.temperature * 0.003 : 0
  const hueShift = adj.temperature < 0 ? adj.temperature * 0.15  : 0
  const fadeB    = 1 + adj.fade * 0.001
  const fadeC    = 1 - adj.fade * 0.002

  const parts = [
    `brightness(${(b * fadeB).toFixed(3)})`,
    `contrast(${(c * fadeC).toFixed(3)})`,
    `saturate(${s.toFixed(3)})`,
    `hue-rotate(${(h + hueShift).toFixed(1)}deg)`,
    sepia > 0 ? `sepia(${sepia.toFixed(3)})` : '',
  ].filter(Boolean).join(' ')

  if (preset && preset.css !== 'none') {
    return `${preset.css} ${parts}`
  }
  return parts || 'none'
}

export function buildTransform(crop: CropState): string {
  const parts: string[] = []
  if (crop.flipH) parts.push('scaleX(-1)')
  if (crop.flipV) parts.push('scaleY(-1)')
  if (crop.rotation !== 0) parts.push(`rotate(${crop.rotation}deg)`)
  return parts.join(' ') || 'none'
}

// ── Main Hook ─────────────────────────────────────────────────────────────────
export function useImageEditor() {
  const [sourceImage,   setSourceImage]   = useState<string | null>(null)
  const [adjustments,   setAdjustments]   = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS })
  const [activeFilter,  setActiveFilter]  = useState('none')
  const [crop,          setCrop]          = useState<CropState>({ ...DEFAULT_CROP })
  const [texts,         setTexts]         = useState<TextLayer[]>([])
  const [stickers,      setStickers]      = useState<StickerLayer[]>([])
  const [strokes,       setStrokes]       = useState<DrawStroke[]>([])
  const [frame,         setFrame]         = useState<FrameSettings>({ type: 'none', color: '#ffffff', size: 20, cornerRadius: 0 })
  const [blur,          setBlur]          = useState<BlurSettings>({ type: 'none', intensity: 10, position: 50, size: 50 })
  const [pro,           setPro]           = useState<ProEffects>({ ...DEFAULT_PRO })
  const [canvasSize,    setCanvasSize]    = useState({ width: 0, height: 0 })
  const imageRef  = useRef<HTMLImageElement>(null) as React.RefObject<HTMLImageElement>
  const drawRef   = useRef<HTMLCanvasElement>(null) as React.RefObject<HTMLCanvasElement>

  // ── Load / Reset ──────────────────────────────────────────────────────────
  const loadImage = useCallback((file: File | null) => {
    if (!file) {
      setSourceImage(null); setAdjustments({ ...DEFAULT_ADJUSTMENTS })
      setActiveFilter('none'); setCrop({ ...DEFAULT_CROP })
      setTexts([]); setStickers([]); setStrokes([])
      setFrame({ type: 'none', color: '#ffffff', size: 20, cornerRadius: 0 })
      setPro({ ...DEFAULT_PRO })
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight })
    img.src = url
    setSourceImage(url)
    setAdjustments({ ...DEFAULT_ADJUSTMENTS }); setActiveFilter('none')
    setCrop({ ...DEFAULT_CROP }); setTexts([]); setStickers([]); setStrokes([])
    setFrame({ type: 'none', color: '#ffffff', size: 20, cornerRadius: 0 })
    setPro({ ...DEFAULT_PRO })
  }, [])

  // ── Adjustments ───────────────────────────────────────────────────────────
  const updateAdjustment = useCallback(<K extends keyof Adjustments>(key: K, value: Adjustments[K]) => {
    setAdjustments(prev => ({ ...prev, [key]: value }))
  }, [])
  const updateAdjustmentsBulk = useCallback((ch: Partial<Adjustments>) => {
    setAdjustments(prev => ({ ...prev, ...ch }))
  }, [])
  const resetAdjustments = useCallback(() => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS }); setActiveFilter('none')
  }, [])
  const applyFilter = useCallback((id: string) => setActiveFilter(id), [])

  // ── Crop ──────────────────────────────────────────────────────────────────
  const rotate  = useCallback((delta: number) => setCrop(p => ({ ...p, rotation: (p.rotation + delta + 360) % 360 })), [])
  const flipH   = useCallback(() => setCrop(p => ({ ...p, flipH: !p.flipH })), [])
  const flipV   = useCallback(() => setCrop(p => ({ ...p, flipV: !p.flipV })), [])
  const setAspect = useCallback((aspect: string) => {
    const presets: Record<string, { w: number; h: number }> = {
      '1:1': { w: 1, h: 1 }, '16:9': { w: 1, h: 0.5625 }, '4:3': { w: 1, h: 0.75 },
      '3:2': { w: 1, h: 0.667 }, '9:16': { w: 0.5625, h: 1 }, '3:4': { w: 0.75, h: 1 },
    }
    const ratio = presets[aspect]
    if (ratio) {
      setCrop(p => ({ ...p, aspect, x: 0.1, y: 0.1, w: ratio.w * 0.8, h: ratio.h * 0.8 }))
    } else {
      setCrop(p => ({ ...p, aspect }))
    }
  }, [])
  const setCropRect = useCallback((x: number, y: number, w: number, h: number) => {
    setCrop(p => ({ ...p, x, y, w, h }))
  }, [])
  const applyCrop = useCallback(() => setCrop(p => ({ ...p, applied: true })), [])
  const resetCrop = useCallback(() => setCrop({ ...DEFAULT_CROP }), [])

  // ── Text ──────────────────────────────────────────────────────────────────
  const addText   = useCallback((l: TextLayer) => setTexts(p => [...p, l]), [])
  const updateText = useCallback((id: string, ch: Partial<TextLayer>) => setTexts(p => p.map(t => t.id === id ? { ...t, ...ch } : t)), [])
  const removeText = useCallback((id: string) => setTexts(p => p.filter(t => t.id !== id)), [])

  // ── Stickers ──────────────────────────────────────────────────────────────
  const addSticker    = useCallback((l: StickerLayer) => setStickers(p => [...p, l]), [])
  const updateSticker = useCallback((id: string, ch: Partial<StickerLayer>) => setStickers(p => p.map(s => s.id === id ? { ...s, ...ch } : s)), [])
  const removeSticker = useCallback((id: string) => setStickers(p => p.filter(s => s.id !== id)), [])

  // ── Drawing ───────────────────────────────────────────────────────────────
  const addStroke    = useCallback((s: DrawStroke) => setStrokes(p => [...p, s]), [])
  const clearStrokes = useCallback(() => setStrokes([]), [])
  const undoStroke   = useCallback(() => setStrokes(p => p.slice(0, -1)), [])

  // ── Frame ─────────────────────────────────────────────────────────────────
  const updateFrame = useCallback((ch: Partial<FrameSettings>) => setFrame(p => ({ ...p, ...ch })), [])

  // ── Pro / AI Bypass ───────────────────────────────────────────────────────
  const updatePro = useCallback((ch: Partial<ProEffects>) => setPro(p => ({ ...p, ...ch })), [])

  // ── Blur ──────────────────────────────────────────────────────────────────
  const updateBlur = useCallback((ch: Partial<BlurSettings>) => setBlur(p => ({ ...p, ...ch })), [])

  // ── Export ────────────────────────────────────────────────────────────────
  const exportImage = useCallback(async (format: 'png' | 'jpeg' | 'webp' = 'jpeg', quality = 0.95) => {
    const img = imageRef.current
    if (!img || !sourceImage) return

    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d')!

    let sw = img.naturalWidth, sh = img.naturalHeight
    // Apply crop
    const cx = Math.round(crop.x * sw), cy = Math.round(crop.y * sh)
    const cw = Math.round(crop.w * sw), ch_ = Math.round(crop.h * sh)
    canvas.width  = crop.applied ? cw : sw
    canvas.height = crop.applied ? ch_ : sh

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    if (crop.flipH) ctx.scale(-1, 1)
    if (crop.flipV) ctx.scale(1, -1)
    if (crop.rotation !== 0) ctx.rotate((crop.rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)
    ;(ctx as any).filter = buildCSSFilter(adjustments, activeFilter)
    if (crop.applied) {
      ctx.drawImage(img, cx, cy, cw, ch_, 0, 0, cw, ch_)
    } else {
      ctx.drawImage(img, 0, 0, sw, sh)
    }
    ctx.restore()

    // Apply Pro Effects (Grain, Lightleak, AI Bypass)
    if (pro.grain > 0 || pro.lightleak > 0 || pro.aiBypass || pro.chromatic > 0) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imgData.data
      const W = canvas.width, H = canvas.height
      
      // Chromatic Aberration
      if (pro.chromatic > 0) {
        const off = Math.round(pro.chromatic * (W / 1000))
        const tmp = new Uint8ClampedArray(d)
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4
            const ri = (y * W + Math.min(W - 1, x + off)) * 4
            const li = (y * W + Math.max(0, x - off)) * 4
            d[i] = tmp[ri] // R channel shifted left
            d[i+2] = tmp[li+2] // B channel shifted right
          }
        }
      }

      // Grain & AI Bypass Noise
      if (pro.grain > 0 || pro.aiBypass) {
        const intensity = pro.aiBypass ? Math.max(pro.grain, 25) : pro.grain
        for (let i = 0; i < d.length; i += 4) {
          const noise = (Math.random() - 0.5) * intensity
          d[i] = Math.max(0, Math.min(255, d[i] + noise))
          d[i+1] = Math.max(0, Math.min(255, d[i+1] + noise * 0.9))
          d[i+2] = Math.max(0, Math.min(255, d[i+2] + noise * 1.1))
        }
      }

      ctx.putImageData(imgData, 0, 0)

      // Lightleak
      if (pro.lightleak > 0) {
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        const g1 = ctx.createLinearGradient(0, 0, W * 0.45, H * 0.35)
        g1.addColorStop(0, `rgba(255,165,50,${pro.lightleak/100 * 0.4})`)
        g1.addColorStop(1, 'rgba(255,70,30,0)')
        ctx.fillStyle = g1
        ctx.fillRect(0, 0, W, H)
        ctx.restore()
      }
    }

    // Composite drawing canvas
    const drawCanvas = drawRef.current
    if (drawCanvas && strokes.length > 0) {
      ctx.drawImage(drawCanvas, 0, 0, canvas.width, canvas.height)
    }

    // Draw text layers
    for (const t of texts) {
      ctx.save()
      const fs = t.fontSize * (canvas.width / img.clientWidth)
      ctx.font = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${fs}px ${t.fontFamily}`
      ctx.fillStyle = t.color
      ctx.globalAlpha = t.opacity / 100
      ctx.textAlign = t.align
      ctx.fillText(t.text, t.x * canvas.width / 100, t.y * canvas.height / 100)
      ctx.restore()
    }

    // Draw stickers
    for (const s of stickers) {
      ctx.save()
      const fs = s.size * (canvas.width / img.clientWidth)
      ctx.font = `${fs}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(s.emoji, s.x * canvas.width / 100, s.y * canvas.height / 100)
      ctx.restore()
    }

    // Frame/border
    if (frame.type !== 'none') {
      ctx.strokeStyle = frame.color
      ctx.lineWidth = frame.size * (canvas.width / 500)
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
    }

    const link = document.createElement('a')
    link.download = `aetheredit.${format}`
    link.href = canvas.toDataURL(`image/${format}`, quality)
    link.click()
  }, [sourceImage, adjustments, activeFilter, crop, texts, stickers, strokes, frame, pro])

  const cssFilter    = buildCSSFilter(adjustments, activeFilter)
  const cssTransform = buildTransform(crop)

  return {
    sourceImage, adjustments, activeFilter, crop, texts, stickers, strokes,
    frame, blur, pro, canvasSize, imageRef, drawRef,
    cssFilter, cssTransform,
    loadImage, updateAdjustment, updateAdjustmentsBulk, resetAdjustments, applyFilter,
    rotate, flipH, flipV, setAspect, setCropRect, applyCrop, resetCrop,
    addText, updateText, removeText,
    addSticker, updateSticker, removeSticker,
    addStroke, clearStrokes, undoStroke,
    updateFrame, updateBlur, updatePro, exportImage,
  }
}
