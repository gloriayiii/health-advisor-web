import fs from 'fs/promises'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')
const fileFor = (collection) => path.join(dataDir, `${collection}.json`)

async function ensure() {
  await fs.mkdir(dataDir, { recursive: true })
}

async function readCollection(collection) {
  await ensure()
  const file = fileFor(collection)
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw || '[]')
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(file, '[]')
      return []
    }
    throw err
  }
}

async function writeCollection(collection, data) {
  const file = fileFor(collection)
  await fs.writeFile(file, JSON.stringify(data, null, 2))
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function getAll(collection) {
  return readCollection(collection)
}

export async function getById(collection, id) {
  const items = await readCollection(collection)
  return items.find((i) => String(i.id) === String(id)) || null
}

export async function createItem(collection, item) {
  const items = await readCollection(collection)
  const newItem = { id: makeId(), ...item }
  items.push(newItem)
  await writeCollection(collection, items)
  return newItem
}

export async function updateItem(collection, id, patch) {
  const items = await readCollection(collection)
  const idx = items.findIndex((i) => String(i.id) === String(id))
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...patch }
  await writeCollection(collection, items)
  return items[idx]
}

export async function deleteItem(collection, id) {
  const items = await readCollection(collection)
  const idx = items.findIndex((i) => String(i.id) === String(id))
  if (idx === -1) return false
  items.splice(idx, 1)
  await writeCollection(collection, items)
  return true
}

export async function ensureCollectionExists(collection) {
  await ensure()
  const file = fileFor(collection)
  try {
    await fs.access(file)
  } catch (err) {
    await writeCollection(collection, [])
  }
}

export default { getAll, getById, createItem, updateItem, deleteItem, ensureCollectionExists }
