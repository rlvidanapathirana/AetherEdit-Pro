import React from 'react'
import { PROFILES } from '../useImageEditor'

interface Props {
  activeProfile: string
  sourceImage: string
  onApply: (id: string) => void
}

const PROFILE_PREVIEWS: Record<string, string> = {
  'none':          'none',
  'adobe-color':   'saturate(110%) contrast(108%)',
  'adobe-land':    'saturate(114%) contrast(110%) brightness(97%)',
  'adobe-port':    'brightness(104%) saturate(108%) contrast(104%)',
  'adobe-vivid':   'saturate(118%) contrast(112%)',
  'adobe-neutral': 'contrast(92%) saturate(95%) brightness(105%)',
  'mono':          'grayscale(100%) contrast(112%)',
  'bw-high':       'grayscale(100%) contrast(128%) brightness(95%)',
  'cinematic':     'contrast(115%) saturate(88%) brightness(95%) sepia(15%)',
  'flat':          'contrast(80%) brightness(108%) saturate(92%)',
  'fuji':          'brightness(104%) contrast(106%) saturate(114%)',
}

const ProfileCard: React.FC<{
  profile: typeof PROFILES[0]
  sourceImage: string
  active: boolean
  onSelect: () => void
}> = ({ profile, sourceImage, active, onSelect }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = 80; canvas.height = 60
      const css = PROFILE_PREVIEWS[profile.id] ?? 'none'
      ;(ctx as any).filter = css === 'none' ? 'none' : css
      ctx.drawImage(img, 0, 0, 80, 60)
    }
    img.src = sourceImage
  }, [sourceImage, profile.id])

  return (
    <button onClick={onSelect}
      className="flex-shrink-0 flex flex-col items-center gap-1.5"
      style={{ width: 80 }}>
      <div style={{
        width: 80, height: 60, borderRadius: 12, overflow: 'hidden',
        border: active ? '2.5px solid #00F0FF' : '2.5px solid rgba(255,255,255,0.08)',
        boxShadow: active ? '0 0 16px rgba(0,240,255,0.35)' : 'none',
        position: 'relative',
      }}>
        <canvas ref={canvasRef} width={80} height={60}
          style={{ display: 'block', width: 80, height: 60 }} />
        {active && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,240,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: '#00F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, color: '#000', fontWeight: 900 }}>✓</span>
            </div>
          </div>
        )}
      </div>
      <span style={{
        fontSize: 9, fontWeight: active ? 700 : 400,
        color: active ? '#00F0FF' : 'rgba(255,255,255,0.6)',
        textAlign: 'center', maxWidth: 80, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {profile.label}
      </span>
    </button>
  )
}

const ProfilesPanel: React.FC<Props> = ({ activeProfile, sourceImage, onApply }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <div>
          <span className="text-sm font-bold" style={{ color: '#fff' }}>Profiles</span>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            Base look applied before adjustments
          </p>
        </div>
        {activeProfile !== 'none' && (
          <button onClick={() => onApply('none')}
            className="text-xs px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-3 px-4 pb-3 panel-scroll-x flex-shrink-0">
        {PROFILES.map(p => (
          <ProfileCard key={p.id} profile={p} sourceImage={sourceImage}
            active={activeProfile === p.id} onSelect={() => onApply(p.id)} />
        ))}
      </div>
    </div>
  )
}

export default ProfilesPanel
