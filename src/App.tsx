import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  SlidersHorizontal, Film, Crop, Type, PenTool,
  Smile, Frame as FrameIcon, Download, ZoomIn, ZoomOut, X,
  Upload, MoreHorizontal, Sun, Crown, LayoutTemplate, Layers, Plus, Maximize, Scissors, Sparkles, Shapes,
  Undo2, Redo2
} from 'lucide-react'
import { useImageEditor, DEFAULT_ADJUSTMENTS } from './editor/useImageEditor'
import type { Adjustments, HslChannel, HslMixer } from './editor/useImageEditor'
import AdjustPanel from './editor/panels/AdjustPanel'
import FiltersPanel from './editor/panels/FiltersPanel'
import ProfilesPanel from './editor/panels/ProfilesPanel'
import CropPanel, { CropOverlay } from './editor/panels/CropPanel'
import GeometryPanel from './editor/panels/GeometryPanel'
import TextPanel from './editor/panels/TextPanel'
import { DrawPanel, useDrawCanvas } from './editor/panels/DrawPanel'
import type { DrawSettings } from './editor/panels/DrawPanel'
import StickersPanel from './editor/panels/StickersPanel'
import FramePanel from './editor/panels/FramePanel'
import SelectivePanel from './editor/panels/SelectivePanel'
import LensBlurPanel from './editor/panels/LensBlurPanel'
import HealingPanel from './editor/panels/HealingPanel'
import PresetsPanel from './editor/panels/PresetsPanel'
import VersionsPanel from './editor/panels/VersionsPanel'
import ProPanel from './editor/panels/ProPanel'
import MorePanel from './editor/panels/MorePanel'
import LayersPanel from './editor/panels/LayersPanel'
import CutoutPanel from './editor/panels/CutoutPanel'
import { OverlayEditor } from './editor/components/OverlayEditor'

type ToolId = 'adjust' | 'profiles' | 'filters' | 'cutout' | 'crop' | 'geometry' | 'selective' | 'lensblur' | 'healing' | 'draw' | 'text' | 'stickers' | 'frame' | 'layers' | 'presets' | 'versions' | 'pro' | 'more'

const TOOLS: { id: ToolId; icon: React.ReactNode; label: string; highlight?: string }[] = [
  { id: 'adjust',   icon: <SlidersHorizontal size={19} />, label: 'Adjust' },
  { id: 'profiles', icon: <LayoutTemplate size={19} />, label: 'Profiles' },
  { id: 'filters',  icon: <Film size={19} />, label: 'Filters' },
  { id: 'cutout',   icon: <Scissors size={19} />, label: 'Cutout', highlight: '#00F0FF' },
  { id: 'crop',     icon: <Crop size={19} />, label: 'Crop' },
  { id: 'geometry', icon: <Shapes size={19} />, label: 'Geometry' },
  { id: 'selective',icon: <Scissors size={19} />, label: 'Selective' },
  { id: 'lensblur', icon: <Sparkles size={19} />, label: 'Lens Blur' },
  { id: 'healing',  icon: <Layers size={19} />, label: 'Retouch' },
  { id: 'draw',     icon: <PenTool size={19} />, label: 'Draw' },
  { id: 'text',     icon: <Type size={19} />, label: 'Text' },
  { id: 'stickers', icon: <Smile size={19} />, label: 'Stickers' },
  { id: 'frame',    icon: <FrameIcon size={19} />, label: 'Frame' },
  { id: 'layers',   icon: <Layers size={19} />, label: 'Layers' },
  { id: 'presets',  icon: <LayoutTemplate size={19} />, label: 'Presets' },
  { id: 'versions', icon: <Layers size={19} />, label: 'Versions' },
  { id: 'pro',      icon: <Crown size={19} color="#ff2299" fill="rgba(255,34,153,0.2)"/>, label: 'Pro', highlight: '#ff2299' },
  { id: 'more',     icon: <MoreHorizontal size={19} />, label: 'More' },
]

export default function App() {
  const editor = useImageEditor()
  const [activeTool, setActiveTool] = useState<ToolId>('adjust')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showComparison, setShowComparison] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null)
  const [activeSelectiveId, setActiveSelectiveId] = useState<string | null>(null)
  const [selectiveBrushSize, setSelectiveBrushSize] = useState(30)
  const [drawSettings, setDrawSettings] = useState<DrawSettings>({ color: '#ffffff', size: 8, opacity: 100, tool: 'pen' })
  const [healingSettings, setHealingSettings] = useState({
    mode: 'spot' as 'spot' | 'clone',
    size: 20,
    isSettingCloneSource: false,
    cloneSource: null as { x: number; y: number } | null,
  })
  const isHealingDrawing = useRef(false)
  const healingPoints = useRef<{ x: number; y: number }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const overlayFileRef = useRef<HTMLInputElement>(null)
  const canvasAreaRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>
  const imageContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

  const drawEvents = useDrawCanvas(editor.drawRef, canvasAreaRef, editor.strokes, editor.addStroke, drawSettings)
  
  const activeSelectiveEdit = activeSelectiveId ? editor.selectiveEdits.find(s => s.id === activeSelectiveId) : null
  const selectiveDrawEvents = useDrawCanvas(
    editor.drawRef, 
    canvasAreaRef, 
    activeSelectiveEdit ? activeSelectiveEdit.strokes : [], 
    (stroke) => { if (activeSelectiveId) editor.addSelectiveStroke(activeSelectiveId, stroke) }, 
    { color: 'rgba(239, 68, 68, 0.45)', size: selectiveBrushSize, opacity: 100, tool: 'brush' }
  )

  const handleHealingPointerDown = useCallback((e: React.PointerEvent) => {
    const img = editor.imageRef.current
    if (!img) return

    const rect = img.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Calculate percentage coords
    const pctX = (x / rect.width) * 100
    const pctY = (y / rect.height) * 100

    if (healingSettings.isSettingCloneSource) {
      setHealingSettings(prev => ({
        ...prev,
        cloneSource: { x: pctX, y: pctY },
        isSettingCloneSource: false
      }))
      return
    }

    isHealingDrawing.current = true
    healingPoints.current = [{ x, y }]

    const canvas = editor.drawRef.current
    if (canvas) {
      canvas.width = rect.width
      canvas.height = rect.height
      canvas.setPointerCapture(e.pointerId)
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = healingSettings.mode === 'spot' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(99, 102, 241, 0.45)'
      ctx.beginPath()
      ctx.arc(x, y, healingSettings.size / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [healingSettings, editor])

  const handleHealingPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isHealingDrawing.current) return
    const img = editor.imageRef.current
    const canvas = editor.drawRef.current
    if (!img || !canvas) return

    const rect = img.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    healingPoints.current.push({ x, y })
    const pts = healingPoints.current

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the translucent stroke mask
    ctx.save()
    ctx.strokeStyle = healingSettings.mode === 'spot' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(99, 102, 241, 0.45)'
    ctx.lineWidth = healingSettings.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      const mid = { x: (pts[i-1].x + pts[i].x)/2, y: (pts[i-1].y + pts[i].y)/2 }
      ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mid.x, mid.y)
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
    ctx.stroke()
    ctx.restore()

    // If Clone Stamp mode, draw source circle, line, and moving destination circle
    if (healingSettings.mode === 'clone' && healingSettings.cloneSource) {
      const srcClientX = (healingSettings.cloneSource.x / 100) * rect.width
      const srcClientY = (healingSettings.cloneSource.y / 100) * rect.height
      const startX = pts[0].x
      const startY = pts[0].y
      const dx = srcClientX - startX
      const dy = srcClientY - startY

      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + dx, y + dy)
      ctx.stroke()

      // Draw active source cursor
      ctx.strokeStyle = '#6366F1'
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(x + dx, y + dy, healingSettings.size / 2, 0, Math.PI * 2)
      ctx.stroke()
      
      // Draw crosshair inside source cursor
      ctx.beginPath()
      ctx.moveTo(x + dx - 6, y + dy)
      ctx.lineTo(x + dx + 6, y + dy)
      ctx.moveTo(x + dx, y + dy - 6)
      ctx.lineTo(x + dx, y + dy + 6)
      ctx.stroke()
      ctx.restore()
    }
  }, [healingSettings, editor])

  const handleHealingPointerUp = useCallback(async (e: React.PointerEvent) => {
    if (!isHealingDrawing.current) return
    isHealingDrawing.current = false

    const canvas = editor.drawRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    if (healingPoints.current.length > 0) {
      await editor.applyHealing(
        healingPoints.current,
        healingSettings.size,
        healingSettings.mode,
        healingSettings.cloneSource
      )
    }
    healingPoints.current = []
  }, [healingSettings, editor])

  const haptic = () => { if (navigator.vibrate) navigator.vibrate(10) }

  const handleToolChange = (tool: ToolId) => {
    haptic()
    setActiveTool(tool)
    setShowComparison(false)
  }

  // ── Unified Zoom & Pan Gestures (Pointer + Wheel) ────────────────────────
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const panStart = useRef({ x: 0, y: 0 })
  const pointerStart = useRef({ x: 0, y: 0 })
  const pinchStartDist = useRef(0)
  const pinchStartZoom = useRef(1)
  const pinchStartPan = useRef({ x: 0, y: 0 })
  const pinchStartMid = useRef({ x: 0, y: 0 })

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // If clicking an overlay container, let that stop propagation or ignore panning
    const target = e.target as HTMLElement
    if (
      target.closest('.overlay-editor') || 
      target.closest('.overlay-control-handle') || 
      target.closest('button') || 
      target.closest('input')
    ) {
      return
    }

    e.currentTarget.setPointerCapture(e.pointerId)
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointers.current.size === 1) {
      panStart.current = { ...pan }
      pointerStart.current = { x: e.clientX, y: e.clientY }
    } else if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values())
      const dx = pts[0].x - pts[1].x
      const dy = pts[0].y - pts[1].y
      pinchStartDist.current = Math.hypot(dx, dy)
      pinchStartZoom.current = zoom
      pinchStartPan.current = { ...pan }
      pinchStartMid.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      }
    }
  }, [pan, zoom])

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values())
      const dx = pts[0].x - pts[1].x
      const dy = pts[0].y - pts[1].y
      const dist = Math.hypot(dx, dy)
      const mid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      }

      if (pinchStartDist.current > 0) {
        const factor = dist / pinchStartDist.current
        const newZoom = Math.max(0.2, Math.min(8, pinchStartZoom.current * factor))
        setZoom(newZoom)

        const dxMid = mid.x - pinchStartMid.current.x
        const dyMid = mid.y - pinchStartMid.current.y
        setPan({
          x: pinchStartPan.current.x + dxMid,
          y: pinchStartPan.current.y + dyMid,
        })
      }
    } else if (activePointers.current.size === 1) {
      // Single finger drag to pan (only if not drawing/healing/cropping)
      if (activeTool !== 'draw' && activeTool !== 'healing' && activeTool !== 'crop') {
        const dx = e.clientX - pointerStart.current.x
        const dy = e.clientY - pointerStart.current.y
        setPan({
          x: panStart.current.x + dx,
          y: panStart.current.y + dy,
        })
      }
    }
  }, [zoom, pan, activeTool])

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointers.current.has(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      activePointers.current.delete(e.pointerId)
    }
    if (activePointers.current.size < 2) {
      pinchStartDist.current = 0
    }
  }, [])

  // Mouse wheel zoom centered on cursor
  useEffect(() => {
    const el = canvasAreaRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomFactor = 1.08
      let newZoom = zoom
      if (e.deltaY < 0) {
        newZoom = Math.min(8, zoom * zoomFactor)
      } else {
        newZoom = Math.max(0.2, zoom / zoomFactor)
      }

      if (newZoom !== zoom) {
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const nextPanX = mouseX - centerX - (mouseX - pan.x - centerX) * (newZoom / zoom)
        const nextPanY = mouseY - centerY - (mouseY - pan.y - centerY) * (newZoom / zoom)

        setZoom(newZoom)
        setPan({ x: nextPanX, y: nextPanY })
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [zoom, pan])

  // Drag handler for text/stickers viewport editing
  const handleDragStart = useCallback((type: 'text' | 'sticker', id: string, initialX: number, initialY: number) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    
    const img = editor.imageRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    
    const startX = e.clientX
    const startY = e.clientY
    
    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      const dxPct = (dx / rect.width) * 100
      const dyPct = (dy / rect.height) * 100
      
      const newX = Math.max(0, Math.min(100, initialX + dxPct))
      const newY = Math.max(0, Math.min(100, initialY + dyPct))
      
      if (type === 'text') {
        editor.updateText(id, { x: newX, y: newY })
      } else {
        editor.updateSticker(id, { x: newX, y: newY })
      }
    }
    
    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
    }
    
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
  }, [editor])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (file) { editor.loadImage(file); setZoom(1); setPan({ x: 0, y: 0 }) }
  }, [editor])

  // ── Layer Routing Logic ───────────────────────────────────────────────────
  const activeOverlay = activeOverlayId ? editor.overlayLayers.find(l => l.id === activeOverlayId) : null
  const currentAdjustments = activeOverlay ? activeOverlay.adjustments : editor.adjustments
  const currentFilter = activeOverlay ? activeOverlay.activeFilter : editor.activeFilter

  const handleAdjustmentChange = useCallback((key: keyof Adjustments, value: number) => {
    if (activeOverlayId && activeOverlay) {
      editor.updateOverlayLayer(activeOverlayId, { adjustments: { ...activeOverlay.adjustments, [key]: value } })
    } else {
      editor.updateAdjustment(key, value)
    }
  }, [activeOverlayId, activeOverlay, editor])

  const handleResetAdjustments = useCallback(() => {
    if (activeOverlayId && activeOverlay) {
      editor.updateOverlayLayer(activeOverlayId, { adjustments: { ...DEFAULT_ADJUSTMENTS }, activeFilter: 'none' })
    } else {
      editor.resetAdjustments()
    }
  }, [activeOverlayId, activeOverlay, editor])

  const handleFilterApply = useCallback((id: string) => {
    if (activeOverlayId && activeOverlay) {
      editor.updateOverlayLayer(activeOverlayId, { activeFilter: id })
    } else {
      editor.applyFilter(id)
    }
  }, [activeOverlayId, activeOverlay, editor])

  // ── Welcome Screen ────────────────────────────────────────────────────────
  if (!editor.sourceImage) {
    return (
      <div className="flex flex-col items-center justify-center relative"
        style={{ height: '100dvh', width: '100dvw', background: 'radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #000 70%)' }}
        onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #00F0FF 0%, #6366F1 100%)', boxShadow: '0 0 40px rgba(0,240,255,0.3)' }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#000', letterSpacing: '-0.05em' }}>Æ</span>
          </div>
          <h1 className="font-black text-2xl cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowAbout(true)} style={{ color: '#fff', letterSpacing: '-0.04em' }}>
            AetherEdit <span style={{ color: '#00F0FF' }}>Pro</span>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', marginTop: 4 }}>PROFESSIONAL PHOTO EDITOR</p>
        </div>
        <div onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center cursor-pointer rounded-3xl transition-all mx-4"
          style={{ width: 'min(360px, 92vw)', height: 260, border: '2px dashed rgba(0,240,255,0.25)', background: 'rgba(0,240,255,0.03)', backdropFilter: 'blur(4px)' }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#00F0FF'; e.currentTarget.style.background = 'rgba(0,240,255,0.08)' }}
          onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.25)'; e.currentTarget.style.background = 'rgba(0,240,255,0.03)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)' }}>
            <Upload size={28} style={{ color: '#00F0FF' }} />
          </div>
          <p className="font-bold text-base" style={{ color: '#fff' }}>Open a Photo</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Tap to browse or drag & drop</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
          if (e.target.files?.[0]) {
            editor.loadImage(e.target.files[0])
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }
        }} />

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center text-xs text-white/30 tracking-wide font-medium pointer-events-auto">
          Developed with <span className="text-red-500 mx-1 animate-pulse">❤️</span> by&nbsp;
          <a 
            href="https://lakshan.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors underline decoration-cyan-400/30 underline-offset-4 hover:decoration-cyan-300"
          >
            V.P.R. Lakshan Vidanapathirana
          </a>
        </div>
      </div>
    )
  }

  const renderPanel = () => {
    switch (activeTool) {
      case 'adjust':  return <AdjustPanel adjustments={currentAdjustments} hslMixer={editor.hslMixer} onChange={handleAdjustmentChange} onHslChange={editor.updateHsl} onReset={handleResetAdjustments} />
      case 'profiles':return <ProfilesPanel activeProfile={editor.profile} sourceImage={editor.sourceImage!} onApply={editor.applyProfile} />
      case 'filters': return <FiltersPanel sourceImage={activeOverlay ? activeOverlay.src : editor.sourceImage!} activeFilter={currentFilter} onApply={handleFilterApply} />
      case 'cutout':  return <CutoutPanel isProcessing={editor.isProcessingCutout} onCutout={editor.cutoutBackground} />
      case 'crop':    return <CropPanel crop={editor.crop} imageRef={editor.imageRef} onRotate={editor.rotate} onFlipH={editor.flipH} onFlipV={editor.flipV} onAspect={editor.setAspect} onCropRect={editor.setCropRect} onApply={editor.applyCrop} onReset={editor.resetCrop} />
      case 'geometry':return <GeometryPanel geometry={editor.geometry} onUpdate={editor.updateGeometry} onReset={editor.resetGeometry} />
      case 'selective':return (
        <SelectivePanel 
          selectiveEdits={editor.selectiveEdits} 
          activeId={activeSelectiveId} 
          setActiveId={setActiveSelectiveId}
          onAdd={editor.addSelectiveEdit}
          onUpdate={(ch) => activeSelectiveId && editor.updateSelectiveEdit(activeSelectiveId, ch)}
          onRemove={(id) => { editor.removeSelectiveEdit(id); if (activeSelectiveId === id) setActiveSelectiveId(null) }}
          brushSize={selectiveBrushSize}
          onBrushSizeChange={setSelectiveBrushSize}
          onUndo={() => activeSelectiveId && editor.undoSelectiveStroke(activeSelectiveId)}
          onClear={() => activeSelectiveId && editor.clearSelectiveStrokes(activeSelectiveId)}
        />
      )
      case 'lensblur':return <LensBlurPanel lensBlur={editor.lensBlur} onUpdate={editor.updateLensBlur} />
      case 'healing': return (
        <HealingPanel
          settings={healingSettings}
          onSettingsChange={setHealingSettings}
          canUndo={editor.historyIndex > 0}
          canRedo={editor.historyIndex < editor.imageHistory.length - 1}
          onUndo={editor.undoImage}
          onRedo={editor.redoImage}
        />
      )
      case 'draw':    return <DrawPanel strokes={editor.strokes} onUndo={editor.undoStroke} onClear={editor.clearStrokes} settings={drawSettings} onSettings={s => setDrawSettings(prev => ({ ...prev, ...s }))} />
      case 'text':    return <TextPanel texts={editor.texts} onAdd={editor.addText} onUpdate={editor.updateText} onRemove={editor.removeText} />
      case 'stickers':return <StickersPanel stickers={editor.stickers} onAdd={editor.addSticker} onUpdate={editor.updateSticker} onRemove={editor.removeSticker} />
      case 'frame':   return <FramePanel frame={editor.frame} onUpdate={editor.updateFrame} />
      case 'layers':  return <LayersPanel layers={editor.overlayLayers} activeLayerId={activeOverlayId} setActiveLayerId={setActiveOverlayId} onUpdateLayer={editor.updateOverlayLayer} onRemoveLayer={editor.removeOverlayLayer} onAddLayerClick={() => overlayFileRef.current?.click()} />
      case 'presets': return <PresetsPanel customPresets={editor.customPresets} onApplyPreset={editor.applyCustomPreset} onSavePreset={editor.saveCustomPreset} onDeletePreset={editor.deleteCustomPreset} />
      case 'versions':return <VersionsPanel versions={editor.versions} onSaveVersion={editor.saveVersion} onRestoreVersion={editor.restoreVersion} onDeleteVersion={editor.deleteVersion} />
      case 'pro':     return <ProPanel pro={editor.pro} onUpdatePro={editor.updatePro} onUpdateAdjustments={editor.updateAdjustmentsBulk} />
      case 'more':    return <MorePanel onExport={editor.exportImage} />
      default:        return null
    }
  }

  // ── Frame CSS ─────────────────────────────────────────────────────────────
  const frameStyle: React.CSSProperties = {}
  const { frame } = editor
  if (frame.type !== 'none' && frame.size > 0) {
    frameStyle.border = `${frame.size}px solid ${frame.color}`
    frameStyle.borderRadius = frame.cornerRadius ? `${frame.cornerRadius}px` : 0
    if (frame.type === 'neon-cyan') frameStyle.boxShadow = `0 0 20px ${frame.color}, inset 0 0 20px rgba(0,240,255,0.1)`
    if (frame.type === 'double') frameStyle.outline = `3px solid ${frame.color}`
  }

  return (
    <div style={{ height: '100dvh', width: '100dvw', background: '#000', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 flex-shrink-0 relative z-30"
        style={{ height: 50, background: 'rgba(5,5,5,0.98)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => editor.loadImage(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-white/60">
            <X size={15} />
          </button>
          <span className="font-black text-sm text-white tracking-tight cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowAbout(true)}>Æ<span style={{ color: '#00F0FF' }}>Edit</span></span>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button onClick={() => setShowComparison(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: showComparison ? 'rgba(251,191,36,0.15)' : 'transparent', color: showComparison ? '#fbbf24' : 'rgba(255,255,255,0.4)', border: showComparison ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent' }}>
            <Sun size={12} /> {showComparison ? 'Before' : 'Compare'}
          </button>

          {editor.imageHistory && editor.imageHistory.length > 1 && (
            <>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <div className="flex gap-1">
                <button onClick={editor.undoImage} disabled={editor.historyIndex <= 0}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  title="Undo Pixel Retouch">
                  <Undo2 size={13} />
                </button>
                <button onClick={editor.redoImage} disabled={editor.historyIndex >= editor.imageHistory.length - 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  title="Redo Pixel Retouch">
                  <Redo2 size={13} />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => { setActiveTool('layers'); overlayFileRef.current?.click(); }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white shadow-lg"
            title="Add Image Layer">
            <Plus size={15} />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button onClick={() => editor.exportImage('jpeg', 0.95)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #00F0FF, #6366F1)', color: '#000' }}>
            <Download size={12} /> Save
          </button>
        </div>
      </div>

      {/* Target Layer Indicator */}
      {activeOverlayId && (
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-40 bg-cyan-400 text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-none">
          <Layers size={14} /> Editing Layer
        </div>
      )}

      {/* ── Canvas Area ──────────────────────────────────────────────────────── */}
      <div ref={canvasAreaRef} className="canvas-area flex-1 relative flex items-center justify-center overflow-hidden bg-[#0c0c0c]"
        onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        style={{ touchAction: 'none' }}>
        <div className="absolute inset-0 checker-bg opacity-40" />

        <div className="editor-image-wrap relative"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center', transition: zoom === 1 && pan.x === 0 && pan.y === 0 ? 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none' }}>
          <div className="relative" style={frameStyle} ref={imageContainerRef}>

            {showComparison && (
              <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none" style={{ clipPath: `inset(0 50% 0 0)` }}>
                <img src={editor.sourceImage!} alt="original" style={{ display: 'block', maxWidth: 'calc(100vw - 16px)', maxHeight: 'calc(100dvh - 50px - 270px)', objectFit: 'contain' }} />
              </div>
            )}

            <img ref={editor.imageRef} src={editor.sourceImage!} alt="Editor" draggable={false}
              style={{
                display: 'block',
                maxWidth: 'calc(100vw - 16px)',
                maxHeight: 'calc(100dvh - 50px - 270px)',
                objectFit: 'contain',
                filter: editor.cssFilter,
                transform: editor.cssTransform,
                WebkitUserSelect: 'none',
                userSelect: 'none',
                clipPath: editor.crop.applied ? `inset(${editor.crop.y * 100}% ${(1 - editor.crop.x - editor.crop.w) * 100}% ${(1 - editor.crop.y - editor.crop.h) * 100}% ${editor.crop.x * 100}%)` : undefined,
              }}
              onPointerDown={() => setActiveOverlayId(null)} />

            {/* Viewport Text Overlays */}
            {editor.texts.map(t => {
              let tx = '-50%';
              if (t.align === 'left') tx = '0%';
              if (t.align === 'right') tx = '-100%';

              return (
                <div key={t.id}
                  onPointerDown={handleDragStart('text', t.id, t.x, t.y)}
                  style={{
                    position: 'absolute',
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    transform: `translate(${tx}, -50%)`,
                    fontSize: `${t.fontSize}px`,
                    color: t.color,
                    opacity: t.opacity / 100,
                    fontFamily: t.fontFamily || 'Inter, sans-serif',
                    fontWeight: t.bold ? 'bold' : 'normal',
                    fontStyle: t.italic ? 'italic' : 'normal',
                    textAlign: t.align || 'left',
                    pointerEvents: 'auto',
                    cursor: 'move',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    zIndex: 20,
                  }}
                >
                  {t.text}
                </div>
              );
            })}

            {/* Viewport Sticker Overlays */}
            {editor.stickers.map(s => (
              <div key={s.id}
                onPointerDown={handleDragStart('sticker', s.id, s.x, s.y)}
                style={{
                  position: 'absolute',
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                  fontSize: `${s.size}px`,
                  pointerEvents: 'auto',
                  cursor: 'move',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  zIndex: 20,
                  lineHeight: 1,
                }}
              >
                {s.emoji}
              </div>
            ))}

            {/* Lens Blur Preview */}
            {editor.lensBlur.enabled && (
              <div className="absolute inset-0 pointer-events-none z-10" style={{
                backdropFilter: `blur(${editor.lensBlur.amount / 10}px)`,
                maskImage: editor.lensBlur.type === 'radial'
                  ? `radial-gradient(circle ${editor.lensBlur.size}% at ${editor.lensBlur.centerX}% ${editor.lensBlur.centerY}%, transparent 0%, transparent ${editor.lensBlur.size}%, black ${editor.lensBlur.size + editor.lensBlur.feather}%)`
                  : `linear-gradient(to bottom, black 0%, transparent ${30 - editor.lensBlur.feather}%, transparent ${70 + editor.lensBlur.feather}%, black 100%)`,
                WebkitMaskImage: editor.lensBlur.type === 'radial'
                  ? `radial-gradient(circle ${editor.lensBlur.size}% at ${editor.lensBlur.centerX}% ${editor.lensBlur.centerY}%, transparent 0%, transparent ${editor.lensBlur.size}%, black ${editor.lensBlur.size + editor.lensBlur.feather}%)`
                  : `linear-gradient(to bottom, black 0%, transparent ${30 - editor.lensBlur.feather}%, transparent ${70 + editor.lensBlur.feather}%, black 100%)`,
              }} />
            )}

            {/* Overlay Image Layers */}
            {editor.overlayLayers.map(ol => (
              <OverlayEditor key={ol.id} layer={ol} 
                isActive={activeOverlayId === ol.id} 
                onSelect={() => { setActiveOverlayId(ol.id); }}
                onUpdate={ch => editor.updateOverlayLayer(ol.id, ch)}
                onRemove={() => { editor.removeOverlayLayer(ol.id); setActiveOverlayId(null); }}
                containerRef={imageContainerRef} />
            ))}

            {activeTool === 'crop' && <CropOverlay crop={editor.crop} onCropRect={editor.setCropRect} imageRef={editor.imageRef} />}

            {healingSettings.cloneSource && healingSettings.mode === 'clone' && activeTool === 'healing' && (
              <div className="absolute border-2 border-dashed border-[#6366F1] rounded-full flex items-center justify-center pointer-events-none animate-pulse"
                style={{
                  left: `${healingSettings.cloneSource.x}%`,
                  top: `${healingSettings.cloneSource.y}%`,
                  width: Math.max(16, healingSettings.size),
                  height: Math.max(16, healingSettings.size),
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 10px rgba(99,102,241,0.5), inset 0 0 10px rgba(99,102,241,0.5)',
                  zIndex: 25
                }}>
                <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full" />
              </div>
            )}

            <canvas ref={editor.drawRef} className="absolute inset-0 w-full h-full"
              style={{
                zIndex: 15,
                pointerEvents: (activeTool === 'draw' || activeTool === 'healing' || activeTool === 'selective') ? 'auto' : 'none',
                cursor: healingSettings.isSettingCloneSource ? 'cell' : 'crosshair'
              }}
              onPointerDown={
                activeTool === 'draw' ? drawEvents.onPointerDown :
                activeTool === 'selective' ? selectiveDrawEvents.onPointerDown :
                activeTool === 'healing' ? handleHealingPointerDown : undefined
              }
              onPointerMove={
                activeTool === 'draw' ? drawEvents.onPointerMove :
                activeTool === 'selective' ? selectiveDrawEvents.onPointerMove :
                activeTool === 'healing' ? handleHealingPointerMove : undefined
              }
              onPointerUp={
                activeTool === 'draw' ? drawEvents.onPointerUp :
                activeTool === 'selective' ? selectiveDrawEvents.onPointerUp :
                activeTool === 'healing' ? handleHealingPointerUp : undefined
              } />
          </div>
        </div>

        {/* Sleek Floating Zoom & Workboard Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-40 bg-black/75 hover:bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-2xl transition-all duration-300">
          {/* Zoom Out */}
          <button 
            onClick={() => setZoom(z => Math.max(0.2, Math.round((z - 0.1) * 10) / 10))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          
          {/* Zoom Level Indicator */}
          <span className="text-xs font-mono font-bold text-white/90 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          {/* Zoom In */}
          <button 
            onClick={() => setZoom(z => Math.min(8, Math.round((z + 0.1) * 10) / 10))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          
          <div className="w-px h-4 bg-white/15 mx-1" />
          
          {/* Auto Fit Screen */}
          <button 
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 ${
              zoom === 1 && pan.x === 0 && pan.y === 0 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'bg-white/5 text-white/80 border border-transparent hover:bg-white/10 hover:text-white'
            }`}
            title="Auto Adjust to Screen (Fit)"
          >
            <Maximize size={10} /> Auto Fit
          </button>
        </div>
      </div>

      {/* ── Bottom Panel ────────────────────────────────────────────────────── */}
      <div className="panel-scroll flex-shrink-0 bg-[#0f0f0f] border-t border-white/5 relative z-40"
        style={{ height: 210, overflowX: 'hidden' }}>
        {renderPanel()}
      </div>

      {/* ── Bottom Tab Bar ───────────────────────────────────────────────────── */}
      <div className="panel-scroll-x flex flex-shrink-0 bg-[#080808] border-t border-white/5 relative z-40 pb-safe">
        {TOOLS.map(tool => (
          <button key={tool.id} onClick={() => handleToolChange(tool.id)}
            className="flex flex-col items-center justify-center py-2.5 gap-1 flex-shrink-0 px-3 min-w-[64px] relative"
            style={{ color: activeTool === tool.id ? (tool.highlight ?? '#00F0FF') : 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}>
            {activeTool === tool.id && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-b-full" style={{ background: tool.highlight ?? '#00F0FF' }} />}
            <div style={{ transform: activeTool === tool.id ? 'scale(1.15) translateY(-2px)' : 'scale(1)', transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>
              {tool.icon}
            </div>
            <span style={{ fontSize: 9, fontWeight: activeTool === tool.id ? 700 : 500 }}>{tool.label}</span>
          </button>
        ))}
      </div>

      <input ref={overlayFileRef} type="file" accept="image/*" className="hidden" onChange={e => {
        if (e.target.files?.[0]) { 
          const newId = editor.addOverlayLayer(URL.createObjectURL(e.target.files[0]));
          setActiveOverlayId(newId);
          setActiveTool('layers');
        }
        if (overlayFileRef.current) overlayFileRef.current.value = '';
      }} />

      {/* ── About Modal ──────────────────────────────────────────────────────── */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowAbout(false)}>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all">
              <X size={16} />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #00F0FF 0%, #6366F1 100%)', boxShadow: '0 0 30px rgba(0,240,255,0.3)' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#000', letterSpacing: '-0.05em' }}>Æ</span>
            </div>
            <h2 className="text-xl font-black text-white mb-2 tracking-tight">Elevate Your Visuals with AetherEdit Pro</h2>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              AetherEdit Pro is a powerful, seamless, and professional photo editor built for modern creators. Bring your creative vision to life with precision editing tools wrapped in a stunning, user-friendly workspace.
            </p>
            <p className="text-sm font-bold text-cyan-400 mb-6 bg-cyan-400/10 p-3 rounded-xl border border-cyan-400/20">
              Free forever. No limits, no catches. Drag, drop, and redefine your photography today.
            </p>
            
            <div className="space-y-3 pt-4 border-t border-white/10">
              <p className="text-xs text-white/60">
                Developer: <strong className="text-white">V.P.R. Lakshan Vidanapathirana</strong>
              </p>
              <a href="mailto:rlvidanapathirana@gmail.com" className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">📩</span>
                Contact for updates
              </a>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-white/40 leading-relaxed">
              Copyright © {new Date().getFullYear()} <a href="https://lakshan.netlify.app/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline decoration-white/20 hover:decoration-cyan-400/50 underline-offset-2 transition-all">V.P.R. Lakshan Vidanapathirana</a>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

