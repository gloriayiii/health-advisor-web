export function structuredLog(level, event, fields = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields
  }
  const output = JSON.stringify(entry)
  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.info(output)
}

export function getRequestId(request) {
  return request.headers.get('x-request-id') || crypto.randomUUID()
}
