import React, { useState, useCallback } from 'react'
import { Scissors, Sparkles, Loader2, CheckCircle, AlertCircle, ImageOff } from 'lucide-react'

interface Props {
  isProcessing: boolean
  onCutout: () => void
}

type Status = 'idle' | 'loading' | 'done' | 'error'

const CutoutPanel: React.FC<Props> = ({ isProcessing, onCutout }) => {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)

  const handleCutout = useCallback(async () => {
    setStatus('loading')
    setProgress(0)

    // Animate progress bar to 90% while waiting (real progress from lib isn't always exposed)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 88) { clearInterval(interval); return p }
        return p + (p < 40 ? 4 : p < 70 ? 2 : 0.5)
      })
    }, 300)

    try {
      await onCutout()
      clearInterval(interval)
      setProgress(100)
      setStatus('done')
    } catch {
      clearInterval(interval)
      setProgress(0)
      setStatus('error')
    }
  }, [onCutout])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-shrink-0">
        <Scissors size={16} style={{ color: '#00F0FF' }} />
        <span className="text-sm font-bold text-white">Background Removal</span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{ background: 'rgba(0,240,255,0.15)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.2)' }}>
          AI · Offline
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4 gap-4">
        {/* Status Card */}
        <div className="w-full rounded-2xl p-4 flex flex-col items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Icon state */}
          {status === 'idle' && (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)' }}>
              <ImageOff size={22} style={{ color: '#00F0FF' }} />
            </div>
          )}
          {status === 'loading' && (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Loader2 size={22} className="animate-spin" style={{ color: '#6366F1' }} />
            </div>
          )}
          {status === 'done' && (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle size={22} style={{ color: '#22c55e' }} />
            </div>
          )}
          {status === 'error' && (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={22} style={{ color: '#ef4444' }} />
            </div>
          )}

          {/* Status text */}
          <div className="text-center">
            {status === 'idle' && (
              <>
                <p className="text-xs font-bold text-white">Remove Background</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  AI model runs in your browser — 100% private & free
                </p>
              </>
            )}
            {status === 'loading' && (
              <>
                <p className="text-xs font-bold text-white">Analyzing image…</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {progress < 10 ? 'Loading AI model…' : progress < 50 ? 'Detecting subject…' : progress < 85 ? 'Removing background…' : 'Finalizing…'}
                </p>
              </>
            )}
            {status === 'done' && (
              <>
                <p className="text-xs font-bold" style={{ color: '#22c55e' }}>Background Removed!</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Save as PNG to keep transparency
                </p>
              </>
            )}
            {status === 'error' && (
              <>
                <p className="text-xs font-bold" style={{ color: '#ef4444' }}>Processing failed</p>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Check your internet connection for the first-time model download
                </p>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {status === 'loading' && (
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00F0FF, #6366F1)' }} />
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={status === 'loading' ? undefined : handleCutout}
          disabled={status === 'loading'}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
          style={{
            background: status === 'loading' ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #00F0FF, #6366F1)',
            color: status === 'loading' ? '#555' : '#000',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          }}>
          {status === 'loading'
            ? <><Loader2 size={16} className="animate-spin" /> Processing… {Math.round(progress)}%</>
            : status === 'done'
            ? <><Sparkles size={16} /> Remove Again</>
            : <><Sparkles size={16} /> Remove Background</>
          }
        </button>

        <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
          ⚠️ First run requires a one-time ~40MB model download
        </p>
      </div>
    </div>
  )
}

export default CutoutPanel
