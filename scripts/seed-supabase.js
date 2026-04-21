#!/usr/bin/env node
import 'dotenv/config'
import { supabase, supabaseAdmin } from '../lib/supabase.js'

const client = supabaseAdmin || supabase

async function seed() {
  console.log('Seeding Supabase...')

  const clinicians = [
    { name: 'Dr. Alice Smith', email: 'alice.smith@example.com', specialty: 'Cardiology' },
    { name: 'Dr. Bob Jones', email: 'bob.jones@example.com', specialty: 'Primary Care' }
  ]

  const { data: cData, error: cErr } = await client.from('clinicians').insert(clinicians).select()
  if (cErr) throw cErr
  console.log('Inserted clinicians:', cData.length)

  const healthplans = [
    { name: 'Acme Health Plus', provider: 'Acme Insurance', coverage: { dental: true, vision: true } },
    { name: 'Standard Care', provider: 'Standard Insurance', coverage: { dental: false, vision: true } }
  ]

  const { data: hData, error: hErr } = await client.from('healthplans').insert(healthplans).select()
  if (hErr) throw hErr
  console.log('Inserted healthplans:', hData.length)

  // create patients and associate with first clinician and plan
  const patients = [
    { name: 'Test Patient', email: 'patient@example.com', dob: '1980-06-15', clinician_id: cData[0].id, healthplan_id: hData[0].id },
    { name: 'Second Patient', email: 'second@example.com', dob: '1990-02-20', clinician_id: cData[1].id, healthplan_id: hData[1].id }
  ]

  const { data: pData, error: pErr } = await client.from('patients').insert(patients).select()
  if (pErr) throw pErr
  console.log('Inserted patients:', pData.length)

  console.log('Seeding complete')
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message || err)
  process.exit(1)
})
