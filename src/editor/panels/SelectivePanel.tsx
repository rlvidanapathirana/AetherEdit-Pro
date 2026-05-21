import React, { useState } from 'react'
import { Circle, CircleDot, Minus, X } from 'lucide-react'

// Dummy implementation for UI
interface Props {
  onReset: () => void
}

const SelectivePanel: React.FC<Props> = ({ onReset }) => {
  const [mode, setMode] = useState<'brush' | 'radial' | 'linear'>('brush')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <div>
          <span className="text-sm font-bold" style={{ color: '#fff' }}>Selective Adjustments</span>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            Edit specific areas of the photo
          </p>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
          <X size={11} /> Clear
        </button>
      </div>

      <div className="flex gap-2 px-4 pb-4 flex-shrink-0">
        {[
          { id: 'brush',  icon: <Circle size={16} />, label: 'Brush' },
          { id: 'radial', icon: <CircleDot size={16} />, label: 'Radial' },
          { id: 'linear', icon: <Minus size={16} />, label: 'Linear' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id as any)}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all"
            style={{
              background: mode === m.id ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: mode === m.id ? '#00F0FF' : 'rgba(255,255,255,0.5)',
              border: mode === m.id ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.08)',
            }}>
            {m.icon}
            <span style={{ fontSize: 10, fontWeight: mode === m.id ? 700 : 500 }}>{m.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Select an area on the image to apply local adjustments. <br/><br/>
          <i>(Coming Soon in full Pro version)</i>
        </p>
      </div>
    </div>
  )
}

export default SelectivePanel
