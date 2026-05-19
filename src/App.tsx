import React, { useState, useRef, useCallback } from 'react'
import {
  SlidersHorizontal, Film, Crop, Type, PenTool,
  Smile, Frame as FrameIcon, Download, ZoomIn, ZoomOut, X,
  Upload, MoreHorizontal, Sun, Crown
} from 'lucide-react'
import { useImageEditor } from './editor/useImageEditor'
import AdjustPanel from './editor/panels/AdjustPanel'
import FiltersPanel from './editor/panels/FiltersPanel'
import CropPanel, { CropOverlay } from './editor/panels/CropPanel'
import TextPanel from './editor/panels/TextPanel'
import { DrawPanel, useDrawCanvas } from './editor/panels/DrawPanel'
import type { DrawSettings } from './editor/panels/DrawPanel'
import StickersPanel from './editor/panels/StickersPanel'
import FramePanel from './editor/panels/FramePanel'
import ProPanel from './editor/panels/ProPanel'
import MorePanel from './editor/panels/MorePanel'

type ToolId = 'adjust' | 'filters' | 'crop' | 'text' | 'draw' | 'stickers' | 'frame' | 'pro' | 'more'

const TOOLS: { id: ToolId; icon: React.ReactNode; label: string }[] = [
  { id: 'adjust',   icon: <SlidersHorizontal size={19} />, label: 'Adjust'   },
  { id: 'filters',  icon: <Film size={19} />,              label: 'Filters'  },
  { id: 'crop',     icon: <Crop size={19} />,              label: 'Crop'     },
  { id: 'draw',     icon: <PenTool size={19} />,           label: 'Draw'     },
  { id: 'text',     icon: <Type size={19} />,              label: 'Text'     },
  { id: 'stickers', icon: <Smile size={19} />,             label: 'Stickers' },
  { id: 'frame',    icon: <FrameIcon size={19} />,         label: 'Frame'    },
  { id: 'pro',      icon: <Crown size={19} color="#ff2299"/>, label: 'Pro'   },
  { id: 'more',     icon: <MoreHorizontal size={19} />,    label: 'More'     },
]

// Draggable layer mixin
function useDraggable(
  id: string,
  containerRef: React.RefObject<HTMLDivElement>,
  onUpdate: (id: string, x: number, y: number) => void
) {
  return (e: React.PointerEvent) => {
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const startX = e.clientX, startY = e.clientY
    const origLeft = parseFloat(el.style.left), origTop = parseFloat(el.style.top)
    const move = (mv: PointerEvent) => {
      const nx = Math.max(0, Math.min(100, origLeft + ((mv.clientX - startX) / rect.width) * 100))
      const ny = Math.max(0, Math.min(100, origTop  + ((mv.clientY - startY) / rect.height) * 100))
      onUpdate(id, nx, ny)
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
}

export default function App() {
  const editor = useImageEditor()
  const [activeTool, setActiveTool] = useState<ToolId>('adjust')
  const [zoom, setZoom] = useState(1)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonX, setComparisonX] = useState(50)
  const [drawSettings, setDrawSettings] = useState<DrawSettings>({ color: '#ffffff', size: 8, opacity: 100, tool: 'pen' })
  const fileRef  = useRef<HTMLInputElement>(null)
  const canvasAreaRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

  const drawEvents = useDrawCanvas(
    editor.drawRef,
    canvasAreaRef,
    editor.strokes,
    editor.addStroke,
    drawSettings
  )

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (file) { editor.loadImage(file); setZoom(1) }
  }, [editor])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { editor.loadImage(file); setZoom(1) }
    e.target.value = ''
  }, [editor])

  const handleToolChange = (tool: ToolId) => {
    setActiveTool(tool)
    setShowComparison(false)
  }

  // ── Frame CSS ─────────────────────────────────────────────────────────────
  const frameStyle: React.CSSProperties = {}
  const { frame } = editor
  if (frame.type !== 'none' && frame.size > 0) {
    frameStyle.border = `${frame.size}px solid ${frame.color}`
    frameStyle.borderRadius = frame.cornerRadius ? `${frame.cornerRadius}px` : 0
    if (frame.type === 'neon-cyan') frameStyle.boxShadow = `0 0 20px ${frame.color}, inset 0 0 20px rgba(0,240,255,0.1)`
    if (frame.type === 'neon-violet') frameStyle.boxShadow = `0 0 20px ${frame.color}`
    if (frame.type === 'double') frameStyle.outline = `3px solid ${frame.color}`
  }

  // ── Welcome Screen ────────────────────────────────────────────────────────
  if (!editor.sourceImage) {
    return (
      <div
        className="flex flex-col items-center justify-center relative"
        style={{ height: '100dvh', width: '100dvw', background: 'radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #000 70%)' }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #00F0FF 0%, #6366F1 100%)', boxShadow: '0 0 40px rgba(0,240,255,0.3)' }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#000', letterSpacing: '-0.05em' }}>Æ</span>
          </div>
          <h1 className="font-black text-2xl" style={{ color: '#fff', letterSpacing: '-0.04em' }}>
            AetherEdit <span style={{ color: '#00F0FF' }}>Pro</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', marginTop: 4 }}>PROFESSIONAL PHOTO EDITOR</p>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center cursor-pointer rounded-3xl transition-all mx-4"
          style={{ width: 'min(360px, 92vw)', height: 260, border: '2px dashed rgba(0,240,255,0.25)', background: 'rgba(0,240,255,0.03)', backdropFilter: 'blur(4px)' }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#00F0FF'; e.currentTarget.style.background = 'rgba(0,240,255,0.08)' }}
          onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.25)'; e.currentTarget.style.background = 'rgba(0,240,255,0.03)' }}
          onDrop={e => { e.preventDefault(); const f = [...e.dataTransfer.files].find(f => f.type.startsWith('image/')); if(f) { editor.loadImage(f); setZoom(1) } }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)' }}>
            <Upload size={28} style={{ color: '#00F0FF' }} />
          </div>
          <p className="font-bold text-base" style={{ color: '#fff' }}>Open a Photo</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Tap to browse or drag & drop</p>
          <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>PNG · JPEG · WebP · AVIF · GIF · BMP</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-8 px-6">
          {['Adjust','Filters','Crop','Draw','Text','Stickers','Frames','AI Tools'].map(f => (
            <span key={f} className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {f}
            </span>
          ))}
        </div>

        <p className="absolute bottom-6 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Developed by{' '}
          <a href="https://lakshan.vercel.app/" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(0,240,255,0.5)', textDecoration: 'none' }}>
            V.P.R. Lakshan Vidanapathirana
          </a>
        </p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
      </div>
    )
  }

  // ── Editor ────────────────────────────────────────────────────────────────
  const isCropActive = activeTool === 'crop'
  const isDrawActive = activeTool === 'draw'

  const renderPanel = () => {
    switch (activeTool) {
      case 'adjust':  return <AdjustPanel adjustments={editor.adjustments} onChange={editor.updateAdjustment} onReset={editor.resetAdjustments} />
      case 'filters': return <FiltersPanel sourceImage={editor.sourceImage!} activeFilter={editor.activeFilter} onApply={editor.applyFilter} />
      case 'crop':    return (
        <CropPanel
          crop={editor.crop}
          imageRef={editor.imageRef}
          onRotate={editor.rotate}
          onFlipH={editor.flipH}
          onFlipV={editor.flipV}
          onAspect={editor.setAspect}
          onCropRect={editor.setCropRect}
          onApply={editor.applyCrop}
          onReset={editor.resetCrop}
        />
      )
      case 'draw':    return (
        <DrawPanel
          strokes={editor.strokes}
          onUndo={editor.undoStroke}
          onClear={editor.clearStrokes}
          settings={drawSettings}
          onSettings={s => setDrawSettings(prev => ({ ...prev, ...s }))}
        />
      )
      case 'text':    return <TextPanel texts={editor.texts} onAdd={editor.addText} onUpdate={editor.updateText} onRemove={editor.removeText} />
      case 'stickers':return <StickersPanel stickers={editor.stickers} onAdd={editor.addSticker} onUpdate={editor.updateSticker} onRemove={editor.removeSticker} />
      case 'frame':   return <FramePanel frame={editor.frame} onUpdate={editor.updateFrame} />
      case 'pro':     return <ProPanel pro={editor.pro} onUpdatePro={editor.updatePro} onUpdateAdjustments={editor.updateAdjustmentsBulk} />
      case 'more':    return <MorePanel onExport={editor.exportImage} />
      default:        return null
    }
  }

  return (
    <div style={{ height: '100dvh', width: '100dvw', background: '#000', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 flex-shrink-0"
        style={{ height: 50, background: 'rgba(5,5,5,0.98)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', zIndex: 30 }}>

        <div className="flex items-center gap-1.5">
          <button onClick={() => editor.loadImage(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X size={15} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>
          <span className="font-black text-sm" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
            Æ<span style={{ color: '#00F0FF' }}>Edit</span>
          </span>

          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          {/* Before/After toggle */}
          <button
            onClick={() => setShowComparison(v => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
            style={{
              background: showComparison ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
              color: showComparison ? '#fbbf24' : 'rgba(255,255,255,0.5)',
              border: showComparison ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent',
            }}>
            <Sun size={12} /> Compare
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(0.2, +(z - 0.25).toFixed(2)))}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ZoomOut size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>
          <span className="font-mono text-xs px-1" style={{ color: 'rgba(255,255,255,0.5)', minWidth: 36, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(8, +(z + 0.25).toFixed(2)))}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ZoomIn size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          <button
            onClick={() => editor.exportImage('jpeg', 0.95)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #00F0FF, #6366F1)', color: '#000' }}>
            <Download size={12} /> Save
          </button>
        </div>
      </div>

      {/* ── Canvas Area ──────────────────────────────────────────────────────── */}
      <div
        ref={canvasAreaRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ background: '#0c0c0c', minHeight: 0 }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Checkered bg */}
        <div className="absolute inset-0 checker-bg opacity-40" />

        {/* Image wrapper */}
        <div
          className="relative transition-transform"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center', userSelect: 'none' }}
        >
          <div className="relative" style={frameStyle}>
            {/* Before/After split */}
            {showComparison && (
              <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - comparisonX}% 0 0)` }}>
                <img src={editor.sourceImage!} alt="original"
                  style={{ display: 'block', maxWidth: '100vw', maxHeight: 'calc(100dvh - 50px - 200px)', objectFit: 'contain' }} />
              </div>
            )}

            {/* Main image */}
            <img
              ref={editor.imageRef}
              src={editor.sourceImage!}
              alt="Editor"
              draggable={false}
              style={{
                display: 'block',
                maxWidth: 'calc(100vw - 16px)',
                maxHeight: 'calc(100dvh - 50px - 200px)',
                objectFit: 'contain',
                filter: editor.cssFilter,
                transform: editor.cssTransform,
                userSelect: 'none',
              }}
            />

            {/* Crop overlay */}
            {isCropActive && (
              <CropOverlay
                crop={editor.crop}
                onCropRect={editor.setCropRect}
                containerRef={canvasAreaRef}
              />
            )}

            {/* Draw canvas */}
            <canvas
              ref={editor.drawRef}
              className="absolute inset-0 w-full h-full"
              style={{
                zIndex: 15,
                pointerEvents: isDrawActive ? 'auto' : 'none',
                touchAction: 'none',
                cursor: isDrawActive ? `crosshair` : 'default',
              }}
              onPointerDown={isDrawActive ? drawEvents.onPointerDown : undefined}
              onPointerMove={isDrawActive ? drawEvents.onPointerMove : undefined}
              onPointerUp={isDrawActive ? drawEvents.onPointerUp : undefined}
              onPointerLeave={isDrawActive ? drawEvents.onPointerUp : undefined}
            />

            {/* Pro Preview Overlays (CSS Grain) */}
            {editor.pro.grain > 0 && (
              <div className="absolute inset-0 pointer-events-none" style={{ 
                zIndex: 25, 
                opacity: editor.pro.grain / 100,
                mixBlendMode: 'overlay',
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }} />
            )}
            
            {editor.pro.lightleak > 0 && (
              <div className="absolute inset-0 pointer-events-none" style={{ 
                zIndex: 26, 
                opacity: editor.pro.lightleak / 100,
                mixBlendMode: 'screen',
                background: 'linear-gradient(135deg, rgba(255,165,50,0.6) 0%, rgba(255,100,40,0.2) 40%, rgba(255,70,30,0) 60%)'
              }} />
            )}

            {/* Text layers */}
            {editor.texts.map(t => (
              <div key={t.id}
                style={{
                  position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
                  transform: `translate(-50%, -50%) rotate(${t.rotation}deg)`,
                  color: t.color, fontSize: t.fontSize, fontFamily: t.fontFamily,
                  fontWeight: t.bold ? 'bold' : 'normal', fontStyle: t.italic ? 'italic' : 'normal',
                  textAlign: t.align, whiteSpace: 'nowrap', cursor: 'move',
                  opacity: (t.opacity ?? 100) / 100,
                  textShadow: '0 1px 6px rgba(0,0,0,0.8)', zIndex: 20, pointerEvents: 'auto',
                }}
                onPointerDown={e => {
                  e.preventDefault()
                  const rect = canvasAreaRef.current!.getBoundingClientRect()
                  const sx = e.clientX, sy = e.clientY, ox = t.x, oy = t.y
                  const move = (mv: PointerEvent) => {
                    editor.updateText(t.id, {
                      x: Math.max(0, Math.min(100, ox + ((mv.clientX - sx) / rect.width) * 100)),
                      y: Math.max(0, Math.min(100, oy + ((mv.clientY - sy) / rect.height) * 100)),
                    })
                  }
                  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
                  window.addEventListener('pointermove', move)
                  window.addEventListener('pointerup', up)
                }}>
                {t.text}
              </div>
            ))}

            {/* Sticker layers */}
            {editor.stickers.map(s => (
              <div key={s.id}
                style={{
                  position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
                  transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                  fontSize: s.size, lineHeight: 1, cursor: 'move', zIndex: 20,
                  userSelect: 'none', pointerEvents: 'auto',
                }}
                onPointerDown={e => {
                  e.preventDefault()
                  const rect = canvasAreaRef.current!.getBoundingClientRect()
                  const sx = e.clientX, sy = e.clientY, ox = s.x, oy = s.y
                  const move = (mv: PointerEvent) => {
                    editor.updateSticker(s.id, {
                      x: Math.max(0, Math.min(100, ox + ((mv.clientX - sx) / rect.width) * 100)),
                      y: Math.max(0, Math.min(100, oy + ((mv.clientY - sy) / rect.height) * 100)),
                    })
                  }
                  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
                  window.addEventListener('pointermove', move)
                  window.addEventListener('pointerup', up)
                }}>
                {s.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Before/After slider */}
        {showComparison && (
          <div className="absolute inset-x-0 top-0 bottom-0 flex items-center pointer-events-none" style={{ zIndex: 25 }}>
            <div className="relative w-full h-full pointer-events-auto"
              onPointerMove={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                setComparisonX(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)))
              }}>
              {/* Divider line */}
              <div className="absolute top-0 bottom-0" style={{ left: `${comparisonX}%`, width: 2, background: '#00F0FF', zIndex: 30, transform: 'translateX(-50%)' }}>
                <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#00F0FF', color: '#000', fontSize: 14, fontWeight: 900, boxShadow: '0 0 20px rgba(0,240,255,0.5)' }}>
                  ⟺
                </div>
              </div>
              <div className="absolute top-3 px-2 py-0.5 rounded text-xs font-bold" style={{ left: `${comparisonX - 2}%`, transform: 'translateX(-100%)', background: 'rgba(0,0,0,0.7)', color: '#00F0FF' }}>Before</div>
              <div className="absolute top-3 px-2 py-0.5 rounded text-xs font-bold" style={{ left: `${comparisonX + 2}%`, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>After</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Panel ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 overflow-hidden"
        style={{ background: '#0f0f0f', borderTop: '1px solid rgba(255,255,255,0.06)', minHeight: 160, maxHeight: 270 }}>
        {renderPanel()}
      </div>

      {/* ── Bottom Tab Bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 overflow-x-auto"
        style={{ background: '#080808', borderTop: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'none', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Open new file */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center py-2.5 gap-0.5 flex-shrink-0 px-3"
          style={{ color: 'rgba(255,255,255,0.35)', border: 'none', background: 'transparent', cursor: 'pointer' }}>
          <Upload size={18} />
          <span style={{ fontSize: 9 }}>Open</span>
        </button>

        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0', flexShrink: 0 }} />

        {TOOLS.map(tool => (
          <button key={tool.id} id={`tab-${tool.id}`}
            onClick={() => handleToolChange(tool.id)}
            className="flex flex-col items-center justify-center py-2.5 gap-0.5 flex-shrink-0 px-3 relative transition-all"
            style={{
              color: activeTool === tool.id ? '#00F0FF' : 'rgba(255,255,255,0.38)',
              background: 'transparent', border: 'none', cursor: 'pointer', minWidth: 56,
            }}>
            {/* Active indicator */}
            {activeTool === tool.id && (
              <div className="absolute top-0 left-1/4 right-1/4 rounded-full" style={{ height: 2, background: '#00F0FF' }} />
            )}
            <div style={{ transform: activeTool === tool.id ? 'scale(1.12)' : 'scale(1)', transition: 'transform 0.15s' }}>
              {tool.icon}
            </div>
            <span style={{ fontSize: 9, fontWeight: activeTool === tool.id ? 700 : 400 }}>
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
    </div>
  )
}
