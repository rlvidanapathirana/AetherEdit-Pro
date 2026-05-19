import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { CropState } from '../useImageEditor'
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Check, X } from 'lucide-react'

interface Props {
  crop: CropState
  imageRef: React.RefObject<HTMLImageElement>
  onRotate: (delta: number) => void
  onFlipH: () => void
  onFlipV: () => void
  onAspect: (a: string) => void
  onCropRect: (x: number, y: number, w: number, h: number) => void
  onApply: () => void
  onReset: () => void
}

const ASPECTS = [
  { id: 'free',  label: 'Free', icon: '⬚' },
  { id: '1:1',   label: '1:1',  icon: '□' },
  { id: '16:9',  label: '16:9', icon: '▬' },
  { id: '4:3',   label: '4:3',  icon: '▭' },
  { id: '3:2',   label: '3:2',  icon: '▭' },
  { id: '9:16',  label: '9:16', icon: '▯' },
  { id: '3:4',   label: '3:4',  icon: '▯' },
]

export const CropOverlay: React.FC<{
  crop: CropState
  onCropRect: (x: number, y: number, w: number, h: number) => void
  containerRef: React.RefObject<HTMLDivElement>
}> = ({ crop, onCropRect, containerRef }) => {
  const [dragging, setDragging] = useState<string | null>(null)
  const startRef = useRef({ x: 0, y: 0, cx: 0, cy: 0, cw: 1, ch: 1 })

  const { x, y, w, h } = crop

  const startDrag = useCallback((handle: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    setDragging(handle)
    startRef.current = { x: e.clientX, y: e.clientY, cx: x, cy: y, cw: w, ch: h }
  }, [x, y, w, h])

  useEffect(() => {
    if (!dragging) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const pw = rect.width, ph = rect.height

    const onMove = (e: PointerEvent) => {
      const dx = (e.clientX - startRef.current.x) / pw
      const dy = (e.clientY - startRef.current.y) / ph
      const { cx, cy, cw, ch } = startRef.current
      const MIN = 0.05

      let nx = cx, ny = cy, nw = cw, nh = ch

      if (dragging === 'body') {
        nx = Math.max(0, Math.min(1 - cw, cx + dx))
        ny = Math.max(0, Math.min(1 - ch, cy + dy))
      } else {
        if (dragging.includes('n')) { ny = Math.min(cy + ch - MIN, cy + dy); nh = ch - (ny - cy) }
        if (dragging.includes('s')) { nh = Math.max(MIN, ch + dy) }
        if (dragging.includes('w')) { nx = Math.min(cx + cw - MIN, cx + dx); nw = cw - (nx - cx) }
        if (dragging.includes('e')) { nw = Math.max(MIN, cw + dx) }
        nx = Math.max(0, nx); ny = Math.max(0, ny)
        nw = Math.min(1 - nx, nw); nh = Math.min(1 - ny, nh)
      }
      onCropRect(nx, ny, nw, nh)
    }
    const onUp = () => setDragging(null)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [dragging, onCropRect, containerRef])

  const px = x * 100, py = y * 100, pw2 = w * 100, ph2 = h * 100
  const HANDLES = [
    { id: 'nw', cursor: 'nw-resize', style: { top: `${py}%`, left: `${px}%`, transform: 'translate(-50%,-50%)' } },
    { id: 'ne', cursor: 'ne-resize', style: { top: `${py}%`, left: `${px + pw2}%`, transform: 'translate(-50%,-50%)' } },
    { id: 'sw', cursor: 'sw-resize', style: { top: `${py + ph2}%`, left: `${px}%`, transform: 'translate(-50%,-50%)' } },
    { id: 'se', cursor: 'se-resize', style: { top: `${py + ph2}%`, left: `${px + pw2}%`, transform: 'translate(-50%,-50%)' } },
    { id: 'n',  cursor: 'n-resize',  style: { top: `${py}%`, left: `${px + pw2 / 2}%`, transform: 'translate(-50%,-50%)' } },
    { id: 's',  cursor: 's-resize',  style: { top: `${py + ph2}%`, left: `${px + pw2 / 2}%`, transform: 'translate(-50%,-50%)' } },
    { id: 'w',  cursor: 'w-resize',  style: { top: `${py + ph2 / 2}%`, left: `${px}%`, transform: 'translate(-50%,-50%)' } },
    { id: 'e',  cursor: 'e-resize',  style: { top: `${py + ph2 / 2}%`, left: `${px + pw2}%`, transform: 'translate(-50%,-50%)' } },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {/* Dark masks */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)', clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${px}% ${py}%, ${px}% ${py + ph2}%, ${px + pw2}% ${py + ph2}%, ${px + pw2}% ${py}%, ${px}% ${py}%)` }} />
      {/* Crop box */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: `${px}%`, top: `${py}%`, width: `${pw2}%`, height: `${ph2}%`,
          border: '2px solid #00F0FF', cursor: 'move',
          boxShadow: '0 0 0 1px rgba(0,240,255,0.3)',
        }}
        onPointerDown={startDrag('body')}
      >
        {/* Rule-of-thirds grid */}
        {[33.3, 66.6].map(p => (
          <React.Fragment key={p}>
            <div style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.2)' }} />
          </React.Fragment>
        ))}
      </div>
      {/* Handles */}
      {HANDLES.map(h => (
        <div key={h.id}
          className="absolute pointer-events-auto"
          style={{
            ...h.style, width: 16, height: 16,
            background: '#00F0FF', borderRadius: 3,
            cursor: h.cursor, zIndex: 20,
            boxShadow: '0 0 8px rgba(0,240,255,0.6)',
          }}
          onPointerDown={startDrag(h.id)}
        />
      ))}
    </div>
  )
}

const CropPanel: React.FC<Props> = ({ crop, imageRef, onRotate, onFlipH, onFlipV, onAspect, onCropRect, onApply, onReset }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Crop & Rotate</span>
        <div className="flex gap-2">
          <button onClick={onReset}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            <X size={11} /> Reset
          </button>
          <button onClick={onApply}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(0,240,255,0.15)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.3)' }}>
            <Check size={11} /> Apply
          </button>
        </div>
      </div>

      {/* Flip & Rotate */}
      <div className="flex items-center justify-center gap-2 px-4 pb-2 flex-shrink-0">
        {[
          { icon: <RotateCcw size={16} />, label: '-90°', action: () => onRotate(-90) },
          { icon: <FlipHorizontal size={16} />, label: 'Flip H', action: onFlipH, active: crop.flipH },
          { icon: <FlipVertical size={16} />, label: 'Flip V', action: onFlipV, active: crop.flipV },
          { icon: <RotateCw size={16} />, label: '+90°', action: () => onRotate(90) },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
            style={{
              background: btn.active ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
              border: btn.active ? '1.5px solid #00F0FF' : '1.5px solid rgba(255,255,255,0.08)',
              color: btn.active ? '#00F0FF' : 'rgba(255,255,255,0.7)',
            }}>
            {btn.icon}
            <span style={{ fontSize: 9 }}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Fine rotate slider */}
      <div className="px-5 pb-2 flex-shrink-0">
        <div className="flex justify-between mb-1">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Straighten</span>
          <span className="font-mono" style={{ color: '#00F0FF', fontSize: 11 }}>{crop.rotation}°</span>
        </div>
        <input type="range" min={0} max={359} value={crop.rotation}
          onChange={e => onRotate(Number(e.target.value) - crop.rotation)}
          style={{ accentColor: '#00F0FF', width: '100%' }} />
      </div>

      {/* Aspect ratio */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        {ASPECTS.map(a => (
          <button key={a.id} onClick={() => onAspect(a.id)}
            className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
            style={{
              background: crop.aspect === a.id ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
              border: crop.aspect === a.id ? '1.5px solid #00F0FF' : '1.5px solid rgba(255,255,255,0.08)',
              color: crop.aspect === a.id ? '#00F0FF' : 'rgba(255,255,255,0.6)',
              minWidth: 52,
            }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <span style={{ fontSize: 9 }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CropPanel
