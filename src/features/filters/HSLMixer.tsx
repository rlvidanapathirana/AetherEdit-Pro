import React from 'react'
import * as Slider from '@radix-ui/react-slider'
import { RotateCcw } from 'lucide-react'
import { useEditorStore } from '../../context/editorStore'
import type { HSLSettings, HSLChannel } from '../../context/editorStore'

const HSL_CHANNELS: { key: keyof HSLSettings; label: string; color: string; bg: string }[] = [
  { key: 'red',     label: 'Reds',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { key: 'orange',  label: 'Oranges',  color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  { key: 'yellow',  label: 'Yellows',  color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  { key: 'green',   label: 'Greens',   color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  { key: 'cyan',    label: 'Cyans',    color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  { key: 'blue',    label: 'Blues',    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { key: 'purple',  label: 'Purples',  color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  { key: 'magenta', label: 'Magentas', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
]

interface ChannelSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  color: string
}

const ChannelSlider: React.FC<ChannelSliderProps> = ({ label, value, onChange, min = -100, max = 100, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs w-6 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{label}</span>
    <Slider.Root
      className="relative flex items-center flex-1 h-4"
      value={[value]}
      min={min} max={max} step={1}
      onValueChange={(v) => onChange(v[0])}
    >
      <Slider.Track style={{ background: `linear-gradient(90deg, rgba(0,0,0,0.3), ${color}40, ${color})` }}>
        <Slider.Range style={{ background: 'transparent' }} />
      </Slider.Track>
      <Slider.Thumb />
    </Slider.Root>
    <span className="text-xs font-mono w-7 text-right flex-shrink-0"
      style={{ color: value === 0 ? 'rgba(255,255,255,0.3)' : color, fontSize: 10 }}>
      {value > 0 ? `+${value}` : value}
    </span>
  </div>
)

const HSLMixer: React.FC = () => {
  const { hsl, setHSL, resetHSL } = useEditorStore()
  const [activeChannel, setActiveChannel] = React.useState<keyof HSLSettings>('red')
  const [activeProp, setActiveProp] = React.useState<'all' | keyof HSLChannel>('all')

  const active = HSL_CHANNELS.find(c => c.key === activeChannel)!

  return (
    <div className="px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="panel-label">HSL / COLOR MIX</span>
        <button className="btn-tool w-5 h-5" onClick={resetHSL}>
          <RotateCcw size={10} />
        </button>
      </div>

      {/* Color channel selector */}
      <div className="grid grid-cols-4 gap-1">
        {HSL_CHANNELS.map(ch => (
          <button
            key={ch.key}
            className="relative rounded py-1 px-1 transition-all"
            style={{
              background: activeChannel === ch.key ? ch.bg : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeChannel === ch.key ? ch.color : 'rgba(255,255,255,0.06)'}`,
              cursor: 'pointer',
            }}
            onClick={() => setActiveChannel(ch.key)}
          >
            <div className="w-full h-1.5 rounded-full mb-1" style={{ background: ch.color }} />
            <span className="text-xs" style={{ color: activeChannel === ch.key ? ch.color : 'rgba(255,255,255,0.4)', fontSize: 9 }}>
              {ch.label}
            </span>
          </button>
        ))}
      </div>

      {/* Property tabs */}
      <div className="flex gap-1 p-1 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {([
          { key: 'all', label: 'All' },
          { key: 'hue', label: 'Hue' },
          { key: 'saturation', label: 'Sat' },
          { key: 'luminance', label: 'Lum' },
        ] as const).map(p => (
          <button
            key={p.key}
            className={`tab-trigger flex-1 text-xs rounded py-1 ${activeProp === p.key ? 'active' : ''}`}
            style={{ fontSize: 10 }}
            onClick={() => setActiveProp(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="space-y-2">
        {(activeProp === 'all' || activeProp === 'hue') && (
          <ChannelSlider
            label="H"
            value={hsl[activeChannel].hue}
            onChange={(v) => setHSL(activeChannel, 'hue', v)}
            min={-180} max={180}
            color={active.color}
          />
        )}
        {(activeProp === 'all' || activeProp === 'saturation') && (
          <ChannelSlider
            label="S"
            value={hsl[activeChannel].saturation}
            onChange={(v) => setHSL(activeChannel, 'saturation', v)}
            color={active.color}
          />
        )}
        {(activeProp === 'all' || activeProp === 'luminance') && (
          <ChannelSlider
            label="L"
            value={hsl[activeChannel].luminance}
            onChange={(v) => setHSL(activeChannel, 'luminance', v)}
            color={active.color}
          />
        )}
      </div>

      {/* Summary dots */}
      <div className="flex gap-1 mt-2">
        {HSL_CHANNELS.map(ch => {
          const total = Math.abs(hsl[ch.key].hue) + Math.abs(hsl[ch.key].saturation) + Math.abs(hsl[ch.key].luminance)
          return (
            <div
              key={ch.key}
              title={ch.label}
              className="flex-1 h-1 rounded-full transition-all"
              style={{
                background: total > 0 ? ch.color : 'rgba(255,255,255,0.1)',
                opacity: total > 0 ? 0.7 + (total / 300) * 0.3 : 1,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default HSLMixer
