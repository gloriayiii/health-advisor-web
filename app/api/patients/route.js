import { requireClinician } from '../../../lib/auth'
import { apiError, apiSuccess } from '../../../lib/apiResponse'

export async function GET(request) {
  try {
    const auth = await requireClinician(request)
    if (auth.error) return auth.error
    const { client } = auth
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const urgency = searchParams.get('urgency')
    const email = searchParams.get('email')
    const id = searchParams.get('id')

    let query = client.from('patients').select('*')

    if (id) query = query.eq('id', id)
    if (email) query = query.ilike('email', email)
    if (status) query = query.eq('metadata->>status', status)
    if (urgency) query = query.eq('metadata->>urgency', urgency)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return apiError(error, 500)
    return apiSuccess({
      patients: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    return apiError(error, 500)
  }
}

export async function POST(request) {
  try {
    const auth = await requireClinician(request)
    if (auth.error) return auth.error
    const { client } = auth
    const body = await request.json()
    if (!body || !body.name || !body.email) {
      return apiError('name and email required', 400)
    }

    const { data, error } = await client.from('patients').insert([body]).select().single()
    if (error) return apiError(error, 500)
    return apiSuccess({ patient: data }, 201)
  } catch (error) {
    return apiError(error, 500)
  }
}
