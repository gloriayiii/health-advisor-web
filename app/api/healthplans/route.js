import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

const client = supabaseAdmin || supabase

export async function GET() {
  const { data, error } = await client.from('healthplans').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const body = await request.json()
  if (!body || !body.name) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }
  const { data, error } = await client.from('healthplans').insert([body]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
