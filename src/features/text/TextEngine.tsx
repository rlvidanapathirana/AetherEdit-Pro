import React, { useState, useCallback } from 'react'
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Search, Upload } from 'lucide-react'
import * as Slider from '@radix-ui/react-slider'
import { useEditorStore } from '../../context/editorStore'
import { loadGoogleFont, installLocalFont, readFileAsArrayBuffer } from '../../utils/helpers'
import { saveFont, getAllFonts } from '../../db/database'

const GOOGLE_FONTS = [
  'Plus Jakarta Sans','Inter','Roboto','Open Sans','Lato','Montserrat',
  'Poppins','Raleway','Nunito','Oswald','Source Sans 3','PT Sans',
  'Playfair Display','Merriweather','Lora','Cormorant Garamond',
  'Bebas Neue','Pacifico','Dancing Script','Lobster','Righteous',
  'Permanent Marker','Special Elite','Courier Prime','JetBrains Mono',
]

const TEXT_EFFECTS = [
  { id: 'none',      label: 'None',        preview: '' },
  { id: 'shadow',    label: 'Drop Shadow', preview: '◼' },
  { id: 'glow',      label: 'Neon Glow',   preview: '✦' },
  { id: 'outline',   label: 'Outline',     preview: '◻' },
  { id: 'gradient',  label: 'Gradient',    preview: '⬤' },
  { id: 'emboss',    label: 'Emboss',      preview: '⬡' },
]

const WARP_TYPES = [
  { id: 'none',     label: 'None' },
  { id: 'arc',      label: 'Arc' },
  { id: 'arch',     label: 'Arch' },
  { id: 'bulge',    label: 'Bulge' },
  { id: 'wave',     label: 'Wave' },
  { id: 'flag',     label: 'Flag' },
  { id: 'fisheye',  label: 'Fish Eye' },
]

interface TextSettings {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: string
  fontStyle: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
  color: string
  effect: string
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  glowColor: string
  glowSize: number
  strokeColor: string
  strokeWidth: number
  warpType: string
  warpAmount: number
}

const DEFAULT_TEXT: TextSettings = {
  text: 'Double click to edit',
  fontFamily: 'Plus Jakarta Sans',
  fontSize: 48,
  fontWeight: '700',
  fontStyle: 'normal',
  textAlign: 'center',
  lineHeight: 1.4,
  letterSpacing: 0,
  color: '#ffffff',
  effect: 'none',
  shadowColor: '#000000',
  shadowBlur: 10,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  glowColor: '#00F0FF',
  glowSize: 20,
  strokeColor: '#000000',
  strokeWidth: 2,
  warpType: 'none',
  warpAmount: 0,
}

const TextEngine: React.FC = () => {
  const [settings, setSettings] = useState<TextSettings>(DEFAULT_TEXT)
  const [fontSearch, setFontSearch] = useState('')
  const [loadedFonts, setLoadedFonts] = useState<string[]>([...GOOGLE_FONTS])
  const [activeTab, setActiveTab] = useState<'font' | 'effects' | 'warp'>('font')
  const { foregroundColor } = useEditorStore()

  const update = (changes: Partial<TextSettings>) => setSettings(prev => ({ ...prev, ...changes }))

  const filteredFonts = loadedFonts.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()))

  const handleFontSelect = async (font: string) => {
    update({ fontFamily: font })
    await loadGoogleFont(font)
    applyToCanvas({ fontFamily: font })
  }

  const applyToCanvas = useCallback((changes: Partial<TextSettings> = {}) => {
    const merged = { ...settings, ...changes }
    const canvas = (window as Window & {
      __aetherCanvas?: { addText?: (t: string, opts: Record<string, unknown>) => void; getFabric?: () => { getActiveObject?: () => { set?: (k: string, v: unknown) => void; setCoords?: () => void } | null; renderAll?: () => void } | null }
    }).__aetherCanvas
    if (!canvas) return

    const fabricCanvas = canvas.getFabric?.()
    const activeObj = fabricCanvas?.getActiveObject?.()

    const shadowDef = merged.effect === 'shadow'
      ? `${merged.shadowOffsetX}px ${merged.shadowOffsetY}px ${merged.shadowBlur}px ${merged.shadowColor}`
      : merged.effect === 'glow'
        ? `0 0 ${merged.glowSize}px ${merged.glowColor}`
        : ''

    if (activeObj && activeObj.set) {
      activeObj.set('fontFamily', merged.fontFamily)
      activeObj.set('fontSize', merged.fontSize)
      activeObj.set('fontWeight', merged.fontWeight)
      activeObj.set('fontStyle', merged.fontStyle)
      activeObj.set('textAlign', merged.textAlign)
      activeObj.set('lineHeight', merged.lineHeight)
      activeObj.set('charSpacing', merged.letterSpacing * 10)
      activeObj.set('fill', merged.color)
      if (shadowDef) {
        activeObj.set('shadow', shadowDef)
      } else {
        activeObj.set('shadow', '')
      }
      if (merged.effect === 'outline' && merged.strokeWidth > 0) {
        activeObj.set('stroke', merged.strokeColor)
        activeObj.set('strokeWidth', merged.strokeWidth)
      } else {
        activeObj.set('stroke', '')
        activeObj.set('strokeWidth', 0)
      }
      activeObj.setCoords?.()
      fabricCanvas?.renderAll?.()
    } else {
      canvas.addText?.(merged.text, {
        fontFamily: merged.fontFamily,
        fontSize: merged.fontSize,
        fontWeight: merged.fontWeight,
        fontStyle: merged.fontStyle,
        textAlign: merged.textAlign,
        fill: merged.color,
      })
    }
  }, [settings])

  const handleLocalFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() as 'ttf' | 'otf' | 'woff' | 'woff2'
    const buf = await readFileAsArrayBuffer(file)
    const name = file.name.replace(/\.[^.]+$/, '')
    await installLocalFont(name, buf, ext)
    await saveFont({ name, family: name, data: new Blob([buf]), format: ext, createdAt: new Date() })
    setLoadedFonts(prev => [name, ...prev])
    update({ fontFamily: name })
  }

  return (
    <div className="px-3 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <Type size={13} style={{ color: '#00F0FF' }} />
        <span className="panel-label" style={{ color: 'rgba(255,255,255,0.6)' }}>TEXT ENGINE</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['font', 'effects', 'warp'] as const).map(t => (
          <button key={t} className={`tab-trigger flex-1 text-xs py-1 rounded capitalize ${activeTab === t ? 'active' : ''}`}
            style={{ fontSize: 10 }} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── FONT TAB ─────────────────────────────────────────── */}
      {activeTab === 'font' && (
        <div className="space-y-3">
          {/* Font search */}
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input
              className="aether-input pl-7"
              placeholder="Search fonts…"
              value={fontSearch}
              onChange={e => setFontSearch(e.target.value)}
              style={{ fontSize: 11 }}
            />
          </div>

          {/* Upload local font */}
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <Upload size={11} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Upload .ttf / .otf / .woff</span>
            <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleLocalFontUpload} />
          </label>

          {/* Font list */}
          <div className="panel-scroll space-y-0.5" style={{ maxHeight: 180 }}>
            {filteredFonts.map(font => (
              <button
                key={font}
                className="w-full text-left px-3 py-1.5 rounded-md text-xs transition-all"
                style={{
                  fontFamily: font,
                  background: settings.fontFamily === font ? 'rgba(0,240,255,0.08)' : 'transparent',
                  color: settings.fontFamily === font ? '#00F0FF' : 'rgba(255,255,255,0.6)',
                  border: settings.fontFamily === font ? '1px solid rgba(0,240,255,0.2)' : '1px solid transparent',
                }}
                onClick={() => handleFontSelect(font)}
              >
                {font}
              </button>
            ))}
          </div>

          {/* Font controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="panel-label block mb-1">SIZE</label>
              <input className="aether-input" type="number" value={settings.fontSize} min={6} max={800}
                onChange={e => { update({ fontSize: Number(e.target.value) }); applyToCanvas({ fontSize: Number(e.target.value) }) }}
                style={{ fontSize: 11 }} />
            </div>
            <div>
              <label className="panel-label block mb-1">WEIGHT</label>
              <select className="aether-select" value={settings.fontWeight}
                onChange={e => { update({ fontWeight: e.target.value }); applyToCanvas({ fontWeight: e.target.value }) }}
                style={{ fontSize: 11 }}>
                {['300','400','500','600','700','800'].map(w => (
                  <option key={w} value={w}>{['Light','Regular','Medium','SemiBold','Bold','ExtraBold'][Number(w)/100 - 3]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Style toggles */}
          <div className="flex gap-1.5">
            {[
              { icon: <Bold size={12} />, key: 'fontStyle' as const, value: 'bold', label: 'Bold' },
              { icon: <Italic size={12} />, key: 'fontStyle' as const, value: 'italic', label: 'Italic' },
            ].map(btn => (
              <button key={btn.value}
                className="btn-tool w-8 h-8 rounded-md"
                style={{ background: settings.fontStyle === btn.value ? 'rgba(0,240,255,0.1)' : 'transparent', color: settings.fontStyle === btn.value ? '#00F0FF' : 'rgba(255,255,255,0.5)' }}
                onClick={() => { const v = settings.fontStyle === btn.value ? 'normal' : btn.value; update({ fontStyle: v }); applyToCanvas({ fontStyle: v }) }}>
                {btn.icon}
              </button>
            ))}

            {/* Alignment */}
            {[
              { icon: <AlignLeft size={12} />, value: 'left' as const },
              { icon: <AlignCenter size={12} />, value: 'center' as const },
              { icon: <AlignRight size={12} />, value: 'right' as const },
            ].map(btn => (
              <button key={btn.value}
                className="btn-tool w-8 h-8 rounded-md"
                style={{ background: settings.textAlign === btn.value ? 'rgba(0,240,255,0.1)' : 'transparent', color: settings.textAlign === btn.value ? '#00F0FF' : 'rgba(255,255,255,0.5)' }}
                onClick={() => { update({ textAlign: btn.value }); applyToCanvas({ textAlign: btn.value }) }}>
                {btn.icon}
              </button>
            ))}
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <span className="panel-label w-10">COLOR</span>
            <input type="color" value={settings.color}
              onChange={e => { update({ color: e.target.value }); applyToCanvas({ color: e.target.value }) }}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              style={{ padding: 2 }} />
            <input className="aether-input flex-1" value={settings.color}
              onChange={e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { update({ color: e.target.value }); applyToCanvas({ color: e.target.value }) } }}
              style={{ fontSize: 11 }} />
          </div>

          {/* Letter spacing / line height */}
          {[
            { label: 'Letter Spacing', key: 'letterSpacing' as const, min: -20, max: 100 },
            { label: 'Line Height', key: 'lineHeight' as const, min: 0.8, max: 4, step: 0.1 },
          ].map(opt => (
            <div key={opt.key} className="flex items-center gap-2">
              <span className="panel-label w-20 flex-shrink-0" style={{ fontSize: 9 }}>{opt.label}</span>
              <Slider.Root className="relative flex items-center flex-1 h-4" value={[settings[opt.key]]}
                min={opt.min} max={opt.max} step={opt.step ?? 1}
                onValueChange={([v]) => { update({ [opt.key]: v }); applyToCanvas({ [opt.key]: v }) }}>
                <Slider.Track><Slider.Range /></Slider.Track><Slider.Thumb />
              </Slider.Root>
              <span className="text-xs font-mono w-8 text-right" style={{ color: '#00F0FF', fontSize: 10 }}>
                {typeof settings[opt.key] === 'number' && opt.step === 0.1 ? settings[opt.key].toFixed(1) : settings[opt.key]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── EFFECTS TAB ──────────────────────────────────────── */}
      {activeTab === 'effects' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {TEXT_EFFECTS.map(ef => (
              <button key={ef.id}
                className="py-2 px-1 rounded-lg text-center transition-all"
                style={{
                  background: settings.effect === ef.id ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${settings.effect === ef.id ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: settings.effect === ef.id ? '#00F0FF' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
                onClick={() => { update({ effect: ef.id }); applyToCanvas({ effect: ef.id }) }}>
                <div className="text-sm mb-1">{ef.preview || '—'}</div>
                <div style={{ fontSize: 9 }}>{ef.label}</div>
              </button>
            ))}
          </div>

          {/* Drop Shadow controls */}
          {settings.effect === 'shadow' && (
            <div className="space-y-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="panel-label">SHADOW SETTINGS</span>
              {[
                { label: 'Blur', key: 'shadowBlur' as const, max: 60 },
                { label: 'X Offset', key: 'shadowOffsetX' as const, min: -50, max: 50 },
                { label: 'Y Offset', key: 'shadowOffsetY' as const, min: -50, max: 50 },
              ].map(opt => (
                <div key={opt.key} className="flex items-center gap-2">
                  <span className="panel-label w-14" style={{ fontSize: 9 }}>{opt.label}</span>
                  <Slider.Root className="relative flex items-center flex-1 h-4"
                    value={[settings[opt.key]]} min={opt.min ?? 0} max={opt.max ?? 100} step={1}
                    onValueChange={([v]) => { update({ [opt.key]: v }); applyToCanvas({ [opt.key]: v }) }}>
                    <Slider.Track><Slider.Range /></Slider.Track><Slider.Thumb />
                  </Slider.Root>
                  <span className="text-xs font-mono w-6 text-right" style={{ color: '#00F0FF', fontSize: 10 }}>{settings[opt.key]}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="panel-label w-14" style={{ fontSize: 9 }}>Color</span>
                <input type="color" value={settings.shadowColor} onChange={e => { update({ shadowColor: e.target.value }); applyToCanvas({ shadowColor: e.target.value }) }}
                  className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent" style={{ padding: 2 }} />
              </div>
            </div>
          )}

          {/* Glow controls */}
          {settings.effect === 'glow' && (
            <div className="space-y-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="panel-label">GLOW SETTINGS</span>
              <div className="flex items-center gap-2">
                <span className="panel-label w-14" style={{ fontSize: 9 }}>Size</span>
                <Slider.Root className="relative flex items-center flex-1 h-4" value={[settings.glowSize]} min={0} max={80} step={1}
                  onValueChange={([v]) => { update({ glowSize: v }); applyToCanvas({ glowSize: v }) }}>
                  <Slider.Track><Slider.Range /></Slider.Track><Slider.Thumb />
                </Slider.Root>
                <span className="text-xs font-mono w-6 text-right" style={{ color: '#00F0FF', fontSize: 10 }}>{settings.glowSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="panel-label w-14" style={{ fontSize: 9 }}>Color</span>
                <input type="color" value={settings.glowColor} onChange={e => { update({ glowColor: e.target.value }); applyToCanvas({ glowColor: e.target.value }) }}
                  className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent" style={{ padding: 2 }} />
              </div>
            </div>
          )}

          {/* Outline controls */}
          {settings.effect === 'outline' && (
            <div className="space-y-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="panel-label">OUTLINE SETTINGS</span>
              <div className="flex items-center gap-2">
                <span className="panel-label w-14" style={{ fontSize: 9 }}>Width</span>
                <Slider.Root className="relative flex items-center flex-1 h-4" value={[settings.strokeWidth]} min={1} max={20} step={1}
                  onValueChange={([v]) => { update({ strokeWidth: v }); applyToCanvas({ strokeWidth: v }) }}>
                  <Slider.Track><Slider.Range /></Slider.Track><Slider.Thumb />
                </Slider.Root>
                <span className="text-xs font-mono w-6 text-right" style={{ color: '#00F0FF', fontSize: 10 }}>{settings.strokeWidth}px</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="panel-label w-14" style={{ fontSize: 9 }}>Color</span>
                <input type="color" value={settings.strokeColor} onChange={e => { update({ strokeColor: e.target.value }); applyToCanvas({ strokeColor: e.target.value }) }}
                  className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent" style={{ padding: 2 }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WARP TAB ─────────────────────────────────────────── */}
      {activeTab === 'warp' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {WARP_TYPES.map(w => (
              <button key={w.id}
                className="py-2 px-2 rounded-lg text-xs transition-all"
                style={{
                  background: settings.warpType === w.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${settings.warpType === w.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: settings.warpType === w.id ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
                onClick={() => update({ warpType: w.id })}>
                {w.label}
              </button>
            ))}
          </div>

          {settings.warpType !== 'none' && (
            <div className="flex items-center gap-2">
              <span className="panel-label w-14 flex-shrink-0">Amount</span>
              <Slider.Root className="relative flex items-center flex-1 h-4" value={[settings.warpAmount]} min={-100} max={100} step={1}
                onValueChange={([v]) => update({ warpAmount: v })}>
                <Slider.Track><Slider.Range /></Slider.Track><Slider.Thumb />
              </Slider.Root>
              <span className="text-xs font-mono w-9 text-right" style={{ color: '#6366F1', fontSize: 10 }}>
                {settings.warpAmount > 0 ? '+' : ''}{settings.warpAmount}
              </span>
            </div>
          )}

          <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="text-xs font-medium"
              style={{ fontFamily: settings.fontFamily, color: '#fff', fontSize: Math.min(settings.fontSize, 28), transform: settings.warpType === 'arc' ? `perspective(400px) rotateX(${settings.warpAmount * 0.3}deg)` : 'none', transition: 'transform 0.3s' }}>
              Ag
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>Preview · {settings.fontFamily}</p>
          </div>
        </div>
      )}

      {/* Add to canvas button */}
      <button className="btn-neon w-full py-2 rounded-lg text-xs font-semibold" onClick={() => applyToCanvas()}>
        Add / Apply Text to Canvas
      </button>
    </div>
  )
}

export default TextEngine
