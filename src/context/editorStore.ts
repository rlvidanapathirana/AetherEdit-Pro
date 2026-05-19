import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'

// ── Types ────────────────────────────────────────────────────────────────────

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity'

export type LayerType = 'image' | 'text' | 'shape' | 'adjustment' | 'group'

export type ToolType =
  | 'select' | 'move' | 'crop' | 'brush' | 'eraser' | 'text'
  | 'rectangle' | 'ellipse' | 'line' | 'polygon' | 'lasso'
  | 'magic-wand' | 'zoom' | 'hand' | 'eyedropper' | 'heal'
  | 'clone' | 'blur-tool' | 'sharpen-tool'

export interface AdjustmentSettings {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  exposure: number
  highlights: number
  shadows: number
  whites: number
  blacks: number
  clarity: number
  vibrance: number
  sharpness: number
  noiseReduction: number
  vignette: number
  temperature: number
  tint: number
}

export interface HSLChannel {
  hue: number
  saturation: number
  luminance: number
}

export interface HSLSettings {
  red: HSLChannel
  orange: HSLChannel
  yellow: HSLChannel
  green: HSLChannel
  cyan: HSLChannel
  blue: HSLChannel
  purple: HSLChannel
  magenta: HSLChannel
}

export interface CurvePoint {
  x: number
  y: number
}

export interface CurvesSettings {
  master: CurvePoint[]
  red: CurvePoint[]
  green: CurvePoint[]
  blue: CurvePoint[]
}

export interface Layer {
  id: string
  name: string
  type: LayerType
  visible: boolean
  locked: boolean
  lockedAlpha: boolean
  opacity: number
  blendMode: BlendMode
  order: number
  selected: boolean
  hasMask: boolean
  maskEnabled: boolean
  groupId?: string
  fabricObjectId?: string
  thumbnail?: string
}

export interface LayerGroup {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: BlendMode
  collapsed: boolean
  order: number
}

export interface HistoryEntry {
  id: string
  label: string
  timestamp: number
  snapshot: string
}

export interface BrushSettings {
  size: number
  hardness: number
  opacity: number
  flow: number
  color: string
  eraserSize: number
}

export interface ProjectMeta {
  id?: number
  name: string
  width: number
  height: number
  dpi: number
  colorProfile: string
}

export interface RecordedAction {
  id: string
  name: string
  description: string
  steps: RecordedStep[]
  createdAt: Date
}

export interface RecordedStep {
  type: string
  payload: Record<string, unknown>
  timestamp: number
}

// ── Default values ────────────────────────────────────────────────────────────

const defaultAdjustments: AdjustmentSettings = {
  brightness: 0, contrast: 0, saturation: 0, hue: 0,
  exposure: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  clarity: 0, vibrance: 0, sharpness: 0, noiseReduction: 0,
  vignette: 0, temperature: 0, tint: 0,
}

const defaultHSLChannel: HSLChannel = { hue: 0, saturation: 0, luminance: 0 }

const defaultHSL: HSLSettings = {
  red: { ...defaultHSLChannel },
  orange: { ...defaultHSLChannel },
  yellow: { ...defaultHSLChannel },
  green: { ...defaultHSLChannel },
  cyan: { ...defaultHSLChannel },
  blue: { ...defaultHSLChannel },
  purple: { ...defaultHSLChannel },
  magenta: { ...defaultHSLChannel },
}

const defaultCurvePoints: CurvePoint[] = [{ x: 0, y: 0 }, { x: 255, y: 255 }]

const defaultCurves: CurvesSettings = {
  master: [...defaultCurvePoints],
  red: [...defaultCurvePoints],
  green: [...defaultCurvePoints],
  blue: [...defaultCurvePoints],
}

const defaultBrush: BrushSettings = {
  size: 20, hardness: 80, opacity: 100, flow: 100,
  color: '#ffffff', eraserSize: 20,
}

// ── Store Interface ───────────────────────────────────────────────────────────

interface EditorState {
  // Project
  project: ProjectMeta
  canvasReady: boolean
  isDirty: boolean
  isSaving: boolean
  isRecording: boolean

  // Layers
  layers: Layer[]
  groups: LayerGroup[]
  selectedLayerIds: string[]

  // Tool
  activeTool: ToolType
  previousTool: ToolType
  brush: BrushSettings

  // Adjustments
  adjustments: AdjustmentSettings
  hsl: HSLSettings
  curves: CurvesSettings

  // UI Panels
  showLeftPanel: boolean
  showRightPanel: boolean
  showBottomBar: boolean
  activeRightTab: string
  activeFilterTab: string

  // Zoom & View
  zoom: number
  panX: number
  panY: number
  showRulers: boolean
  showGrid: boolean
  showGuides: boolean
  snapToGrid: boolean

  // Colors
  foregroundColor: string
  backgroundColor: string

  // History
  history: HistoryEntry[]
  historyIndex: number

  // Actions
  recordedActions: RecordedAction[]
  currentRecording: RecordedStep[]

  // AI
  aiProcessing: boolean
  aiProgress: number
  aiStatus: string

  // Actions (Zustand methods)
  setProject: (project: Partial<ProjectMeta>) => void
  setCanvasReady: (ready: boolean) => void
  setDirty: (dirty: boolean) => void
  setSaving: (saving: boolean) => void

  addLayer: (layer: Layer) => void
  removeLayer: (id: string) => void
  updateLayer: (id: string, changes: Partial<Layer>) => void
  selectLayer: (id: string, multi?: boolean) => void
  reorderLayers: (layers: Layer[]) => void
  duplicateLayer: (id: string) => void
  mergeSelectedLayers: () => void
  flattenAll: () => void
  toggleLayerVisibility: (id: string) => void
  toggleLayerLock: (id: string) => void

  setActiveTool: (tool: ToolType) => void
  setBrush: (changes: Partial<BrushSettings>) => void

  setAdjustments: (changes: Partial<AdjustmentSettings>) => void
  resetAdjustments: () => void
  setHSL: (channel: keyof HSLSettings, prop: keyof HSLChannel, value: number) => void
  resetHSL: () => void
  setCurvePoint: (channel: keyof CurvesSettings, points: CurvePoint[]) => void
  resetCurves: () => void

  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setShowRulers: (v: boolean) => void
  setShowGrid: (v: boolean) => void
  setSnapToGrid: (v: boolean) => void

  setForegroundColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  swapColors: () => void

  pushHistory: (label: string, snapshot: string) => void
  undo: () => string | null
  redo: () => string | null

  setActiveRightTab: (tab: string) => void
  setActiveFilterTab: (tab: string) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void

  addRecordedAction: (action: RecordedAction) => void
  startRecording: () => void
  stopRecording: (name: string, description: string) => RecordedAction | null
  addRecordingStep: (step: RecordedStep) => void

  setAIProcessing: (v: boolean, progress?: number, status?: string) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      project: { name: 'Untitled Project', width: 1920, height: 1080, dpi: 72, colorProfile: 'sRGB' },
      canvasReady: false,
      isDirty: false,
      isSaving: false,
      isRecording: false,

      layers: [],
      groups: [],
      selectedLayerIds: [],

      activeTool: 'select',
      previousTool: 'select',
      brush: defaultBrush,

      adjustments: { ...defaultAdjustments },
      hsl: { ...defaultHSL },
      curves: { ...defaultCurves },

      showLeftPanel: true,
      showRightPanel: true,
      showBottomBar: true,
      activeRightTab: 'layers',
      activeFilterTab: 'basic',

      zoom: 100,
      panX: 0,
      panY: 0,
      showRulers: true,
      showGrid: false,
      showGuides: true,
      snapToGrid: false,

      foregroundColor: '#ffffff',
      backgroundColor: '#000000',

      history: [],
      historyIndex: -1,

      recordedActions: [],
      currentRecording: [],

      aiProcessing: false,
      aiProgress: 0,
      aiStatus: '',

      // Project
      setProject: (project) => set(state => { Object.assign(state.project, project) }),
      setCanvasReady: (ready) => set(state => { state.canvasReady = ready }),
      setDirty: (dirty) => set(state => { state.isDirty = dirty }),
      setSaving: (saving) => set(state => { state.isSaving = saving }),

      // Layers
      addLayer: (layer) => set(state => {
        state.layers.unshift(layer)
        state.selectedLayerIds = [layer.id]
        state.isDirty = true
      }),

      removeLayer: (id) => set(state => {
        state.layers = state.layers.filter(l => l.id !== id)
        state.selectedLayerIds = state.selectedLayerIds.filter(sid => sid !== id)
        state.isDirty = true
      }),

      updateLayer: (id, changes) => set(state => {
        const idx = state.layers.findIndex(l => l.id === id)
        if (idx !== -1) {
          Object.assign(state.layers[idx], changes)
          state.isDirty = true
        }
      }),

      selectLayer: (id, multi = false) => set(state => {
        if (multi) {
          const idx = state.selectedLayerIds.indexOf(id)
          if (idx === -1) state.selectedLayerIds.push(id)
          else state.selectedLayerIds.splice(idx, 1)
        } else {
          state.selectedLayerIds = [id]
        }
        state.layers.forEach(l => {
          l.selected = state.selectedLayerIds.includes(l.id)
        })
      }),

      reorderLayers: (layers) => set(state => {
        state.layers = layers
        state.isDirty = true
      }),

      duplicateLayer: (id) => set(state => {
        const layer = state.layers.find(l => l.id === id)
        if (!layer) return
        const newLayer: Layer = {
          ...JSON.parse(JSON.stringify(layer)),
          id: `layer-${Date.now()}`,
          name: `${layer.name} copy`,
          selected: true,
          order: layer.order + 1,
        }
        const idx = state.layers.findIndex(l => l.id === id)
        state.layers.splice(idx, 0, newLayer)
        state.selectedLayerIds = [newLayer.id]
        state.isDirty = true
      }),

      mergeSelectedLayers: () => set(state => { state.isDirty = true }),
      flattenAll: () => set(state => { state.isDirty = true }),

      toggleLayerVisibility: (id) => set(state => {
        const layer = state.layers.find(l => l.id === id)
        if (layer) { layer.visible = !layer.visible; state.isDirty = true }
      }),

      toggleLayerLock: (id) => set(state => {
        const layer = state.layers.find(l => l.id === id)
        if (layer) { layer.locked = !layer.locked }
      }),

      // Tool
      setActiveTool: (tool) => set(state => {
        state.previousTool = state.activeTool
        state.activeTool = tool
      }),

      setBrush: (changes) => set(state => { Object.assign(state.brush, changes) }),

      // Adjustments
      setAdjustments: (changes) => set(state => {
        Object.assign(state.adjustments, changes)
        state.isDirty = true
      }),

      resetAdjustments: () => set(state => { state.adjustments = { ...defaultAdjustments } }),

      setHSL: (channel, prop, value) => set(state => {
        state.hsl[channel][prop] = value
        state.isDirty = true
      }),

      resetHSL: () => set(state => { state.hsl = JSON.parse(JSON.stringify(defaultHSL)) }),

      setCurvePoint: (channel, points) => set(state => {
        state.curves[channel] = points
        state.isDirty = true
      }),

      resetCurves: () => set(state => {
        state.curves = {
          master: [...defaultCurvePoints],
          red: [...defaultCurvePoints],
          green: [...defaultCurvePoints],
          blue: [...defaultCurvePoints],
        }
      }),

      // View
      setZoom: (zoom) => set(state => { state.zoom = Math.max(1, Math.min(3200, zoom)) }),
      setPan: (x, y) => set(state => { state.panX = x; state.panY = y }),
      setShowRulers: (v) => set(state => { state.showRulers = v }),
      setShowGrid: (v) => set(state => { state.showGrid = v }),
      setSnapToGrid: (v) => set(state => { state.snapToGrid = v }),

      // Colors
      setForegroundColor: (color) => set(state => { state.foregroundColor = color }),
      setBackgroundColor: (color) => set(state => { state.backgroundColor = color }),
      swapColors: () => set(state => {
        const temp = state.foregroundColor
        state.foregroundColor = state.backgroundColor
        state.backgroundColor = temp
      }),

      // History
      pushHistory: (label, snapshot) => set(state => {
        const entry: HistoryEntry = {
          id: `h-${Date.now()}`,
          label,
          timestamp: Date.now(),
          snapshot,
        }
        // Trim redo history
        state.history = state.history.slice(0, state.historyIndex + 1)
        state.history.push(entry)
        if (state.history.length > 50) state.history.shift()
        state.historyIndex = state.history.length - 1
      }),

      undo: () => {
        const state = get()
        if (state.historyIndex <= 0) return null
        set(s => { s.historyIndex -= 1 })
        return get().history[get().historyIndex]?.snapshot ?? null
      },

      redo: () => {
        const state = get()
        if (state.historyIndex >= state.history.length - 1) return null
        set(s => { s.historyIndex += 1 })
        return get().history[get().historyIndex]?.snapshot ?? null
      },

      // UI
      setActiveRightTab: (tab) => set(state => { state.activeRightTab = tab }),
      setActiveFilterTab: (tab) => set(state => { state.activeFilterTab = tab }),
      toggleLeftPanel: () => set(state => { state.showLeftPanel = !state.showLeftPanel }),
      toggleRightPanel: () => set(state => { state.showRightPanel = !state.showRightPanel }),

      // Recording
      addRecordedAction: (action) => set(state => { state.recordedActions.unshift(action) }),
      startRecording: () => set(state => { state.isRecording = true; state.currentRecording = [] }),
      stopRecording: (name, description) => {
        const state = get()
        if (!state.isRecording) return null
        const action: RecordedAction = {
          id: `action-${Date.now()}`,
          name,
          description,
          steps: [...state.currentRecording],
          createdAt: new Date(),
        }
        set(s => {
          s.isRecording = false
          s.recordedActions.unshift(action)
          s.currentRecording = []
        })
        return action
      },
      addRecordingStep: (step) => set(state => {
        if (state.isRecording) state.currentRecording.push(step)
      }),

      // AI
      setAIProcessing: (v, progress = 0, status = '') => set(state => {
        state.aiProcessing = v
        state.aiProgress = progress
        state.aiStatus = status
      }),
    }))
  )
)
