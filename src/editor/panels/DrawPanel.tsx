import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { DrawStroke } from '../useImageEditor'
import { Undo2, Trash2 } from 'lucide-react'

interface DrawSettings {
  color: string
  size: number
  opacity: number
  tool: 'pen' | 'brush' | 'marker'
}

interface Props {
  strokes: DrawStroke[]
  onUndo: () => void
  onClear: () => void
  settings: DrawSettings
  onSettings: (s: Partial<DrawSettings>) => void
}

const COLORS = ['#ffffff','#000000','#ef4444','#f97316','#fbbf24','#22c55e','#3b82f6','#8b5cf6','#ec4899','#00F0FF','#6366F1','#f0abfc']
const TOOLS = [
  { id: 'pen',    label: 'Pen',    icon: '✏️' },
  { id: 'brush',  label: 'Brush',  icon: '🖌️' },
  { id: 'marker', label: 'Marker', icon: '🖊️' },
]

// ── DrawPanel: only renders settings UI, canvas is in App.tsx ─────────────────
const DrawPanel: React.FC<Props> = ({ strokes, onUndo, onClear, settings, onSettings }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Draw</span>
        <div className="flex gap-2">
          <button onClick={onUndo} disabled={strokes.length === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', opacity: strokes.length === 0 ? 0.4 : 1 }}>
            <Undo2 size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>
          <button onClick={onClear} disabled={strokes.length === 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)', opacity: strokes.length === 0 ? 0.4 : 1 }}>
            <Trash2 size={14} style={{ color: '#f87171' }} />
          </button>
        </div>
      </div>

      {/* Tool selector */}
      <div className="flex gap-2 px-4 pb-2 flex-shrink-0">
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => onSettings({ tool: t.id as any })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-1 justify-center"
            style={{
              background: settings.tool === t.id ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
              border: settings.tool === t.id ? '1.5px solid #00F0FF' : '1.5px solid rgba(255,255,255,0.08)',
              color: settings.tool === t.id ? '#00F0FF' : 'rgba(255,255,255,0.6)',
            }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Size + Opacity */}
      <div className="px-4 pb-2 space-y-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 40 }}>Size</span>
          <input type="range" min={1} max={80} value={settings.size}
            onChange={e => onSettings({ size: Number(e.target.value) })}
            style={{ accentColor: '#00F0FF', flex: 1 }} />
          <span className="font-mono" style={{ fontSize: 11, color: '#00F0FF', width: 24, textAlign: 'right' }}>{settings.size}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 40 }}>Opacity</span>
          <input type="range" min={5} max={100} value={settings.opacity}
            onChange={e => onSettings({ opacity: Number(e.target.value) })}
            style={{ accentColor: '#6366F1', flex: 1 }} />
          <span className="font-mono" style={{ fontSize: 11, color: '#6366F1', width: 28, textAlign: 'right' }}>{settings.opacity}%</span>
        </div>
      </div>

      {/* Color palette */}
      <div className="flex gap-2 px-4 pb-3 panel-scroll-x flex-shrink-0">
        {COLORS.map(c => (
          <button key={c} onClick={() => onSettings({ color: c })}
            className="flex-shrink-0 w-8 h-8 rounded-full transition-all"
            style={{
              background: c,
              border: settings.color === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
              transform: settings.color === c ? 'scale(1.25)' : 'scale(1)',
            }} />
        ))}
        <input type="color" value={settings.color} onChange={e => onSettings({ color: e.target.value })}
          title="Custom color"
          className="flex-shrink-0 w-8 h-8 rounded-full cursor-pointer"
          style={{ padding: 2, border: '2px dashed rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }} />
      </div>
    </div>
  )
}

export { DrawPanel }
export type { DrawSettings }

// ── useDrawCanvas: all drawing logic as a hook ────────────────────────────────
export function useDrawCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  containerRef: React.RefObject<HTMLDivElement>,
  strokes: DrawStroke[],
  onAddStroke: (s: DrawStroke) => void,
  settings: DrawSettings
) {
  const isDrawing = useRef(false)
  const currentStroke = useRef<{ x: number; y: number }[]>([])
  const lastCanvas = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

  // Sync canvas size
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const rect = container.getBoundingClientRect()
    if (rect.width !== lastCanvas.current.w || rect.height !== lastCanvas.current.h) {
      const temp = document.createElement('canvas')
      temp.width = canvas.width; temp.height = canvas.height
      temp.getContext('2d')!.drawImage(canvas, 0, 0)
      canvas.width = rect.width; canvas.height = rect.height
      if (rect.width > 0) canvas.getContext('2d')!.drawImage(temp, 0, 0, rect.width, rect.height)
      lastCanvas.current = { w: rect.width, h: rect.height }
    }
  })

  // Redraw strokes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokes.forEach(s => {
      if (s.points.length < 2) return
      ctx.save()
      ctx.globalAlpha = s.opacity / 100
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.width
      ctx.lineCap = s.tool === 'marker' ? 'square' : 'round'
      ctx.lineJoin = 'round'
      if (s.tool === 'brush') { ctx.shadowBlur = s.width * 1.5; ctx.shadowColor = s.color }
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length; i++) {
        const mid = { x: (s.points[i-1].x + s.points[i].x)/2, y: (s.points[i-1].y + s.points[i].y)/2 }
        ctx.quadraticCurveTo(s.points[i-1].x, s.points[i-1].y, mid.x, mid.y)
      }
      ctx.stroke()
      ctx.restore()
    })
  }, [strokes, canvasRef])

  const getPos = (e: PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDrawing.current = true
    const pos = { x: e.clientX - canvasRef.current!.getBoundingClientRect().left, y: e.clientY - canvasRef.current!.getBoundingClientRect().top }
    currentStroke.current = [pos]
    canvasRef.current!.setPointerCapture(e.pointerId)
  }, [canvasRef])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = { x: e.clientX - canvas.getBoundingClientRect().left, y: e.clientY - canvas.getBoundingClientRect().top }
    currentStroke.current.push(pos)
    const pts = currentStroke.current
    if (pts.length >= 2) {
      ctx.save()
      ctx.globalAlpha = settings.opacity / 100
      ctx.strokeStyle = settings.color
      ctx.lineWidth = settings.tool === 'marker' ? settings.size * 2 : settings.size
      ctx.lineCap = settings.tool === 'marker' ? 'square' : 'round'
      ctx.lineJoin = 'round'
      if (settings.tool === 'brush') { ctx.shadowBlur = settings.size * 1.5; ctx.shadowColor = settings.color }
      const prev = pts[pts.length - 2]
      const mid = { x: (prev.x + pos.x)/2, y: (prev.y + pos.y)/2 }
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y)
      ctx.stroke()
      ctx.restore()
    }
  }, [canvasRef, settings])

  const onPointerUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (currentStroke.current.length >= 2) {
      onAddStroke({
        id: `stroke-${Date.now()}`,
        points: [...currentStroke.current],
        color: settings.color,
        opacity: settings.opacity,
        width: settings.tool === 'marker' ? settings.size * 2 : settings.size,
        tool: settings.tool,
      })
    }
    currentStroke.current = []
  }, [onAddStroke, settings])

  return { onPointerDown, onPointerMove, onPointerUp }
}

export default DrawPanel
