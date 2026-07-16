import { NextResponse } from 'next/server'
import { structuredLog } from './lib/logger'

export function middleware(request) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const headers = new Headers(request.headers)
  headers.set('x-request-id', requestId)

  structuredLog('info', 'request.received', {
    requestId,
    method: request.method,
    route: request.nextUrl.pathname
  })

  const response = NextResponse.next({ request: { headers } })
  response.headers.set('x-request-id', requestId)
  return response
}

export const config = {
  matcher: ['/api/:path*']
}
