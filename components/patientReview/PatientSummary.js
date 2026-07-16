import React from 'react'
import { Stethoscope, User } from 'lucide-react'

function Detail({ label, children }) {
  return (
    <div className="review-detail-item">
      <span className="review-detail-label">{label}</span>
      <span className="review-detail-value">{children || '—'}</span>
    </div>
  )
}

export default function PatientSummary({ patient }) {
  return (
    <div>
      <div className="review-patient-info-card">
        <h2 className="review-card-title"><User size={20} />Patient Information</h2>
        <div className="review-patient-details">
          <Detail label="Name">{patient.name}</Detail>
          <Detail label="Age">{patient.age ? `${patient.age} years` : ''}</Detail>
          <Detail label="Gender">{patient.gender}</Detail>
          <Detail label="Medical Record">{patient.medicalRecord}</Detail>
          <Detail label="Email">{patient.email}</Detail>
          <Detail label="Phone">{patient.phone}</Detail>
          <Detail label="Primary Condition">{patient.condition}</Detail>
          <Detail label="Date of Birth">{patient.dateOfBirth}</Detail>
        </div>
      </div>

      <div className="review-patient-info-card">
        <h2 className="review-card-title"><Stethoscope size={20} />Medical Details</h2>
        <div className="review-medical-details">
          {[
            ['Symptoms', patient.symptoms],
            ['Medical History', patient.medicalHistory],
            ['Current Medications', patient.currentMedications],
            ['Allergies', patient.allergies]
          ].map(([label, value]) => (
            <div className="review-medical-detail-item" key={label}>
              <span className="review-detail-label">{label}</span>
              <div className="review-medical-detail-content">{value || '—'}</div>
            </div>
          ))}
          {Object.keys(patient.vitalSigns || {}).length > 0 && (
            <div className="review-medical-detail-item">
              <span className="review-detail-label">Vital Signs</span>
              <div className="review-medical-detail-content">
                {Object.entries(patient.vitalSigns).map(([key, value]) => (
                  <div key={key}><strong>{key.replace(/([A-Z])/g, ' $1')}: </strong>{value}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
