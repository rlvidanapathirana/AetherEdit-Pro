import React, { useState } from 'react'
import type { Adjustments } from '../useImageEditor'

interface Props {
  adjustments: Adjustments
  onChange: <K extends keyof Adjustments>(key: K, value: number) => void
  onReset: () => void
}

const SLIDERS: {
  key: keyof Adjustments
  label: string
  icon: string
  min: number
  max: number
  color: string
  step: number
}[] = [
  { key: 'brightness',  label: 'Brightness',   icon: '☀️', min: -100, max: 100, color: '#fbbf24', step: 1 },
  { key: 'contrast',    label: 'Contrast',     icon: '◑',  min: -100, max: 100, color: '#e2e8f0', step: 1 },
  { key: 'saturation',  label: 'Saturation',   icon: '🎨', min: -100, max: 100, color: '#f472b6', step: 1 },
  { key: 'hue',         label: 'Hue',          icon: '🌈', min: -180, max: 180, color: '#a78bfa', step: 1 },
  { key: 'temperature', label: 'Warmth',       icon: '🌡️', min: -100, max: 100, color: '#fb923c', step: 1 },
  { key: 'highlights',  label: 'Highlights',   icon: '✦',  min: -100, max: 100, color: '#fde68a', step: 1 },
  { key: 'shadows',     label: 'Shadows',      icon: '◼',  min: -100, max: 100, color: '#94a3b8', step: 1 },
  { key: 'fade',        label: 'Fade',         icon: '◌',  min: 0,    max: 100, color: '#cbd5e1', step: 1 },
  { key: 'vignette',    label: 'Vignette',     icon: '⬤',  min: -100, max: 100, color: '#6366f1', step: 1 },
  { key: 'grain',       label: 'Grain',        icon: '⋮⋮', min: 0,    max: 100, color: '#a1a1aa', step: 1 },
  { key: 'sharpness',   label: 'Sharpness',    icon: '◈',  min: 0,    max: 100, color: '#00F0FF', step: 1 },
]

const AdjustPanel: React.FC<Props> = ({ adjustments, onChange, onReset }) => {
  const [selected, setSelected] = useState<keyof Adjustments>('brightness')
  const hasChanges = Object.values(adjustments).some(v => v !== 0)
  const active = SLIDERS.find(s => s.key === selected)!

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Adjust</span>
        {hasChanges && (
          <button
            onClick={onReset}
            className="text-xs px-3 py-1 rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
          >
            Reset All
          </button>
        )}
      </div>

      {/* Active slider — big, prominent */}
      <div className="px-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>{active.icon}</span>
            <span className="font-semibold text-sm" style={{ color: '#fff' }}>{active.label}</span>
          </div>
          <span className="font-mono font-bold text-base" style={{ color: active.color }}>
            {adjustments[selected] > 0 ? `+${adjustments[selected]}` : adjustments[selected]}
          </span>
        </div>

        {/* Slider track */}
        <div className="relative">
          <input
            type="range"
            min={active.min}
            max={active.max}
            step={active.step}
            value={adjustments[selected]}
            onChange={e => onChange(selected, Number(e.target.value))}
            className="w-full"
            style={{ accentColor: active.color, height: 6 }}
          />
          {/* Center mark */}
          {active.min < 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `${((0 - active.min) / (active.max - active.min)) * 100}%`,
                width: 2,
                height: 12,
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                pointerEvents: 'none',
                transform: 'translateX(-50%) translateY(-50%)',
              }}
            />
          )}
        </div>

        {/* Min / Max labels */}
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{active.min}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{active.max}</span>
        </div>
      </div>

      {/* Tool chips — horizontal scroll */}
      <div
        className="flex gap-2 px-4 pb-3 overflow-x-auto flex-shrink-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {SLIDERS.map(s => {
          const isActive = selected === s.key
          const hasValue = adjustments[s.key] !== 0
          return (
            <button
              key={s.key}
              onClick={() => setSelected(s.key)}
              className="flex-shrink-0 flex flex-col items-center gap-1 pt-2 pb-2 px-3 rounded-2xl transition-all"
              style={{
                background: isActive
                  ? `rgba(${hexToRgb(s.color)},0.18)`
                  : hasValue ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                border: isActive
                  ? `2px solid ${s.color}`
                  : hasValue ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.06)',
                minWidth: 58,
              }}
            >
              <span style={{ fontSize: 17, lineHeight: 1 }}>{s.icon}</span>
              <span style={{ fontSize: 9, color: isActive ? s.color : 'rgba(255,255,255,0.55)', fontWeight: isActive ? 700 : 400, lineHeight: 1.2, textAlign: 'center' }}>
                {s.label}
              </span>
              {hasValue && (
                <span
                  className="font-mono leading-none"
                  style={{ fontSize: 8, color: s.color, opacity: 0.8 }}
                >
                  {adjustments[s.key] > 0 ? `+${adjustments[s.key]}` : adjustments[s.key]}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
  }
  return '255,255,255'
}

export default AdjustPanel
