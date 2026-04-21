import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

const client = supabaseAdmin || supabase

export async function GET() {
  try {
    // Try a simple select from clinicians to verify connection
    const { data, error } = await client.from('clinicians').select('id,name').limit(1)
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, sample: data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
