import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export async function importStandalone(relativePath) {
  const absolutePath = path.resolve(relativePath)
  const source = await fs.readFile(absolutePath, 'utf8')
  const encoded = Buffer.from(`${source}\n//# sourceURL=${pathToFileURL(absolutePath)}`).toString('base64')
  return import(`data:text/javascript;base64,${encoded}`)
}
