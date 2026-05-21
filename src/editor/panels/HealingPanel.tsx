import React from 'react'
import { Eraser, Crosshair, Sparkles, Undo2, Redo2, HelpCircle } from 'lucide-react'

interface HealingSettings {
  mode: 'spot' | 'clone'
  size: number
  isSettingCloneSource: boolean
  cloneSource: { x: number; y: number } | null
}

interface Props {
  settings: HealingSettings
  onSettingsChange: React.Dispatch<React.SetStateAction<HealingSettings>>
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

const HealingPanel: React.FC<Props> = ({
  settings,
  onSettingsChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  const { mode, size, isSettingCloneSource, cloneSource } = settings

  const toggleMode = (newMode: 'spot' | 'clone') => {
    onSettingsChange(prev => ({
      ...prev,
      mode: newMode,
      isSettingCloneSource: false
    }))
  }

  return (
    <div className="flex flex-col h-full select-none" style={{ color: '#fff' }}>
      {/* Panel Title & Undo/Redo */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <span className="text-xs font-bold tracking-wider text-white/40 uppercase flex items-center gap-1.5">
          <Sparkles size={12} className="text-cyan-400 animate-pulse" /> Offline Retouching
        </span>
        <div className="flex gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            title="Undo Healing Stroke"
          >
            <Undo2 size={13} className="text-white/80" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            title="Redo Healing Stroke"
          >
            <Redo2 size={13} className="text-white/80" />
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 px-4 py-2 flex-shrink-0">
        <button
          onClick={() => toggleMode('spot')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 justify-center"
          style={{
            background: mode === 'spot' ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
            border: mode === 'spot' ? '1.5px solid #00F0FF' : '1.5px solid rgba(255,255,255,0.06)',
            color: mode === 'spot' ? '#00F0FF' : 'rgba(255,255,255,0.5)',
            boxShadow: mode === 'spot' ? '0 0 15px rgba(0,240,255,0.15)' : 'none'
          }}
        >
          <Sparkles size={13} /> Auto Spot-Heal
        </button>
        <button
          onClick={() => toggleMode('clone')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 justify-center"
          style={{
            background: mode === 'clone' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
            border: mode === 'clone' ? '1.5px solid #6366F1' : '1.5px solid rgba(255,255,255,0.06)',
            color: mode === 'clone' ? '#6366F1' : 'rgba(255,255,255,0.5)',
            boxShadow: mode === 'clone' ? '0 0 15px rgba(99,102,241,0.15)' : 'none'
          }}
        >
          <Crosshair size={13} /> Clone Stamp
        </button>
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 px-4 overflow-y-auto pb-3 flex flex-col justify-between">
        {/* Brush Size Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Brush Size</span>
            <span className="font-mono text-xs font-bold" style={{ color: mode === 'spot' ? '#00F0FF' : '#6366F1' }}>
              {size}px
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={100}
              value={size}
              onChange={e => onSettingsChange(prev => ({ ...prev, size: Number(e.target.value) }))}
              style={{
                accentColor: mode === 'spot' ? '#00F0FF' : '#6366F1',
                flex: 1,
                cursor: 'pointer'
              }}
            />
            {/* Visual circle preview inside container */}
            <div
              className="flex-shrink-0 rounded-full border flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderColor: 'rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.03)'
              }}
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: Math.max(3, size * 0.32),
                  height: Math.max(3, size * 0.32),
                  background: mode === 'spot' ? '#00F0FF' : '#6366F1',
                  opacity: 0.7
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Panel / Helpful guides */}
        <div className="mt-3 flex-1 flex flex-col justify-center">
          {mode === 'spot' ? (
            <div className="text-center space-y-2 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                <span className="font-bold text-[#00F0FF]">Smart Patching:</span> Just paint over the blemish, scratch, or object. The editor automatically searches for clean textures nearby and blends them seamlessly.
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Runs completely client-side. No data leaves your device.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onSettingsChange(prev => ({
                      ...prev,
                      isSettingCloneSource: !prev.isSettingCloneSource
                    }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all select-none ${
                    isSettingCloneSource
                      ? 'bg-cyan-500 text-black shadow-lg scale-95 border border-cyan-400'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Crosshair size={13} className={isSettingCloneSource ? 'animate-spin' : ''} />
                  {isSettingCloneSource ? 'TAPPING ON IMAGE...' : 'SET STAMP SOURCE'}
                </button>
                {cloneSource && (
                  <div className="text-[10px] bg-[#6366F1]/10 text-[#a5b4fc] px-2.5 py-1.5 rounded-xl font-bold border border-[#6366F1]/20">
                    Source Set
                  </div>
                )}
              </div>
              <div className="text-center p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                  {cloneSource ? (
                    <span>
                      Excellent! Source set at <span className="font-mono text-cyan-400">{Math.round(cloneSource.x)}%, {Math.round(cloneSource.y)}%</span>. Now <b>paint over</b> the destination area to stamp pixels.
                    </span>
                  ) : (
                    <span>
                      First, click <b>Set Stamp Source</b> and tap a clean area of your photo. Then paint to stamp those pixels elsewhere.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HealingPanel
