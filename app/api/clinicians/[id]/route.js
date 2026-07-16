import { requireClinician } from '../../../../lib/auth'
import { apiError, apiSuccess } from '../../../../lib/apiResponse'

export async function GET(request, { params }) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error
  const { data, error } = await auth.client.from('clinicians').select('*').eq('id', params.id).single()
  if (error) return apiError(error, 404)
  return apiSuccess(data)
}

export async function PUT(request, { params }) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error
  const patch = await request.json()
  const { data, error } = await auth.client.from('clinicians').update(patch).eq('id', params.id).select().single()
  if (error) return apiError(error, 404)
  return apiSuccess(data)
}

export async function DELETE(request, { params }) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error
  const { error } = await auth.client.from('clinicians').delete().eq('id', params.id)
  if (error) return apiError(error, 404)
  return apiSuccess()
}
