import React, { useRef, useEffect } from 'react'
import { FILTER_PRESETS } from '../useImageEditor'

// Extended filter set with artistic effects
const ARTISTIC_FILTERS = [
  { id: 'vhs',       label: 'VHS',       css: 'saturate(120%) contrast(120%) brightness(90%) hue-rotate(5deg)' },
  { id: 'glitch',    label: 'Glitch',    css: 'saturate(200%) contrast(130%) hue-rotate(180deg)' },
  { id: 'sketch',    label: 'Sketch',    css: 'grayscale(100%) contrast(200%) brightness(120%)' },
  { id: 'oilpaint',  label: 'Oil Paint', css: 'saturate(200%) contrast(110%) brightness(105%)' },
  { id: 'waterclr',  label: 'Waterclr',  css: 'saturate(80%) contrast(85%) brightness(115%) sepia(10%)' },
  { id: 'infrared',  label: 'Infrared',  css: 'hue-rotate(150deg) saturate(150%) contrast(110%)' },
  { id: 'xprocess',  label: 'X-Process', css: 'saturate(180%) contrast(130%) hue-rotate(-20deg) brightness(105%)' },
  { id: 'duotone',   label: 'Duotone',   css: 'grayscale(100%) sepia(80%) hue-rotate(200deg) saturate(300%)' },
  { id: 'retrowave', label: 'Retrowave', css: 'saturate(250%) contrast(120%) hue-rotate(270deg) brightness(90%)' },
  { id: 'bleach',    label: 'Bleach',    css: 'contrast(130%) brightness(115%) saturate(60%) sepia(10%)' },
]

const ALL_FILTERS = [...FILTER_PRESETS, ...ARTISTIC_FILTERS]

const CATEGORIES = [
  { id: 'all',      label: 'All'      },
  { id: 'original', label: 'Basic'    },
  { id: 'artistic', label: 'Artistic' },
  { id: 'bw',       label: 'B&W'      },
]

interface Props {
  sourceImage: string
  activeFilter: string
  onApply: (id: string) => void
}

const FiltersPanel: React.FC<Props> = ({ sourceImage, activeFilter, onApply }) => {
  const [category, setCategory] = React.useState('all')

  const filteredList = ALL_FILTERS.filter(f => {
    if (category === 'all') return true
    if (category === 'bw') return f.css.includes('grayscale')
    if (category === 'artistic') return ARTISTIC_FILTERS.some(af => af.id === f.id)
    if (category === 'original') return FILTER_PRESETS.some(pf => pf.id === f.id) && !f.css.includes('grayscale')
    return true
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Filters</span>
        {activeFilter !== 'none' && (
          <button onClick={() => onApply('none')}
            className="text-xs px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            Clear
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 pb-2 flex-shrink-0">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              background: category === c.id ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
              color: category === c.id ? '#00F0FF' : 'rgba(255,255,255,0.45)',
              border: category === c.id ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Filter scroll row */}
      <div className="panel-scroll-x flex gap-3 px-4 pb-3 flex-shrink-0">
        {filteredList.map(filter => (
          <FilterThumb key={filter.id} filter={filter} sourceImage={sourceImage}
            active={activeFilter === filter.id} onSelect={() => onApply(filter.id)} />
        ))}
      </div>
    </div>
  )
}

const FilterThumb: React.FC<{
  filter: { id: string; label: string; css: string }
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
      canvas.width = 72; canvas.height = 72
      ;(ctx as any).filter = filter.css === 'none' ? 'none' : filter.css
      ctx.drawImage(img, 0, 0, 72, 72)
    }
    img.src = sourceImage
  }, [sourceImage, filter.css])

  return (
    <button onClick={onSelect} className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className="rounded-2xl overflow-hidden transition-all relative"
        style={{
          width: 72, height: 72,
          border: active ? '2.5px solid #00F0FF' : '2.5px solid transparent',
          boxShadow: active ? '0 0 16px rgba(0,240,255,0.4)' : 'none',
        }}>
        <canvas ref={canvasRef} width={72} height={72} style={{ display: 'block', width: 72, height: 72 }} />
        {active && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,240,255,0.08)' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#00F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>✓</span>
            </div>
          </div>
        )}
      </div>
      <span className="text-center" style={{
        fontSize: 10, color: active ? '#00F0FF' : 'rgba(255,255,255,0.6)',
        fontWeight: active ? 700 : 400, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {filter.label}
      </span>
    </button>
  )
}

export default FiltersPanel
