import React, { useState } from 'react'
import type { Adjustments, HslMixer } from '../useImageEditor'

type SubTab = 'light' | 'color' | 'detail' | 'effects'
type ColorMode = 'basic' | 'mixer'

interface Props {
  adjustments: Adjustments
  hslMixer: HslMixer
  onChange: (key: keyof Adjustments, value: number) => void
  onHslChange: (color: keyof HslMixer, ch: { hue?: number; sat?: number; lum?: number }) => void
  onReset: () => void
}

const HSL_COLORS: { key: keyof HslMixer; label: string; hue: number }[] = [
  { key: 'red',     label: 'Red',     hue: 0   },
  { key: 'orange',  label: 'Orange',  hue: 30  },
  { key: 'yellow',  label: 'Yellow',  hue: 55  },
  { key: 'green',   label: 'Green',   hue: 120 },
  { key: 'aqua',    label: 'Aqua',    hue: 180 },
  { key: 'blue',    label: 'Blue',    hue: 220 },
  { key: 'purple',  label: 'Purple',  hue: 275 },
  { key: 'magenta', label: 'Magenta', hue: 320 },
]

const LIGHT_SLIDERS = [
  { key: 'brightness' as keyof Adjustments,  label: 'Exposure',    icon: '☀️', min: -100, max: 100, color: '#fbbf24' },
  { key: 'contrast'   as keyof Adjustments,  label: 'Contrast',    icon: '◑',  min: -100, max: 100, color: '#e2e8f0' },
  { key: 'highlights' as keyof Adjustments,  label: 'Highlights',  icon: '✦',  min: -100, max: 100, color: '#fde68a' },
  { key: 'shadows'    as keyof Adjustments,  label: 'Shadows',     icon: '◼',  min: -100, max: 100, color: '#94a3b8' },
  { key: 'whites'     as keyof Adjustments,  label: 'Whites',      icon: '○',  min: -100, max: 100, color: '#f1f5f9' },
  { key: 'blacks'     as keyof Adjustments,  label: 'Blacks',      icon: '●',  min: -100, max: 100, color: '#64748b' },
]
const COLOR_SLIDERS = [
  { key: 'temperature' as keyof Adjustments, label: 'Warmth',      icon: '🌡️', min: -100, max: 100, color: '#fb923c' },
  { key: 'tint'        as keyof Adjustments, label: 'Tint',        icon: '🌿', min: -100, max: 100, color: '#4ade80' },
  { key: 'vibrance'    as keyof Adjustments, label: 'Vibrance',    icon: '⚡', min: -100, max: 100, color: '#e879f9' },
  { key: 'saturation'  as keyof Adjustments, label: 'Saturation',  icon: '🎨', min: -100, max: 100, color: '#f472b6' },
]
const DETAIL_SLIDERS = [
  { key: 'sharpness'     as keyof Adjustments, label: 'Sharpness',    icon: '◈',  min: 0,    max: 100, color: '#00F0FF' },
  { key: 'clarity'       as keyof Adjustments, label: 'Clarity',      icon: '💎', min: -100, max: 100, color: '#38bdf8' },
  { key: 'texture'       as keyof Adjustments, label: 'Texture',      icon: '⋮⋮', min: -100, max: 100, color: '#7dd3fc' },
  { key: 'noiseReduction'as keyof Adjustments, label: 'Noise Reduc.', icon: '〜', min: 0,    max: 100, color: '#93c5fd' },
]
const EFFECTS_SLIDERS = [
  { key: 'dehaze'   as keyof Adjustments, label: 'Dehaze',    icon: '🌫️', min: -100, max: 100, color: '#a78bfa' },
  { key: 'fade'     as keyof Adjustments, label: 'Fade',      icon: '◌',  min: 0,    max: 100, color: '#cbd5e1' },
  { key: 'vignette' as keyof Adjustments, label: 'Vignette',  icon: '⬤',  min: -100, max: 100, color: '#6366f1' },
  { key: 'grain'    as keyof Adjustments, label: 'Grain',     icon: '⋯',  min: 0,    max: 100, color: '#a1a1aa' },
]

const TABS: { id: SubTab; label: string; icon: string }[] = [
  { id: 'light',   label: 'Light',   icon: '☀️' },
  { id: 'color',   label: 'Color',   icon: '🎨' },
  { id: 'detail',  label: 'Detail',  icon: '🔍' },
  { id: 'effects', label: 'Effects', icon: '✨' },
]

function hexToRgb(hex: string): string {
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
  }
  return '255,255,255'
}

const AdjustPanel: React.FC<Props> = ({ adjustments, hslMixer, onChange, onHslChange, onReset }) => {
  const [subTab, setSubTab] = useState<SubTab>('light')
  const [colorMode, setColorMode] = useState<ColorMode>('basic')
  const [selectedColor, setSelectedColor] = useState<keyof HslMixer>('red')
  const [selectedHslProp, setSelectedHslProp] = useState<'hue' | 'sat' | 'lum'>('sat')

  const sliders = subTab === 'light' ? LIGHT_SLIDERS
    : subTab === 'color' ? COLOR_SLIDERS
    : subTab === 'detail' ? DETAIL_SLIDERS : EFFECTS_SLIDERS

  const [selectedKey, setSelectedKey] = useState<keyof Adjustments>('brightness')

  const activeSlider = sliders.find(s => s.key === selectedKey) ?? sliders[0]
  const currentKey = sliders.some(s => s.key === selectedKey) ? selectedKey : sliders[0].key

  const hasChanges = Object.values(adjustments).some(v => v !== 0) ||
    Object.values(hslMixer).some(ch => ch.hue !== 0 || ch.sat !== 0 || ch.lum !== 0)

  const hslColorInfo = HSL_COLORS.find(c => c.key === selectedColor)!
  const activeHsl = hslMixer[selectedColor]

  const hslPropSliders = [
    { prop: 'hue' as const,  label: 'Hue',        color: `hsl(${hslColorInfo.hue},80%,55%)`, min: -100, max: 100 },
    { prop: 'sat' as const,  label: 'Saturation',  color: `hsl(${hslColorInfo.hue},80%,55%)`, min: -100, max: 100 },
    { prop: 'lum' as const,  label: 'Luminance',   color: `hsl(${hslColorInfo.hue},80%,55%)`, min: -100, max: 100 },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 px-3 pt-2.5 pb-0 flex-shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setSubTab(t.id); setSelectedKey(
            t.id === 'light' ? 'brightness' : t.id === 'color' ? 'temperature' : t.id === 'detail' ? 'sharpness' : 'dehaze'
          )}}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: subTab === t.id ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: subTab === t.id ? '#00F0FF' : 'rgba(255,255,255,0.45)',
              border: subTab === t.id ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>
            <span style={{ fontSize: 12 }}>{t.icon}</span>
            <span style={{ fontSize: 10 }}>{t.label}</span>
          </button>
        ))}
        {hasChanges && (
          <button onClick={onReset}
            className="px-2 py-1.5 rounded-xl text-xs flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
            Reset
          </button>
        )}
      </div>

      {/* Color mode toggle inside Color tab */}
      {subTab === 'color' && (
        <div className="flex gap-1.5 px-3 pt-2 flex-shrink-0">
          <button onClick={() => setColorMode('basic')}
            className="flex-1 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: colorMode === 'basic' ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.05)',
              color: colorMode === 'basic' ? '#f472b6' : 'rgba(255,255,255,0.4)',
              border: colorMode === 'basic' ? '1px solid rgba(244,114,182,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>Color</button>
          <button onClick={() => setColorMode('mixer')}
            className="flex-1 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: colorMode === 'mixer' ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.05)',
              color: colorMode === 'mixer' ? '#f472b6' : 'rgba(255,255,255,0.4)',
              border: colorMode === 'mixer' ? '1px solid rgba(244,114,182,0.4)' : '1px solid rgba(255,255,255,0.06)',
            }}>Mixer (HSL)</button>
        </div>
      )}

      {/* HSL Mixer */}
      {subTab === 'color' && colorMode === 'mixer' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Color dots */}
          <div className="panel-scroll-x flex gap-2 px-3 pt-2 pb-1 flex-shrink-0">
            {HSL_COLORS.map(c => {
              const ch = hslMixer[c.key]
              const hasVal = ch.hue !== 0 || ch.sat !== 0 || ch.lum !== 0
              return (
                <button key={c.key} onClick={() => setSelectedColor(c.key)}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                  style={{ minWidth: 44 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: `hsl(${c.hue}, 80%, 55%)`,
                    border: selectedColor === c.key ? '2.5px solid #fff' : hasVal ? '2px solid rgba(255,255,255,0.4)' : '2px solid rgba(255,255,255,0.15)',
                    boxShadow: selectedColor === c.key ? `0 0 14px hsl(${c.hue},80%,55%)` : 'none',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}>
                    {hasVal && <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#00F0FF', border: '1px solid #000' }} />}
                  </div>
                  <span style={{ fontSize: 9, color: selectedColor === c.key ? '#fff' : 'rgba(255,255,255,0.4)' }}>{c.label}</span>
                </button>
              )
            })}
          </div>

          {/* HSL prop tabs */}
          <div className="flex gap-1.5 px-3 pt-1 flex-shrink-0">
            {hslPropSliders.map(p => (
              <button key={p.prop} onClick={() => setSelectedHslProp(p.prop)}
                className="flex-1 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selectedHslProp === p.prop ? `rgba(${hexToRgb(p.color)},0.15)` : 'rgba(255,255,255,0.05)',
                  color: selectedHslProp === p.prop ? p.color : 'rgba(255,255,255,0.4)',
                  border: selectedHslProp === p.prop ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.06)',
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Big HSL slider */}
          <div className="px-4 pt-3 pb-1 flex-shrink-0">
            {hslPropSliders.filter(p => p.prop === selectedHslProp).map(p => (
              <div key={p.prop}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: `hsl(${hslColorInfo.hue},80%,55%)` }} />
                    <span className="font-semibold text-sm" style={{ color: '#fff' }}>
                      {hslColorInfo.label} · {p.label}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-base" style={{ color: p.color }}>
                    {activeHsl[p.prop] > 0 ? `+${activeHsl[p.prop]}` : activeHsl[p.prop]}
                  </span>
                </div>
                <input type="range" min={-100} max={100} step={1}
                  value={activeHsl[p.prop]}
                  onChange={e => onHslChange(selectedColor, { [p.prop]: Number(e.target.value) })}
                  style={{ accentColor: p.color, width: '100%' }} />
              </div>
            ))}
          </div>

          {/* All 3 HSL sliders mini */}
          <div className="px-4 pb-2 space-y-1.5 flex-shrink-0">
            {hslPropSliders.filter(p => p.prop !== selectedHslProp).map(p => (
              <div key={p.prop} className="flex items-center gap-2">
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', width: 60 }}>{p.label}</span>
                <input type="range" min={-100} max={100} step={1}
                  value={activeHsl[p.prop]}
                  onChange={e => onHslChange(selectedColor, { [p.prop]: Number(e.target.value) })}
                  style={{ accentColor: p.color, flex: 1 }} />
                <span className="font-mono" style={{ fontSize: 9, color: p.color, width: 28, textAlign: 'right' }}>
                  {activeHsl[p.prop] > 0 ? `+${activeHsl[p.prop]}` : activeHsl[p.prop]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Active big slider */}
          <div className="px-4 pt-2 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 17 }}>{activeSlider.icon}</span>
                <span className="font-semibold text-sm" style={{ color: '#fff' }}>{activeSlider.label}</span>
              </div>
              <span className="font-mono font-bold text-base" style={{ color: activeSlider.color }}>
                {adjustments[currentKey] > 0 ? `+${adjustments[currentKey]}` : adjustments[currentKey]}
              </span>
            </div>
            <div className="relative">
              <input type="range"
                min={activeSlider.min} max={activeSlider.max} step={1}
                value={adjustments[currentKey]}
                onChange={e => onChange(currentKey, Number(e.target.value))}
                style={{ accentColor: activeSlider.color, width: '100%' }} />
              {activeSlider.min < 0 && (
                <div className="absolute top-1/2" style={{
                  left: `${((0 - activeSlider.min) / (activeSlider.max - activeSlider.min)) * 100}%`,
                  width: 2, height: 12, background: 'rgba(255,255,255,0.2)',
                  borderRadius: 2, transform: 'translateX(-50%) translateY(-50%)', pointerEvents: 'none',
                }} />
              )}
            </div>
          </div>

          {/* Tool chips */}
          <div className="panel-scroll-x flex gap-2 px-3 pb-2 flex-shrink-0">
            {sliders.map(s => {
              const isActive = currentKey === s.key
              const val = adjustments[s.key]
              const hasVal = val !== 0
              return (
                <button key={s.key}
                  onClick={() => setSelectedKey(s.key)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 pt-2 pb-2 px-3 rounded-2xl transition-all"
                  style={{
                    background: isActive ? `rgba(${hexToRgb(s.color)},0.18)` : hasVal ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                    border: isActive ? `2px solid ${s.color}` : hasVal ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.06)',
                    minWidth: 56,
                  }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{s.icon}</span>
                  <span style={{ fontSize: 9, color: isActive ? s.color : 'rgba(255,255,255,0.55)', fontWeight: isActive ? 700 : 400, textAlign: 'center' }}>
                    {s.label}
                  </span>
                  {hasVal && (
                    <span className="font-mono" style={{ fontSize: 8, color: s.color, opacity: 0.9 }}>
                      {val > 0 ? `+${val}` : val}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdjustPanel
