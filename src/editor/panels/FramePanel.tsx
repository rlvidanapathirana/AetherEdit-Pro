import React from 'react'
import type { FrameSettings } from '../useImageEditor'

interface Props {
  frame: FrameSettings
  onUpdate: (ch: Partial<FrameSettings>) => void
}

const FRAME_PRESETS: { id: string; label: string; color: string; size: number; cornerRadius: number }[] = [
  { id: 'none',       label: 'None',      color: '#ffffff', size: 0,   cornerRadius: 0 },
  { id: 'white-thin', label: 'White Thin',color: '#ffffff', size: 10,  cornerRadius: 0 },
  { id: 'white',      label: 'White',     color: '#ffffff', size: 30,  cornerRadius: 0 },
  { id: 'black',      label: 'Black',     color: '#000000', size: 30,  cornerRadius: 0 },
  { id: 'gold',       label: 'Gold',      color: '#d4af37', size: 20,  cornerRadius: 0 },
  { id: 'polaroid',   label: 'Polaroid',  color: '#f5f5f0', size: 16,  cornerRadius: 0 },
  { id: 'neon-cyan',  label: 'Neon Cyan', color: '#00F0FF', size: 12,  cornerRadius: 8 },
  { id: 'neon-violet',label: 'Neon Vlt',  color: '#6366F1', size: 12,  cornerRadius: 8 },
  { id: 'rounded',    label: 'Rounded',   color: '#ffffff', size: 20,  cornerRadius: 20 },
  { id: 'double',     label: 'Double',    color: '#c0c0c0', size: 25,  cornerRadius: 0 },
]

const COLORS = ['#ffffff','#000000','#d4af37','#c0c0c0','#00F0FF','#6366F1','#ef4444','#f97316','#22c55e','#3b82f6','#8b5cf6','#ec4899']

const FramePanel: React.FC<Props> = ({ frame, onUpdate }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Frame & Border</span>
      </div>

      {/* Preset frames */}
      <div className="flex gap-2 px-4 pb-3 panel-scroll-x flex-shrink-0">
        {FRAME_PRESETS.map(p => (
          <button key={p.id}
            onClick={() => onUpdate({ type: p.id, color: p.color, size: p.size, cornerRadius: p.cornerRadius })}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-all"
          >
            {/* Frame preview */}
            <div
              className="w-14 h-14 flex items-center justify-center rounded-lg transition-all"
              style={{
                background: '#1a1a1a',
                border: frame.type === p.id ? '2px solid #00F0FF' : '2px solid rgba(255,255,255,0.08)',
                boxShadow: frame.type === p.id ? '0 0 12px rgba(0,240,255,0.3)' : 'none',
              }}
            >
              <div style={{
                width: 40, height: 32,
                background: '#555',
                borderRadius: p.cornerRadius / 2,
                border: p.size > 0 ? `${Math.max(2, p.size / 3)}px solid ${p.color}` : 'none',
                outline: p.id === 'double' ? `2px solid ${p.color}` : 'none',
                outlineOffset: 2,
              }} />
            </div>
            <span style={{ fontSize: 9, color: frame.type === p.id ? '#00F0FF' : 'rgba(255,255,255,0.5)', fontWeight: frame.type === p.id ? 700 : 400 }}>
              {p.label}
            </span>
          </button>
        ))}
      </div>

      {/* Custom controls (if frame active) */}
      {frame.type !== 'none' && (
        <div className="px-4 pb-3 space-y-2 flex-shrink-0 animate-fade-in">
          {/* Border size */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 40 }}>Size</span>
            <input type="range" min={2} max={100} value={frame.size}
              onChange={e => onUpdate({ size: Number(e.target.value) })}
              style={{ accentColor: '#00F0FF', flex: 1 }} />
            <span className="font-mono" style={{ fontSize: 11, color: '#00F0FF', width: 28, textAlign: 'right' }}>{frame.size}px</span>
          </div>
          {/* Corner radius */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 40 }}>Round</span>
            <input type="range" min={0} max={50} value={frame.cornerRadius}
              onChange={e => onUpdate({ cornerRadius: Number(e.target.value) })}
              style={{ accentColor: '#6366F1', flex: 1 }} />
            <span className="font-mono" style={{ fontSize: 11, color: '#6366F1', width: 28, textAlign: 'right' }}>{frame.cornerRadius}%</span>
          </div>
          {/* Color palette */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 40 }}>Color</span>
            <div className="flex gap-1.5 panel-scroll-x flex-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => onUpdate({ color: c })}
                  className="flex-shrink-0 w-6 h-6 rounded-full transition-all"
                  style={{
                    background: c, flexShrink: 0,
                    border: frame.color === c ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                    transform: frame.color === c ? 'scale(1.25)' : 'scale(1)',
                  }} />
              ))}
              <input type="color" value={frame.color}
                onChange={e => onUpdate({ color: e.target.value })}
                className="flex-shrink-0 w-6 h-6 rounded-full cursor-pointer border-0"
                style={{ background: 'transparent', padding: 0 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FramePanel
