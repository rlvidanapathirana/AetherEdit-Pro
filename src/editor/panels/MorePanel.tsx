import React, { useState } from 'react'
import { Cpu, Wand2, Download, CheckCircle2, Maximize2, Info, RotateCcw } from 'lucide-react'

interface Props {
  onExport: (format: 'png' | 'jpeg' | 'webp', quality: number) => void
}

const MorePanel: React.FC<Props> = ({ onExport }) => {
  const [format, setFormat]   = useState<'png' | 'jpeg' | 'webp'>('jpeg')
  const [quality, setQuality] = useState(92)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDone, setAiDone]   = useState(false)
  const [aiProgress, setAiProgress] = useState(0)
  const [aiLabel, setAiLabel] = useState('')

  const runAI = async (label: string) => {
    if (aiLoading) return
    setAiLabel(label); setAiLoading(true); setAiDone(false); setAiProgress(0)
    const steps = ['Loading model…', 'Analysing image…', 'Running inference…', 'Compositing…']
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 60))
      setAiProgress(i)
    }
    setAiLoading(false); setAiDone(true)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#fff' }}>More Tools</span>
      </div>

      <div className="px-4 pb-4 space-y-3 flex-shrink-0">
        {/* AI Tools */}
        <div className="rounded-2xl p-3.5" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="text-xs font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: '#a5b4fc' }}>
            <Cpu size={13} /> AI Tools
            <span className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 9 }}>LOCAL</span>
          </p>

          {aiLoading ? (
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{aiLabel}</span>
                <span className="font-mono" style={{ fontSize: 10, color: '#a5b4fc' }}>{aiProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${aiProgress}%`, background: 'linear-gradient(90deg,#6366F1,#00F0FF)' }} />
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => runAI('Removing background…')}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Wand2 size={13} /> Remove BG
              </button>
              <button onClick={() => runAI('Running Magic Eraser…')}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Wand2 size={13} /> Magic Erase
              </button>
            </div>
          )}
          {aiDone && (
            <p className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: '#4ade80' }}>
              <CheckCircle2 size={12} /> {aiLabel.replace('…', '')} complete!
            </p>
          )}
        </div>

        {/* Export section */}
        <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-semibold mb-2.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <Download size={12} style={{ display: 'inline', marginRight: 5 }} />
            Export Image
          </p>

          {/* Format picker */}
          <div className="flex gap-1.5 mb-3">
            {(['jpeg','png','webp'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold uppercase transition-all"
                style={{
                  background: format === f ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)',
                  color: format === f ? '#00F0FF' : 'rgba(255,255,255,0.4)',
                  border: format === f ? '1.5px solid #00F0FF' : '1.5px solid rgba(255,255,255,0.08)',
                }}>
                {f}
              </button>
            ))}
          </div>

          {/* Quality */}
          {format !== 'png' && (
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Quality</span>
                <span className="font-mono" style={{ fontSize: 11, color: '#00F0FF' }}>{quality}%</span>
              </div>
              <input type="range" min={10} max={100} value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                style={{ accentColor: '#00F0FF', width: '100%' }} />
            </div>
          )}

          <button onClick={() => onExport(format, quality / 100)}
            className="w-full py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00F0FF, #6366F1)', color: '#000' }}>
            <Download size={15} /> Save {format.toUpperCase()}
          </button>
        </div>

        {/* Tips */}
        <div className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Info size={12} style={{ display: 'inline', marginRight: 5 }} />
            Tips
          </p>
          <ul className="space-y-1" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, lineHeight: 1.7 }}>
            <li>• <b style={{ color: 'rgba(255,255,255,0.5)' }}>Compare</b> — tap "Compare" in topbar for before/after</li>
            <li>• <b style={{ color: 'rgba(255,255,255,0.5)' }}>Draw</b> — use pen/brush/marker to draw on the image</li>
            <li>• <b style={{ color: 'rgba(255,255,255,0.5)' }}>Crop</b> — drag the blue handles to set crop area</li>
            <li>• <b style={{ color: 'rgba(255,255,255,0.5)' }}>Text/Stickers</b> — drag to reposition on image</li>
            <li>• <b style={{ color: 'rgba(255,255,255,0.5)' }}>Open</b> — drag & drop image from desktop</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MorePanel
