import { requireClinician } from '../../../../../lib/auth'
import { apiError, apiSuccess } from '../../../../../lib/apiResponse'
import { listQuestionnaireResponses } from '../../../../../lib/questionnaireResponses'

export async function GET(request, { params }) {
  const auth = await requireClinician(request)
  if (auth.error) return auth.error

  try {
    const responses = await listQuestionnaireResponses(auth.client, params.id)
    return apiSuccess({ responses })
  } catch (error) {
    return apiError(error, 500)
  }
}
