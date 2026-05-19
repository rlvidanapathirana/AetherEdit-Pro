import React, { useState, useRef, useCallback } from 'react'
import {
  FolderOpen, Save, Download, Upload, Undo2, Redo2,
  ZoomIn, ZoomOut, Maximize, Grid, Ruler, Eye,
  ChevronDown, FileDown, FileImage, Layers, Settings,
  Play, Square as StopIcon, Cpu, Image as ImageIcon,
  PanelLeftClose, PanelRightClose, RefreshCw, AlertTriangle
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { useEditorStore } from '../../context/editorStore'
import { useHistory } from '../../hooks/useHistory'
import { downloadFile, dataURLToBlob } from '../../utils/helpers'
import { getAllProjects, saveProject } from '../../db/database'
import JSZip from 'jszip'

interface NewProjectDialogProps {
  open: boolean
  onClose: () => void
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ open, onClose }) => {
  const { setProject } = useEditorStore()
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)
  const [name, setName] = useState('Untitled Project')
  const [preset, setPreset] = useState('')

  const PRESETS = [
    { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
    { label: '4K UHD (3840×2160)', w: 3840, h: 2160 },
    { label: 'Instagram Post (1080×1080)', w: 1080, h: 1080 },
    { label: 'Instagram Story (1080×1920)', w: 1080, h: 1920 },
    { label: 'Twitter Banner (1500×500)', w: 1500, h: 500 },
    { label: 'YouTube Thumbnail (1280×720)', w: 1280, h: 720 },
    { label: 'A4 Print (2480×3508)', w: 2480, h: 3508 },
    { label: 'Business Card (1050×600)', w: 1050, h: 600 },
  ]

  const applyPreset = (p: typeof PRESETS[0]) => {
    setWidth(p.w); setHeight(p.h); setPreset(p.label)
  }

  const handleCreate = () => {
    setProject({ name, width, height })
    const canvas = (window as Window & { __aetherCanvas?: { getFabric: () => { setWidth: (w: number) => void; setHeight: (h: number) => void; renderAll: () => void } | null } }).__aetherCanvas?.getFabric?.()
    if (canvas) {
      canvas.setWidth(width)
      canvas.setHeight(height)
      canvas.renderAll()
    }
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
        <Dialog.Content
          className="fixed z-50 glass-modal rounded-2xl p-6 animate-slide-up"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 520 }}
        >
          <Dialog.Title className="text-base font-bold mb-4" style={{ color: '#fff' }}>
            New Project
          </Dialog.Title>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="panel-label block mb-1.5">PROJECT NAME</label>
              <input className="aether-input" value={name} onChange={e => setName(e.target.value)} placeholder="Untitled Project" />
            </div>

            {/* Presets */}
            <div>
              <label className="panel-label block mb-1.5">CANVAS PRESET</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    className="text-left px-3 py-2 rounded-lg text-xs transition-all"
                    style={{
                      background: preset === p.label ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${preset === p.label ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      color: preset === p.label ? '#00F0FF' : 'rgba(255,255,255,0.6)',
                    }}
                    onClick={() => applyPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="panel-label block mb-1.5">WIDTH (px)</label>
                <input className="aether-input" type="number" value={width} min={1} max={8000} onChange={e => setWidth(Number(e.target.value))} />
              </div>
              <div>
                <label className="panel-label block mb-1.5">HEIGHT (px)</label>
                <input className="aether-input" type="number" value={height} min={1} max={8000} onChange={e => setHeight(Number(e.target.value))} />
              </div>
            </div>

            {/* Canvas preview ratio */}
            <div className="flex items-center gap-3">
              <div
                className="rounded flex-shrink-0"
                style={{
                  width: Math.min(80, 80 * (width / Math.max(width, height))),
                  height: Math.min(50, 50 * (height / Math.max(width, height))),
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {width} × {height} px · {(width * height / 1000000).toFixed(1)}MP
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button className="btn-ghost flex-1 px-4 py-2 rounded-lg text-sm font-medium" onClick={onClose}>Cancel</button>
              <button className="btn-neon flex-1 px-4 py-2 rounded-lg text-sm font-semibold" onClick={handleCreate}>
                Create Project
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const TopBar: React.FC = () => {
  const {
    project, isDirty, isSaving, zoom, setZoom,
    showGrid, setShowGrid, showRulers, setShowRulers,
    showLeftPanel, showRightPanel, toggleLeftPanel, toggleRightPanel,
    isRecording, startRecording, stopRecording,
  } = useEditorStore()
  const { performUndo, performRedo, canUndo, canRedo } = useHistory()

  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp'>('png')
  const [exportQuality, setExportQuality] = useState(95)
  const [stopName, setStopName] = useState('')
  const [showStopDialog, setShowStopDialog] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const canvas = (window as Window & {
      __aetherCanvas?: { export: (f: 'png' | 'jpeg' | 'webp', q: number) => string }
    }).__aetherCanvas
    if (!canvas) return
    const dataUrl = canvas.export(exportFormat, exportQuality / 100)
    const blob = await dataURLToBlob(dataUrl)
    downloadFile(blob, `${project.name}.${exportFormat}`)
    setExportOpen(false)
  }

  // ── Export as .proproject ────────────────────────────────────────────────
  const handleExportProject = async () => {
    const canvas = (window as Window & {
      __aetherCanvas?: { getJSON: () => string; export: (f: 'png', q: number) => string }
    }).__aetherCanvas
    if (!canvas) return
    const zip = new JSZip()
    const state = useEditorStore.getState()
    const projectData = {
      version: '1.0',
      meta: state.project,
      layers: state.layers,
      adjustments: state.adjustments,
      hsl: state.hsl,
      curves: state.curves,
      canvasJSON: canvas.getJSON(),
      exportedAt: new Date().toISOString(),
    }
    zip.file('project.json', JSON.stringify(projectData, null, 2))
    // Add thumbnail
    const thumb = canvas.export('png', 0.5)
    const thumbData = thumb.split(',')[1]
    zip.file('thumbnail.png', thumbData, { base64: true })
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadFile(blob, `${project.name}.proproject`)
  }

  // ── Import image ─────────────────────────────────────────────────────────
  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const canvas = (window as Window & {
      __aetherCanvas?: { addImage: (url: string, name: string) => Promise<void> }
    }).__aetherCanvas
    if (!canvas) return
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file)
      canvas.addImage(url, file.name.replace(/\.[^.]+$/, ''))
    })
    e.target.value = ''
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  const handleRecordToggle = () => {
    if (isRecording) {
      setShowStopDialog(true)
    } else {
      startRecording()
    }
  }

  const handleStopRecording = () => {
    if (stopName.trim()) {
      stopRecording(stopName, '')
      setStopName('')
      setShowStopDialog(false)
    }
  }

  const ZOOM_PRESETS = [25, 50, 75, 100, 150, 200, 300, 400]

  return (
    <>
      <div
        className="flex items-center gap-1 px-3 h-11 flex-shrink-0 select-none"
        style={{
          background: '#0A0A0A',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          zIndex: 30,
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 mr-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00F0FF, #6366F1)' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#000' }}>Æ</span>
          </div>
          <span className="font-bold text-sm" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
            AetherEdit <span style={{ color: '#00F0FF' }}>Pro</span>
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 mx-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* ── File Menu ── */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="btn-ghost px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1">
              File <ChevronDown size={11} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="start" sideOffset={4} className="rounded-xl p-1 animate-fade-in" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.8)', minWidth: 160, zIndex: 100 }}>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => setNewProjectOpen(true)}>
                <FileImage size={12} /> New Project...
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => imageInputRef.current?.click()}>
                <FolderOpen size={12} /> Open Image...
              </DropdownMenu.Item>
              <DropdownMenu.Separator style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => setExportOpen(true)}>
                <FileDown size={12} /> Export Image...
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={handleExportProject}>
                <Download size={12} /> Save as .proproject
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => projectInputRef.current?.click()}>
                <Upload size={12} /> Open .proproject
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* ── Edit Menu ── */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="btn-ghost px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1">
              Edit <ChevronDown size={11} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="start" sideOffset={4} className="rounded-xl p-1 animate-fade-in" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.8)', minWidth: 160, zIndex: 100 }}>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" onClick={performUndo} disabled={!canUndo}
                style={{ opacity: canUndo ? 1 : 0.4, color: 'rgba(255,255,255,0.8)' }}>
                <Undo2 size={12} /> Undo <kbd style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>Ctrl+Z</kbd>
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" onClick={performRedo} disabled={!canRedo}
                style={{ opacity: canRedo ? 1 : 0.4, color: 'rgba(255,255,255,0.8)' }}>
                <Redo2 size={12} /> Redo <kbd style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>Ctrl+Y</kbd>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* ── View Menu ── */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="btn-ghost px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1">
              View <ChevronDown size={11} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="start" sideOffset={4} className="rounded-xl p-1 animate-fade-in" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.8)', minWidth: 160, zIndex: 100 }}>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => setShowGrid(!showGrid)}>
                <Grid size={12} /> {showGrid ? 'Hide Grid' : 'Show Grid'}
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => setShowRulers(!showRulers)}>
                <Ruler size={12} /> {showRulers ? 'Hide Rulers' : 'Show Rulers'}
              </DropdownMenu.Item>
              <DropdownMenu.Separator style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer outline-none hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => setZoom(100)}>
                <Maximize size={12} /> Fit to Screen
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Separator */}
        <div className="w-px h-5 mx-1 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Undo / Redo quick buttons */}
        <button
          className="btn-tool w-8 h-8 rounded-md"
          onClick={performUndo}
          disabled={!canUndo}
          style={{ opacity: canUndo ? 1 : 0.3 }}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          className="btn-tool w-8 h-8 rounded-md"
          onClick={performRedo}
          disabled={!canRedo}
          style={{ opacity: canRedo ? 1 : 0.3 }}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </button>

        {/* Separator */}
        <div className="w-px h-5 mx-2 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Zoom controls */}
        <button className="btn-tool w-7 h-7 rounded" onClick={() => setZoom(Math.max(zoom - 25, 1))}>
          <ZoomOut size={13} />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors hover:bg-white/5"
              style={{ color: '#00F0FF', minWidth: 56, textAlign: 'center' }}
            >
              {zoom}%
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="center" sideOffset={4} className="rounded-xl p-1 animate-fade-in" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.8)', minWidth: 80, zIndex: 100 }}>
              {ZOOM_PRESETS.map(z => (
                <DropdownMenu.Item key={z} className="flex items-center px-2 py-1.5 rounded-md text-xs font-mono cursor-pointer outline-none hover:bg-white/10" onClick={() => setZoom(z)}
                  style={{ color: zoom === z ? '#00F0FF' : 'rgba(255,255,255,0.8)' }}>
                  {z}%
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <button className="btn-tool w-7 h-7 rounded" onClick={() => setZoom(Math.min(zoom + 25, 3200))}>
          <ZoomIn size={13} />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Project name + status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate max-w-[180px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {project.name}
          </span>
          {isDirty && !isSaving && (
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f97316' }} title="Unsaved changes" />
          )}
          {isSaving && (
            <RefreshCw size={11} className="animate-spin" style={{ color: '#00F0FF' }} />
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-5 mx-2 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Recording indicator */}
        <button
          onClick={handleRecordToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
          style={{
            background: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isRecording ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: isRecording ? '#f87171' : 'rgba(255,255,255,0.5)',
          }}
          title="Record Action Macro"
        >
          {isRecording ? (
            <><div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} /> Recording</>
          ) : (
            <><Play size={11} /> Record</>
          )}
        </button>

        {/* Panel toggles */}
        <button className="btn-tool w-8 h-8 rounded-md ml-1" onClick={toggleLeftPanel} title="Toggle Left Panel">
          <PanelLeftClose size={14} style={{ opacity: showLeftPanel ? 1 : 0.4 }} />
        </button>
        <button className="btn-tool w-8 h-8 rounded-md" onClick={toggleRightPanel} title="Toggle Right Panel">
          <PanelRightClose size={14} style={{ opacity: showRightPanel ? 1 : 0.4 }} />
        </button>

        {/* Export quick button */}
        <button
          onClick={() => setExportOpen(true)}
          className="btn-neon flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ml-1"
          style={{ fontSize: 12 }}
        >
          <Download size={12} /> Export
        </button>
      </div>

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageImport} />
      <input ref={projectInputRef} type="file" accept=".proproject" className="hidden" />

      {/* New Project Dialog */}
      <NewProjectDialog open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />

      {/* Export Dialog */}
      <Dialog.Root open={exportOpen} onOpenChange={setExportOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
          <Dialog.Content
            className="fixed z-50 glass-modal rounded-2xl p-6 animate-slide-up"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 380 }}
          >
            <Dialog.Title className="text-base font-bold mb-4" style={{ color: '#fff' }}>Export Image</Dialog.Title>
            <div className="space-y-4">
              <div>
                <label className="panel-label block mb-1.5">FORMAT</label>
                <div className="flex gap-2">
                  {(['png', 'jpeg', 'webp'] as const).map(f => (
                    <button
                      key={f}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold uppercase transition-all"
                      style={{
                        background: exportFormat === f ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${exportFormat === f ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: exportFormat === f ? '#00F0FF' : 'rgba(255,255,255,0.5)',
                      }}
                      onClick={() => setExportFormat(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              {exportFormat !== 'png' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="panel-label">QUALITY</label>
                    <span className="text-xs font-mono" style={{ color: '#00F0FF' }}>{exportQuality}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={exportQuality}
                    onChange={e => setExportQuality(Number(e.target.value))} style={{ accentColor: '#00F0FF' }} />
                </div>
              )}
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Output: {project.width} × {project.height} px
              </p>
              <div className="flex gap-2 pt-2">
                <button className="btn-ghost flex-1 px-4 py-2 rounded-lg text-sm" onClick={() => setExportOpen(false)}>Cancel</button>
                <button className="btn-neon flex-1 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2" onClick={handleExport}>
                  <Download size={14} /> Export
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Stop recording dialog */}
      <Dialog.Root open={showStopDialog} onOpenChange={setShowStopDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <Dialog.Content
            className="fixed z-50 glass-modal rounded-2xl p-6 animate-slide-up"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 340 }}
          >
            <Dialog.Title className="text-base font-bold mb-4" style={{ color: '#fff' }}>Save Recording</Dialog.Title>
            <input
              className="aether-input mb-4"
              placeholder="Action name..."
              value={stopName}
              onChange={e => setStopName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleStopRecording() }}
              autoFocus
            />
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 px-3 py-2 rounded-lg text-sm" onClick={() => setShowStopDialog(false)}>Discard</button>
              <button className="btn-neon flex-1 px-3 py-2 rounded-lg text-sm font-semibold" onClick={handleStopRecording}>Save Action</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export default TopBar
