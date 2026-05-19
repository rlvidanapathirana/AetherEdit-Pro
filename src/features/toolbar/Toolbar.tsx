import React, { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  MousePointer2, Move, Crop, Paintbrush, Eraser, Type,
  Square, Circle, Minus, Triangle, Lasso, Wand2, ZoomIn,
  Hand, Pipette, Sparkles, Copy, Slice, ScanLine
} from 'lucide-react'
import { useEditorStore, type ToolType } from '../../context/editorStore'

interface ToolDef {
  id: ToolType
  icon: React.ReactNode
  label: string
  shortcut: string
  group?: string
}

const TOOL_GROUPS: { label: string; tools: ToolDef[] }[] = [
  {
    label: 'Selection',
    tools: [
      { id: 'select',     icon: <MousePointer2 size={16} />, label: 'Select',      shortcut: 'V' },
      { id: 'move',       icon: <Move size={16} />,          label: 'Move',         shortcut: 'M' },
      { id: 'lasso',      icon: <Lasso size={16} />,         label: 'Lasso',        shortcut: 'L' },
      { id: 'magic-wand', icon: <Wand2 size={16} />,         label: 'Magic Wand',   shortcut: 'W' },
      { id: 'crop',       icon: <Crop size={16} />,          label: 'Crop',         shortcut: 'C' },
    ],
  },
  {
    label: 'Draw',
    tools: [
      { id: 'brush',       icon: <Paintbrush size={16} />, label: 'Brush',        shortcut: 'B' },
      { id: 'eraser',      icon: <Eraser size={16} />,      label: 'Eraser',       shortcut: 'E' },
      { id: 'clone',       icon: <Copy size={16} />,         label: 'Clone Stamp',  shortcut: 'S' },
      { id: 'heal',        icon: <Sparkles size={16} />,     label: 'Heal',         shortcut: 'J' },
    ],
  },
  {
    label: 'Shape',
    tools: [
      { id: 'rectangle', icon: <Square size={16} />,   label: 'Rectangle', shortcut: 'R' },
      { id: 'ellipse',   icon: <Circle size={16} />,   label: 'Ellipse',   shortcut: 'U' },
      { id: 'line',      icon: <Minus size={16} />,    label: 'Line',      shortcut: '' },
      { id: 'polygon',   icon: <Triangle size={16} />, label: 'Polygon',   shortcut: '' },
    ],
  },
  {
    label: 'Type',
    tools: [
      { id: 'text', icon: <Type size={16} />, label: 'Text', shortcut: 'T' },
    ],
  },
  {
    label: 'View',
    tools: [
      { id: 'zoom',       icon: <ZoomIn size={16} />,   label: 'Zoom',       shortcut: 'Z' },
      { id: 'hand',       icon: <Hand size={16} />,     label: 'Hand (Pan)', shortcut: 'H' },
      { id: 'eyedropper', icon: <Pipette size={16} />,  label: 'Eyedropper', shortcut: 'I' },
    ],
  },
]

const ALL_TOOLS = TOOL_GROUPS.flatMap(g => g.tools)

const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool, foregroundColor, backgroundColor, swapColors, brush, setBrush } = useEditorStore()
  const [showBrushOpts, setShowBrushOpts] = useState(false)

  const handleToolClick = (tool: ToolDef) => {
    setActiveTool(tool.id)

    // Auto-trigger canvas actions for shape tools
    const canvas = (window as Window & {
      __aetherCanvas?: {
        addText?: (t: string) => void
        addShape?: (t: 'rectangle' | 'ellipse' | 'line' | 'polygon') => void
      }
    }).__aetherCanvas

    if (tool.id === 'text') {
      // Will be triggered on canvas click; just set tool
    } else if (['rectangle', 'ellipse', 'line', 'polygon'].includes(tool.id)) {
      canvas?.addShape?.(tool.id as 'rectangle' | 'ellipse' | 'line' | 'polygon')
    }
  }

  return (
    <Tooltip.Provider delayDuration={600}>
      <div
        className="flex flex-col items-center gap-0.5 py-3 px-1.5 panel-scroll"
        style={{
          width: 52,
          background: '#0A0A0A',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          height: '100%',
        }}
      >
        {TOOL_GROUPS.map((group, gi) => (
          <React.Fragment key={group.label}>
            {gi > 0 && <div className="section-divider w-8 my-0.5" />}

            {group.tools.map(tool => (
              <Tooltip.Root key={tool.id}>
                <Tooltip.Trigger asChild>
                  <button
                    id={`tool-${tool.id}`}
                    className={`btn-tool w-9 h-9 rounded-lg relative transition-all ${activeTool === tool.id ? 'active' : ''}`}
                    style={{
                      background: activeTool === tool.id
                        ? 'rgba(0,240,255,0.1)'
                        : 'transparent',
                      color: activeTool === tool.id
                        ? '#00F0FF'
                        : 'rgba(255,255,255,0.45)',
                    }}
                    onClick={() => handleToolClick(tool)}
                    onDoubleClick={() => {
                      if (tool.id === 'brush' || tool.id === 'eraser') {
                        setShowBrushOpts(v => !v)
                      }
                    }}
                  >
                    {tool.icon}
                    {tool.shortcut && (
                      <span
                        className="absolute bottom-0.5 right-0.5 font-mono"
                        style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}
                      >
                        {tool.shortcut}
                      </span>
                    )}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={8}>
                    <div className="flex items-center gap-2">
                      <span>{tool.label}</span>
                      {tool.shortcut && (
                        <kbd
                          className="font-mono text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.08)', fontSize: 10 }}
                        >
                          {tool.shortcut}
                        </kbd>
                      )}
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ))}
          </React.Fragment>
        ))}

        {/* Brush options flyout */}
        {showBrushOpts && (activeTool === 'brush' || activeTool === 'eraser') && (
          <div
            className="absolute left-16 z-50 p-3 rounded-xl space-y-3 animate-fade-in"
            style={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
              width: 200,
              top: 80,
            }}
          >
            <p className="panel-label">BRUSH OPTIONS</p>
            {([
              { label: 'Size', key: 'size' as const, min: 1, max: 500 },
              { label: 'Hardness', key: 'hardness' as const, min: 0, max: 100 },
              { label: 'Opacity', key: 'opacity' as const, min: 0, max: 100 },
              { label: 'Flow', key: 'flow' as const, min: 1, max: 100 },
            ]).map(opt => (
              <div key={opt.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{opt.label}</span>
                  <span className="font-mono text-xs" style={{ color: '#00F0FF', fontSize: 10 }}>{brush[opt.key]}</span>
                </div>
                <input
                  type="range"
                  min={opt.min} max={opt.max}
                  value={brush[opt.key]}
                  onChange={(e) => setBrush({ [opt.key]: Number(e.target.value) })}
                  style={{ accentColor: '#00F0FF' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Color swatches */}
        <div className="section-divider w-8 my-0.5" />
        <div className="relative mt-1 cursor-pointer" title="Click to swap colors (X)" onClick={swapColors}>
          {/* Background color */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 rounded"
            style={{
              background: backgroundColor,
              border: '2px solid rgba(255,255,255,0.2)',
              zIndex: 1,
            }}
          />
          {/* Foreground color */}
          <div
            className="relative w-6 h-6 rounded"
            style={{
              background: foregroundColor,
              border: '2px solid rgba(255,255,255,0.4)',
              zIndex: 2,
              marginBottom: 6,
              marginRight: 6,
            }}
          />
        </div>
      </div>
    </Tooltip.Provider>
  )
}

export default Toolbar
