import { clearAuthCookies } from '../../../../lib/auth'
import { apiSuccess } from '../../../../lib/apiResponse'

export async function POST() {
  const response = apiSuccess()
  clearAuthCookies(response)
  return response
}
