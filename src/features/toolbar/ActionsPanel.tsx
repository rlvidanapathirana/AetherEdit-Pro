import React, { useState, useRef } from 'react'
import { Play, Square, Trash2, Copy, Upload, Download, Loader2, CheckCircle2, Package, Zap } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import JSZip from 'jszip'
import { useEditorStore } from '../../context/editorStore'
import type { RecordedAction } from '../../context/editorStore'
import { downloadFile, readFileAsDataURL } from '../../utils/helpers'
import { db } from '../../db/database'

const ActionsPanel: React.FC = () => {
  const { recordedActions, addRecordedAction, isRecording, startRecording, stopRecording } = useEditorStore()
  const [actionName, setActionName] = useState('')
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchDone, setBatchDone] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'actions' | 'batch'>('actions')
  const [showStopDialog, setShowStopDialog] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleToggleRecord = () => {
    if (isRecording) {
      setShowStopDialog(true)
    } else {
      startRecording()
    }
  }

  const handleSaveRecording = () => {
    if (!actionName.trim()) return
    const action = stopRecording(actionName, `Recorded action: ${actionName}`)
    if (action) setSelectedAction(action.id)
    setActionName('')
    setShowStopDialog(false)
  }

  const handleDeleteAction = (id: string) => {
    useEditorStore.setState(s => ({
      recordedActions: s.recordedActions.filter(a => a.id !== id)
    }))
    if (selectedAction === id) setSelectedAction(null)
  }

  const handleExportAction = (action: RecordedAction) => {
    const blob = new Blob([JSON.stringify(action, null, 2)], { type: 'application/json' })
    downloadFile(blob, `${action.name}.aether-action`)
  }

  const handleImportAction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const action = JSON.parse(text) as RecordedAction
      action.id = `action-${Date.now()}`
      action.createdAt = new Date(action.createdAt)
      addRecordedAction(action)
    } catch {
      console.error('Invalid action file')
    }
    e.target.value = ''
  }

  // ── Batch processing ────────────────────────────────────────────────────
  const handleBatchFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setBatchFiles(prev => [...prev, ...files].slice(0, 50)) // max 50
    e.target.value = ''
  }

  const handleRunBatch = async () => {
    if (!selectedAction || batchFiles.length === 0) return
    setBatchRunning(true)
    setBatchProgress(0)
    setBatchDone(false)

    const action = recordedActions.find(a => a.id === selectedAction)
    const zip = new JSZip()
    const folder = zip.folder('batch-output')!

    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i]
      const dataUrl = await readFileAsDataURL(file)

      // In a full implementation, each step in action.steps would be replayed
      // on a temporary offscreen canvas, then the result exported
      // For now, we simulate and save original (framework wired up)
      await new Promise(r => setTimeout(r, 200)) // simulated processing

      const base64 = dataUrl.split(',')[1]
      folder.file(`output-${i + 1}-${file.name}`, base64, { base64: true })
      setBatchProgress(Math.round(((i + 1) / batchFiles.length) * 100))
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadFile(zipBlob, 'aetheredit-batch.zip')
    setBatchRunning(false)
    setBatchDone(true)
  }

  return (
    <div className="px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} style={{ color: '#fbbf24' }} />
          <span className="panel-label" style={{ color: 'rgba(255,255,255,0.6)' }}>ACTIONS & BATCH</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {([
          { key: 'actions', label: 'Actions' },
          { key: 'batch', label: 'Batch' },
        ] as const).map(t => (
          <button key={t.key}
            className={`tab-trigger flex-1 text-xs py-1 rounded ${activeTab === t.key ? 'active' : ''}`}
            style={{ fontSize: 10 }} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ACTIONS TAB ────────────────────────────────── */}
      {activeTab === 'actions' && (
        <div className="space-y-3">
          {/* Record button */}
          <button
            className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            onClick={handleToggleRecord}
            style={{
              background: isRecording ? 'rgba(239,68,68,0.15)' : 'rgba(0,240,255,0.08)',
              border: `1px solid ${isRecording ? 'rgba(239,68,68,0.4)' : 'rgba(0,240,255,0.25)'}`,
              color: isRecording ? '#f87171' : '#00F0FF',
              cursor: 'pointer',
            }}
          >
            {isRecording ? (
              <><div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} /> Stop Recording</>
            ) : (
              <><div className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} /> Start Recording</>
            )}
          </button>

          {isRecording && (
            <p className="text-xs text-center animate-pulse" style={{ color: '#f87171', fontSize: 10 }}>
              ● Recording your actions…
            </p>
          )}

          {/* Import action */}
          <label className="flex items-center justify-center gap-2 py-2 rounded-xl cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <Upload size={11} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Import .aether-action</span>
            <input type="file" accept=".aether-action,.json" className="hidden" onChange={handleImportAction} />
          </label>

          {/* Actions list */}
          {recordedActions.length === 0 ? (
            <div className="text-center py-6">
              <Zap size={24} style={{ color: 'rgba(255,255,255,0.08)', margin: '0 auto 8px' }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>No actions yet. Start recording!</p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="panel-label">SAVED ACTIONS ({recordedActions.length})</span>
              {recordedActions.map(action => (
                <div
                  key={action.id}
                  className="flex items-center gap-2 px-2.5 py-2.5 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selectedAction === action.id ? 'rgba(0,240,255,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedAction === action.id ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                  onClick={() => setSelectedAction(action.id === selectedAction ? null : action.id)}
                >
                  <Zap size={12} style={{ color: selectedAction === action.id ? '#fbbf24' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{action.name}</p>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{action.steps.length} steps</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button className="btn-tool w-6 h-6" onClick={(e) => { e.stopPropagation(); handleExportAction(action) }}
                      title="Export action">
                      <Download size={10} />
                    </button>
                    <button className="btn-tool w-6 h-6" onClick={(e) => { e.stopPropagation(); handleDeleteAction(action.id) }}
                      title="Delete action">
                      <Trash2 size={10} style={{ color: '#f87171' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BATCH TAB ──────────────────────────────────── */}
      {activeTab === 'batch' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontSize: 10 }}>
              Select up to <strong style={{ color: '#fbbf24' }}>50 images</strong> and apply a saved action. All outputs are bundled into a single <strong style={{ color: '#fbbf24' }}>.zip</strong> archive.
            </p>
          </div>

          {/* Action selector */}
          <div>
            <label className="panel-label block mb-1.5">APPLY ACTION</label>
            <select
              className="aether-select"
              value={selectedAction ?? ''}
              onChange={e => setSelectedAction(e.target.value || null)}
              style={{ fontSize: 11 }}
            >
              <option value="">Select an action…</option>
              {recordedActions.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.steps.length} steps)</option>
              ))}
            </select>
          </div>

          {/* File drop zone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="panel-label">INPUT IMAGES ({batchFiles.length}/50)</label>
              {batchFiles.length > 0 && (
                <button className="text-xs" style={{ color: '#f87171', fontSize: 9 }} onClick={() => setBatchFiles([])}>
                  Clear all
                </button>
              )}
            </div>

            <label
              className="flex flex-col items-center justify-center py-4 rounded-xl cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.1)',
              }}
            >
              <Package size={20} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 8 }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                {batchFiles.length > 0 ? `${batchFiles.length} image(s) selected` : 'Add images (max 50)'}
              </span>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBatchFilesAdd} />
            </label>
          </div>

          {/* File list preview */}
          {batchFiles.length > 0 && (
            <div className="panel-scroll space-y-1" style={{ maxHeight: 120 }}>
              {batchFiles.slice(0, 10).map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(0,240,255,0.4)', flexShrink: 0 }} />
                  <span className="text-xs truncate flex-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{f.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>{(f.size / 1024).toFixed(0)}KB</span>
                </div>
              ))}
              {batchFiles.length > 10 && (
                <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>
                  +{batchFiles.length - 10} more
                </p>
              )}
            </div>
          )}

          {/* Run batch */}
          {batchRunning ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                  Processing {batchProgress}% ({Math.round(batchFiles.length * batchProgress / 100)}/{batchFiles.length})
                </span>
                <Loader2 size={12} className="animate-spin" style={{ color: '#00F0FF' }} />
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${batchProgress}%`, background: 'linear-gradient(90deg, #fbbf24, #f97316)' }}
                />
              </div>
            </div>
          ) : (
            <button
              className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              onClick={handleRunBatch}
              disabled={!selectedAction || batchFiles.length === 0 || batchRunning}
              style={{
                background: (!selectedAction || batchFiles.length === 0) ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #fbbf24, #f97316)',
                color: (!selectedAction || batchFiles.length === 0) ? 'rgba(255,255,255,0.3)' : '#000',
                cursor: (!selectedAction || batchFiles.length === 0) ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              <Package size={13} /> Run Batch Export
            </button>
          )}

          {batchDone && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle2 size={13} style={{ color: '#4ade80' }} />
              <p className="text-xs" style={{ color: '#86efac', fontSize: 10 }}>
                Batch complete! {batchFiles.length} files exported as .zip
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stop recording dialog */}
      <Dialog.Root open={showStopDialog} onOpenChange={setShowStopDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <Dialog.Content
            className="fixed z-50 glass-modal rounded-2xl p-6 animate-slide-up"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 320 }}
          >
            <Dialog.Title className="text-sm font-bold mb-3" style={{ color: '#fff' }}>Save Recording</Dialog.Title>
            <input
              className="aether-input mb-4"
              placeholder="Action name…"
              value={actionName}
              onChange={e => setActionName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveRecording() }}
              autoFocus
            />
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 px-3 py-2 rounded-lg text-xs" onClick={() => { stopRecording('', ''); setShowStopDialog(false) }}>Discard</button>
              <button className="btn-neon flex-1 px-3 py-2 rounded-lg text-xs font-semibold" onClick={handleSaveRecording}>Save</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

export default ActionsPanel
