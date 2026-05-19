import React, { useState } from 'react'
import { Sparkles, Wand2, ShieldAlert, Cpu } from 'lucide-react'
import type { ProEffects, Adjustments } from '../useImageEditor'

interface Props {
  pro: ProEffects
  onUpdatePro: (ch: Partial<ProEffects>) => void
  onUpdateAdjustments: (ch: Partial<Adjustments>) => void
}

const PRO_PRESETS = [
  { id: 'none',    icon: '—', name: 'Original',   pro: { grain: 0, chromatic: 0, lightleak: 0 }, adj: {} },
  { id: 'k400',    icon: '🎞', name: 'Kodak 400',  pro: { grain: 22, chromatic: 2, lightleak: 5 }, adj: { brightness: 5, contrast: 12, saturation: 10, vignette: 28, temp: 14, fade: 6 } },
  { id: 'fuji',    icon: '🟢', name: 'Fuji 400H',  pro: { grain: 14, chromatic: 0, lightleak: 0 }, adj: { brightness: 4, contrast: 6, saturation: 14, vignette: 20, temp: -6, tint: -10, fade: 10 } },
  { id: 'portra',  icon: '🌸', name: 'Portra 400', pro: { grain: 12, chromatic: 0, lightleak: 0 }, adj: { brightness: 8, contrast: 4, saturation: 8, vignette: 15, temp: 10, fade: 8 } },
  { id: 'ektar',   icon: '🔴', name: 'Ektar 100',  pro: { grain: 10, chromatic: 0, lightleak: 0 }, adj: { brightness: 2, contrast: 18, saturation: 28, vignette: 22, temp: 8, fade: 4 } },
  { id: 'velvia',  icon: '🌈', name: 'Velvia 50',  pro: { grain: 8, chromatic: 0, lightleak: 0 }, adj: { brightness: 0, contrast: 22, saturation: 35, vignette: 18, temp: 5 } },
  { id: 'hp5',     icon: '⬛', name: 'Ilford HP5', pro: { grain: 30, chromatic: 0, lightleak: 0 }, adj: { saturation: -100, contrast: 18, vignette: 35, fade: 5, brightness: -3 } },
  { id: 'delta',   icon: '◼', name: 'Delta 400',  pro: { grain: 22, chromatic: 0, lightleak: 0 }, adj: { saturation: -100, contrast: 12, vignette: 25, fade: 12, brightness: 2 } },
  { id: 'torg',    icon: '🎬', name: 'Teal & Org', pro: { grain: 18, chromatic: 0, lightleak: 0 }, adj: { contrast: 15, saturation: -8, vignette: 30, fade: 10 } },
  { id: 'cin4k',   icon: '🎥', name: 'Cinema 4K',  pro: { grain: 20, chromatic: 3, lightleak: 0 }, adj: { contrast: 18, saturation: -12, vignette: 35, fade: 12, temp: -6 } },
  { id: 'hwood',   icon: '⭐', name: 'Hollywood',  pro: { grain: 15, chromatic: 0, lightleak: 0 }, adj: { brightness: 6, contrast: 14, saturation: 12, vignette: 25, temp: 10 } },
  { id: 'thrillr', icon: '🖤', name: 'Thriller',   pro: { grain: 28, chromatic: 4, lightleak: 0 }, adj: { brightness: -8, contrast: 25, saturation: -30, vignette: 55, fade: 8 } },
  { id: 'scifi',   icon: '🔵', name: 'Sci-Fi',     pro: { grain: 12, chromatic: 6, lightleak: 0 }, adj: { brightness: 2, contrast: 16, saturation: -5, vignette: 28, temp: -22 } },
  { id: 'west',    icon: '🤠', name: 'Western',    pro: { grain: 25, chromatic: 0, lightleak: 0 }, adj: { brightness: 4, contrast: 10, saturation: 5, vignette: 40, temp: 25, fade: 18 } },
  { id: 'golden',  icon: '🌅', name: 'Golden Hr',  pro: { grain: 12, chromatic: 0, lightleak: 15 }, adj: { brightness: 8, contrast: 8, saturation: 18, vignette: 22, temp: 32 } },
  { id: 'bluehr',  icon: '🌆', name: 'Blue Hour',  pro: { grain: 14, chromatic: 2, lightleak: 0 }, adj: { brightness: -5, contrast: 12, saturation: -15, vignette: 30, temp: -28 } },
  { id: 'stormy',  icon: '⛈', name: 'Stormy',     pro: { grain: 32, chromatic: 0, lightleak: 0 }, adj: { brightness: -10, contrast: 22, saturation: -20, vignette: 45, temp: -10, fade: 8 } },
  { id: 'dreamy',  icon: '☁', name: 'Dreamy',     pro: { grain: 8, chromatic: 0, lightleak: 0 }, adj: { brightness: 12, contrast: -10, saturation: -12, fade: 22, vignette: 20 } },
  { id: 'neon',    icon: '🌃', name: 'Neon Night', pro: { grain: 20, chromatic: 8, lightleak: 0 }, adj: { brightness: -8, contrast: 20, saturation: 22, vignette: 40, temp: -15 } },
  { id: 'polar',   icon: '📸', name: 'Polaroid',   pro: { grain: 10, chromatic: 0, lightleak: 10 }, adj: { brightness: 12, contrast: -10, saturation: -8, fade: 32, vignette: 42, temp: 10 } },
  { id: 'lomo',    icon: '🔴', name: 'Lomo LC-A',  pro: { grain: 35, chromatic: 7, lightleak: 30 }, adj: { brightness: -4, contrast: 20, saturation: 20, vignette: 55, fade: 8 } },
  { id: 'sev',     icon: '🕰', name: '70s Faded',  pro: { grain: 28, chromatic: 0, lightleak: 0 }, adj: { brightness: 5, contrast: -8, saturation: -18, vignette: 32, temp: 18, fade: 28 } },
  { id: 'xpro',    icon: '🔀', name: 'Cross Pro',  pro: { grain: 20, chromatic: 5, lightleak: 0 }, adj: { contrast: 22, saturation: 25, vignette: 35, temp: 15, fade: 5 } },
  { id: 'iph',     icon: '📱', name: 'iPhone',     pro: { grain: 5, chromatic: 0, lightleak: 0 }, adj: { brightness: 6, contrast: 8, saturation: 10, vignette: 8, temp: 4 } },
  { id: 'vsco',    icon: '🤍', name: 'VSCO A4',    pro: { grain: 8, chromatic: 0, lightleak: 0 }, adj: { brightness: 4, contrast: 2, saturation: -5, fade: 15, vignette: 12, temp: 6 } },
]

const ProPanel: React.FC<Props> = ({ pro, onUpdatePro, onUpdateAdjustments }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'ai'>('presets')
  const [bypassing, setBypassing] = useState(false)

  const handlePreset = (p: typeof PRO_PRESETS[0]) => {
    onUpdatePro({ preset: p.id, ...p.pro })
    if (Object.keys(p.adj).length > 0) {
      onUpdateAdjustments(p.adj)
    }
  }

  const runBypass = () => {
    setBypassing(true)
    setTimeout(() => {
      onUpdatePro({ aiBypass: true, grain: Math.max(pro.grain, 25), chromatic: Math.max(pro.chromatic, 3) })
      setBypassing(false)
    }, 800)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#ff2299' }}>
          <Sparkles size={16} /> Pro Features
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
        <button onClick={() => setActiveTab('presets')}
          className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'presets' ? 'rgba(255,34,153,0.15)' : 'rgba(255,255,255,0.06)',
            color: activeTab === 'presets' ? '#ff2299' : 'rgba(255,255,255,0.6)',
            border: activeTab === 'presets' ? '1.5px solid #ff2299' : '1.5px solid transparent'
          }}>
          Film Lab
        </button>
        <button onClick={() => setActiveTab('ai')}
          className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: activeTab === 'ai' ? 'rgba(26,255,122,0.15)' : 'rgba(255,255,255,0.06)',
            color: activeTab === 'ai' ? '#1aff7a' : 'rgba(255,255,255,0.6)',
            border: activeTab === 'ai' ? '1.5px solid #1aff7a' : '1.5px solid transparent'
          }}>
          AI Bypass
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'none' }}>
        {activeTab === 'presets' ? (
          <div>
            <p className="text-xs mb-3 italic" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Professional film emulations with realistic grain, halation, and light leaks.
            </p>
            <div className="grid grid-cols-3 gap-2 pb-4">
              {PRO_PRESETS.map(p => (
                <button key={p.id} onClick={() => handlePreset(p)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl transition-all"
                  style={{
                    background: pro.preset === p.id ? 'rgba(255,34,153,0.12)' : 'rgba(255,255,255,0.04)',
                    border: pro.preset === p.id ? '1.5px solid #ff2299' : '1.5px solid rgba(255,255,255,0.08)',
                  }}>
                  <span className="text-2xl mb-1">{p.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider" 
                    style={{ color: pro.preset === p.id ? '#ff2299' : 'rgba(255,255,255,0.6)' }}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Pro sliders */}
            {pro.preset !== 'none' && (
              <div className="mt-4 space-y-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Film Grain</span>
                    <span className="font-mono" style={{ fontSize: 10, color: '#ff2299' }}>{pro.grain}</span>
                  </div>
                  <input type="range" min={0} max={100} value={pro.grain}
                    onChange={e => onUpdatePro({ grain: Number(e.target.value) })}
                    style={{ accentColor: '#ff2299' }} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Light Leak</span>
                    <span className="font-mono" style={{ fontSize: 10, color: '#ff2299' }}>{pro.lightleak}</span>
                  </div>
                  <input type="range" min={0} max={100} value={pro.lightleak}
                    onChange={e => onUpdatePro({ lightleak: Number(e.target.value) })}
                    style={{ accentColor: '#ff2299' }} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Chromatic Aberration</span>
                    <span className="font-mono" style={{ fontSize: 10, color: '#ff2299' }}>{pro.chromatic}</span>
                  </div>
                  <input type="range" min={0} max={30} value={pro.chromatic}
                    onChange={e => onUpdatePro({ chromatic: Number(e.target.value) })}
                    style={{ accentColor: '#ff2299' }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex gap-3 p-3 rounded-xl mb-4" style={{ background: 'rgba(26,255,122,0.1)', border: '1px solid rgba(26,255,122,0.2)' }}>
              <ShieldAlert size={16} style={{ color: '#1aff7a', flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <strong style={{ color: '#1aff7a' }}>Research Tool:</strong> Applies pixel-level transformations (PRNU sensor noise injection, FFT smoothing, and edge perturbation) to remove AI-generated statistical artifacts and make photos appear authentically real to AI detectors.
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>📡</div>
                <div>
                  <p className="text-xs font-bold text-white">Sensor Noise Injection</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Breaks uniform AI noise floors.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>🌊</div>
                <div>
                  <p className="text-xs font-bold text-white">Frequency Smoothing</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Attenuates checkerboard patterns.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>📋</div>
                <div>
                  <p className="text-xs font-bold text-white">Metadata Stripping</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Removes generation signatures.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={pro.aiBypass ? () => onUpdatePro({ aiBypass: false }) : runBypass}
              disabled={bypassing}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{ 
                background: pro.aiBypass ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #1aff7a, #00d8bc)', 
                color: pro.aiBypass ? '#fff' : '#000',
                boxShadow: pro.aiBypass ? 'none' : '0 4px 20px rgba(26,255,122,0.3)',
                opacity: bypassing ? 0.5 : 1
              }}>
              <Cpu size={16} /> 
              {bypassing ? 'Injecting Noise...' : pro.aiBypass ? 'Disable Bypass Engine' : 'Run Bypass Engine'}
            </button>
            
            {pro.aiBypass && !bypassing && (
              <p className="text-center text-[10px] mt-3" style={{ color: '#1aff7a' }}>
                ✓ Bypass transformations active.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProPanel
