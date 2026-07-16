import { createClient } from '@supabase/supabase-js'
import { apiError } from './apiResponse'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

export const ACCESS_TOKEN_COOKIE = 'health-advisor-access-token'
export const REFRESH_TOKEN_COOKIE = 'health-advisor-refresh-token'

export function createUserClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export async function requireClinician(request) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (!accessToken) {
    return { error: apiError('Authentication required', 401) }
  }

  const client = createUserClient(accessToken)
  const { data: authData, error: authError } = await client.auth.getUser(accessToken)
  if (authError || !authData.user) {
    return { error: apiError('Session expired', 401) }
  }

  const { data: clinician, error: clinicianError } = await client
    .from('clinicians')
    .select('*')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (clinicianError || !clinician) {
    return { error: apiError('Clinician access required', 403) }
  }

  return { client, user: authData.user, clinician }
}

export function setAuthCookies(response, session) {
  const secure = process.env.NODE_ENV === 'production'
  const options = { httpOnly: true, sameSite: 'lax', secure, path: '/' }

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    ...options,
    maxAge: session.expires_in
  })
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    ...options,
    maxAge: 60 * 60 * 24 * 30
  })
}

export function clearAuthCookies(response) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 })
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', { path: '/', maxAge: 0 })
}
