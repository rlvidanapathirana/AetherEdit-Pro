import Dexie, { Table } from 'dexie'

export interface ProjectRecord {
  id?: number
  name: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  canvasJSON: string
  width: number
  height: number
  metadata: Record<string, unknown>
}

export interface LayerRecord {
  id?: number
  projectId: number
  name: string
  type: 'image' | 'text' | 'shape' | 'adjustment' | 'group'
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: string
  order: number
  fabricData: string
  maskData?: string
  groupId?: number
  createdAt: Date
}

export interface AssetRecord {
  id?: number
  projectId: number
  name: string
  type: 'image' | 'font' | 'lut'
  data: Blob
  mimeType: string
  size: number
  createdAt: Date
}

export interface ActionRecord {
  id?: number
  name: string
  description: string
  steps: ActionStep[]
  createdAt: Date
}

export interface ActionStep {
  type: string
  payload: Record<string, unknown>
  timestamp: number
}

export interface FontRecord {
  id?: number
  name: string
  family: string
  data: Blob
  format: 'ttf' | 'otf' | 'woff' | 'woff2'
  createdAt: Date
}

export interface AutoSaveRecord {
  id?: number
  projectId: number
  snapshotJSON: string
  savedAt: Date
}

class AetherEditDB extends Dexie {
  projects!: Table<ProjectRecord>
  layers!: Table<LayerRecord>
  assets!: Table<AssetRecord>
  actions!: Table<ActionRecord>
  fonts!: Table<FontRecord>
  autoSaves!: Table<AutoSaveRecord>

  constructor() {
    super('AetherEditProDB')
    this.version(1).stores({
      projects: '++id, name, updatedAt',
      layers: '++id, projectId, order, type, groupId',
      assets: '++id, projectId, type, name',
      actions: '++id, name, createdAt',
      fonts: '++id, name, family',
      autoSaves: '++id, projectId, savedAt',
    })
  }
}

export const db = new AetherEditDB()

// ── DB Helper Functions ──────────────────────────────────────────────────────

export async function saveProject(project: Omit<ProjectRecord, 'id'>): Promise<number> {
  return await db.projects.add(project)
}

export async function updateProject(id: number, changes: Partial<ProjectRecord>): Promise<void> {
  await db.projects.update(id, { ...changes, updatedAt: new Date() })
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
  return await db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function deleteProject(id: number): Promise<void> {
  await db.transaction('rw', [db.projects, db.layers, db.assets, db.autoSaves], async () => {
    await db.projects.delete(id)
    await db.layers.where('projectId').equals(id).delete()
    await db.assets.where('projectId').equals(id).delete()
    await db.autoSaves.where('projectId').equals(id).delete()
  })
}

export async function saveAsset(asset: Omit<AssetRecord, 'id'>): Promise<number> {
  return await db.assets.add(asset)
}

export async function getProjectAssets(projectId: number): Promise<AssetRecord[]> {
  return await db.assets.where('projectId').equals(projectId).toArray()
}

export async function saveFont(font: Omit<FontRecord, 'id'>): Promise<number> {
  return await db.fonts.add(font)
}

export async function getAllFonts(): Promise<FontRecord[]> {
  return await db.fonts.toArray()
}

export async function autoSaveSnapshot(projectId: number, snapshotJSON: string): Promise<void> {
  // Keep only last 10 auto-saves per project
  const existing = await db.autoSaves.where('projectId').equals(projectId).sortBy('savedAt')
  if (existing.length >= 10) {
    const toDelete = existing.slice(0, existing.length - 9)
    await Promise.all(toDelete.map(s => db.autoSaves.delete(s.id!)))
  }
  await db.autoSaves.add({ projectId, snapshotJSON, savedAt: new Date() })
}

export async function getLatestAutoSave(projectId: number): Promise<AutoSaveRecord | undefined> {
  const saves = await db.autoSaves.where('projectId').equals(projectId).sortBy('savedAt')
  return saves[saves.length - 1]
}
