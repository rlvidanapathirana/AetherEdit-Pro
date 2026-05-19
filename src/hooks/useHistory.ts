import { useCallback, useRef } from 'react'
import { useEditorStore } from '../context/editorStore'
import { autoSaveSnapshot } from '../db/database'
import { debounce } from '../utils/helpers'

export function useHistory() {
  const { pushHistory, undo, redo, history, historyIndex } = useEditorStore()
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null)

  const snapshot = useCallback(
    (label: string, json: string, projectId?: number) => {
      pushHistory(label, json)

      // Debounced auto-save to IndexedDB
      if (projectId) {
        if (pendingSave.current) clearTimeout(pendingSave.current)
        pendingSave.current = setTimeout(() => {
          autoSaveSnapshot(projectId, json).catch(console.error)
        }, 2000)
      }
    },
    [pushHistory]
  )

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const performUndo = useCallback(() => undo(), [undo])
  const performRedo = useCallback(() => redo(), [redo])

  return { snapshot, performUndo, performRedo, canUndo, canRedo, history, historyIndex }
}

/** Debounced auto-save hook */
export function useAutoSave(projectId: number | undefined, getSnapshot: () => string) {
  const { isDirty, setSaving } = useEditorStore()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const save = useCallback(
    debounce(async () => {
      if (!projectId || !isDirty) return
      setSaving(true)
      try {
        await autoSaveSnapshot(projectId, getSnapshot())
      } finally {
        setSaving(false)
      }
    }, 3000),
    [projectId, isDirty]
  )

  return save
}
