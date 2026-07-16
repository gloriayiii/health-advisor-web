import { requireClinician } from '../../../../lib/auth'
import { apiError, apiSuccess } from '../../../../lib/apiResponse'

export async function GET(request, { params }) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error

  const { data, error } = await auth.client
    .from('recommendations')
    .select('*')
    .eq('id', params.id)
    .single()
  if (error) return apiError(error, 404)
  return apiSuccess(data)
}

export async function PUT(request, { params }) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error

  const patch = await request.json()
  const allowedFields = ['recommendation', 'status']
  const update = Object.fromEntries(
    Object.entries(patch).filter(([key]) => allowedFields.includes(key))
  )
  if (Object.keys(update).length === 0) {
    return apiError('No supported fields provided', 400)
  }

  const { data, error } = await auth.client
    .from('recommendations')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return apiError(error, 404)
  return apiSuccess(data)
}

export async function DELETE(request, { params }) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error

  const { error } = await auth.client.from('recommendations').delete().eq('id', params.id)
  if (error) return apiError(error, 404)
  return apiSuccess()
}
