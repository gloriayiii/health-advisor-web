import React from 'react'
import { CheckCircle, FileText, Save } from 'lucide-react'
import {
  ALL_QUESTION_DEFS,
  QUESTION_BY_ID,
  QUESTION_CATEGORIES,
  QUESTION_TYPE_OPTIONS,
  getDefaultChoiceOptions,
  isChoiceType
} from './questionnaireConfig'

export default function QuestionnaireEditor({
  selectedQuestionIds,
  setSelectedQuestionIds,
  questionConfigs,
  clinicians,
  healthplans,
  selectedClinician,
  selectedPlan,
  planInfo,
  optionDrafts,
  questionnaireStatus,
  questionnaireSentAt,
  questionnaireDelivery,
  questionnaireResponses,
  onSelectedClinicianChange,
  onSelectedPlanChange,
  onPlanInfoChange,
  onOptionDraftChange,
  onToggleQuestion,
  onQuestionTypeChange,
  onOptionsChange,
  onRequiredChange,
  onAddOptions,
  onSave
}) {
  return (
    <div className="review-healthplan-card review-healthplan-tab">
      <h2 className="review-card-title"><FileText size={20} />Health Plan Questionnaire</h2>

      <div className="questionnaire-status-row">
        <div className={`questionnaire-status-pill ${questionnaireStatus}`}>
          Status: {questionnaireStatus === 'sent' ? 'Sent to patient' : 'Draft'}
        </div>
        <div className="questionnaire-summary">
          {selectedQuestionIds.length} of {ALL_QUESTION_DEFS.length} questions selected
        </div>
        {questionnaireSentAt && (
          <div className="questionnaire-summary">
            Sent at: {new Date(questionnaireSentAt).toLocaleString()}
          </div>
        )}
        {questionnaireStatus === 'sent' && (
          <div className={`questionnaire-delivery-status ${questionnaireDelivery.status}`}>
            Delivery: {questionnaireDelivery.status}
          </div>
        )}
      </div>

      {questionnaireDelivery.error && (
        <div className="api-error">App notification failed: {questionnaireDelivery.error}</div>
      )}

      <div className="plan-selection-row">
        <label>Assign Clinician</label>
        <select value={selectedClinician || ''} onChange={(event) => onSelectedClinicianChange(event.target.value)}>
          <option value="">(Unassigned)</option>
          {clinicians.map((clinician) => (
            <option key={clinician.id} value={clinician.id}>
              {clinician.name} {clinician.specialty ? `- ${clinician.specialty}` : ''}
            </option>
          ))}
        </select>

        <label>Health Plan</label>
        <div className="healthplan-selection-list">
          {healthplans.length === 0 && <div className="muted">No health plans available</div>}
          {healthplans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className={`healthplan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={() => onSelectedPlanChange(plan.id)}
            >
              <div className="hp-name">{plan.name}</div>
              <div className="hp-provider">{plan.provider || '—'}</div>
              {plan.coverage && (
                <div className="hp-coverage">
                  {typeof plan.coverage === 'string'
                    ? plan.coverage
                    : plan.coverage.summary || JSON.stringify(plan.coverage)}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="healthplan-categories">
        {QUESTION_CATEGORIES.map((category, categoryIndex) => {
          const selectedCount = category.questions.filter((question) =>
            selectedQuestionIds.includes(question.id)
          ).length
          const allSelected = selectedCount === category.questions.length

          return (
            <details key={category.id} className="category-panel" open={categoryIndex === 0}>
              <summary className="category-summary">
                <span>{category.title}</span>
                <span className="category-count">{selectedCount}/{category.questions.length} selected</span>
              </summary>
              <div className="category-content stacked">
                <label className="category-select-all">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelectedQuestionIds((previous) => {
                      if (allSelected) {
                        return previous.filter((id) =>
                          !category.questions.some((question) => question.id === id)
                        )
                      }
                      return Array.from(new Set([
                        ...previous,
                        ...category.questions.map((question) => question.id)
                      ]))
                    })}
                  />
                  Select all questions in this category
                </label>

                {category.questions.map((question) => {
                  const config = questionConfigs[question.id] || {}
                  const type = config.type || question.type
                  const options = isChoiceType(type)
                    ? config.options?.length
                      ? config.options
                      : getDefaultChoiceOptions(question.id, type, question.options || [])
                    : []
                  const selected = selectedQuestionIds.includes(question.id)

                  return (
                    <div key={question.id} className={`question-row question-card ${selected ? 'selected' : ''}`}>
                      <label className="question-item-inline">
                        <input type="checkbox" checked={selected} onChange={() => onToggleQuestion(question.id)} />
                      </label>
                      <div className="question-main">
                        <div className="question-text">{question.text}</div>
                        <div className="question-controls wrap">
                          <label className="field-inline">
                            Type
                            <select
                              className="question-format-select"
                              value={type}
                              onChange={(event) => onQuestionTypeChange(question.id, event.target.value)}
                            >
                              {QUESTION_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </label>
                          <label className="field-inline required-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(config.required)}
                              onChange={(event) => onRequiredChange(question.id, event.target.checked)}
                            />
                            Required
                          </label>
                        </div>

                        <div className="question-preview">
                          {type === 'yes_no' && (
                            <div className="preview-yesno">
                              <label><input type="radio" disabled /> Yes</label>
                              <label><input type="radio" disabled /> No</label>
                            </div>
                          )}
                          {type === 'single_select' && (
                            <select value="" onChange={() => {}} aria-label={`Preview for ${question.text}`}>
                              <option value="">Select one option</option>
                              {options.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                          )}
                          {type === 'multi_select' && (
                            <div className="preview-multi">
                              {options.map((option) => (
                                <label key={option} className="preview-multi-item">
                                  <input type="checkbox" disabled /> {option}
                                </label>
                              ))}
                            </div>
                          )}
                          {type === 'text' && <input type="text" disabled placeholder="Short text answer" />}
                          {type === 'long_text' && <textarea disabled placeholder="Long text answer" className="preview-textarea" />}
                        </div>

                        {isChoiceType(type) && type !== 'yes_no' && (
                          <div className="options-editor">
                            <label className="field-inline block">
                              Options (comma separated)
                              <input
                                className="options-input"
                                value={options.join(', ')}
                                onChange={(event) => onOptionsChange(question.id, event.target.value)}
                              />
                            </label>
                            <div className="options-add-row">
                              <input
                                className="options-input"
                                value={optionDrafts[question.id] || ''}
                                onChange={(event) => onOptionDraftChange(question.id, event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault()
                                    onAddOptions(question.id)
                                  }
                                }}
                                placeholder="Add more options"
                              />
                              <button type="button" className="review-action-button" onClick={() => onAddOptions(question.id)}>
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>

      <div className="healthplan-info">
        <label>Additional Plan Information</label>
        <textarea
          value={planInfo}
          onChange={(event) => onPlanInfoChange(event.target.value)}
          placeholder="Enter instructions or details for the patient..."
          className="healthplan-textarea"
        />
      </div>

      <section className="questionnaire-responses">
        <h3>Patient Responses</h3>
        {questionnaireResponses.length === 0 ? (
          <p className="muted">No responses submitted yet.</p>
        ) : questionnaireResponses.map((submission) => (
          <div key={submission.id} className="questionnaire-response">
            <div className="questionnaire-response-time">
              Submitted {new Date(submission.submitted_at).toLocaleString()}
            </div>
            {Object.entries(submission.responses || {}).map(([questionId, value]) => (
              <div key={questionId} className="questionnaire-response-row">
                <strong>{QUESTION_BY_ID[questionId]?.text || questionId}</strong>
                <span>{Array.isArray(value) ? value.join(', ') : String(value || '—')}</span>
              </div>
            ))}
          </div>
        ))}
      </section>

      <div className="review-action-buttons">
        <button className="review-action-button" onClick={() => onSave('draft')}>
          <Save size={16} />Save Draft
        </button>
        <button
          className="review-action-button approve"
          onClick={() => onSave('sent')}
          disabled={selectedQuestionIds.length === 0}
        >
          <CheckCircle size={16} />Send to Patient
        </button>
      </div>
    </div>
  )
}
