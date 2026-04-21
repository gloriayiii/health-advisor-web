import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'

const client = supabaseAdmin || supabase

export async function GET(request, { params }) {
  const { data, error } = await client.from('healthplans').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request, { params }) {
  const patch = await request.json()
  const { data, error } = await client.from('healthplans').update(patch).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(request, { params }) {
  const { error } = await client.from('healthplans').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ success: true })
}
