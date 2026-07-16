import { supabase, supabaseAdmin } from '../../../lib/supabase'
import { apiError, apiSuccess } from '../../../lib/apiResponse'

const client = supabaseAdmin || supabase

export async function GET() {
  try {
    const tables = [
      'patients',
      'clinicians',
      'healthplans',
      'recommendations',
      'users',
      'questionnaires',
      'questionnaire_responses'
    ]
    const checks = await Promise.all(
      tables.map(async (table) => {
        const { count, error } = await client.from(table).select('id', { count: 'exact', head: true })
        return {
          table,
          ok: !error,
          count: count ?? 0,
          error: error?.message || null
        }
      })
    )
    const ok = checks.every((check) => check.ok)

    if (!ok) {
      return apiError(
        `Database checks failed: ${checks.filter((check) => !check.ok).map((check) => check.table).join(', ')}`,
        500
      )
    }

    return apiSuccess({
        ok,
        usingServiceRole: Boolean(supabaseAdmin),
        checks
    })
  } catch (err) {
    return apiError(err, 500)
  }
}
