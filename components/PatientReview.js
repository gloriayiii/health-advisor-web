'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requestJson } from '@/lib/apiClient';
import PatientSummary from './patientReview/PatientSummary';
import QuestionnaireEditor from './patientReview/QuestionnaireEditor';
import RecommendationReview from './patientReview/RecommendationReview';
import {
  ALL_QUESTION_DEFS,
  QUESTION_BY_ID,
  QUESTION_ID_BY_TEXT,
  QUESTIONNAIRE_SCHEMA_VERSION,
  getDefaultChoiceOptions,
  isChoiceType
} from './patientReview/questionnaireConfig';
import {
  EMPTY_RECOMMENDATION,
  mapPatientRecord,
  mapRecommendationRecord
} from './patientReview/mappers';
import './styles/PatientReview.css';

async function readSseEvents(response, handlers) {
  if (!response.body) throw new Error('Recommendation stream is unavailable')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() || ''

    for (const block of blocks) {
      const lines = block.split('\n')
      const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim()
      const dataLine = lines.find((line) => line.startsWith('data:'))?.slice(5).trim()
      if (!event || !dataLine) continue
      handlers[event]?.(JSON.parse(dataLine))
    }

    if (done) break
  }
}

function PatientReview({ patientId }) {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [recommendation, setRecommendation] = useState({ ...EMPTY_RECOMMENDATION });
  const [loadError, setLoadError] = useState('')
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecommendation, setEditedRecommendation] = useState('');
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('')
  const [activeTab, setActiveTab] = useState('review');
  const [patientMetadataRaw, setPatientMetadataRaw] = useState({})
  const [questionnaireId, setQuestionnaireId] = useState('')
  const [questionnaireDelivery, setQuestionnaireDelivery] = useState({
    status: 'not_attempted',
    error: ''
  })
  const [questionnaireResponses, setQuestionnaireResponses] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { patient: data } = await requestJson(`/api/patients/${patientId}`)
        if (!mounted) return
        const md = data.metadata || data.meta || {}
        const savedQuestionnaire = md.questionnaire || {}
        setPatientMetadataRaw(md)
        setPatient(mapPatientRecord(data))
        setSelectedQuestionIds(
          Array.isArray(savedQuestionnaire.selectedQuestionIds)
            ? savedQuestionnaire.selectedQuestionIds
            : (md.selectedQuestions || [])
                .map((questionText) => QUESTION_ID_BY_TEXT[questionText])
                .filter(Boolean)
        )
        setPlanInfo(savedQuestionnaire.planInfo ?? md.planInfo ?? '')
        if (savedQuestionnaire.questionConfigs) {
          setQuestionConfigs(savedQuestionnaire.questionConfigs)
        }
        setQuestionnaireStatus(savedQuestionnaire.status || 'draft')
        setQuestionnaireSentAt(savedQuestionnaire.sentAt || null)
        setQuestionnaireId(savedQuestionnaire.id || '')
        setQuestionnaireDelivery({
          status:
            savedQuestionnaire.delivery?.externalServerStatus ||
            md.questionnairePushResult?.status ||
            'not_attempted',
          error:
            savedQuestionnaire.delivery?.externalServerStatus === 'failed'
              ? savedQuestionnaire.delivery?.externalServerResponse || ''
              : ''
        })
        setSelectedClinician(data.clinician_id || null)
        setSelectedPlan(data.healthplan_id || null)
      } catch (err) {
        console.warn('Failed to fetch patient', err)
        if (mounted) setLoadError(err.message || 'Patient could not be loaded')
      }

      // fetch clinicians, healthplans, and recommendations
      try {
        const [clinicianData, healthplanData, recommendationData] = await Promise.all([
          requestJson('/api/clinicians'),
          requestJson('/api/healthplans'),
          requestJson(`/api/recommendations?patient_id=${patientId}`)
        ])
        setClinicians(clinicianData)
        setHealthplans(healthplanData)
        const record = recommendationData[0] || null
        const mapped = mapRecommendationRecord(record)
        setRecommendation(mapped)
        setRecommendationRecord(record)
        setEditedRecommendation(mapped.recommendation)
        setReviewStatus(mapped.status)
      } catch (err) {
        console.warn('Failed to fetch clinicians/healthplans/recommendations', err)
      }

      // nothing further here; clinician/plan set when patient loaded
    }
    load()
    return () => { mounted = false }
  }, [patientId]);

  useEffect(() => {
    if (!questionnaireId) {
      setQuestionnaireResponses([])
      return
    }

    requestJson(`/api/questionnaires/${questionnaireId}/responses`)
      .then((data) => setQuestionnaireResponses(data.responses || []))
      .catch((error) => {
        console.error(error)
        setQuestionnaireResponses([])
      })
  }, [questionnaireId])

  const persistRecommendation = async (status, text = editedRecommendation) => {
    const options = {
      method: recommendationRecord?.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        recommendationRecord?.id
          ? { recommendation: text, status }
          : { patient_id: patient.id, recommendation: text, status }
      )
    }
    const url = recommendationRecord?.id
      ? `/api/recommendations/${recommendationRecord.id}`
      : '/api/recommendations'
    const record = await requestJson(url, options)
    const mapped = mapRecommendationRecord(record)
    setRecommendation(mapped)
    setEditedRecommendation(mapped.recommendation)
    setRecommendationRecord(record)
    setReviewStatus(mapped.status)
    return record
  }

  const updateRecommendationStatus = async (status) => {
    try {
      await persistRecommendation(status)
    } catch (error) {
      console.error(error)
      alert(`Could not mark recommendation as ${status}`)
    }
  }

  const handleApprove = () => updateRecommendationStatus('approved');
  const handleReject = () => updateRecommendationStatus('rejected');

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleGenerateRecommendation = () => {
    const run = async () => {
      try {
        if (!patient || !patient.id) return alert('No patient selected')
        setGenerateError('')
        setGenerating(true)
        setRecommendation({
          originalPrompt: '',
          recommendation: '',
          confidence: 0,
          generatedAt: new Date().toISOString(),
          status: 'pending'
        })
        setEditedRecommendation('')
        setRecommendationRecord(null)

        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generate: true, patient_id: patient.id })
        })
        if (!res.ok) {
          const txt = await res.text()
          let msg = txt
          try {
            const j = JSON.parse(txt)
            msg = j.error || txt
          } catch (e) {}
          throw new Error(msg)
        }

        let streamError = ''
        await readSseEvents(res, {
          token: ({ content }) => {
            setRecommendation((current) => ({
              ...current,
              recommendation: `${current.recommendation}${content}`
            }))
            setEditedRecommendation((current) => `${current}${content}`)
          },
          done: ({ recommendation: created }) => {
            const mapped = mapRecommendationRecord(created)
            setRecommendation(mapped)
            setEditedRecommendation(mapped.recommendation)
            setRecommendationRecord(created)
            setReviewStatus(mapped.status)
          },
          error: ({ error }) => {
            streamError = error || 'Recommendation generation failed'
          }
        })

        if (streamError) throw new Error(streamError)
      } catch (err) {
        console.error('Generate failed', err)
        const msg = err?.message || String(err)
        setGenerateError(msg)
        console.error('Generate failed', msg)
      } finally {
        setGenerating(false)
      }
    }
    run()
  }

  const handleSaveEdit = () => {
    const save = async () => {
      try {
        await persistRecommendation('modified', editedRecommendation)
        setIsEditing(false)
      } catch (err) {
        console.error(err)
        alert('Could not save recommendation')
      }
    }
    save()
  };

  const handleCancelEdit = () => {
    setEditedRecommendation(recommendation?.recommendation || '');
    setIsEditing(false);
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'modified': return 'Modified';
      case 'pending': return 'Pending Review';
      default: return 'Unknown';
    }
  };

  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [planInfo, setPlanInfo] = useState('');
  const [questionConfigs, setQuestionConfigs] = useState({});
  const [clinicians, setClinicians] = useState([])
  const [healthplans, setHealthplans] = useState([])
  const [selectedClinician, setSelectedClinician] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [recommendationRecord, setRecommendationRecord] = useState(null)
  const [questionnaireStatus, setQuestionnaireStatus] = useState('draft')
  const [questionnaireSentAt, setQuestionnaireSentAt] = useState(null)
  const [optionDrafts, setOptionDrafts] = useState({})

  useEffect(() => {
    // initialize default configuration for all template questions
    const defaults = {};
    ALL_QUESTION_DEFS.forEach((question) => {
      const choiceType = question.type === 'yes_no' || question.type === 'single_select' || question.type === 'multi_select';
      defaults[question.id] = {
        type: question.type,
        options: choiceType ? getDefaultChoiceOptions(question.id, question.type, question.options) : [],
        required: false
      };
    });
    setQuestionConfigs((prev) => ({ ...defaults, ...prev }));
  }, []);

  const handleToggleQuestion = (questionId) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(questionId)) {
        setQuestionConfigs((current) => ({
          ...current,
          [questionId]: {
            ...(current[questionId] || {}),
            required: false
          }
        }));
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleQuestionTypeChange = (questionId, type) => {
    setQuestionConfigs((prev) => {
      const current = prev[questionId] || {};
      const next = { ...current, type };
      if (type === 'yes_no') {
        next.options = ['Yes', 'No'];
      }
      if ((type === 'single_select' || type === 'multi_select') && (!current.options || current.options.length === 0)) {
        next.options = getDefaultChoiceOptions(
          questionId,
          type,
          QUESTION_BY_ID[questionId]?.options || []
        );
      }
      if (type === 'text' || type === 'long_text') {
        next.options = [];
      }
      return { ...prev, [questionId]: next };
    });
  };

  const handleOptionsChange = (questionId, value) => {
    setQuestionConfigs((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        options: value.split(',').map((item) => item.trim()).filter(Boolean)
      }
    }));
  };

  const handleRequiredChange = (questionId, required) => {
    if (required) {
      setSelectedQuestionIds((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
    }
    setQuestionConfigs((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        required
      }
    }));
  };

  const handleAddOptions = (questionId) => {
    const draft = optionDrafts[questionId] || '';
    const toAdd = draft.split(',').map((item) => item.trim()).filter(Boolean);
    if (toAdd.length === 0) return;

    setQuestionConfigs((prev) => {
      const current = prev[questionId] || {};
      const existing = Array.isArray(current.options) ? current.options : [];
      const normalizedExisting = new Set(existing.map((option) => option.toLowerCase()));
      const merged = [...existing];

      toAdd.forEach((option) => {
        const key = option.toLowerCase();
        if (!normalizedExisting.has(key)) {
          normalizedExisting.add(key);
          merged.push(option);
        }
      });

      return {
        ...prev,
        [questionId]: {
          ...current,
          options: merged
        }
      };
    });

    setOptionDrafts((prev) => ({ ...prev, [questionId]: '' }));
  };

  const buildQuestionnairePayload = (status) => {
    const selectedQuestions = selectedQuestionIds
      .map((questionId, index) => {
        const base = QUESTION_BY_ID[questionId];
        const config = questionConfigs[questionId] || {};
        const type = config.type || base?.type || 'text';
        const options = isChoiceType(type)
          ? (config.options && config.options.length
            ? config.options
            : getDefaultChoiceOptions(questionId, type, base?.options || []))
          : [];
        return {
          id: questionId,
          order: index + 1,
          categoryId: base?.categoryId,
          categoryTitle: base?.categoryTitle,
          text: base?.text || questionId,
          type,
          required: Boolean(config.required),
          options,
          answerKey: questionId
        };
      })
      .filter((question) => question.text);

    return {
      id: questionnaireId || crypto.randomUUID(),
      schemaVersion: QUESTIONNAIRE_SCHEMA_VERSION,
      patientId: patient?.id || '',
      planInfo,
      selectedQuestionIds,
      selectedQuestions,
      questionConfigs,
      answerTemplate: Object.fromEntries(
        selectedQuestions.map((question) => [
          question.answerKey,
          question.type === 'multi_select' ? [] : ''
        ])
      ),
      status,
      sentAt: status === 'sent' ? new Date().toISOString() : null,
      delivery: {
        destination: '',
        externalServerStatus: 'not_configured',
        externalServerResponse: null
      },
      totalQuestionsSelected: selectedQuestions.length
    };
  };

  const handleSavePlan = (status = 'draft') => {
    const save = async () => {
      try {
        const questionnaire = buildQuestionnairePayload(status)
        const body = {
          clinician_id: selectedClinician,
          healthplan_id: selectedPlan,
          metadata: {
            ...patientMetadataRaw,
            questionnaire,
            // Keep legacy keys for compatibility with older consumers
            planInfo: questionnaire.planInfo,
            selectedQuestions: questionnaire.selectedQuestions.map((question) => question.text),
            questionFormats: Object.fromEntries(questionnaire.selectedQuestions.map((question) => [question.text, question.type])),
            questionOptions: Object.fromEntries(questionnaire.selectedQuestions.map((question) => [question.text, question.options || []]))
          }
        }
        const result = await requestJson(`/api/patients/${patient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const updated = result.patient
        const savedQuestionnaire = updated.metadata?.questionnaire || questionnaire
        const pushResult = updated.metadata?.questionnairePushResult || {}
        const deliveryStatus = pushResult.attempted
          ? pushResult.status
          : status === 'sent'
            ? 'available'
            : 'not_attempted'

        setPatientMetadataRaw(updated.metadata || body.metadata)
        setPatient(prev => ({ ...prev, clinician_id: updated.clinician_id, healthplan_id: updated.healthplan_id }))
        setQuestionnaireStatus(status)
        setQuestionnaireSentAt(savedQuestionnaire.sentAt)
        setQuestionnaireId(savedQuestionnaire.id)
        setQuestionnaireDelivery({
          status: deliveryStatus,
          error: deliveryStatus === 'failed' ? pushResult.response || 'Notification delivery failed' : ''
        })

        if (status === 'draft') {
          alert('Health plan questionnaire saved as draft')
        } else if (deliveryStatus === 'failed') {
          alert('Questionnaire was saved for the patient, but the app notification delivery failed')
        } else {
          alert('Questionnaire is available to the patient')
        }
      } catch (err) {
        console.error(err)
        alert('Could not save health plan')
      }
    }
    save()
  };

  if (!patient) {
    return (
      <div className="review-container">
        <header className="review-header">
          <button className="review-back-button" onClick={() => router.push('/')}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="review-header-title">{loadError || 'Loading patient...'}</h1>
        </header>
      </div>
    );
  }

  return (
    <div className="review-container">
      <header className="review-header">
        <button className="review-back-button" onClick={() => router.push('/')}> 
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <h1 className="review-header-title">Patient Review - {patient.name}</h1>
        <div className={`review-status-badge ${reviewStatus}`}>
          {getStatusText(reviewStatus)}
        </div>
      </header>

      <div className="review-body">
        <div className="review-tabs">
        <button
          className={activeTab === 'review' ? 'active' : ''}
          onClick={() => setActiveTab('review')}
        >
          Review
        </button>
        <button
          className={activeTab === 'questionnaire' ? 'active' : ''}
          onClick={() => setActiveTab('questionnaire')}
        >
          Health Plan
        </button>
      </div>

      <main className={`review-main-content ${activeTab === 'questionnaire' ? 'single-col' : ''}`}>
        {activeTab === 'review' && (
          <div className="review-main-two-col">
            <PatientSummary patient={patient} />
            <RecommendationReview
              recommendation={recommendation}
              editedRecommendation={editedRecommendation}
              isEditing={isEditing}
              generating={generating}
              generateError={generateError}
              onEditedRecommendationChange={setEditedRecommendation}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={handleEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onGenerate={handleGenerateRecommendation}
            />
          </div>
        )}
        {activeTab === 'questionnaire' && (
          <QuestionnaireEditor
            selectedQuestionIds={selectedQuestionIds}
            setSelectedQuestionIds={setSelectedQuestionIds}
            questionConfigs={questionConfigs}
            clinicians={clinicians}
            healthplans={healthplans}
            selectedClinician={selectedClinician}
            selectedPlan={selectedPlan}
            planInfo={planInfo}
            optionDrafts={optionDrafts}
            questionnaireStatus={questionnaireStatus}
            questionnaireSentAt={questionnaireSentAt}
            questionnaireDelivery={questionnaireDelivery}
            questionnaireResponses={questionnaireResponses}
            onSelectedClinicianChange={setSelectedClinician}
            onSelectedPlanChange={setSelectedPlan}
            onPlanInfoChange={setPlanInfo}
            onOptionDraftChange={(id, value) => setOptionDrafts((current) => ({ ...current, [id]: value }))}
            onToggleQuestion={handleToggleQuestion}
            onQuestionTypeChange={handleQuestionTypeChange}
            onOptionsChange={handleOptionsChange}
            onRequiredChange={handleRequiredChange}
            onAddOptions={handleAddOptions}
            onSave={handleSavePlan}
          />
        )}
      </main>
      </div>
    </div>
  );
}

export default PatientReview;
