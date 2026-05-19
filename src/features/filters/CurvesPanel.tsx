import React, { useRef, useEffect, useCallback, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useEditorStore } from '../../context/editorStore'
import type { CurvePoint, CurvesSettings } from '../../context/editorStore'
import { clamp, buildCurveLUT } from '../../utils/helpers'

interface CurveEditorProps {
  channel: keyof CurvesSettings
  color: string
  label: string
}

const CurveEditor: React.FC<CurveEditorProps> = ({ channel, color, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { curves, setCurvePoint } = useEditorStore()
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const points = curves[channel]

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Background
    ctx.fillStyle = '#0e0e0e'
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const x = (i / 4) * w
      const y = (i / 4) * h
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    // Diagonal reference
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, 0); ctx.stroke()
    ctx.setLineDash([])

    // Curve from LUT
    const sorted = [...points].sort((a, b) => a.x - b.x)
    const lut = buildCurveLUT(sorted)
    ctx.beginPath()
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * w
      const y = h - (lut[i] / 255) * h
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Control points
    sorted.forEach((pt, i) => {
      const x = (pt.x / 255) * w
      const y = h - (pt.y / 255) * h
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = i === draggingIdx ? '#fff' : color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  }, [points, color, draggingIdx])

  useEffect(() => { draw() }, [draw])

  const getPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return {
      x: clamp(Math.round(((clientX - rect.left) / rect.width) * 255), 0, 255),
      y: clamp(Math.round((1 - (clientY - rect.top) / rect.height) * 255), 0, 255),
    }
  }

  const hitTest = (pt: { x: number; y: number }): number => {
    const threshold = 12
    for (let i = 0; i < points.length; i++) {
      const dx = Math.abs(points[i].x - pt.x)
      const dy = Math.abs(points[i].y - pt.y)
      if (dx < threshold && dy < threshold) return i
    }
    return -1
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPoint(e)
    const hit = hitTest(pt)
    if (hit >= 0) {
      setDraggingIdx(hit)
    } else {
      // Add new point
      const newPoints = [...points, pt].sort((a, b) => a.x - b.x)
      setCurvePoint(channel, newPoints)
      setDraggingIdx(newPoints.findIndex(p => p.x === pt.x && p.y === pt.y))
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIdx === null) return
    const pt = getPoint(e)
    const newPoints = points.map((p, i) => i === draggingIdx ? pt : p)
    setCurvePoint(channel, newPoints)
  }

  const handleMouseUp = () => { setDraggingIdx(null) }

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPoint(e)
    const hit = hitTest(pt)
    if (hit > 0 && hit < points.length - 1) {
      // Remove point (don't remove endpoints)
      const newPoints = points.filter((_, i) => i !== hit)
      setCurvePoint(channel, newPoints)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color, fontSize: 10, fontWeight: 600 }}>{label}</span>
        <button
          className="btn-tool w-5 h-5"
          onClick={() => setCurvePoint(channel, [{ x: 0, y: 0 }, { x: 255, y: 255 }])}
        >
          <RotateCcw size={9} />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={240}
        height={160}
        className="w-full rounded-md cursor-crosshair"
        style={{ border: `1px solid rgba(255,255,255,0.08)` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  )
}

const CurvesPanel: React.FC = () => {
  const [activeChannel, setActiveChannel] = React.useState<keyof CurvesSettings>('master')
  const { resetCurves } = useEditorStore()

  const channels: { key: keyof CurvesSettings; label: string; color: string }[] = [
    { key: 'master', label: 'Master RGB', color: '#ffffff' },
    { key: 'red', label: 'Red', color: '#ef4444' },
    { key: 'green', label: 'Green', color: '#22c55e' },
    { key: 'blue', label: 'Blue', color: '#3b82f6' },
  ]

  return (
    <div className="px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="panel-label">CURVES</span>
        <button className="btn-tool w-5 h-5" onClick={resetCurves}>
          <RotateCcw size={10} />
        </button>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-1 p-1 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {channels.map(ch => (
          <button
            key={ch.key}
            className={`tab-trigger flex-1 py-1 text-xs rounded ${activeChannel === ch.key ? 'active' : ''}`}
            style={{
              fontSize: 10,
              color: activeChannel === ch.key ? ch.color : 'rgba(255,255,255,0.35)',
              background: activeChannel === ch.key ? 'rgba(0,240,255,0.06)' : 'transparent',
            }}
            onClick={() => setActiveChannel(ch.key)}
          >
            {ch.key === 'master' ? 'RGB' : ch.label}
          </button>
        ))}
      </div>

      <CurveEditor
        channel={activeChannel}
        color={channels.find(c => c.key === activeChannel)!.color}
        label={channels.find(c => c.key === activeChannel)!.label}
      />

      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
        Click to add point · Double-click to remove · Drag to adjust
      </p>
    </div>
  )
}

export default CurvesPanel
