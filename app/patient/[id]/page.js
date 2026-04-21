'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useParams } from 'next/navigation'
import Login from '@/components/Login'
import PatientReview from '@/components/PatientReview'

export default function PatientPage() {
  const { isAuthenticated } = useAuth()
  const params = useParams()

  if (!isAuthenticated) {
    return <Login />
  }

  return <PatientReview patientId={params.id} />
}
