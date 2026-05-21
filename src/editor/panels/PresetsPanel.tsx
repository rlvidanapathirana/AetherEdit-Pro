import React, { useState } from 'react'
import { BUILTIN_PRESETS, type CustomPreset } from '../useImageEditor'
import { Save, Trash2, CheckCircle2 } from 'lucide-react'

interface Props {
  customPresets: CustomPreset[]
  onApplyPreset: (p: CustomPreset) => void
  onSavePreset: (name: string, icon?: string) => void
  onDeletePreset: (id: string) => void
}

const PresetsPanel: React.FC<Props> = ({ customPresets, onApplyPreset, onSavePreset, onDeletePreset }) => {
  const [tab, setTab] = useState<'aether' | 'custom'>('aether')
  const [isSaving, setIsSaving] = useState(false)
  const [newName, setNewName] = useState('')

  const handleSave = () => {
    if (newName.trim()) {
      onSavePreset(newName.trim(), '✨')
      setNewName('')
      setIsSaving(false)
      setTab('custom')
    }
  }

  const presets = tab === 'aether' ? BUILTIN_PRESETS : customPresets

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>Presets</span>
        <button onClick={() => setIsSaving(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
          <Save size={12} /> Save Edits
        </button>
      </div>

      <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
        <button onClick={() => setTab('aether')}
          className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: tab === 'aether' ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
            color: tab === 'aether' ? '#00F0FF' : 'rgba(255,255,255,0.5)',
            border: tab === 'aether' ? '1px solid rgba(0,240,255,0.4)' : '1px solid transparent',
          }}>
          AetherEdit
        </button>
        <button onClick={() => setTab('custom')}
          className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: tab === 'custom' ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.05)',
            color: tab === 'custom' ? '#f472b6' : 'rgba(255,255,255,0.5)',
            border: tab === 'custom' ? '1px solid rgba(244,114,182,0.4)' : '1px solid transparent',
          }}>
          Yours ({customPresets.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 grid grid-cols-2 gap-2" style={{ scrollbarWidth: 'none', alignContent: 'start' }}>
        {presets.map(p => (
          <button key={p.id} onClick={() => onApplyPreset(p)}
            className="relative flex flex-col p-3 rounded-2xl text-left transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</span>
            <span className="font-bold text-xs" style={{ color: '#fff' }}>{p.name}</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {Object.keys(p.adjustments).length} edits
            </span>
            {!p.isBuiltIn && (
              <div
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-black/40 text-red-400 opacity-50 hover:opacity-100"
                onClick={e => { e.stopPropagation(); onDeletePreset(p.id) }}>
                <Trash2 size={12} />
              </div>
            )}
          </button>
        ))}

        {tab === 'custom' && presets.length === 0 && (
          <div className="col-span-2 py-8 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <p className="text-xs">No custom presets yet.</p>
            <p className="text-[10px] mt-1">Tap "Save Edits" to create one.</p>
          </div>
        )}
      </div>

      {isSaving && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-5" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="font-bold text-sm mb-3">Save as Preset</h3>
            <input autoFocus
              type="text" placeholder="Preset name (e.g. Vintage Matte)"
              value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full bg-black rounded-xl px-4 py-3 text-sm text-white mb-4"
              style={{ border: '1px solid rgba(255,255,255,0.2)', outline: 'none' }} />
            <div className="flex gap-2">
              <button onClick={() => setIsSaving(false)} className="flex-1 py-3 rounded-xl text-xs font-bold bg-white/10 text-white">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl text-xs font-bold text-black" style={{ background: '#00F0FF' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PresetsPanel
