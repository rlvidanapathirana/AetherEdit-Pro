import React, { useState, useEffect, useRef } from 'react'
import type { TextLayer } from '../useImageEditor'
import { Plus, Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight, UploadCloud } from 'lucide-react'

interface Props {
  texts: TextLayer[]
  onAdd: (layer: TextLayer) => void
  onUpdate: (id: string, changes: Partial<TextLayer>) => void
  onRemove: (id: string) => void
}

const DEFAULT_FONTS = [
  'Inter', 'Montserrat', 'Playfair Display', 'Bebas Neue', 'Dancing Script', 'Pacifico', 'Righteous', 'Lobster', 'Oswald',
  // Sinhala
  'Abhaya Libre', 'Noto Sans Sinhala', 'Gemunu Libre', 'Yrsa',
  // Tamil
  'Noto Sans Tamil', 'Mukta Malar', 'Hind Madurai', 'Kavivanar',
  // Creative
  'Creepster', 'Permanent Marker', 'Audiowide', 'Bangers'
]

const COLORS = ['#ffffff', '#000000', '#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#00F0FF', '#6366F1']

const TextPanel: React.FC<Props> = ({ texts, onAdd, onUpdate, onRemove }) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [customFonts, setCustomFonts] = useState<{name: string, url: string}[]>([])
  const fontFileRef = useRef<HTMLInputElement>(null)

  // Dynamically load Google Fonts
  useEffect(() => {
    const id = 'aether-google-fonts'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      const imports = DEFAULT_FONTS.map(f => `@import url('https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@400;700&display=swap');`).join('\n')
      style.innerHTML = imports
      document.head.appendChild(style)
    }
  }, [])

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '')
    try {
      const fontFace = new FontFace(fontName, `url(${url})`)
      const loadedFont = await fontFace.load()
      document.fonts.add(loadedFont)
      setCustomFonts(p => [...p, { name: fontName, url }])
      if (selected) onUpdate(selected, { fontFamily: fontName })
    } catch (err) {
      console.error('Font load error:', err)
    }
    e.target.value = ''
  }

  const handleAdd = () => {
    if (!newText.trim()) return
    const layer: TextLayer = {
      id: `text-${Date.now()}`,
      text: newText,
      x: 50, y: 50,
      color: '#ffffff',
      fontSize: 32,
      fontFamily: 'Inter',
      bold: false,
      italic: false,
      align: 'center',
      background: 'transparent',
      opacity: 100,
      rotation: 0,
    }
    onAdd(layer)
    setSelected(layer.id)
    setNewText('')
  }

  const sel = texts.find(t => t.id === selected)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Text</span>
      </div>

      {/* Add text input */}
      <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
        <input
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.12)', fontSize: 13 }}
          placeholder="Type text…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <button
          onClick={handleAdd}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00F0FF, #6366F1)' }}
        >
          <Plus size={18} style={{ color: '#000' }} />
        </button>
      </div>

      {/* Text list */}
      {texts.length > 0 && (
        <div className="flex gap-2 px-4 pb-2 panel-scroll-x flex-shrink-0">
          {texts.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id === selected ? null : t.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: selected === t.id ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: selected === t.id ? '1.5px solid #00F0FF' : '1.5px solid rgba(255,255,255,0.08)',
                color: selected === t.id ? '#00F0FF' : 'rgba(255,255,255,0.7)',
                maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {t.text}
            </button>
          ))}
        </div>
      )}

      {/* Selected text controls */}
      {sel && (
        <div className="px-4 pb-3 space-y-3 flex-shrink-0 animate-fade-in">
          {/* Edit text */}
          <input
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
            value={sel.text}
            onChange={e => onUpdate(sel.id, { text: e.target.value })}
          />

          {/* Style row */}
          <div className="flex items-center gap-2">
            {/* Bold */}
            <button onClick={() => onUpdate(sel.id, { bold: !sel.bold })}
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all"
              style={{ background: sel.bold ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)', color: sel.bold ? '#00F0FF' : 'rgba(255,255,255,0.6)', border: sel.bold ? '1.5px solid #00F0FF' : '1.5px solid transparent' }}>
              <Bold size={14} />
            </button>
            {/* Italic */}
            <button onClick={() => onUpdate(sel.id, { italic: !sel.italic })}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{ background: sel.italic ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)', color: sel.italic ? '#00F0FF' : 'rgba(255,255,255,0.6)', border: sel.italic ? '1.5px solid #00F0FF' : '1.5px solid transparent' }}>
              <Italic size={14} />
            </button>
            {/* Align */}
            {(['left','center','right'] as const).map(a => (
              <button key={a} onClick={() => onUpdate(sel.id, { align: a })}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ background: sel.align === a ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)', color: sel.align === a ? '#00F0FF' : 'rgba(255,255,255,0.6)', border: sel.align === a ? '1.5px solid #00F0FF' : '1.5px solid transparent' }}>
                {a === 'left' ? <AlignLeft size={14} /> : a === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
            {/* Delete */}
            <button onClick={() => { onRemove(sel.id); setSelected(null) }}
              className="w-9 h-9 rounded-lg flex items-center justify-center ml-auto"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1.5px solid rgba(239,68,68,0.2)' }}>
              <Trash2 size={14} />
            </button>
          </div>

          {/* Font size */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>Size</span>
            <input type="range" min={8} max={200} value={sel.fontSize}
              onChange={e => onUpdate(sel.id, { fontSize: Number(e.target.value) })}
              style={{ accentColor: '#00F0FF', flex: 1 }} />
            <span className="font-mono" style={{ color: '#00F0FF', fontSize: 11, width: 30, textAlign: 'right' }}>{sel.fontSize}</span>
          </div>

          {/* Font family */}
          <div className="flex gap-2 panel-scroll-x items-center">
            <button onClick={() => fontFileRef.current?.click()}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px dashed rgba(255,255,255,0.3)' }}>
              <UploadCloud size={12} /> Custom
            </button>
            <input type="file" accept=".ttf,.otf,.woff,.woff2" ref={fontFileRef} className="hidden" onChange={handleFontUpload} />
            
            {[...customFonts.map(f => f.name), ...DEFAULT_FONTS].map(f => (
              <button key={f} onClick={() => onUpdate(sel.id, { fontFamily: f })}
                className="flex-shrink-0 px-3 py-1 rounded-lg text-xs transition-all"
                style={{
                  fontFamily: f,
                  background: sel.fontFamily === f ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
                  border: sel.fontFamily === f ? '1.5px solid #00F0FF' : '1.5px solid transparent',
                  color: sel.fontFamily === f ? '#00F0FF' : 'rgba(255,255,255,0.6)',
                }}>
                {f.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>Color</span>
            <div className="flex gap-1.5 panel-scroll-x flex-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => onUpdate(sel.id, { color: c })}
                  className="w-7 h-7 rounded-full flex-shrink-0 transition-all"
                  style={{
                    background: c,
                    border: sel.color === c ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                    transform: sel.color === c ? 'scale(1.2)' : 'scale(1)',
                  }} />
              ))}
              <input type="color" value={sel.color}
                onChange={e => onUpdate(sel.id, { color: e.target.value })}
                className="w-7 h-7 rounded-full flex-shrink-0 cursor-pointer border-0"
                style={{ background: 'transparent', padding: 0 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TextPanel
