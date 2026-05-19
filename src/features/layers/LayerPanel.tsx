import React, { useCallback, useRef, useState } from 'react'
import {
  Layers, Eye, EyeOff, Lock, Unlock, Trash2, Copy, Plus,
  ChevronDown, ChevronRight, Type, Image, Square, Sliders,
  FolderOpen, Blend, Merge, Move, GripVertical, MoreHorizontal
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Slider from '@radix-ui/react-slider'
import * as Tooltip from '@radix-ui/react-tooltip'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useEditorStore } from '../../context/editorStore'
import type { Layer, BlendMode } from '../../context/editorStore'
import { uid } from '../../utils/helpers'

const BLEND_MODES: { label: string; value: BlendMode }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Color Dodge', value: 'color-dodge' },
  { label: 'Color Burn', value: 'color-burn' },
  { label: 'Hard Light', value: 'hard-light' },
  { label: 'Soft Light', value: 'soft-light' },
  { label: 'Difference', value: 'difference' },
  { label: 'Exclusion', value: 'exclusion' },
  { label: 'Hue', value: 'hue' },
  { label: 'Saturation', value: 'saturation' },
  { label: 'Color', value: 'color' },
  { label: 'Luminosity', value: 'luminosity' },
]

const TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <Image size={11} />,
  text: <Type size={11} />,
  shape: <Square size={11} />,
  adjustment: <Sliders size={11} />,
  group: <FolderOpen size={11} />,
}

interface LayerItemProps {
  layer: Layer
  index: number
}

const LayerItem: React.FC<LayerItemProps> = ({ layer, index }) => {
  const { updateLayer, removeLayer, duplicateLayer, selectLayer, selectedLayerIds } = useEditorStore()
  const isSelected = selectedLayerIds.includes(layer.id)

  const handleClick = (e: React.MouseEvent) => {
    selectLayer(layer.id, e.metaKey || e.ctrlKey)
  }

  const handleOpacityChange = (values: number[]) => {
    updateLayer(layer.id, { opacity: values[0] })
    // Sync with Fabric
    const canvas = (window as Window & { __aetherCanvas?: { getFabric: () => unknown } }).__aetherCanvas?.getFabric?.()
    if (canvas) {
      // @ts-expect-error fabric dynamic API
      const obj = canvas.getObjects?.().find((o: { layerId?: string }) => o.layerId === layer.id)
      if (obj) {
        obj.set('opacity', values[0] / 100)
        // @ts-expect-error fabric dynamic API
        canvas.renderAll?.()
      }
    }
  }

  const handleBlendChange = (value: BlendMode) => {
    updateLayer(layer.id, { blendMode: value })
  }

  return (
    <Draggable draggableId={layer.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`layer-item group ${isSelected ? 'selected' : ''}`}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.8 : 1,
          }}
          onClick={handleClick}
        >
          {/* Drag handle */}
          <div {...provided.dragHandleProps} className="opacity-0 group-hover:opacity-40 transition-opacity drag-handle flex-shrink-0">
            <GripVertical size={12} className="text-white" />
          </div>

          {/* Visibility toggle */}
          <button
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-60 hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }}
          >
            {layer.visible
              ? <Eye size={11} style={{ color: '#00F0FF' }} />
              : <EyeOff size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />}
          </button>

          {/* Type icon */}
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
            {TYPE_ICONS[layer.type] || <Square size={11} />}
          </div>

          {/* Thumbnail */}
          <div className="flex-shrink-0 w-8 h-8 rounded overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {layer.thumbnail
              ? <img src={layer.thumbnail} alt={layer.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full" style={{ background: 'rgba(255,255,255,0.04)' }} />}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)' }}>
              {layer.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
              {layer.blendMode} · {layer.opacity}%
            </p>
          </div>

          {/* Lock */}
          <button
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }) }}
          >
            {layer.locked
              ? <Lock size={10} style={{ color: '#f87171' }} />
              : <Unlock size={10} style={{ color: 'rgba(255,255,255,0.4)' }} />}
          </button>

          {/* More menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={11} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={4}>
                <DropdownMenu.Item onClick={() => duplicateLayer(layer.id)}>
                  <Copy size={12} /> Duplicate
                </DropdownMenu.Item>
                <DropdownMenu.Separator style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                <DropdownMenu.Item onClick={() => removeLayer(layer.id)}
                  style={{ color: '#f87171' }}>
                  <Trash2 size={12} /> Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
    </Draggable>
  )
}

const LayerPanel: React.FC = () => {
  const {
    layers, selectedLayerIds, reorderLayers,
    addLayer, updateLayer,
    zoom,
  } = useEditorStore()

  const [showBlendFor, setShowBlendFor] = useState<string | null>(null)

  const selectedLayer = layers.find(l => selectedLayerIds.includes(l.id))

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const reordered = Array.from(layers)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)
    reorderLayers(reordered.map((l, i) => ({ ...l, order: i })))
  }

  const addNewLayer = (type: Layer['type']) => {
    const canvas = (window as Window & { __aetherCanvas?: {
      addText?: (t: string) => void
      addShape?: (s: 'rectangle' | 'ellipse') => void
    } }).__aetherCanvas

    if (type === 'text') {
      canvas?.addText?.('New Text')
    } else if (type === 'shape') {
      canvas?.addShape?.('rectangle')
    } else {
      const id = uid('layer')
      addLayer({
        id,
        name: 'New Layer',
        type,
        visible: true,
        locked: false,
        lockedAlpha: false,
        opacity: 100,
        blendMode: 'normal',
        order: layers.length,
        selected: true,
        hasMask: false,
        maskEnabled: false,
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <Layers size={13} style={{ color: '#00F0FF' }} />
          <span className="panel-label" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>LAYERS</span>
          <span className="badge badge-cyan">{layers.length}</span>
        </div>

        {/* Add layer buttons */}
        <div className="flex items-center gap-1">
          <Tooltip.Provider delayDuration={400}>
            {([
              { icon: <Image size={11} />, label: 'Add Image Layer', type: 'image' as const },
              { icon: <Type size={11} />, label: 'Add Text Layer', type: 'text' as const },
              { icon: <Square size={11} />, label: 'Add Shape Layer', type: 'shape' as const },
            ]).map(btn => (
              <Tooltip.Root key={btn.type}>
                <Tooltip.Trigger asChild>
                  <button className="btn-tool w-6 h-6" onClick={() => addNewLayer(btn.type)}>
                    {btn.icon}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="top">{btn.label}</Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ))}
          </Tooltip.Provider>
        </div>
      </div>

      {/* Selected layer blend/opacity controls */}
      {selectedLayer && (
        <div className="px-3 py-2 space-y-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Blend mode */}
          <div className="flex items-center gap-2">
            <span className="panel-label w-12 flex-shrink-0">Mode</span>
            <select
              className="aether-select flex-1 text-xs"
              value={selectedLayer.blendMode}
              onChange={(e) => updateLayer(selectedLayer.id, { blendMode: e.target.value as BlendMode })}
              style={{ fontSize: 11, padding: '4px 6px' }}
            >
              {BLEND_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Opacity slider */}
          <div className="flex items-center gap-2">
            <span className="panel-label w-12 flex-shrink-0">Opacity</span>
            <Slider.Root
              className="relative flex items-center flex-1 h-4"
              value={[selectedLayer.opacity]}
              min={0} max={100} step={1}
              onValueChange={(values) => updateLayer(selectedLayer.id, { opacity: values[0] })}
            >
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Root>
            <span className="text-xs font-mono w-8 text-right flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.5)' }}>
              {selectedLayer.opacity}
            </span>
          </div>
        </div>
      )}

      {/* Layer list */}
      <div className="flex-1 panel-scroll px-2 py-1">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <Layers size={28} style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No layers yet.<br />Add an image or create a new layer.
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="layers">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-0.5">
                  {layers.map((layer, index) => (
                    <LayerItem key={layer.id} layer={layer} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-2 py-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1">
          <Tooltip.Provider delayDuration={400}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="btn-tool w-6 h-6" onClick={() => addNewLayer('image')}>
                  <Plus size={12} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top">New Layer</Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        {selectedLayerIds.length > 0 && (
          <button
            className="btn-tool w-6 h-6"
            onClick={() => selectedLayerIds.forEach(id => useEditorStore.getState().removeLayer(id))}
          >
            <Trash2 size={12} style={{ color: '#f87171' }} />
          </button>
        )}
      </div>
    </div>
  )
}

export default LayerPanel
