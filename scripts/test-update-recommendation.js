#!/usr/bin/env node
import 'dotenv/config'
import { supabase, supabaseAdmin } from '../lib/supabase.js'

const client = supabaseAdmin || supabase

async function run() {
  const id = process.argv[2]
  if (!id) {
    console.error('Usage: node scripts/test-update-recommendation.js <id>')
    process.exit(2)
  }
  try {
    console.log('Updating recommendation', id)
    const { data, error } = await client.from('recommendations').update({ status: 'approved' }).eq('id', id).select().single()
    if (error) {
      console.error('Supabase error:', error)
      process.exit(1)
    }
    console.log('Updated:', data)
  } catch (err) {
    console.error('Exception:', err)
    process.exit(1)
  }
}

run()
