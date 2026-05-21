import React from 'react'
import type { StickerLayer } from '../useImageEditor'
import { Trash2 } from 'lucide-react'

interface Props {
  stickers: StickerLayer[]
  onAdd: (s: StickerLayer) => void
  onUpdate: (id: string, changes: Partial<StickerLayer>) => void
  onRemove: (id: string) => void
}

const STICKER_SETS: { label: string; items: string[] }[] = [
  { label: '😊 Emotions', items: ['😀','😂','😍','🥰','😎','🤩','😴','🥳','😭','🤔','🤫','🥺','😡','🤯','🤪'] },
  { label: '❤️ Love',     items: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','💝','💖','💗','💓','💘'] },
  { label: '⭐ Stars',    items: ['⭐','🌟','✨','💫','🌠','🌙','☀️','🌈','⚡','🔥','💥','🎆','🎇','✴️','🎯'] },
  { label: '🎉 Party',    items: ['🎉','🎊','🎈','🎁','🎂','🥂','🍾','🎀','🏆','🥇','🎵','🎶','🎸','🎤','🎭'] },
  { label: '🌺 Nature',   items: ['🌺','🌸','🌹','🌻','🌷','🌿','🍀','🍁','🌊','🏔️','🌴','🦋','🐝','🐬','🦁'] },
  { label: '👑 Shapes',   items: ['👑','💎','🔮','⚡','🌀','💠','🔷','🔶','🔹','🔸','▶️','⏺️','🔲','🔳','⬛'] },
]

const StickersPanel: React.FC<Props> = ({ stickers, onAdd, onUpdate, onRemove }) => {
  const [activeSet, setActiveSet] = React.useState(0)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const sel = stickers.find(s => s.id === selectedId)

  const handleAdd = (emoji: string) => {
    const sticker: StickerLayer = {
      id: `sticker-${Date.now()}`,
      emoji, x: 50, y: 50, size: 48, rotation: 0,
    }
    onAdd(sticker)
    setSelectedId(sticker.id)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Stickers</span>
        {sel && (
          <button onClick={() => { onRemove(sel.id); setSelectedId(null) }}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)' }}>
            <Trash2 size={12} style={{ color: '#f87171' }} />
          </button>
        )}
      </div>

      {/* Controls when sticker selected */}
      {sel && (
        <div className="px-4 pb-2 space-y-2 flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 40 }}>Size</span>
            <input type="range" min={16} max={200} value={sel.size}
              onChange={e => onUpdate(sel.id, { size: Number(e.target.value) })}
              style={{ accentColor: '#00F0FF', flex: 1 }} />
            <span className="font-mono" style={{ fontSize: 11, color: '#00F0FF', width: 28, textAlign: 'right' }}>{sel.size}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 40 }}>Rotate</span>
            <input type="range" min={0} max={360} value={sel.rotation}
              onChange={e => onUpdate(sel.id, { rotation: Number(e.target.value) })}
              style={{ accentColor: '#6366F1', flex: 1 }} />
            <span className="font-mono" style={{ fontSize: 11, color: '#6366F1', width: 28, textAlign: 'right' }}>{sel.rotation}°</span>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5 px-4 pb-2 panel-scroll-x flex-shrink-0">
        {STICKER_SETS.map((set, i) => (
          <button key={i} onClick={() => setActiveSet(i)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-all"
            style={{
              background: activeSet === i ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
              border: activeSet === i ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: activeSet === i ? '#00F0FF' : 'rgba(255,255,255,0.5)',
              fontSize: 11,
            }}>
            {set.label}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="flex flex-wrap gap-1 px-4 pb-3 overflow-y-auto flex-shrink-0" style={{ maxHeight: 80, scrollbarWidth: 'none' }}>
        {STICKER_SETS[activeSet].items.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleAdd(emoji)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.06)', fontSize: 20 }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Active stickers row */}
      {stickers.length > 0 && (
        <div className="flex gap-2 px-4 pb-2 panel-scroll-x flex-shrink-0">
          {stickers.map(s => (
            <button key={s.id} onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: selectedId === s.id ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.06)',
                border: selectedId === s.id ? '1.5px solid #00F0FF' : '1.5px solid transparent',
                fontSize: 22,
              }}>
              {s.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default StickersPanel
