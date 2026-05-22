import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { OverlayLayer } from '../useImageEditor'
import { buildCSSFilter } from '../useImageEditor'
import { Trash2, Move, Maximize2, RotateCw } from 'lucide-react'

interface Props {
  layer: OverlayLayer
  isActive: boolean
  onSelect: () => void
  onUpdate: (ch: Partial<OverlayLayer>) => void
  onRemove: () => void
  containerRef: React.RefObject<HTMLDivElement>
}

export const OverlayEditor: React.FC<Props> = ({ layer, isActive, onSelect, onUpdate, onRemove, containerRef }) => {
  const [dragging, setDragging] = useState<'move' | 'resize' | 'rotate' | null>(null)
  const startRef = useRef({ x: 0, y: 0, lx: layer.x, ly: layer.y, lw: layer.width, lrot: layer.rotation })

  const startDrag = useCallback((mode: 'move' | 'resize' | 'rotate') => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    setDragging(mode)
    startRef.current = {
      x: e.clientX, y: e.clientY,
      lx: layer.x, ly: layer.y, lw: layer.width, lrot: layer.rotation
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [layer, onSelect])

  useEffect(() => {
    if (!dragging) return

    const getRect = () => containerRef.current?.getBoundingClientRect() ?? { width: 1, height: 1, left: 0, top: 0 }

    const onMove = (e: PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const rect = getRect()
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y

      if (dragging === 'move') {
        // Convert pixel delta to percentage
        const dxPct = (dx / rect.width) * 100
        const dyPct = (dy / rect.height) * 100
        onUpdate({ x: startRef.current.lx + dxPct, y: startRef.current.ly + dyPct })
      } 
      else if (dragging === 'resize') {
        // Simple resizing based on X movement
        const dxPct = (dx / rect.width) * 100
        const newWidth = Math.max(5, startRef.current.lw + dxPct * 2)
        onUpdate({ width: newWidth })
      }
      else if (dragging === 'rotate') {
        // Calculate angle based on center
        const cx = rect.left + (layer.x / 100) * rect.width
        const cy = rect.top + (layer.y / 100) * rect.height
        const startAngle = Math.atan2(startRef.current.y - cy, startRef.current.x - cx)
        const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx)
        let angleDiff = (currentAngle - startAngle) * (180 / Math.PI)
        onUpdate({ rotation: (startRef.current.lrot + angleDiff) % 360 })
      }
    }
    const onUp = (e: PointerEvent) => {
      e.preventDefault(); e.stopPropagation()
      setDragging(null)
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp, { passive: false })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, layer, onUpdate, containerRef])

  return (
    <div className="absolute overlay-editor"
      style={{
        left: `${layer.x}%`, top: `${layer.y}%`, width: `${layer.width}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
        opacity: layer.opacity / 100,
        mixBlendMode: layer.blendMode as any,
        zIndex: isActive ? 30 : 12,
        // When active, maintain aspect ratio using an img wrapper.
      }}>
      
      {/* The actual image */}
      <img src={layer.src} alt="layer" draggable={false}
        onPointerDown={e => {
          if (!isActive) { onSelect(); e.stopPropagation() }
          else { startDrag('move')(e) }
        }}
        style={{
          display: 'block', width: '100%', pointerEvents: 'auto',
          cursor: isActive ? (dragging === 'move' ? 'grabbing' : 'grab') : 'pointer',
          filter: buildCSSFilter(layer.adjustments, layer.activeFilter)
        }} />

      {/* Editor Controls Overlay */}
      {isActive && (
        <div className="absolute inset-0 border-2 border-cyan-400 pointer-events-none" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.5)' }}>
          {/* Delete Button */}
          <div className="absolute pointer-events-auto bg-red-500 rounded-full text-white shadow-lg flex items-center justify-center cursor-pointer"
            style={{ width: 24, height: 24, top: -12, left: -12 }}
            onClick={e => { e.stopPropagation(); onRemove(); }}>
            <Trash2 size={14} />
          </div>

          {/* Resize Handle */}
          <div className="absolute pointer-events-auto bg-cyan-400 rounded-full text-black shadow-lg flex items-center justify-center cursor-se-resize"
            style={{ width: 24, height: 24, bottom: -12, right: -12, touchAction: 'none' }}
            onPointerDown={startDrag('resize')}>
            <Maximize2 size={14} />
          </div>

          {/* Rotate Handle */}
          <div className="absolute pointer-events-auto bg-white rounded-full text-black shadow-lg flex items-center justify-center cursor-crosshair"
            style={{ width: 24, height: 24, top: -12, right: -12, touchAction: 'none' }}
            onPointerDown={startDrag('rotate')}>
            <RotateCw size={14} />
          </div>
        </div>
      )}
    </div>
  )
}
