import React from 'react'
import {
  Brain,
  CheckCircle,
  Edit3,
  RotateCcw,
  Save,
  XCircle
} from 'lucide-react'

export default function RecommendationReview({
  recommendation,
  editedRecommendation,
  isEditing,
  generating,
  generateError,
  onEditedRecommendationChange,
  onApprove,
  onReject,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onGenerate
}) {
  return (
    <div className="review-llm-recommendation-card">
      <h2 className="review-card-title"><Brain size={20} />AI-Generated Recommendation</h2>
      <div className="review-confidence-info">
        Confidence Score: {Math.round(recommendation.confidence * 100)}% |
        {' '}Generated: {recommendation.generatedAt || 'Not generated'}
      </div>

      {isEditing ? (
        <div className="review-edit-section">
          <textarea
            className="review-textarea"
            value={editedRecommendation}
            onChange={(event) => onEditedRecommendationChange(event.target.value)}
            placeholder="Edit the recommendation..."
          />
          <div className="review-action-buttons">
            <button className="review-action-button edit" onClick={onSaveEdit}>
              <Save size={16} />Save Changes
            </button>
            <button className="review-action-button" onClick={onCancelEdit}>
              <XCircle size={16} />Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="review-recommendation-content">
            {recommendation.recommendation || 'No recommendation generated yet.'}
          </div>
          <div className="review-action-buttons">
            <button className="review-action-button approve" onClick={onApprove}>
              <CheckCircle size={16} />Approve
            </button>
            <button className="review-action-button" onClick={onGenerate} disabled={generating}>
              <RotateCcw size={16} />{generating ? 'Generating...' : 'Generate with Ollama'}
            </button>
            <button className="review-action-button reject" onClick={onReject}>
              <XCircle size={16} />Reject
            </button>
            <button className="review-action-button edit" onClick={onEdit}>
              <Edit3 size={16} />Edit
            </button>
          </div>
          {generateError && (
            <div className="api-error">Could not generate recommendation: {generateError}</div>
          )}
        </>
      )}
    </div>
  )
}
