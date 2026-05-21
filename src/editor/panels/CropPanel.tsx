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
  { id: 'free',  label: 'Free',  icon: '⬚' },
  { id: '1:1',   label: '1:1',   icon: '□' },
  { id: '16:9',  label: '16:9',  icon: '▬' },
  { id: '4:3',   label: '4:3',   icon: '▭' },
  { id: '3:2',   label: '3:2',   icon: '▭' },
  { id: '9:16',  label: '9:16',  icon: '▯' },
  { id: '3:4',   label: '3:4',   icon: '▯' },
  { id: '2:1',   label: '2:1',   icon: '▬' },
  { id: '5:4',   label: '5:4',   icon: '▭' },
  { id: '21:9',  label: '21:9',  icon: '▬' },
]

// ── Crop Overlay — fixed to use image rect, not container rect ────────────────
export const CropOverlay: React.FC<{
  crop: CropState
  onCropRect: (x: number, y: number, w: number, h: number) => void
  imageRef: React.RefObject<HTMLImageElement>
}> = ({ crop, onCropRect, imageRef }) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const startRef = useRef({ x: 0, y: 0, cx: 0, cy: 0, cw: 1, ch: 1 })

  const { x, y, w, h } = crop

  const startDrag = useCallback((handle: string) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(handle)
    startRef.current = { x: e.clientX, y: e.clientY, cx: x, cy: y, cw: w, ch: h }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [x, y, w, h])

  useEffect(() => {
    if (!dragging) return
    const getRect = () => {
      // Use image element rect for accurate pixel→percent conversion
      const imgEl = imageRef.current
      if (imgEl) return imgEl.getBoundingClientRect()
      return overlayRef.current?.getBoundingClientRect() ?? { width: 1, height: 1 }
    }

    const onMove = (e: PointerEvent) => {
      const rect = getRect()
      const pw = rect.width, ph = rect.height
      const dx = (e.clientX - startRef.current.x) / pw
      const dy = (e.clientY - startRef.current.y) / ph
      const { cx, cy, cw, ch } = startRef.current
      const MIN = 0.04

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
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, onCropRect, imageRef])

  const px = x * 100, py = y * 100, pw2 = w * 100, ph2 = h * 100
  const CORNER_SIZE = 28

  const HANDLES = [
    { id: 'nw', cursor: 'nw-resize', top: py,       left: px,       tx: '-50%', ty: '-50%' },
    { id: 'ne', cursor: 'ne-resize', top: py,       left: px+pw2,   tx: '-50%', ty: '-50%' },
    { id: 'sw', cursor: 'sw-resize', top: py+ph2,   left: px,       tx: '-50%', ty: '-50%' },
    { id: 'se', cursor: 'se-resize', top: py+ph2,   left: px+pw2,   tx: '-50%', ty: '-50%' },
    { id: 'n',  cursor: 'n-resize',  top: py,       left: px+pw2/2, tx: '-50%', ty: '-50%' },
    { id: 's',  cursor: 's-resize',  top: py+ph2,   left: px+pw2/2, tx: '-50%', ty: '-50%' },
    { id: 'w',  cursor: 'w-resize',  top: py+ph2/2, left: px,       tx: '-50%', ty: '-50%' },
    { id: 'e',  cursor: 'e-resize',  top: py+ph2/2, left: px+pw2,   tx: '-50%', ty: '-50%' },
  ]

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 10, touchAction: 'none' }}>
      {/* Dark overlay mask */}
      <div className="absolute inset-0" style={{
        background: 'rgba(0,0,0,0.55)',
        clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
          ${px}% ${py}%, ${px}% ${py + ph2}%, ${px + pw2}% ${py + ph2}%, ${px + pw2}% ${py}%, ${px}% ${py}%)`,
      }} />

      {/* Crop box body — draggable */}
      <div className="absolute pointer-events-auto"
        style={{
          left: `${px}%`, top: `${py}%`, width: `${pw2}%`, height: `${ph2}%`,
          border: '2px solid rgba(0,240,255,0.9)',
          cursor: dragging === 'body' ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onPointerDown={startDrag('body')}>
        {/* Rule-of-thirds grid */}
        {[33.3, 66.6].map(p => (
          <React.Fragment key={p}>
            <div style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }} />
          </React.Fragment>
        ))}
        {/* Corner brackets */}
        {[{ t: 0, l: 0, tr: 0, tb: '100%' }, { t: 0, l: '100%', tr: '100%', tb: '100%' }].map(() => null)}
      </div>

      {/* Handles */}
      {HANDLES.map(handle => (
        <div key={handle.id} className="absolute pointer-events-auto"
          style={{
            top: `${handle.top}%`, left: `${handle.left}%`,
            transform: `translate(${handle.tx}, ${handle.ty})`,
            width: CORNER_SIZE, height: CORNER_SIZE,
            cursor: handle.cursor, zIndex: 20, touchAction: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onPointerDown={startDrag(handle.id)}>
          <div style={{
            width: handle.id.length === 1 ? 10 : 14,
            height: handle.id.length === 1 ? 10 : 14,
            background: '#00F0FF',
            borderRadius: handle.id.length === 2 ? 4 : '50%',
            boxShadow: '0 0 10px rgba(0,240,255,0.7), 0 2px 8px rgba(0,0,0,0.5)',
          }} />
        </div>
      ))}
    </div>
  )
}

const CropPanel: React.FC<Props> = ({ crop, imageRef, onRotate, onFlipH, onFlipV, onAspect, onCropRect, onApply, onReset }) => {
  const fineRotation = crop.rotation % 360

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

      {/* Flip & Rotate buttons */}
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

      {/* Fine straighten slider */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div className="flex justify-between mb-1">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Straighten</span>
          <span className="font-mono" style={{ color: '#00F0FF', fontSize: 11 }}>{fineRotation}°</span>
        </div>
        <input type="range" min={-45} max={45}
          value={((fineRotation + 180) % 360) - 180}
          onChange={e => onRotate(Number(e.target.value) - (((fineRotation + 180) % 360) - 180))}
          style={{ accentColor: '#00F0FF', width: '100%' }} />
      </div>

      {/* Aspect ratio chips */}
      <div className="flex gap-2 px-4 pb-3 panel-scroll-x flex-shrink-0">
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
