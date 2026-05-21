import React from 'react'
import type { GeometryState } from '../useImageEditor'
import { RotateCcw } from 'lucide-react'

interface Props {
  geometry: GeometryState
  onUpdate: (ch: Partial<GeometryState>) => void
  onReset: () => void
}

const GEO_SLIDERS: {
  key: keyof GeometryState; label: string; icon: string; min: number; max: number; color: string
}[] = [
  { key: 'vertical',   label: 'Vertical',    icon: '↕️', min: -100, max: 100, color: '#a78bfa' },
  { key: 'horizontal', label: 'Horizontal',  icon: '↔️', min: -100, max: 100, color: '#818cf8' },
  { key: 'rotate',     label: 'Rotate',      icon: '🔄', min: -45,  max: 45,  color: '#6366f1' },
  { key: 'distortion', label: 'Distortion',  icon: '🌀', min: -100, max: 100, color: '#4f46e5' },
]

const UPRIGHT_MODES = [
  { id: 'auto',   label: 'Auto',   icon: '✦' },
  { id: 'level',  label: 'Level',  icon: '—' },
  { id: 'vert',   label: 'Vert.',  icon: '|' },
  { id: 'full',   label: 'Full',   icon: '⊞' },
]

const GeometryPanel: React.FC<Props> = ({ geometry, onUpdate, onReset }) => {
  const [selectedKey, setSelectedKey] = React.useState<keyof GeometryState>('vertical')
  const [uprightMode, setUprightMode] = React.useState<string | null>(null)
  const hasChanges = Object.values(geometry).some(v => v !== 0)

  const active = GEO_SLIDERS.find(s => s.key === selectedKey)!

  const applyUpright = (mode: string) => {
    setUprightMode(mode)
    if (mode === 'level') onUpdate({ rotate: 0, vertical: 0, horizontal: 0 })
    else if (mode === 'vert') onUpdate({ vertical: 0 })
    else if (mode === 'auto') onUpdate({ vertical: 0, horizontal: 0, rotate: 0, distortion: 0 })
    else onUpdate({ vertical: 0, horizontal: 0, rotate: 0, distortion: 0 })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Geometry</span>
        {hasChanges && (
          <button onClick={onReset}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
            <RotateCcw size={10} /> Reset
          </button>
        )}
      </div>

      {/* Upright modes */}
      <div className="flex gap-2 px-4 pb-2 flex-shrink-0">
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', alignSelf: 'center', marginRight: 2 }}>Upright:</span>
        {UPRIGHT_MODES.map(m => (
          <button key={m.id} onClick={() => applyUpright(m.id)}
            className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: uprightMode === m.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
              color: uprightMode === m.id ? '#a78bfa' : 'rgba(255,255,255,0.5)',
              border: uprightMode === m.id ? '1.5px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.08)',
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Active big slider */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 17 }}>{active.icon}</span>
            <span className="font-semibold text-sm" style={{ color: '#fff' }}>{active.label}</span>
          </div>
          <span className="font-mono font-bold text-base" style={{ color: active.color }}>
            {geometry[selectedKey] > 0 ? `+${geometry[selectedKey]}` : geometry[selectedKey]}
          </span>
        </div>
        <div className="relative">
          <input type="range" min={active.min} max={active.max} step={1}
            value={geometry[selectedKey]}
            onChange={e => onUpdate({ [active.key]: Number(e.target.value) })}
            style={{ accentColor: active.color, width: '100%' }} />
          {active.min < 0 && (
            <div className="absolute top-1/2" style={{
              left: `${((0 - active.min) / (active.max - active.min)) * 100}%`,
              width: 2, height: 12, background: 'rgba(255,255,255,0.2)',
              borderRadius: 2, transform: 'translateX(-50%) translateY(-50%)', pointerEvents: 'none',
            }} />
          )}
        </div>
      </div>

      {/* Slider chips */}
      <div className="flex gap-2 px-4 pb-3 panel-scroll-x flex-shrink-0">
        {GEO_SLIDERS.map(s => {
          const val = geometry[s.key]
          const isActive = selectedKey === s.key
          const hasVal = val !== 0
          return (
            <button key={s.key} onClick={() => setSelectedKey(s.key)}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all"
              style={{
                background: isActive ? `rgba(167,139,250,0.18)` : hasVal ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                border: isActive ? `2px solid ${s.color}` : hasVal ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.06)',
                minWidth: 64,
              }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span style={{ fontSize: 9, color: isActive ? s.color : 'rgba(255,255,255,0.55)', fontWeight: isActive ? 700 : 400 }}>{s.label}</span>
              {hasVal && <span className="font-mono" style={{ fontSize: 8, color: s.color }}>{val > 0 ? `+${val}` : val}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default GeometryPanel
