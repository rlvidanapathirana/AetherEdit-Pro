import React, { useState } from 'react'
import type { LensBlurSettings } from '../useImageEditor'
import { CircleDot, MoveHorizontal, RotateCcw } from 'lucide-react'

interface Props {
  lensBlur: LensBlurSettings
  onUpdate: (ch: Partial<LensBlurSettings>) => void
}

const LensBlurPanel: React.FC<Props> = ({ lensBlur, onUpdate }) => {
  const [selectedKey, setSelectedKey] = useState<'amount' | 'feather' | 'size'>('amount')

  const sliders = [
    { key: 'amount' as const, label: 'Blur Amount', min: 0, max: 100, color: '#f87171' },
    { key: 'feather' as const, label: 'Feather', min: 0, max: 100, color: '#60a5fa' },
    { key: 'size' as const, label: 'Focal Size', min: 10, max: 100, color: '#34d399' },
  ]

  const activeSlider = sliders.find(s => s.key === selectedKey)!

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <div>
          <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#fff' }}>
            <span style={{ fontSize: 16 }}>✨</span> AI Lens Blur
          </span>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            Realistic DSLR bokeh & depth of field
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onUpdate({ enabled: !lensBlur.enabled })}
            className="text-xs px-3 py-1 rounded-full font-bold transition-all"
            style={{
              background: lensBlur.enabled ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.08)',
              color: lensBlur.enabled ? '#00F0FF' : 'rgba(255,255,255,0.6)',
              border: lensBlur.enabled ? '1px solid #00F0FF' : '1px solid transparent',
            }}>
            {lensBlur.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {lensBlur.enabled ? (
        <>
          {/* Modes */}
          <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
            <button onClick={() => onUpdate({ type: 'radial' })}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: lensBlur.type === 'radial' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                color: lensBlur.type === 'radial' ? '#fff' : 'rgba(255,255,255,0.4)',
                border: lensBlur.type === 'radial' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
              }}>
              <CircleDot size={14} /> Subject Focus
            </button>
            <button onClick={() => onUpdate({ type: 'tiltshift' })}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: lensBlur.type === 'tiltshift' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                color: lensBlur.type === 'tiltshift' ? '#fff' : 'rgba(255,255,255,0.4)',
                border: lensBlur.type === 'tiltshift' ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
              }}>
              <MoveHorizontal size={14} /> Tilt-Shift
            </button>
          </div>

          {/* Active slider */}
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-sm" style={{ color: '#fff' }}>{activeSlider.label}</span>
              <span className="font-mono font-bold text-base" style={{ color: activeSlider.color }}>
                {lensBlur[activeSlider.key]}
              </span>
            </div>
            <input type="range" min={activeSlider.min} max={activeSlider.max} step={1}
              value={lensBlur[activeSlider.key]}
              onChange={e => onUpdate({ [activeSlider.key]: Number(e.target.value) })}
              style={{ accentColor: activeSlider.color, width: '100%' }} />
          </div>

          {/* Slider tabs */}
          <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
            {sliders.map(s => (
              <button key={s.key} onClick={() => setSelectedKey(s.key)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selectedKey === s.key ? `rgba(255,255,255,0.1)` : 'rgba(255,255,255,0.03)',
                  color: selectedKey === s.key ? s.color : 'rgba(255,255,255,0.4)',
                  border: selectedKey === s.key ? `1px solid ${s.color}` : '1px solid transparent',
                }}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="px-4 text-[10px] text-center mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Drag on the image to position the focal point.
          </p>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-60">
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>✨</span>
          </div>
          <p className="text-sm font-semibold text-white mb-1">AI Bokeh Effect</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 200 }}>
            Simulate a shallow depth of field similar to professional DSLR cameras.
          </p>
        </div>
      )}
    </div>
  )
}

export default LensBlurPanel
