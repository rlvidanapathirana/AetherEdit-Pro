import React, { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle2, Film, X } from 'lucide-react'
import { parseCubeFile, downloadFile } from '../../utils/helpers'
import { useEditorStore } from '../../context/editorStore'

interface LUTEntry {
  id: string
  name: string
  data: Float32Array
  applied: boolean
}

const PRESET_LUTS = [
  { name: 'Cinematic Teal', description: 'Hollywood teal & orange look' },
  { name: 'Vintage Film', description: 'Warm faded analog feel' },
  { name: 'Cold Blue', description: 'Cool desaturated blue tones' },
  { name: 'Moody Dark', description: 'Deep shadows, lifted blacks' },
  { name: 'Golden Hour', description: 'Warm amber sunset tones' },
  { name: 'Noir B&W', description: 'Desaturated monochrome' },
]

const LUTPanel: React.FC = () => {
  const [luts, setLuts] = useState<LUTEntry[]>([])
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(100)
  const fileRef = useRef<HTMLInputElement>(null)
  const { setDirty } = useEditorStore()

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return
    setError(null)
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.cube')) {
        setError('Only .cube LUT files are supported')
        continue
      }
      const text = await file.text()
      const data = parseCubeFile(text)
      if (!data) {
        setError(`Could not parse "${file.name}" — invalid .cube format`)
        continue
      }
      const lut: LUTEntry = {
        id: `lut-${Date.now()}`,
        name: file.name.replace('.cube', ''),
        data,
        applied: false,
      }
      setLuts(prev => [...prev, lut])
    }
  }

  const applyLUT = (id: string) => {
    setAppliedId(id)
    setDirty(true)
    // In a full implementation, apply LUT via WebGL fragment shader
    // For now, signal dirty state and store would re-render
  }

  const removeLUT = (id: string) => {
    setLuts(prev => prev.filter(l => l.id !== id))
    if (appliedId === id) { setAppliedId(null) }
  }

  return (
    <div className="px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="panel-label">LUT COLOR GRADING</span>
        <span className="badge badge-violet">PRO</span>
      </div>

      {/* Drop zone */}
      <div
        className="relative rounded-lg p-4 text-center cursor-pointer transition-all"
        style={{
          border: '2px dashed rgba(99,102,241,0.3)',
          background: 'rgba(99,102,241,0.04)',
        }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#6366F1' }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
        onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files) }}
      >
        <Film size={20} style={{ color: 'rgba(99,102,241,0.6)', margin: '0 auto 8px' }} />
        <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Drop .cube LUT file</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>or click to browse</p>
        <input
          ref={fileRef}
          type="file"
          accept=".cube"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={12} style={{ color: '#f87171', flexShrink: 0 }} />
          <span className="text-xs" style={{ color: '#fca5a5', fontSize: 10 }}>{error}</span>
        </div>
      )}

      {/* Intensity */}
      {appliedId && (
        <div className="flex items-center gap-2">
          <span className="panel-label w-14 flex-shrink-0">Intensity</span>
          <input
            type="range" min={0} max={100} value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: '#6366F1' }}
          />
          <span className="text-xs font-mono w-7 text-right" style={{ color: '#6366F1', fontSize: 10 }}>{intensity}%</span>
        </div>
      )}

      {/* Uploaded LUTs */}
      {luts.length > 0 && (
        <div className="space-y-1">
          <span className="panel-label">UPLOADED LUTs</span>
          {luts.map(lut => (
            <div
              key={lut.id}
              className="flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-all"
              style={{
                background: appliedId === lut.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${appliedId === lut.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
              onClick={() => applyLUT(lut.id)}
            >
              <Film size={12} style={{ color: appliedId === lut.id ? '#6366F1' : 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <span className="text-xs flex-1 truncate" style={{ color: appliedId === lut.id ? '#a5b4fc' : 'rgba(255,255,255,0.6)' }}>
                {lut.name}
              </span>
              {appliedId === lut.id && <CheckCircle2 size={11} style={{ color: '#6366F1', flexShrink: 0 }} />}
              <button
                className="w-4 h-4 flex items-center justify-center rounded opacity-0 hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(239,68,68,0.2)', flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); removeLUT(lut.id) }}
              >
                <X size={8} style={{ color: '#f87171' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Built-in presets */}
      <div className="space-y-1">
        <span className="panel-label">BUILT-IN PRESETS</span>
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {PRESET_LUTS.map(preset => (
            <div
              key={preset.name}
              className="rounded-md p-2 cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              title={preset.description}
            >
              {/* Gradient preview swatch */}
              <div className="w-full h-6 rounded mb-1"
                style={{
                  background: preset.name === 'Cinematic Teal' ? 'linear-gradient(90deg, #0d4f5e, #8b4513)'
                    : preset.name === 'Vintage Film' ? 'linear-gradient(90deg, #7a6050, #d4a67a)'
                    : preset.name === 'Cold Blue' ? 'linear-gradient(90deg, #1a2a4a, #6090c0)'
                    : preset.name === 'Moody Dark' ? 'linear-gradient(90deg, #0a0a1a, #2a2040)'
                    : preset.name === 'Golden Hour' ? 'linear-gradient(90deg, #8b4a00, #ffb347)'
                    : 'linear-gradient(90deg, #1a1a1a, #888888)',
                }} />
              <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{preset.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LUTPanel
