import { NextResponse } from 'next/server'

export function apiSuccess(data = null, status = 200) {
  return NextResponse.json({ success: true, data, error: null }, { status })
}

export function apiError(error, status = 500) {
  const message = error?.message || String(error)
  return NextResponse.json({ success: false, data: null, error: message }, { status })
}
