auth.users
└── Login credentials

users
├── Application role
└── Link to patient identity

patients
├── Demographics
├── Assigned clinician and plan
├── Health profiles
├── Questionnaires
└── Recommendations

clinicians
├── Professional information
├── Assigned patients
├── Sent questionnaires
└── Reviewed recommendations

health_profiles
└── Patient measurements and conditions

questionnaires
└── Questions sent to a patient

questionnaire_responses
└── Answers submitted by that patient

recommendations
└── Both app-generated and clinician-reviewed recommendations

health_recommendations
└── Legacy table to migrate and eventually remove

Reliability constraints
├── users.portal_patient_id uniquely links an Auth user to a patient
├── questionnaires store immutable IDs and explicit sent/delivery status
├── questionnaire_responses is unique on (questionnaire_id, user_id)
├── app reads questionnaires where status = sent, newest sent_at first
├── duplicate submissions update the existing response through upsert
└── RLS limits patient records to the linked user or assigned clinician

Operational behavior
├── Webhook failure does not delete the Supabase questionnaire
├── Missing optional patient fields normalize to empty values
├── Clinician response review sorts submitted_at descending
└── health_recommendations remains legacy; recommendations is clinician workflow
