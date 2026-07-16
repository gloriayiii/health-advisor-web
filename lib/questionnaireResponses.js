export async function listQuestionnaireResponses(client, questionnaireId) {
  const { data, error } = await client
    .from('questionnaire_responses')
    .select('id, questionnaire_id, patient_id, user_id, responses, submitted_at')
    .eq('questionnaire_id', questionnaireId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data || []
}
