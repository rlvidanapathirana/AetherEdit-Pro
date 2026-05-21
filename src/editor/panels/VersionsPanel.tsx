import React from 'react'
import type { EditVersion } from '../useImageEditor'
import { History, Plus, Trash2, Clock } from 'lucide-react'

interface Props {
  versions: EditVersion[]
  onSaveVersion: (name: string) => void
  onRestoreVersion: (v: EditVersion) => void
  onDeleteVersion: (id: string) => void
}

const VersionsPanel: React.FC<Props> = ({ versions, onSaveVersion, onRestoreVersion, onDeleteVersion }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-3 flex-shrink-0">
        <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#fff' }}>
          <History size={16} /> Versions
        </span>
        <button onClick={() => onSaveVersion(`Version ${versions.length + 1}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: 'rgba(0,240,255,0.15)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.3)' }}>
          <Plus size={14} /> Snapshot
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50 pt-4">
            <History size={24} style={{ marginBottom: 8 }} />
            <p className="text-xs font-semibold text-white">No snapshots saved</p>
            <p className="text-[10px] mt-1 max-w-[200px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Save snapshots of your edits to easily compare different looks.
            </p>
          </div>
        ) : (
          versions.slice().reverse().map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex-1 cursor-pointer" onClick={() => onRestoreVersion(v)}>
                <p className="font-bold text-sm text-white mb-0.5">{v.label}</p>
                <div className="flex items-center gap-1.5" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  <Clock size={10} /> {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="px-1.5 py-0.5 rounded ml-1" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                    {Object.keys(v.adjustments).length} edits
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onRestoreVersion(v)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  Restore
                </button>
                <button onClick={() => onDeleteVersion(v.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 bg-red-400/10">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default VersionsPanel
