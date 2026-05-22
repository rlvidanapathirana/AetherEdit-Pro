import React from 'react'
import { Plus, Trash2, Brush, Undo2, X, Settings2 } from 'lucide-react'
import type { SelectiveEdit, Adjustments } from '../useImageEditor'

interface Props {
  selectiveEdits: SelectiveEdit[]
  activeId: string | null
  setActiveId: (id: string | null) => void
  onAdd: () => string
  onUpdate: (ch: Partial<SelectiveEdit>) => void
  onRemove: (id: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  onUndo: () => void
  onClear: () => void
}

const SelectivePanel: React.FC<Props> = ({
  selectiveEdits, activeId, setActiveId, onAdd, onUpdate, onRemove,
  brushSize, onBrushSizeChange, onUndo, onClear
}) => {
  const activeEdit = selectiveEdits.find(s => s.id === activeId)

  const handleAdd = () => {
    const id = onAdd()
    setActiveId(id)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#fff' }}>
          <Brush size={16} /> Selective Masking
        </span>
        <button onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: 'rgba(0,240,255,0.15)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.3)' }}>
          <Plus size={14} /> Add Mask
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mask List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
          {selectiveEdits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 pt-4">
              <Brush size={24} style={{ marginBottom: 8 }} />
              <p className="text-xs font-semibold text-white">No selective masks</p>
              <p className="text-[10px] mt-1 max-w-[200px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Add a mask to paint over areas and apply local adjustments.
              </p>
            </div>
          ) : (
            selectiveEdits.slice().reverse().map((s, i) => (
              <div key={s.id} 
                className="flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer"
                onClick={() => setActiveId(s.id)}
                style={{ 
                  background: activeId === s.id ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.05)', 
                  border: activeId === s.id ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.08)' 
                }}>
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-white/10 flex-shrink-0" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                  <Brush size={14} style={{ color: '#ef4444' }} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-xs text-white truncate">Brush Mask {selectiveEdits.length - i}</p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{s.strokes.length} strokes</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
                  className="w-8 h-8 flex items-center justify-center text-red-400 opacity-60 hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Active Mask Settings */}
        {activeEdit && (
          <div className="w-[180px] border-l border-white/10 bg-black/20 flex flex-col flex-shrink-0">
            <div className="p-2 border-b border-white/5 flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span className="flex items-center gap-1.5"><Settings2 size={12} /> Options</span>
              <div className="flex gap-1">
                <button onClick={onUndo} disabled={activeEdit.strokes.length === 0}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white/5 disabled:opacity-30">
                  <Undo2 size={11} className="text-white" />
                </button>
                <button onClick={onClear} disabled={activeEdit.strokes.length === 0}
                  className="w-6 h-6 flex items-center justify-center rounded bg-red-500/20 disabled:opacity-30">
                  <X size={11} className="text-red-400" />
                </button>
              </div>
            </div>
            <div className="p-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Brush Size</span>
                  <span className="font-mono text-white" style={{ fontSize: 10 }}>{brushSize}px</span>
                </div>
                <input type="range" min={5} max={100} value={brushSize}
                  onChange={e => onBrushSizeChange(Number(e.target.value))}
                  style={{ accentColor: '#00F0FF', width: '100%', height: 2 }} />
              </div>

              <div className="space-y-4">
                {[
                  { key: 'brightness', label: 'Exposure', min: -50, max: 50 },
                  { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
                  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
                  { key: 'temperature', label: 'Temperature', min: -50, max: 50 },
                ].map(slider => (
                  <div key={slider.key}>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{slider.label}</span>
                      <span className="font-mono text-white" style={{ fontSize: 10 }}>
                        {activeEdit.adjustments[slider.key as keyof Adjustments] > 0 ? '+' : ''}
                        {activeEdit.adjustments[slider.key as keyof Adjustments]}
                      </span>
                    </div>
                    <input type="range" min={slider.min} max={slider.max} 
                      value={activeEdit.adjustments[slider.key as keyof Adjustments]}
                      onChange={e => onUpdate({ adjustments: { ...activeEdit.adjustments, [slider.key]: Number(e.target.value) } })}
                      style={{ accentColor: '#6366F1', width: '100%', height: 2 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectivePanel
