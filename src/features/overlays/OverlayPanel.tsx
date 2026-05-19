import React, { useState, useRef, useCallback } from 'react'
import { Upload, Search, Image as ImageIcon, ExternalLink, Loader2, X, Plus } from 'lucide-react'
import { useEditorStore } from '../../context/editorStore'
import { readFileAsDataURL } from '../../utils/helpers'

const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_KEY'  // User fills in or skips
const PIXABAY_API_KEY = 'YOUR_PIXABAY_KEY'         // User fills in or skips

interface StockPhoto {
  id: string
  thumb: string
  small: string
  full: string
  author: string
  source: 'unsplash' | 'pixabay'
}

const OverlayPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'stock' | 'eraser'>('upload')
  const [stockQuery, setStockQuery] = useState('')
  const [stockSource, setStockSource] = useState<'unsplash' | 'pixabay'>('unsplash')
  const [photos, setPhotos] = useState<StockPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eraserSize, setEraserSize] = useState(30)
  const [eraserHardness, setEraserHardness] = useState(50)
  const dropRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addLayer, setActiveTool } = useEditorStore()

  const getCanvas = () => (window as Window & {
    __aetherCanvas?: { addImage?: (url: string, name: string) => Promise<void> }
  }).__aetherCanvas

  const addImageToEditor = useCallback(async (url: string, name: string) => {
    const canvas = getCanvas()
    await canvas?.addImage?.(url, name)
  }, [])

  // ── Drag & Drop Upload ─────────────────────────────────────────────────
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    dropRef.current!.style.borderColor = 'rgba(0,240,255,0.2)'
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    for (const file of files) {
      const dataUrl = await readFileAsDataURL(file)
      await addImageToEditor(dataUrl, file.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      const dataUrl = await readFileAsDataURL(file)
      await addImageToEditor(dataUrl, file.name.replace(/\.[^.]+$/, ''))
    }
    e.target.value = ''
  }

  // ── Stock Photo Search ─────────────────────────────────────────────────
  const searchUnsplash = async (q: string) => {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=20&client_id=${UNSPLASH_ACCESS_KEY}`
    )
    if (!res.ok) throw new Error('Unsplash API error')
    const data = await res.json()
    return (data.results as {
      id: string
      urls: { thumb: string; small: string; full: string }
      user: { name: string }
    }[]).map(photo => ({
      id: photo.id,
      thumb: photo.urls.thumb,
      small: photo.urls.small,
      full: photo.urls.full,
      author: photo.user.name,
      source: 'unsplash' as const,
    }))
  }

  const searchPixabay = async (q: string) => {
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=20`
    )
    if (!res.ok) throw new Error('Pixabay API error')
    const data = await res.json()
    return (data.hits as {
      id: number
      previewURL: string
      webformatURL: string
      largeImageURL: string
      user: string
    }[]).map(hit => ({
      id: String(hit.id),
      thumb: hit.previewURL,
      small: hit.webformatURL,
      full: hit.largeImageURL,
      author: hit.user,
      source: 'pixabay' as const,
    }))
  }

  const handleSearch = async () => {
    if (!stockQuery.trim()) return
    setLoading(true)
    setError(null)
    setPhotos([])
    try {
      const results = stockSource === 'unsplash'
        ? await searchUnsplash(stockQuery)
        : await searchPixabay(stockQuery)
      setPhotos(results)
    } catch (e) {
      setError(`API error. Add your ${stockSource === 'unsplash' ? 'Unsplash' : 'Pixabay'} API key in OverlayPanel.tsx`)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoImport = async (photo: StockPhoto) => {
    // Proxy through a CORS-safe endpoint or use crossorigin attribute
    await addImageToEditor(photo.small, `${photo.source}-${photo.id}`)
  }

  return (
    <div className="px-3 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon size={13} style={{ color: '#00F0FF' }} />
        <span className="panel-label" style={{ color: 'rgba(255,255,255,0.6)' }}>OVERLAYS & IMAGES</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {([
          { key: 'upload', label: 'Upload' },
          { key: 'stock', label: 'Stock' },
          { key: 'eraser', label: 'Eraser' },
        ] as const).map(t => (
          <button key={t.key}
            className={`tab-trigger flex-1 text-xs py-1 rounded ${activeTab === t.key ? 'active' : ''}`}
            style={{ fontSize: 10 }} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── UPLOAD TAB ──────────────────────────────────────── */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <div
            ref={dropRef}
            className="rounded-xl p-6 text-center cursor-pointer transition-all"
            style={{
              border: '2px dashed rgba(0,240,255,0.2)',
              background: 'rgba(0,240,255,0.03)',
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); dropRef.current!.style.borderColor = '#00F0FF' }}
            onDragLeave={() => { dropRef.current!.style.borderColor = 'rgba(0,240,255,0.2)' }}
            onDrop={handleDrop}
          >
            <Upload size={24} style={{ color: 'rgba(0,240,255,0.5)', margin: '0 auto 10px' }} />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Drag & Drop Images</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>PNG, JPG, WebP, GIF, AVIF</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
          </div>

          <button
            className="btn-neon w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
            onClick={() => fileRef.current?.click()}
          >
            <Plus size={14} /> Add Image Layer
          </button>
        </div>
      )}

      {/* ── STOCK TAB ──────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <div className="space-y-3">
          {/* Source selector */}
          <div className="flex gap-1.5">
            {(['unsplash', 'pixabay'] as const).map(s => (
              <button key={s}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background: stockSource === s ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${stockSource === s ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: stockSource === s ? '#00F0FF' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                }}
                onClick={() => setStockSource(s)}>
                {s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                className="aether-input pl-7"
                placeholder={`Search ${stockSource}…`}
                value={stockQuery}
                onChange={e => setStockQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                style={{ fontSize: 11 }}
              />
            </div>
            <button className="btn-neon px-3 rounded-lg text-xs font-semibold" onClick={handleSearch}>
              Go
            </button>
          </div>

          {error && (
            <div className="p-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', fontSize: 10 }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: '#00F0FF' }} />
            </div>
          )}

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 panel-scroll" style={{ maxHeight: 280 }}>
              {photos.map(photo => (
                <div key={photo.id}
                  className="relative group rounded-lg overflow-hidden cursor-pointer"
                  style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.05)' }}
                  onClick={() => handlePhotoImport(photo)}>
                  <img src={photo.thumb} alt={photo.author} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ background: 'rgba(0,240,255,0.2)' }}>
                    <Plus size={20} style={{ color: '#fff' }} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.7)', fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>
                    {photo.author}
                  </div>
                </div>
              ))}
            </div>
          )}

          {photos.length === 0 && !loading && !error && (
            <div className="text-center py-8">
              <ImageIcon size={28} style={{ color: 'rgba(255,255,255,0.08)', margin: '0 auto 8px' }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>
                Search for free stock photos
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── ERASER TAB ─────────────────────────────────────── */}
      {activeTab === 'eraser' && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.6 }}>
            Select an image layer, then paint to erase pixels non-destructively. The original layer data is preserved.
          </p>

          {[
            { label: 'Brush Size', value: eraserSize, setValue: setEraserSize, min: 1, max: 300, color: '#00F0FF' },
            { label: 'Hardness', value: eraserHardness, setValue: setEraserHardness, min: 0, max: 100, color: '#6366F1' },
          ].map(opt => (
            <div key={opt.label} className="flex items-center gap-2">
              <span className="panel-label w-20 flex-shrink-0" style={{ fontSize: 9 }}>{opt.label}</span>
              <input type="range" min={opt.min} max={opt.max} value={opt.value}
                onChange={e => opt.setValue(Number(e.target.value))}
                style={{ accentColor: opt.color, flex: 1 }} />
              <span className="text-xs font-mono w-8 text-right" style={{ color: opt.color, fontSize: 10 }}>{opt.value}</span>
            </div>
          ))}

          {/* Brush preview */}
          <div className="flex items-center justify-center py-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="rounded-full border-2" style={{
              width: Math.min(eraserSize, 80),
              height: Math.min(eraserSize, 80),
              borderColor: '#00F0FF',
              boxShadow: `0 0 ${eraserHardness * 0.2}px rgba(0,240,255,${eraserHardness * 0.008})`,
              background: `radial-gradient(circle, rgba(0,240,255,${eraserHardness * 0.003}) 0%, transparent 100%)`,
            }} />
          </div>

          <button
            className="btn-neon w-full py-2.5 rounded-xl text-xs font-semibold"
            onClick={() => setActiveTool('eraser')}
          >
            Activate Eraser Tool
          </button>

          <div className="p-2 rounded-lg text-xs" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1.6 }}>
            💡 Tip: Hold Alt while erasing to restore pixels. Use low hardness for soft, photorealistic blending.
          </div>
        </div>
      )}
    </div>
  )
}

export default OverlayPanel
