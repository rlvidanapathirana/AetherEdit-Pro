import React, { useState } from 'react'
import type { OverlayLayer } from '../useImageEditor'
import { Layers, Trash2, Settings2, ImagePlus } from 'lucide-react'

interface Props {
  layers: OverlayLayer[]
  activeLayerId: string | null
  setActiveLayerId: (id: string | null) => void
  onUpdateLayer: (id: string, ch: Partial<OverlayLayer>) => void
  onRemoveLayer: (id: string) => void
  onAddLayerClick: () => void
}

const BLEND_MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'multiply', label: 'Multiply' },
  { id: 'screen', label: 'Screen' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'darken', label: 'Darken' },
  { id: 'lighten', label: 'Lighten' },
  { id: 'color-dodge', label: 'Color Dodge' },
  { id: 'color-burn', label: 'Color Burn' },
]

const LayersPanel: React.FC<Props> = ({ layers, activeLayerId, setActiveLayerId, onUpdateLayer, onRemoveLayer, onAddLayerClick }) => {
  const activeLayer = layers.find(l => l.id === activeLayerId)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#fff' }}>
          <Layers size={16} /> Layers & Overlays
        </span>
        <button onClick={onAddLayerClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: 'rgba(0,240,255,0.15)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.3)' }}>
          <ImagePlus size={14} /> Add Image
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Layer List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
          {layers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 pt-4">
              <Layers size={24} style={{ marginBottom: 8 }} />
              <p className="text-xs font-semibold text-white">No extra layers</p>
              <p className="text-[10px] mt-1 max-w-[200px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Add images on top to create double exposures, logos, or collages.
              </p>
            </div>
          ) : (
            layers.slice().reverse().map((l, i) => (
              <div key={l.id} 
                className="flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer"
                onClick={() => setActiveLayerId(l.id)}
                style={{ 
                  background: activeLayerId === l.id ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.05)', 
                  border: activeLayerId === l.id ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.08)' 
                }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/50 border border-white/10 flex-shrink-0">
                  <img src={l.src} alt="layer thumb" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-xs text-white truncate">Layer {layers.length - i}</p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{l.blendMode} • {l.opacity}%</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRemoveLayer(l.id); if (activeLayerId === l.id) setActiveLayerId(null); }}
                  className="w-8 h-8 flex items-center justify-center text-red-400 opacity-60 hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Active Layer Settings */}
        {activeLayer && (
          <div className="w-[140px] border-l border-white/10 bg-black/20 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-white/5 flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <Settings2 size={12} /> Options
            </div>
            <div className="p-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Opacity</span>
                  <span className="font-mono text-white" style={{ fontSize: 10 }}>{activeLayer.opacity}%</span>
                </div>
                <input type="range" min={0} max={100} value={activeLayer.opacity}
                  onChange={e => onUpdateLayer(activeLayer.id, { opacity: Number(e.target.value) })}
                  style={{ accentColor: '#00F0FF', width: '100%', height: 2 }} />
              </div>

              <div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Blend Mode</span>
                <div className="flex flex-col gap-1 mt-1">
                  {BLEND_MODES.map(m => (
                    <button key={m.id}
                      onClick={() => onUpdateLayer(activeLayer.id, { blendMode: m.id })}
                      className="text-left px-2 py-1.5 rounded-lg transition-all"
                      style={{ 
                        fontSize: 10,
                        background: activeLayer.blendMode === m.id ? 'rgba(0,240,255,0.15)' : 'transparent',
                        color: activeLayer.blendMode === m.id ? '#00F0FF' : 'rgba(255,255,255,0.5)',
                        fontWeight: activeLayer.blendMode === m.id ? 700 : 500,
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LayersPanel
