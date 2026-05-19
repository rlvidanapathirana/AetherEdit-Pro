import React, { useRef, useEffect } from 'react'
import { FILTER_PRESETS } from '../useImageEditor'

interface Props {
  sourceImage: string
  activeFilter: string
  onApply: (id: string) => void
}

const FiltersPanel: React.FC<Props> = ({ sourceImage, activeFilter, onApply }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Filters</span>
        {activeFilter !== 'none' && (
          <button
            onClick={() => onApply('none')}
            className="text-xs px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter scroll row */}
      <div
        className="flex gap-3 px-4 pb-3 overflow-x-auto flex-shrink-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {FILTER_PRESETS.map(filter => (
          <FilterThumb
            key={filter.id}
            filter={filter}
            sourceImage={sourceImage}
            active={activeFilter === filter.id}
            onSelect={() => onApply(filter.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Filter Thumbnail ──────────────────────────────────────────────────────────
const FilterThumb: React.FC<{
  filter: typeof FILTER_PRESETS[0]
  sourceImage: string
  active: boolean
  onSelect: () => void
}> = ({ filter, sourceImage, active, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = 72
      canvas.height = 72
      ;(ctx as any).filter = filter.css === 'none' ? 'none' : filter.css
      ctx.drawImage(img, 0, 0, 72, 72)
    }
    img.src = sourceImage
  }, [sourceImage, filter.css])

  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
    >
      <div
        className="rounded-2xl overflow-hidden transition-all"
        style={{
          width: 72, height: 72,
          border: active ? '2.5px solid #00F0FF' : '2.5px solid transparent',
          boxShadow: active ? '0 0 16px rgba(0,240,255,0.4)' : 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          width={72} height={72}
          style={{ display: 'block', width: 72, height: 72 }}
        />
      </div>
      <span
        className="text-center"
        style={{ fontSize: 10, color: active ? '#00F0FF' : 'rgba(255,255,255,0.6)', fontWeight: active ? 700 : 400 }}
      >
        {filter.label}
      </span>
    </button>
  )
}

export default FiltersPanel
