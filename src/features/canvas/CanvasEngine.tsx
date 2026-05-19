import React, { useEffect, useRef, useCallback, useState } from 'react'
// @ts-ignore
import { fabric } from 'fabric'
import { useEditorStore } from '../../context/editorStore'
import { uid, generateThumbnail, readFileAsDataURL } from '../../utils/helpers'
import { useHistory } from '../../hooks/useHistory'
import type { Layer } from '../../context/editorStore'

// WebGL Shader code for image filters
const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_hue;
  uniform float u_exposure;
  uniform float u_highlights;
  uniform float u_shadows;
  uniform float u_temperature;
  uniform float u_tint;
  uniform float u_vignette;
  varying vec2 v_texCoord;

  vec3 rgb2hsl(vec3 c) {
    float maxC = max(max(c.r, c.g), c.b);
    float minC = min(min(c.r, c.g), c.b);
    float l = (maxC + minC) / 2.0;
    if (maxC == minC) return vec3(0.0, 0.0, l);
    float d = maxC - minC;
    float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    float h;
    if (maxC == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if (maxC == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
    return vec3(h / 6.0, s, l);
  }

  float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
  }

  vec3 hsl2rgb(vec3 hsl) {
    if (hsl.y == 0.0) return vec3(hsl.z);
    float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
    float p = 2.0 * hsl.z - q;
    return vec3(hue2rgb(p,q,hsl.x+1.0/3.0), hue2rgb(p,q,hsl.x), hue2rgb(p,q,hsl.x-1.0/3.0));
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    vec3 rgb = color.rgb;

    // Exposure
    rgb *= pow(2.0, u_exposure);

    // Brightness
    rgb = rgb + vec3(u_brightness / 100.0);

    // Contrast
    float cf = (100.0 + u_contrast) / 100.0;
    rgb = (rgb - 0.5) * cf + 0.5;

    // Highlights / Shadows
    float lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    rgb += vec3(u_highlights / 200.0 * smoothstep(0.5, 1.0, lum));
    rgb += vec3(u_shadows / 200.0 * smoothstep(0.5, 0.0, lum));

    // Temperature / Tint (white balance)
    rgb.r += u_temperature * 0.01;
    rgb.b -= u_temperature * 0.01;
    rgb.g += u_tint * 0.01;

    // Saturation & Hue via HSL
    vec3 hsl = rgb2hsl(clamp(rgb, 0.0, 1.0));
    hsl.x = mod(hsl.x + u_hue / 360.0, 1.0);
    hsl.y = clamp(hsl.y * (1.0 + u_saturation / 100.0), 0.0, 1.0);
    rgb = hsl2rgb(hsl);

    // Vignette
    if (u_vignette != 0.0) {
      vec2 uv = v_texCoord - 0.5;
      float vig = 1.0 - smoothstep(0.3, 0.8, length(uv) * abs(u_vignette) / 50.0);
      if (u_vignette < 0.0) rgb *= vig;
      else rgb = mix(rgb, vec3(1.0), (1.0 - vig) * u_vignette / 100.0);
    }

    gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
  }
`

interface CanvasEngineProps {
  className?: string
}

const CanvasEngine: React.FC<CanvasEngineProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glCanvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const {
    activeTool, zoom, panX, panY,
    project, canvasReady, setCanvasReady,
    adjustments, showGrid,
    foregroundColor, brush,
    addLayer, updateLayer, selectLayer,
  } = useEditorStore()

  const { snapshot } = useHistory()

  // ── Initialize Fabric.js ─────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: project.width,
      height: project.height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      renderOnAddRemove: true,
      enableRetinaScaling: true,
      fireMiddleClick: true,
    })

    fabricRef.current = canvas
    setCanvasReady(true)

    // Resize observer
    const observer = new ResizeObserver(() => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    if (containerRef.current) observer.observe(containerRef.current)

    // Selection events
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => {
      useEditorStore.setState({ selectedLayerIds: [] })
    })

    // Object modified
    canvas.on('object:modified', () => {
      const json = JSON.stringify(canvas.toJSON(['id', 'layerId', 'name']))
      snapshot('Object modified', json)
    })

    // Mouse wheel zoom
    canvas.on('mouse:wheel', (opt: any) => {
      const delta = (opt.e as WheelEvent).deltaY
      let z = canvas.getZoom()
      z *= 0.999 ** delta
      z = Math.max(0.01, Math.min(32, z))
      const point = new fabric.Point((opt.e as WheelEvent).offsetX, (opt.e as WheelEvent).offsetY)
      canvas.zoomToPoint(point, z)
      useEditorStore.getState().setZoom(Math.round(z * 100))
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })

    // Pan with middle mouse
    let panning = false
    let lastPan = { x: 0, y: 0 }
    canvas.on('mouse:down', (opt: any) => {
      if ((opt.e as MouseEvent).button === 1 || activeTool === 'hand') {
        panning = true
        lastPan = { x: (opt.e as MouseEvent).clientX, y: (opt.e as MouseEvent).clientY }
        canvas.defaultCursor = 'grabbing'
      }
    })
    canvas.on('mouse:move', (opt: any) => {
      if (panning) {
        const dx = (opt.e as MouseEvent).clientX - lastPan.x
        const dy = (opt.e as MouseEvent).clientY - lastPan.y
        canvas.relativePan(new fabric.Point(dx, dy))
        lastPan = { x: (opt.e as MouseEvent).clientX, y: (opt.e as MouseEvent).clientY }
      }
    })
    canvas.on('mouse:up', () => {
      panning = false
      canvas.defaultCursor = 'default'
    })

    return () => {
      observer.disconnect()
      canvas.dispose()
      setCanvasReady(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Selection handler ────────────────────────────────────────────────────
  const handleSelection = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const selected = canvas.getActiveObjects()
    const ids = selected.map((o: any) => (o as fabric.Object & { layerId?: string }).layerId).filter(Boolean) as string[]
    useEditorStore.setState({ selectedLayerIds: ids })
  }, [])

  // ── Tool management ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    switch (activeTool) {
      case 'select':
        canvas.isDrawingMode = false
        canvas.selection = true
        canvas.defaultCursor = 'default'
        break
      case 'move':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'move'
        break
      case 'brush':
        canvas.isDrawingMode = true
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
        canvas.freeDrawingBrush.color = foregroundColor
        canvas.freeDrawingBrush.width = brush.size
        canvas.defaultCursor = 'crosshair'
        break
      case 'eraser':
        canvas.isDrawingMode = false
        canvas.defaultCursor = 'crosshair'
        break
      case 'zoom':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'zoom-in'
        break
      case 'hand':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'grab'
        break
      case 'eyedropper':
        canvas.isDrawingMode = false
        canvas.selection = false
        canvas.defaultCursor = 'crosshair'
        break
      default:
        canvas.isDrawingMode = false
        canvas.selection = true
        break
    }
  }, [activeTool, foregroundColor, brush.size])

  // ── Update zoom from store ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const center = canvas.getCenter()
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom / 100)
  }, [zoom])

  // ── Grid overlay ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    // Remove existing grid lines
    const gridObjects = canvas.getObjects().filter((o: any) =>
      (o as fabric.Object & { isGrid?: boolean }).isGrid
    )
    gridObjects.forEach((o: any) => canvas.remove(o))

    if (showGrid) {
      const gridSize = 20
      const w = project.width
      const h = project.height
      for (let x = 0; x <= w; x += gridSize) {
        const line = new fabric.Line([x, 0, x, h], {
          stroke: 'rgba(255,255,255,0.08)',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        }) as fabric.Line & { isGrid: boolean }
        line.isGrid = true
        canvas.add(line)
      }
      for (let y = 0; y <= h; y += gridSize) {
        const line = new fabric.Line([0, y, w, y], {
          stroke: 'rgba(255,255,255,0.08)',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        }) as fabric.Line & { isGrid: boolean }
        line.isGrid = true
        canvas.add(line)
      }
      canvas.sendToBack(canvas.getObjects().filter((o: any) => !(o as fabric.Object & { isGrid?: boolean }).isGrid)[0])
    }
    canvas.renderAll()
  }, [showGrid, project.width, project.height])

  // ── Public API via ref ───────────────────────────────────────────────────
  const addImageToCanvas = useCallback(async (dataUrl: string, name: string) => {
    const canvas = fabricRef.current
    if (!canvas) return

    return new Promise<void>((resolve) => {
      fabric.Image.fromURL(dataUrl, (img: any) => {
        const id = uid('layer')
        const maxW = canvas.width! * 0.8
        const maxH = canvas.height! * 0.8
        const scale = Math.min(maxW / img.width!, maxH / img.height!, 1)
        img.set({
          left: (canvas.width! - img.width! * scale) / 2,
          top: (canvas.height! - img.height! * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          cornerColor: '#00F0FF',
          cornerStrokeColor: '#00F0FF',
          borderColor: '#00F0FF',
          borderScaleFactor: 1.5,
          cornerSize: 8,
          transparentCorners: false,
        })
        ;(img as fabric.Image & { layerId: string }).layerId = id
        canvas.add(img)
        canvas.setActiveObject(img)

        const layer: Layer = {
          id,
          name,
          type: 'image',
          visible: true,
          locked: false,
          lockedAlpha: false,
          opacity: 100,
          blendMode: 'normal',
          order: canvas.getObjects().length,
          selected: true,
          hasMask: false,
          maskEnabled: false,
          thumbnail: generateThumbnail(canvas.getElement()),
        }
        addLayer(layer)
        canvas.renderAll()
        resolve()
      }, { crossOrigin: 'anonymous' })
    })
  }, [addLayer])

  const addTextToCanvas = useCallback((text = 'Double click to edit', options: Partial<fabric.ITextboxOptions> = {}) => {
    const canvas = fabricRef.current
    if (!canvas) return

    const id = uid('layer')
    const textObj = new fabric.Textbox(text, {
      left: canvas.width! / 2 - 100,
      top: canvas.height! / 2 - 20,
      width: 300,
      fontSize: 48,
      fontFamily: 'Plus Jakarta Sans',
      fill: useEditorStore.getState().foregroundColor,
      fontWeight: 'bold',
      textAlign: 'center',
      cornerColor: '#00F0FF',
      cornerStrokeColor: '#00F0FF',
      borderColor: '#00F0FF',
      borderScaleFactor: 1.5,
      cornerSize: 8,
      transparentCorners: false,
      ...options,
    })
    ;(textObj as fabric.Textbox & { layerId: string }).layerId = id
    canvas.add(textObj)
    canvas.setActiveObject(textObj)

    const layer: Layer = {
      id,
      name: `Text: "${text.slice(0, 20)}"`,
      type: 'text',
      visible: true,
      locked: false,
      lockedAlpha: false,
      opacity: 100,
      blendMode: 'normal',
      order: canvas.getObjects().length,
      selected: true,
      hasMask: false,
      maskEnabled: false,
    }
    addLayer(layer)
    canvas.renderAll()
  }, [addLayer])

  const addShapeToCanvas = useCallback((shapeType: 'rectangle' | 'ellipse' | 'line' | 'polygon') => {
    const canvas = fabricRef.current
    if (!canvas) return

    const id = uid('layer')
    const cx = canvas.width! / 2
    const cy = canvas.height! / 2
    const commonOpts = {
      left: cx - 75,
      top: cy - 75,
      fill: useEditorStore.getState().foregroundColor,
      stroke: 'transparent',
      strokeWidth: 2,
      cornerColor: '#00F0FF',
      cornerStrokeColor: '#00F0FF',
      borderColor: '#00F0FF',
      cornerSize: 8,
      transparentCorners: false,
    }

    let shape: fabric.Object
    let typeName = ''

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({ ...commonOpts, width: 150, height: 150 })
        typeName = 'Rectangle'
        break
      case 'ellipse':
        shape = new fabric.Ellipse({ ...commonOpts, rx: 75, ry: 75 })
        typeName = 'Ellipse'
        break
      case 'line':
        shape = new fabric.Line([cx - 100, cy, cx + 100, cy], {
          stroke: useEditorStore.getState().foregroundColor,
          strokeWidth: 4,
          cornerColor: '#00F0FF',
          borderColor: '#00F0FF',
          cornerSize: 8,
          transparentCorners: false,
        })
        typeName = 'Line'
        break
      default:
        shape = new fabric.Rect({ ...commonOpts, width: 150, height: 150 })
        typeName = 'Shape'
    }

    ;(shape as fabric.Object & { layerId: string }).layerId = id
    canvas.add(shape)
    canvas.setActiveObject(shape)

    const layer: Layer = {
      id,
      name: typeName,
      type: 'shape',
      visible: true,
      locked: false,
      lockedAlpha: false,
      opacity: 100,
      blendMode: 'normal',
      order: canvas.getObjects().length,
      selected: true,
      hasMask: false,
      maskEnabled: false,
    }
    addLayer(layer)
    canvas.renderAll()
  }, [addLayer])

  const exportCanvas = useCallback((format: 'png' | 'jpeg' | 'webp' = 'png', quality = 1): string => {
    const canvas = fabricRef.current
    if (!canvas) return ''
    // Remove grid objects before export
    const origObjects = canvas.getObjects()
    const gridObjects = origObjects.filter((o: any) => (o as fabric.Object & { isGrid?: boolean }).isGrid)
    gridObjects.forEach((o: any) => o.visible = false)
    canvas.renderAll()
    const dataUrl = canvas.toDataURL({ format, quality, multiplier: 1 })
    gridObjects.forEach((o: any) => o.visible = true)
    canvas.renderAll()
    return dataUrl
  }, [])

  const getCanvasJSON = useCallback((): string => {
    const canvas = fabricRef.current
    if (!canvas) return '{}'
    return JSON.stringify(canvas.toJSON(['id', 'layerId', 'name', 'isGrid']))
  }, [])

  // Expose canvas API globally (used by other components)
  useEffect(() => {
    ;(window as Window & { __aetherCanvas?: {
      addImage: typeof addImageToCanvas
      addText: typeof addTextToCanvas
      addShape: typeof addShapeToCanvas
      export: typeof exportCanvas
      getJSON: typeof getCanvasJSON
      getFabric: () => fabric.Canvas | null
    } }).__aetherCanvas = {
      addImage: addImageToCanvas,
      addText: addTextToCanvas,
      addShape: addShapeToCanvas,
      export: exportCanvas,
      getJSON: getCanvasJSON,
      getFabric: () => fabricRef.current,
    }
  }, [addImageToCanvas, addTextToCanvas, addShapeToCanvas, exportCanvas, getCanvasJSON])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    for (const file of files) {
      const dataUrl = await readFileAsDataURL(file)
      await addImageToCanvas(dataUrl, file.name.replace(/\.[^.]+$/, ''))
    }
  }, [addImageToCanvas])

  return (
    <div 
      ref={containerRef} 
      className={`relative flex-1 overflow-hidden canvas-workspace ${className}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false) }}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingFile && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="p-8 rounded-2xl flex flex-col items-center" style={{ border: '2px dashed #00F0FF', background: 'rgba(0,240,255,0.1)' }}>
            <p className="text-xl font-bold" style={{ color: '#00F0FF' }}>Drop Image Here</p>
          </div>
        </div>
      )}

      {/* Main Fabric canvas */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ cursor: activeTool === 'hand' ? 'grab' : 'default' }}
      >
        <div
          className="relative shadow-2xl"
          style={{
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.8)',
          }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 px-3 py-1 rounded-md text-xs font-mono font-medium"
        style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {zoom}%
      </div>

      {/* Canvas size indicator */}
      {canvasReady && (
        <div className="absolute bottom-4 right-4 px-3 py-1 rounded-md text-xs font-mono"
          style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {project.width} × {project.height} px
        </div>
      )}
    </div>
  )
}

export default CanvasEngine
