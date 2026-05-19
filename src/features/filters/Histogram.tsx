import React, { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../../context/editorStore'

interface HistogramData {
  r: Uint32Array
  g: Uint32Array
  b: Uint32Array
  lum: Uint32Array
}

function computeHistogram(canvas: HTMLCanvasElement): HistogramData {
  const ctx = canvas.getContext('2d')
  const data: HistogramData = {
    r: new Uint32Array(256),
    g: new Uint32Array(256),
    b: new Uint32Array(256),
    lum: new Uint32Array(256),
  }
  if (!ctx) return data

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]
    if (a === 0) continue
    data.r[r]++
    data.g[g]++
    data.b[b]++
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    data.lum[lum]++
  }

  return data
}

function drawHistogram(
  histCanvas: HTMLCanvasElement,
  data: HistogramData,
  channel: 'rgb' | 'r' | 'g' | 'b' | 'lum'
): void {
  const ctx = histCanvas.getContext('2d')
  if (!ctx) return

  const w = histCanvas.width
  const h = histCanvas.height
  ctx.clearRect(0, 0, w, h)

  // Background
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, w, h)

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const x = (i / 4) * w
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let i = 1; i < 3; i++) {
    const y = (i / 3) * h
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  const channels = channel === 'rgb'
    ? [
      { data: data.r, color: 'rgba(239,68,68,0.7)' },
      { data: data.g, color: 'rgba(34,197,94,0.7)' },
      { data: data.b, color: 'rgba(59,130,246,0.7)' },
    ]
    : channel === 'r' ? [{ data: data.r, color: 'rgba(239,68,68,0.9)' }]
    : channel === 'g' ? [{ data: data.g, color: 'rgba(34,197,94,0.9)' }]
    : channel === 'b' ? [{ data: data.b, color: 'rgba(59,130,246,0.9)' }]
    : [{ data: data.lum, color: 'rgba(255,255,255,0.6)' }]

  channels.forEach(({ data: ch, color }) => {
    const max = Math.max(...ch)
    if (max === 0) return

    ctx.beginPath()
    ctx.moveTo(0, h)

    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * w
      const y = h - (ch[i] / max) * h * 0.95
      if (i === 0) ctx.lineTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.lineTo(w, h)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, color.replace('0.7', '0.1').replace('0.9', '0.2').replace('0.6', '0.1'))
    ctx.fillStyle = gradient
    ctx.fill()

    // Line on top
    ctx.beginPath()
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * w
      const y = h - (ch[i] / max) * h * 0.95
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()
  })
}

const Histogram: React.FC = () => {
  const histRef = useRef<HTMLCanvasElement>(null)
  const [activeChannel, setActiveChannel] = React.useState<'rgb' | 'r' | 'g' | 'b' | 'lum'>('rgb')
  const { isDirty } = useEditorStore()

  const updateHistogram = useCallback(() => {
    const histCanvas = histRef.current
    if (!histCanvas) return

    const fabricCanvas = (window as Window & { __aetherCanvas?: { getFabric: () => HTMLCanvasElement | null } }).__aetherCanvas?.getFabric?.()
    if (!fabricCanvas) return

    // @ts-expect-error Fabric canvas has getElement method
    const sourceCanvas = fabricCanvas.getElement ? fabricCanvas.getElement() : fabricCanvas
    if (!sourceCanvas) return

    const data = computeHistogram(sourceCanvas as HTMLCanvasElement)
    drawHistogram(histCanvas, data, activeChannel)
  }, [activeChannel])

  useEffect(() => {
    const timer = setTimeout(updateHistogram, 100)
    return () => clearTimeout(timer)
  }, [isDirty, activeChannel, updateHistogram])

  const channels: { key: 'rgb' | 'r' | 'g' | 'b' | 'lum'; label: string; color: string }[] = [
    { key: 'rgb', label: 'RGB', color: '#fff' },
    { key: 'r', label: 'R', color: '#ef4444' },
    { key: 'g', label: 'G', color: '#22c55e' },
    { key: 'b', label: 'B', color: '#3b82f6' },
    { key: 'lum', label: 'Lum', color: '#aaa' },
  ]

  return (
    <div className="px-3 py-3 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="panel-label">HISTOGRAM</span>
        <div className="flex items-center gap-1">
          {channels.map(ch => (
            <button
              key={ch.key}
              className={`tab-trigger px-2 py-0.5 text-xs rounded ${activeChannel === ch.key ? 'active' : ''}`}
              style={{ fontSize: 10, color: activeChannel === ch.key ? ch.color : 'rgba(255,255,255,0.35)' }}
              onClick={() => setActiveChannel(ch.key)}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      <canvas
        ref={histRef}
        width={260}
        height={80}
        className="histogram-canvas w-full rounded-md"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
      />
    </div>
  )
}

export default Histogram
