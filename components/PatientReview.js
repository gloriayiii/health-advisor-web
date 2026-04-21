'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  Brain, 
  CheckCircle, 
  XCircle,
  Edit3,
  Save,
  RotateCcw,
  AlertTriangle,
  Stethoscope
} from 'lucide-react';
import './styles/PatientReview.css';

// Mock data for patient and LLM recommendation
const mockPatientData = {
  '1': {
    id: '1',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    dateOfBirth: '1979-03-15',
    medicalRecord: 'MR-2024-001',
    condition: 'Hypertension',
    symptoms: 'Elevated blood pressure readings over the past 3 months, occasional headaches',
    medicalHistory: 'Family history of hypertension, non-smoker, moderate alcohol consumption',
    currentMedications: 'None currently',
    allergies: 'None known',
    vitalSigns: {
      bloodPressure: '150/95 mmHg',
      heartRate: '78 bpm',
      temperature: '98.6°F',
      weight: '180 lbs'
    }
  }
};

const mockLLMRecommendation = {
  '1': {
    originalPrompt: 'Patient presents with elevated blood pressure readings over the past 3 months. Family history of hypertension. Please provide treatment recommendations.',
    recommendation: `Based on the patient's presentation and medical history, I recommend the following treatment plan:

1. **Lifestyle Modifications:**
   - Implement DASH diet (Dietary Approaches to Stop Hypertension)
   - Regular aerobic exercise (30 minutes, 5 days/week)
   - Weight reduction if BMI > 25
   - Limit sodium intake to <2.3g/day
   - Stress management techniques

2. **Pharmacological Treatment:**
   - Start with ACE inhibitor (Lisinopril 10mg daily)
   - Monitor blood pressure weekly for first month
   - Consider adding thiazide diuretic if target BP not achieved

3. **Monitoring:**
   - Follow-up in 2 weeks
   - Home blood pressure monitoring
   - Annual comprehensive metabolic panel

4. **Patient Education:**
   - Blood pressure self-monitoring techniques
   - Medication adherence counseling
   - Warning signs requiring immediate medical attention

**Target Blood Pressure:** <130/80 mmHg

**Contraindications to consider:**
- Pregnancy (if applicable)
- Bilateral renal artery stenosis
- Hyperkalemia

Please review and modify as clinically appropriate.`,
    confidence: 0.87,
    generatedAt: '2024-01-15 10:30:00',
    status: 'pending'
  }
};

const QUESTION_TYPE_OPTIONS = [
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'single_select', label: 'Single selection' },
  { value: 'multi_select', label: 'Multiple select (Select all that apply)' },
  { value: 'text', label: 'Text input' },
  { value: 'long_text', label: 'Long text input' }
];

const QUESTION_CATEGORIES = [
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    questions: [
      { id: 'smoke', text: 'Do you smoke?', type: 'yes_no' },
      { id: 'alcohol', text: 'Do you consume alcohol?', type: 'yes_no' },
      { id: 'sleep_hours', text: 'How many hours of sleep do you get per night?', type: 'text' },
      { id: 'exercise_frequency', text: 'How often do you exercise in a typical week?', type: 'single_select', options: ['Never', '1-2 days', '3-4 days', '5+ days'] },
      { id: 'dietary_restrictions', text: 'Do you have any dietary restrictions?', type: 'multi_select', options: ['Low sodium', 'Low sugar', 'Gluten free', 'Vegetarian', 'None'] },
      { id: 'stress_level', text: 'How would you describe your current stress level?', type: 'single_select', options: ['Low', 'Moderate', 'High'] }
    ]
  },
  {
    id: 'medical_history',
    title: 'Medical History',
    questions: [
      { id: 'active_medications', text: 'Are you currently on any medication?', type: 'yes_no' },
      { id: 'hypertension_history', text: 'Do you have a history of hypertension?', type: 'yes_no' },
      { id: 'diabetes', text: 'Do you have diabetes?', type: 'yes_no' },
      { id: 'recent_surgery', text: 'Have you had any surgeries in the past year?', type: 'yes_no' },
      { id: 'pregnancy', text: 'Are you pregnant or planning pregnancy?', type: 'yes_no' },
      { id: 'allergies', text: 'Please list any allergies you have.', type: 'long_text' }
    ]
  },
  {
    id: 'symptoms_monitoring',
    title: 'Symptoms and Monitoring',
    questions: [
      { id: 'chest_pain', text: 'Have you experienced any chest pain?', type: 'yes_no' },
      { id: 'shortness_breath', text: 'Do you experience shortness of breath?', type: 'yes_no' },
      { id: 'headaches', text: 'Do you experience frequent headaches?', type: 'yes_no' },
      { id: 'home_bp', text: 'Do you monitor your blood pressure at home?', type: 'yes_no' },
      { id: 'weight_change', text: 'Have you noticed any changes in weight recently?', type: 'single_select', options: ['Weight loss', 'Weight gain', 'No major change'] },
      { id: 'symptom_notes', text: 'Describe any recent symptoms we should know about.', type: 'long_text' }
    ]
  },
  {
    id: 'function_sensory',
    title: 'Functional and Sensory',
    questions: [
      { id: 'mobility', text: 'Do you have trouble with mobility?', type: 'yes_no' },
      { id: 'assistive_devices', text: 'Do you use any assistive devices?', type: 'multi_select', options: ['Cane', 'Walker', 'Wheelchair', 'Hearing aid', 'None'] },
      { id: 'vision_changes', text: 'Do you have vision changes?', type: 'yes_no' },
      { id: 'hearing_problems', text: 'Do you have any hearing problems?', type: 'yes_no' },
      { id: 'joint_pain', text: 'Do you experience joint pain?', type: 'yes_no' },
      { id: 'concentration', text: 'Do you have trouble concentrating?', type: 'yes_no' }
    ]
  },
  {
    id: 'preventive_other',
    title: 'Preventive and Other',
    questions: [
      { id: 'flu_vaccine', text: 'Have you been vaccinated for influenza this year?', type: 'yes_no' },
      { id: 'depression_history', text: 'Do you have a history of depression?', type: 'yes_no' },
      { id: 'sleep_quality', text: 'Do you have trouble sleeping?', type: 'yes_no' },
      { id: 'dizziness', text: 'Do you experience dizziness or fainting?', type: 'yes_no' },
      { id: 'family_heart', text: 'Do you have a family history of heart disease?', type: 'yes_no' },
      { id: 'patient_goals', text: 'What are your top health goals for the next 3 months?', type: 'long_text' }
    ]
  }
];

const ALL_QUESTION_DEFS = QUESTION_CATEGORIES.flatMap((category) =>
  category.questions.map((question) => ({ ...question, categoryId: category.id, categoryTitle: category.title }))
);

const QUESTION_BY_ID = Object.fromEntries(ALL_QUESTION_DEFS.map((q) => [q.id, q]));
const QUESTION_ID_BY_TEXT = Object.fromEntries(ALL_QUESTION_DEFS.map((q) => [q.text, q.id]));

function formatTypeLabel(type) {
  const found = QUESTION_TYPE_OPTIONS.find((option) => option.value === type);
  return found ? found.label : 'Unknown';
}

function getDefaultChoiceOptions(questionId, type, baseOptions = []) {
  if (Array.isArray(baseOptions) && baseOptions.length > 0) return baseOptions;
  if (type === 'yes_no') return ['Yes', 'No'];

  const optionLibrary = {
    sleep_hours: ['4-5 hours', '6-7 hours', '8+ hours'],
    exercise_frequency: ['Never', '1-2 days', '3-4 days', '5+ days'],
    dietary_restrictions: ['Low sodium', 'Low sugar', 'Gluten free', 'Vegetarian', 'None'],
    stress_level: ['Low', 'Moderate', 'High'],
    weight_change: ['Weight loss', 'Weight gain', 'No major change'],
    assistive_devices: ['Cane', 'Walker', 'Wheelchair', 'Hearing aid', 'None'],
    symptom_notes: ['Chest discomfort', 'Fatigue', 'Swelling', 'Dizziness', 'No current symptoms'],
    patient_goals: ['Lower blood pressure', 'Improve sleep', 'Increase activity', 'Weight management', 'Medication adherence']
  };

  if (optionLibrary[questionId]) return optionLibrary[questionId];
  return type === 'single_select'
    ? ['Option 1', 'Option 2', 'Option 3']
    : ['Option A', 'Option B', 'Option C', 'Option D'];
}

function PatientReview({ patientId }) {
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecommendation, setEditedRecommendation] = useState('');
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('')
  const [activeTab, setActiveTab] = useState('review');
  const [patientMetadataRaw, setPatientMetadataRaw] = useState({})

  useEffect(() => {
    // Load patient data from API (fallback to mock)
    let mounted = true
    async function load() {
      try {
        const res = await fetch(`/api/users/${patientId}`)
        if (res.ok) {
          const data = await res.json()
          if (!mounted) return
          // map DB patient structure into UI-friendly shape
          const md = data.metadata || data.meta || {}
          const savedQuestionnaire = md.questionnaire || {}
          setPatientMetadataRaw(md)
          setPatient({
            id: data.id,
            name: data.name,
            email: data.email || '',
            age: data.dob ? new Date().getFullYear() - new Date(data.dob).getFullYear() : '',
            gender: data.gender || 'Unknown',
            dateOfBirth: data.dob || '',
            phone: data.phone || '',
            address: data.address || {},
            clinician_id: data.clinician_id || null,
            healthplan_id: data.healthplan_id || null,
            medicalRecord: md.medical_record || md.medicalRecord || '',
            condition: md.condition || '',
            symptoms: md.symptoms || '',
            medicalHistory: md.medicalHistory || md.medical_history || '',
            currentMedications: md.currentMedications || md.current_medications || '',
            allergies: md.allergies || '',
            vitalSigns: md.vitalSigns || md.vital_signs || {}
          })
          if (Array.isArray(savedQuestionnaire.selectedQuestionIds)) {
            setSelectedQuestionIds(savedQuestionnaire.selectedQuestionIds)
          } else if (Array.isArray(md.selectedQuestions)) {
            // Backward compatibility for the old text-only selected question format
            setSelectedQuestionIds(
              md.selectedQuestions
                .map((questionText) => QUESTION_ID_BY_TEXT[questionText])
                .filter(Boolean)
            )
          }
          if (typeof savedQuestionnaire.planInfo === 'string') {
            setPlanInfo(savedQuestionnaire.planInfo)
          } else if (typeof md.planInfo === 'string') {
            setPlanInfo(md.planInfo)
          }
          if (savedQuestionnaire.questionConfigs && typeof savedQuestionnaire.questionConfigs === 'object') {
            setQuestionConfigs(savedQuestionnaire.questionConfigs)
          }
          if (savedQuestionnaire.status) {
            setQuestionnaireStatus(savedQuestionnaire.status)
          }
          if (savedQuestionnaire.sentAt) {
            setQuestionnaireSentAt(savedQuestionnaire.sentAt)
          }
          // set selected clinician/plan from DB
          setSelectedClinician(data.clinician_id || null)
          setSelectedPlan(data.healthplan_id || null)
        } else {
          // fallback to mock data
          const patientData = mockPatientData[patientId]
          if (patientData && mounted) setPatient(patientData)
        }
      } catch (err) {
        console.warn('Failed to fetch patient', err)
        const patientData = mockPatientData[patientId]
        if (patientData && mounted) setPatient(patientData)
      }

      // fetch clinicians, healthplans, and recommendations
      try {
        const [cRes, hRes, rRes] = await Promise.all([
          fetch('/api/clinicians'),
          fetch('/api/healthplans'),
          fetch(`/api/recommendations?patient_id=${patientId}`)
        ])
        if (cRes.ok) setClinicians(await cRes.json())
        if (hRes.ok) setHealthplans(await hRes.json())

        if (rRes.ok) {
          const rData = await rRes.json()
          if (Array.isArray(rData) && rData.length > 0) {
            const rec = rData[0]
            const mapped = {
              originalPrompt: rec.original_prompt || '',
              recommendation: rec.recommendation || '',
              confidence: rec.confidence || 0,
              generatedAt: rec.generated_at || rec.created_at,
              status: rec.status || 'pending'
            }
            setRecommendation(mapped)
            setRecommendationRecord(rec)
            setEditedRecommendation(rec.recommendation || '')
            setReviewStatus(rec.status || 'pending')
          } else {
            const llmRecommendation = mockLLMRecommendation[patientId]
            if (llmRecommendation) {
              setRecommendation(llmRecommendation)
              setEditedRecommendation(llmRecommendation.recommendation)
              setReviewStatus(llmRecommendation.status)
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch clinicians/healthplans/recommendations', err)
      }

      // nothing further here; clinician/plan set when patient loaded
    }
    load()
    return () => { mounted = false }
  }, [patientId]);

  const handleApprove = () => {
    const save = async () => {
      try {
        if (recommendationRecord && recommendationRecord.id) {
          const res = await fetch(`/api/recommendations/${recommendationRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
          })
          if (!res.ok) throw new Error('Failed to approve')
          const updated = await res.json()
          setRecommendation(prev => ({ ...prev, status: updated.status }))
          setRecommendationRecord(updated)
          setReviewStatus(updated.status)
        } else {
          const res = await fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patient.id, recommendation: editedRecommendation, status: 'approved' })
          })
          if (!res.ok) throw new Error('Failed to create recommendation')
          const created = await res.json()
          setRecommendation({ ...recommendation, recommendation: created.recommendation, status: created.status })
          setRecommendationRecord(created)
          setReviewStatus(created.status)
        }
      } catch (err) {
        console.error(err)
        alert('Could not save approval')
      }
    }
    save()
  };

  const handleReject = () => {
    const save = async () => {
      try {
        if (recommendationRecord && recommendationRecord.id) {
          const res = await fetch(`/api/recommendations/${recommendationRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' })
          })
          if (!res.ok) throw new Error('Failed to reject')
          const updated = await res.json()
          setRecommendation(prev => ({ ...prev, status: updated.status }))
          setRecommendationRecord(updated)
          setReviewStatus(updated.status)
        } else {
          const res = await fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patient.id, recommendation: editedRecommendation, status: 'rejected' })
          })
          if (!res.ok) throw new Error('Failed to create recommendation')
          const created = await res.json()
          setRecommendation({ ...recommendation, recommendation: created.recommendation, status: created.status })
          setRecommendationRecord(created)
          setReviewStatus(created.status)
        }
      } catch (err) {
        console.error(err)
        alert('Could not save rejection')
      }
    }
    save()
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleGenerateRecommendation = () => {
    const run = async () => {
      try {
        if (!patient || !patient.id) return alert('No patient selected')
        setGenerateError('')
        setGenerating(true)
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // include patient object as fallback so server can generate without DB
          body: JSON.stringify({ generate: true, patient_id: patient.id, patient })
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
        const created = await res.json()
        const mapped = {
          originalPrompt: created.original_prompt || '',
          recommendation: created.recommendation || '',
          confidence: created.confidence || 0,
          generatedAt: created.generated_at || created.created_at,
          status: created.status || 'pending'
        }
        setRecommendation(mapped)
        setEditedRecommendation(mapped.recommendation)
        setRecommendationRecord(created)
        setReviewStatus(mapped.status)
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
        if (recommendationRecord && recommendationRecord.id) {
          const res = await fetch(`/api/recommendations/${recommendationRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recommendation: editedRecommendation, status: 'modified' })
          })
          if (!res.ok) throw new Error('Failed to update recommendation')
          const updated = await res.json()
          setRecommendation({ ...recommendation, recommendation: updated.recommendation })
          setRecommendationRecord(updated)
          setReviewStatus(updated.status)
        } else {
          const res = await fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patient.id, recommendation: editedRecommendation, status: 'modified' })
          })
          if (!res.ok) throw new Error('Failed to create recommendation')
          const created = await res.json()
          setRecommendation({ ...recommendation, recommendation: created.recommendation })
          setRecommendationRecord(created)
          setReviewStatus(created.status)
        }
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

  const isChoiceType = (questionType) => questionType === 'yes_no' || questionType === 'single_select' || questionType === 'multi_select';

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
          options
        };
      })
      .filter((question) => question.text);

    return {
      planInfo,
      selectedQuestionIds,
      selectedQuestions,
      questionConfigs,
      status,
      sentAt: status === 'sent' ? new Date().toISOString() : null,
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
        const res = await fetch(`/api/users/${patient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!res.ok) throw new Error('Failed to update patient')
        const updated = await res.json()
        setPatientMetadataRaw(updated.metadata || body.metadata)
        setPatient(prev => ({ ...prev, clinician_id: updated.clinician_id, healthplan_id: updated.healthplan_id }))
        setQuestionnaireStatus(status)
        setQuestionnaireSentAt(questionnaire.sentAt)
        alert(status === 'sent' ? 'Questionnaire sent to patient successfully' : 'Health plan questionnaire saved as draft')
      } catch (err) {
        console.error(err)
        alert('Could not save health plan')
      }
    }
    save()
  };

  if (!patient || !recommendation) {
    return (
      <div className="review-container">
        <header className="review-header">
          <button className="review-back-button" onClick={() => router.push('/')}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <h1 className="review-header-title">Loading...</h1>
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
            <div>
              <div className="review-patient-info-card">
                <h2 className="review-card-title">
                  <User size={20} />
                  Patient Information
                </h2>
                <div className="review-patient-details">
                  <div className="review-detail-item">
                    <span className="review-detail-label">Name</span>
                    <span className="review-detail-value">{patient.name}</span>
                  </div>
                  <div className="review-detail-item">
                    <span className="review-detail-label">Age</span>
                    <span className="review-detail-value">{patient.age} years</span>
                  </div>
                  <div className="review-detail-item">
                    <span className="review-detail-label">Gender</span>
                    <span className="review-detail-value">{patient.gender}</span>
                  </div>
                  <div className="review-detail-item">
                    <span className="review-detail-label">Medical Record</span>
                    <span className="review-detail-value">{patient.medicalRecord}</span>
                  </div>
                  <div className="review-detail-item">
                    <span className="review-detail-label">Email</span>
                    <span className="review-detail-value">{patient.email || '—'}</span>
                  </div>
                  <div className="review-detail-item">
                    <span className="review-detail-label">Phone</span>
                    <span className="review-detail-value">{patient.phone || '—'}</span>
                  </div>
                  <div className="review-detail-item">
                    <span className="review-detail-label">Primary Condition</span>
                    <span className="review-detail-value">{patient.condition}</span>
                  </div>
                  <div className="review-detail-item">
                    <span className="review-detail-label">Date of Birth</span>
                    <span className="review-detail-value">{patient.dateOfBirth}</span>
                  </div>
                </div>
              </div>

              <div className="review-patient-info-card">
                <h2 className="review-card-title">
                  <Stethoscope size={20} />
                  Medical Details
                </h2>
                <div className="review-medical-details">
                  <div className="review-medical-detail-item">
                    <span className="review-detail-label">Symptoms</span>
                    <div className="review-medical-detail-content">
                      {patient.symptoms}
                    </div>
                  </div>
                  {patient.vitalSigns && Object.keys(patient.vitalSigns).length > 0 && (
                    <div className="review-medical-detail-item">
                      <span className="review-detail-label">Vital Signs</span>
                      <div className="review-medical-detail-content">
                        {Object.entries(patient.vitalSigns).map(([k,v]) => (
                          <div key={k}><strong>{k.replace(/([A-Z])/g, ' $1')}: </strong>{v}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="review-medical-detail-item">
                    <span className="review-detail-label">Medical History</span>
                    <div className="review-medical-detail-content">
                      {patient.medicalHistory}
                    </div>
                  </div>
                  <div className="review-medical-detail-item">
                    <span className="review-detail-label">Current Medications</span>
                    <div className="review-medical-detail-content">
                      {patient.currentMedications}
                    </div>
                  </div>
                  <div className="review-medical-detail-item">
                    <span className="review-detail-label">Allergies</span>
                    <div className="review-medical-detail-content">
                      {patient.allergies}
                    </div>
                  </div>
                  {patient.address && Object.keys(patient.address).length > 0 && (
                    <div className="review-medical-detail-item">
                      <span className="review-detail-label">Address</span>
                      <div className="review-medical-detail-content">
                        {typeof patient.address === 'string' ? (
                          patient.address
                        ) : (
                          <div>
                            {patient.address.street && <div>{patient.address.street}</div>}
                            {patient.address.city && <div>{patient.address.city}{patient.address.state ? `, ${patient.address.state}` : ''} {patient.address.postcode || ''}</div>}
                            {patient.address.country && <div>{patient.address.country}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="review-llm-recommendation-card">
                <h2 className="review-card-title">
                  <Brain size={20} />
                  AI-Generated Recommendation
                </h2>
                <div className="review-confidence-info">
                  Confidence Score: {Math.round(recommendation.confidence * 100)}% | 
                  Generated: {recommendation.generatedAt}
                </div>
                {isEditing ? (
                  <div className="review-edit-section">
                    <textarea
                      className="review-textarea"
                      value={editedRecommendation}
                      onChange={(e) => setEditedRecommendation(e.target.value)}
                      placeholder="Edit the recommendation..."
                    />
                    <div className="review-action-buttons">
                      <button className="review-action-button edit" onClick={handleSaveEdit}>
                        <Save size={16} />
                        Save Changes
                      </button>
                      <button className="review-action-button" onClick={handleCancelEdit}>
                        <XCircle size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="review-recommendation-content">
                      {recommendation.recommendation}
                    </div>
                    <div className="review-action-buttons">
                      <button className="review-action-button approve" onClick={handleApprove}>
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button className="review-action-button" onClick={handleGenerateRecommendation} disabled={generating}>
                        <RotateCcw size={16} />
                        {generating ? 'Generating...' : 'Generate'}
                      </button>
                      <button className="review-action-button reject" onClick={handleReject}>
                        <XCircle size={16} />
                        Reject
                      </button>
                      <button className="review-action-button edit" onClick={handleEdit}>
                        <Edit3 size={16} />
                        Edit
                      </button>
                    </div>
                    {generateError && (
                      <div className="api-error">Could not generate recommendation: {generateError}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'questionnaire' && (
          <div className="review-healthplan-card review-healthplan-tab">
            <h2 className="review-card-title">
              <FileText size={20} />
              Health Plan Questionnaire
            </h2>
            <p>
              Clinicians can preview every question in each category, decide what to include for this patient,
              and send the final questionnaire to the patient side.
            </p>

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
            </div>

            <div className="plan-selection-row">
              <label>Assign Clinician</label>
              <select value={selectedClinician || ''} onChange={(e) => setSelectedClinician(e.target.value)}>
                <option value="">(Unassigned)</option>
                {clinicians.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.specialty ? `— ${c.specialty}` : ''}</option>
                ))}
              </select>

              <label>Health Plan</label>
              <div className="healthplan-selection-list">
                {healthplans.length === 0 && <div className="muted">No health plans available</div>}
                {healthplans.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`healthplan-card ${selectedPlan === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan(p.id)}
                  >
                    <div className="hp-name">{p.name}</div>
                    <div className="hp-provider">{p.provider || '—'}</div>
                    {p.coverage && (typeof p.coverage === 'string' ? (
                      <div className="hp-coverage">{p.coverage}</div>
                    ) : (
                      <div className="hp-coverage">{p.coverage?.summary || JSON.stringify(p.coverage)}</div>
                    ))}
                  </button>
                ))}
              </div>
            </div>

            <div className="healthplan-categories">
              {QUESTION_CATEGORIES.map((category, categoryIndex) => {
                const categorySelectedCount = category.questions.filter((question) => selectedQuestionIds.includes(question.id)).length;
                const allSelected = category.questions.length > 0 && categorySelectedCount === category.questions.length;

                return (
                  <details key={category.id} className="category-panel" open={categoryIndex === 0}>
                    <summary className="category-summary">
                      <span>{category.title}</span>
                      <span className="category-count">{categorySelectedCount}/{category.questions.length} selected</span>
                    </summary>
                    <div className="category-content stacked">
                      <label className="category-select-all">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => {
                            if (allSelected) {
                              setSelectedQuestionIds((prev) => prev.filter((id) => !category.questions.some((question) => question.id === id)));
                            } else {
                              setSelectedQuestionIds((prev) => {
                                const next = new Set(prev);
                                category.questions.forEach((question) => next.add(question.id));
                                return Array.from(next);
                              });
                            }
                          }}
                        />
                        Select all questions in this category
                      </label>

                      {category.questions.map((question) => {
                        const config = questionConfigs[question.id] || {};
                        const type = config.type || question.type;
                        const options = isChoiceType(type)
                          ? (config.options && config.options.length
                            ? config.options
                            : getDefaultChoiceOptions(question.id, type, question.options || []))
                          : [];
                        const selected = selectedQuestionIds.includes(question.id);

                        return (
                          <div key={question.id} className={`question-row question-card ${selected ? 'selected' : ''}`}>
                            <label className="question-item-inline">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => handleToggleQuestion(question.id)}
                              />
                            </label>
                            <div className="question-main">
                              <div className="question-text">{question.text}</div>

                              <div className="question-controls wrap">
                                <label className="field-inline">
                                  Type
                                  <select
                                    className="question-format-select"
                                    value={type}
                                    onChange={(e) => handleQuestionTypeChange(question.id, e.target.value)}
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
                                    onChange={(e) => handleRequiredChange(question.id, e.target.checked)}
                                  />
                                  Required
                                </label>

                                {/* x<span className="format-badge">Preview: {formatTypeLabel(type)}</span> */}
                              </div>

                              <div className="question-preview">
                                {type === 'yes_no' && (
                                  <div className="preview-yesno">
                                    <label><input type="radio" disabled name={`preview-${question.id}`} /> Yes</label>
                                    <label><input type="radio" disabled name={`preview-${question.id}`} /> No</label>
                                  </div>
                                )}
                                {type === 'single_select' && (
                                  <select
                                    value=""
                                    onChange={() => {}}
                                    aria-label={`Preview dropdown for ${question.text}`}
                                  >
                                    <option value="">Select one option</option>
                                    {options.map((option, index) => (
                                      <option key={index} value={option}>{option}</option>
                                    ))}
                                  </select>
                                )}
                                {type === 'multi_select' && (
                                  <div className="preview-multi">
                                    {options.map((option, index) => (
                                      <label key={index} className="preview-multi-item">
                                        <input type="checkbox" disabled /> {option}
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {type === 'text' && (
                                  <input type="text" disabled placeholder="Short text answer" />
                                )}
                                {type === 'long_text' && (
                                  <textarea disabled placeholder="Long text answer" className="preview-textarea" />
                                )}
                              </div>

                              {isChoiceType(type) && type !== 'yes_no' && (
                                <div className="options-editor">
                                  <label className="field-inline block">
                                    Options (comma separated)
                                    <input
                                      className="options-input"
                                      value={options.join(', ')}
                                      onChange={(e) => handleOptionsChange(question.id, e.target.value)}
                                      placeholder="Example: Option A, Option B, Option C"
                                    />
                                  </label>

                                  {(type === 'multi_select' || type === 'single_select') && (
                                    <div className="options-add-row">
                                      <input
                                        className="options-input"
                                        value={optionDrafts[question.id] || ''}
                                        onChange={(e) => setOptionDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddOptions(question.id);
                                          }
                                        }}
                                        placeholder="Add more options (comma separated)"
                                      />
                                      <button
                                        type="button"
                                        className="review-action-button"
                                        onClick={() => handleAddOptions(question.id)}
                                      >
                                        Add
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>

            <div className="healthplan-info">
              <label>Additional Plan Information</label>
              <textarea
                value={planInfo}
                onChange={(e) => setPlanInfo(e.target.value)}
                placeholder="Enter instructions or details for the patient..."
                className="healthplan-textarea"
              />
            </div>

            <div className="review-action-buttons">
              <button className="review-action-button" onClick={() => handleSavePlan('draft')}>
                <Save size={16} />
                Save Draft
              </button>
              <button
                className="review-action-button approve"
                onClick={() => handleSavePlan('sent')}
                disabled={selectedQuestionIds.length === 0}
              >
                <CheckCircle size={16} />
                Send to Patient
              </button>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

export default PatientReview;
