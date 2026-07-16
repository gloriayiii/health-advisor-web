import { createClient } from '@supabase/supabase-js'
import { apiError, apiSuccess } from '../../../../lib/apiResponse'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  createUserClient,
  setAuthCookies
} from '../../../../lib/auth'

async function getSession(request) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (accessToken) {
    const client = createUserClient(accessToken)
    const { data } = await client.auth.getUser(accessToken)
    if (data.user) return { accessToken, user: data.user }
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  if (!refreshToken) return null

  const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session) return null

  return {
    accessToken: data.session.access_token,
    user: data.user,
    session: data.session
  }
}

export async function GET(request) {
  const session = await getSession(request)
  if (!session) {
    const response = apiError('Authentication required', 401)
    clearAuthCookies(response)
    return response
  }

  const client = createUserClient(session.accessToken)
  const { data: clinician } = await client
    .from('clinicians')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single()

  if (!clinician) {
    const response = apiError('Clinician access required', 403)
    clearAuthCookies(response)
    return response
  }

  const response = apiSuccess({
    user: {
      id: session.user.id,
      clinicianId: clinician.id,
      name: clinician.name,
      email: clinician.email || session.user.email,
      role: 'clinician',
      department: clinician.specialty || ''
    }
  })
  if (session.session) setAuthCookies(response, session.session)
  return response
}
