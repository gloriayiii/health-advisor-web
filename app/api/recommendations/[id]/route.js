import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'

const client = supabaseAdmin || supabase

export async function GET(request, { params }) {
  try {
    const { data, error } = await client.from('recommendations').select('*').eq('id', params.id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err), stack: err.stack }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const patch = await request.json()
    const { data, error } = await client.from('recommendations').update(patch).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err), stack: err.stack }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { error } = await client.from('recommendations').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err), stack: err.stack }, { status: 500 })
  }
}

