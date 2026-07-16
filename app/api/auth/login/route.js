import { createClient } from '@supabase/supabase-js'
import { createUserClient, setAuthCookies } from '../../../../lib/auth'
import { apiError, apiSuccess } from '../../../../lib/apiResponse'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return apiError('Email and password are required', 400)
    }

    const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      return apiError('Invalid email or password', 401)
    }

    const client = createUserClient(data.session.access_token)
    const { data: clinician, error: clinicianError } = await client
      .from('clinicians')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single()

    if (clinicianError || !clinician) {
      await authClient.auth.signOut()
      return apiError('This account is not linked to a clinician', 403)
    }

    const response = apiSuccess({
      user: {
        id: data.user.id,
        clinicianId: clinician.id,
        name: clinician.name,
        email: clinician.email || data.user.email,
        role: 'clinician',
        department: clinician.specialty || ''
      }
    })
    setAuthCookies(response, data.session)
    return response
  } catch (error) {
    return apiError(error, 500)
  }
}
