import { requireClinician } from '../../../lib/auth'
import { apiError, apiSuccess } from '../../../lib/apiResponse'

export async function GET(request) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error

  const { data, error } = await auth.client.from('healthplans').select('*')
  if (error) return apiError(error, 500)
  return apiSuccess(data || [])
}

export async function POST(request) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body?.name) return apiError('name required', 400)

  const { data, error } = await auth.client
    .from('healthplans')
    .insert([body])
    .select()
    .single()
  if (error) return apiError(error, 500)
  return apiSuccess(data, 201)
}
