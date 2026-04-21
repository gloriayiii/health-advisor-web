import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../lib/supabase'

const client = supabaseAdmin || supabase

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const patient_id = url.searchParams.get('patient_id')
    let query = client.from('recommendations').select('*')
    if (patient_id) query = query.eq('patient_id', patient_id)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err), stack: err.stack }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    // If client asks to generate a recommendation via LLM
    if (body && body.generate) {
      if (!body.patient_id && !body.patient) return NextResponse.json({ error: 'patient_id or patient data required to generate' }, { status: 400 })

      // use provided patient fields if present, otherwise fetch from DB
      let patient = body.patient || null
      if (!patient) {
        const { data, error: pErr } = await client.from('patients').select('*').eq('id', body.patient_id).single()
        if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
        patient = data
      }

      // build prompt from patient data
      const promptParts = []
      promptParts.push('You are a clinical assistant. Provide concise, evidence-informed recommendations for the following patient.')
      if (patient.name) promptParts.push(`Name: ${patient.name}`)
      if (patient.dob) promptParts.push(`DOB: ${patient.dob}`)
      if (patient.email) promptParts.push(`Email: ${patient.email}`)
      if (patient.phone) promptParts.push(`Phone: ${patient.phone}`)
      if (patient.gender) promptParts.push(`Gender: ${patient.gender}`)
      if (patient.healthplan_id) promptParts.push(`Health plan id: ${patient.healthplan_id}`)
      if (patient.clinician_id) promptParts.push(`Assigned clinician id: ${patient.clinician_id}`)
      // metadata may contain medicalHistory, symptoms, medications, allergies
      const md = patient.metadata || patient.meta || {}
      if (md.medicalHistory || md.medical_history) promptParts.push(`Medical history: ${md.medicalHistory || md.medical_history}`)
      if (md.symptoms) promptParts.push(`Symptoms: ${md.symptoms}`)
      if (md.currentMedications || md.current_medications) promptParts.push(`Current medications: ${md.currentMedications || md.current_medications}`)
      if (md.allergies) promptParts.push(`Allergies: ${md.allergies}`)
      const prompt = promptParts.join('\n') + '\n\nPlease provide: 1) brief assessment, 2) recommended next steps (lifestyle and pharmacologic where appropriate), 3) monitoring plan and safety/contraindications. Keep it clinician-facing and cite nothing.'

      // call OpenAI Chat Completions API (expects OPENAI_API_KEY in env)
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY
      if (!OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY not configured on server' }, { status: 500 })

      const modelToUse = body.model || process.env.DEFAULT_OPENAI_MODEL || 'gpt-3.5-turbo'
      const maxTokens = body.max_tokens || parseInt(process.env.OPENAI_MAX_TOKENS || '400', 10)

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: 'You are a helpful medical assistant for clinicians.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.2
        })
      })

      if (!openaiRes.ok) {
        const errText = await openaiRes.text()
        return NextResponse.json({ error: 'LLM request failed', detail: errText }, { status: 500 })
      }

      const openaiJson = await openaiRes.json()
      const content = openaiJson?.choices?.[0]?.message?.content || openaiJson?.choices?.[0]?.text || ''

      const rec = {
        patient_id: body.patient_id,
        original_prompt: prompt,
        recommendation: content,
        confidence: 0,
        status: 'pending',
        generated_at: new Date().toISOString()
      }

      const { data, error: insertErr } = await client.from('recommendations').insert([rec]).select().single()
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
      return NextResponse.json(data, { status: 201 })
    }

    // fallback: direct insert when the client provides recommendation text
    if (!body || !body.patient_id || !body.recommendation) {
      return NextResponse.json({ error: 'patient_id and recommendation required' }, { status: 400 })
    }
    const { data, error } = await client.from('recommendations').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err), stack: err.stack }, { status: 500 })
  }
}
