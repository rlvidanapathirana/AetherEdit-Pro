import { useEffect, useCallback } from 'react'
import { useEditorStore } from '../context/editorStore'

type KeyMap = Record<string, () => void>

export function useKeyboardShortcuts(
  keyMap: KeyMap,
  enabled = true,
  deps: unknown[] = []
): void {
  const handler = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    // Don't fire when typing in inputs
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) return

    const key = buildKeyString(e)
    const action = keyMap[key]
    if (action) {
      e.preventDefault()
      action()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}

function buildKeyString(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('ctrl')
  if (e.shiftKey) parts.push('shift')
  if (e.altKey) parts.push('alt')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}

/** Global editor keyboard shortcuts hook */
export function useEditorShortcuts(): void {
  const {
    setActiveTool,
    undo, redo,
    setZoom, zoom,
    swapColors,
    toggleLeftPanel,
    toggleRightPanel,
  } = useEditorStore()

  useKeyboardShortcuts({
    // Tools
    'v': () => setActiveTool('select'),
    'm': () => setActiveTool('move'),
    'c': () => setActiveTool('crop'),
    'b': () => setActiveTool('brush'),
    'e': () => setActiveTool('eraser'),
    't': () => setActiveTool('text'),
    'r': () => setActiveTool('rectangle'),
    'u': () => setActiveTool('ellipse'),
    'l': () => setActiveTool('lasso'),
    'w': () => setActiveTool('magic-wand'),
    'z': () => setActiveTool('zoom'),
    'h': () => setActiveTool('hand'),
    'i': () => setActiveTool('eyedropper'),
    'j': () => setActiveTool('heal'),
    's': () => setActiveTool('clone'),
    'x': () => swapColors(),

    // History
    'ctrl+z': () => undo(),
    'ctrl+shift+z': () => redo(),
    'ctrl+y': () => redo(),

    // Zoom
    'ctrl+=': () => setZoom(Math.min(zoom * 1.25, 3200)),
    'ctrl+-': () => setZoom(Math.max(zoom * 0.8, 1)),
    'ctrl+0': () => setZoom(100),

    // Panels
    'tab': () => { toggleLeftPanel(); toggleRightPanel() },
    'ctrl+1': () => toggleLeftPanel(),
    'ctrl+2': () => toggleRightPanel(),
  })
}
