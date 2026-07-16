const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000)
const OLLAMA_AVAILABILITY_TTL_MS = Number(
  process.env.OLLAMA_AVAILABILITY_TTL_MS || 15000
)
const OLLAMA_KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE || '10m'

export const OLLAMA_FAST_MODEL =
  process.env.OLLAMA_FAST_MODEL || process.env.OLLAMA_MODEL || 'llama3.2'
export const OLLAMA_FINAL_MODEL =
  process.env.OLLAMA_FINAL_MODEL || process.env.OLLAMA_MODEL || OLLAMA_FAST_MODEL

let availabilityCache = {
  checkedAt: 0,
  available: false
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS)
  const abortFromCaller = () => controller.abort()
  options.signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    })
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}

export async function isOllamaAvailable({ force = false } = {}) {
  const now = Date.now()
  if (!force && now - availabilityCache.checkedAt < OLLAMA_AVAILABILITY_TTL_MS) {
    return availabilityCache.available
  }

  try {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET'
    })
    availabilityCache = { checkedAt: now, available: response.ok }
  } catch {
    availabilityCache = { checkedAt: now, available: false }
  }

  return availabilityCache.available
}

export async function streamOllamaGenerate({
  prompt,
  systemPrompt = '',
  model = OLLAMA_FINAL_MODEL,
  temperature = 0.2,
  maxTokens = 800,
  signal,
  onToken
}) {
  const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: systemPrompt,
      stream: true,
      keep_alive: OLLAMA_KEEP_ALIVE,
      options: {
        temperature,
        num_predict: maxTokens
      }
    }),
    signal
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Ollama request failed (${response.status}): ${detail}`)
  }

  if (!response.body) throw new Error('Ollama returned an empty response stream')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue
      const chunk = JSON.parse(line)
      if (chunk.error) throw new Error(chunk.error)
      if (chunk.response) {
        content += chunk.response
        onToken?.(chunk.response)
      }
    }

    if (done) break
  }

  if (buffer.trim()) {
    const chunk = JSON.parse(buffer)
    if (chunk.error) throw new Error(chunk.error)
    if (chunk.response) {
      content += chunk.response
      onToken?.(chunk.response)
    }
  }

  return content
}

export async function callOllama(prompt, systemPrompt = '', options = {}) {
  return streamOllamaGenerate({
    prompt,
    systemPrompt,
    model: options.model || OLLAMA_FAST_MODEL,
    temperature: options.temperature ?? 0.2,
    maxTokens: options.max_tokens || 400,
    signal: options.signal
  })
}

export async function getAvailableModels() {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET'
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.models || []
  } catch {
    return []
  }
}
