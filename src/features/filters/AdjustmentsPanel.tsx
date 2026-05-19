import React from 'react'
import * as Slider from '@radix-ui/react-slider'
import { RotateCcw, Sun, Contrast, Droplets, Thermometer, Wind, Zap, Circle, Eye } from 'lucide-react'
import { useEditorStore } from '../../context/editorStore'
import type { AdjustmentSettings } from '../../context/editorStore'

interface AdjSliderProps {
  label: string
  icon?: React.ReactNode
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
  accentColor?: string
}

const AdjSlider: React.FC<AdjSliderProps> = ({
  label, icon, value, min = -100, max = 100, step = 1, onChange, accentColor = '#00F0FF'
}) => {
  const isZero = value === 0
  return (
    <div className="flex items-center gap-2 group">
      <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
        {icon && <span style={{ color: isZero ? 'rgba(255,255,255,0.25)' : accentColor, transition: 'color 0.2s' }}>{icon}</span>}
        <span className="text-xs truncate" style={{ color: isZero ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: isZero ? 400 : 500 }}>
          {label}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center flex-1 h-5"
        value={[value]}
        min={min} max={max} step={step}
        onValueChange={(v) => onChange(v[0])}
      >
        <Slider.Track className="relative flex-1 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <Slider.Range
            className="absolute h-full rounded-full"
            style={{
              background: value >= 0
                ? `linear-gradient(90deg, rgba(0,240,255,0.5), ${accentColor})`
                : `linear-gradient(90deg, ${accentColor}, rgba(239,68,68,0.5))`,
            }}
          />
        </Slider.Track>
        <Slider.Thumb
          className="block w-3 h-3 rounded-full bg-white cursor-pointer"
          style={{ border: `2px solid ${accentColor}`, boxShadow: `0 0 6px ${accentColor}66` }}
        />
      </Slider.Root>
      <span
        className="w-9 text-right text-xs font-mono flex-shrink-0"
        style={{ color: isZero ? 'rgba(255,255,255,0.25)' : accentColor, fontSize: 10 }}
      >
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  )
}

const SECTIONS: {
  title: string
  fields: { key: keyof AdjustmentSettings; label: string; icon: React.ReactNode; min?: number; max?: number; accent?: string }[]
}[] = [
  {
    title: 'Light',
    fields: [
      { key: 'exposure',    label: 'Exposure',    icon: <Zap size={11} />,      min: -5, max: 5, accent: '#fbbf24' },
      { key: 'brightness',  label: 'Brightness',  icon: <Sun size={11} />,      accent: '#fbbf24' },
      { key: 'contrast',    label: 'Contrast',    icon: <Contrast size={11} />, accent: '#e879f9' },
      { key: 'highlights',  label: 'Highlights',  icon: <Circle size={11} />,   accent: '#fde68a' },
      { key: 'shadows',     label: 'Shadows',     icon: <Circle size={11} />,   accent: '#7c3aed' },
      { key: 'whites',      label: 'Whites',      icon: <Eye size={11} />,      accent: '#e2e8f0' },
      { key: 'blacks',      label: 'Blacks',      icon: <Eye size={11} />,      accent: '#6366f1' },
    ],
  },
  {
    title: 'Color',
    fields: [
      { key: 'saturation',  label: 'Saturation',  icon: <Droplets size={11} />, accent: '#ec4899' },
      { key: 'vibrance',    label: 'Vibrance',    icon: <Droplets size={11} />, accent: '#f97316' },
      { key: 'hue',         label: 'Hue',         icon: <Droplets size={11} />, min: -180, max: 180, accent: '#a78bfa' },
      { key: 'temperature', label: 'Temperature', icon: <Thermometer size={11} />, accent: '#fb923c' },
      { key: 'tint',        label: 'Tint',        icon: <Wind size={11} />,     accent: '#34d399' },
    ],
  },
  {
    title: 'Detail',
    fields: [
      { key: 'clarity',        label: 'Clarity',      icon: <Eye size={11} />,      accent: '#67e8f9' },
      { key: 'sharpness',      label: 'Sharpness',    icon: <Zap size={11} />,      accent: '#00F0FF' },
      { key: 'noiseReduction', label: 'Noise Red.',   icon: <Wind size={11} />,     accent: '#94a3b8' },
    ],
  },
  {
    title: 'Effects',
    fields: [
      { key: 'vignette', label: 'Vignette', icon: <Circle size={11} />, accent: '#6366f1' },
    ],
  },
]

const AdjustmentsPanel: React.FC = () => {
  const { adjustments, setAdjustments, resetAdjustments } = useEditorStore()
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})

  const toggle = (title: string) => setCollapsed(prev => ({ ...prev, [title]: !prev[title] }))

  const hasChanges = Object.values(adjustments).some(v => v !== 0)

  return (
    <div className="px-3 py-3 space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="panel-label">ADJUSTMENTS</span>
        {hasChanges && (
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontSize: 10 }}
            onClick={resetAdjustments}
          >
            <RotateCcw size={9} /> Reset All
          </button>
        )}
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Section header */}
          <button
            className="w-full flex items-center justify-between px-3 py-2 transition-colors"
            style={{ background: 'rgba(255,255,255,0.02)', cursor: 'pointer', border: 'none' }}
            onClick={() => toggle(section.title)}
          >
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{section.title}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
              {collapsed[section.title] ? '▶' : '▼'}
            </span>
          </button>

          {!collapsed[section.title] && (
            <div className="px-3 py-2 space-y-3">
              {section.fields.map(field => (
                <AdjSlider
                  key={field.key}
                  label={field.label}
                  icon={field.icon}
                  value={adjustments[field.key]}
                  min={field.min}
                  max={field.max}
                  accentColor={field.accent}
                  onChange={(v) => setAdjustments({ [field.key]: v })}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default AdjustmentsPanel
