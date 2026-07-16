export async function requestJson(url, options) {
  const response = await fetch(url, options)
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Request failed (${response.status})`)
  }

  return payload.data
}
