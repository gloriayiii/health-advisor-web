'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { requestJson } from '@/lib/apiClient';
import { 
  LogOut, 
  User, 
  Stethoscope, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Trash2
} from 'lucide-react';
import './styles/Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState('');

  useEffect(() => {
    let mounted = true
    const mapPatient = (p) => {
      const metadata = p.metadata || p.meta || {}
      return {
        id: p.id,
        name: p.name,
        age: p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : metadata.age || 0,
        gender: p.gender || metadata.gender || 'Unknown',
        condition: metadata.condition || metadata.primaryCondition || p.condition || '—',
        status: metadata.status || p.status || 'pending',
        urgency: metadata.urgency || p.urgency || 'normal',
        requestTime: p.created_at || ''
      }
    }

    async function load() {
      setLoadingPatients(true)
      setPatientsError('')
      try {
        const data = await requestJson('/api/patients')
        const dbPatients = data.patients || []
        if (mounted) setPatients(dbPatients.map(mapPatient))
      } catch (err) {
        console.warn('Could not fetch patients', err)
        if (mounted) {
          setPatients([])
          setPatientsError('Could not connect to the patient database. Check Supabase settings and restart the portal.')
        }
      } finally {
        if (mounted) setLoadingPatients(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleLogout = () => {
    logout();
  };

  const handleViewPatient = (patientId) => {
    router.push(`/patient/${patientId}`);
  };

  const handleDeletePatient = async (patientId, patientName) => {
    const confirmed = window.confirm(`Delete patient ${patientName}? This cannot be undone.`)
    if (!confirmed) return

    const previous = patients
    setPatients((prev) => prev.filter((patient) => patient.id !== patientId))

    try {
      await requestJson(`/api/patients/${patientId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Delete failed', err)
      setPatients(previous)
      alert('Could not delete patient. Please try again.')
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock size={16} />;
      case 'reviewed': return <CheckCircle size={16} />;
      case 'urgent': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Pending Review';
      case 'reviewed': return 'Reviewed';
      case 'urgent': return 'Urgent';
      default: return 'Unknown';
    }
  };

  const stats = {
    total: patients.length,
    pending: patients.filter(p => p.status === 'pending').length,
    reviewed: patients.filter(p => p.status === 'reviewed').length,
    urgent: patients.filter(p => p.status === 'urgent').length
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="dashboard-logo">
            <Stethoscope size={24} />
            Health Advisor
          </div>
          <div className="dashboard-user-info">
            <User size={16} />
            {user?.name} - {user?.department}
          </div>
        </div>
        <button className="dashboard-logout-button" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <main className="dashboard-main-content">
        <div className="dashboard-welcome-section">
          <h1 className="dashboard-welcome-title">Welcome back, {user?.name}!</h1>
          <p className="dashboard-welcome-subtitle">
            Review patient recommendations and provide clinical guidance
          </p>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <div className="dashboard-stat-icon">
                <User size={20} />
              </div>
              <h3 className="dashboard-stat-title">Total Patients</h3>
            </div>
            <div className="dashboard-stat-value">{stats.total}</div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <div className="dashboard-stat-icon orange">
                <Clock size={20} />
              </div>
              <h3 className="dashboard-stat-title">Pending Review</h3>
            </div>
            <div className="dashboard-stat-value">{stats.pending}</div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <div className="dashboard-stat-icon green">
                <CheckCircle size={20} />
              </div>
              <h3 className="dashboard-stat-title">Reviewed</h3>
            </div>
            <div className="dashboard-stat-value">{stats.reviewed}</div>
          </div>

          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <div className="dashboard-stat-icon red">
                <AlertCircle size={20} />
              </div>
              <h3 className="dashboard-stat-title">Urgent Cases</h3>
            </div>
            <div className="dashboard-stat-value">{stats.urgent}</div>
          </div>
        </div>

        <div className="dashboard-patients-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Patient Cases</h2>
          </div>
          {patientsError && (
            <div className="dashboard-api-error">
              {patientsError}
            </div>
          )}
          {loadingPatients ? (
            <div className="dashboard-empty-state">Loading patients from database...</div>
          ) : patients.length === 0 && !patientsError ? (
            <div className="dashboard-empty-state">No patients found in the connected database.</div>
          ) : (
            <div className="dashboard-patient-list">
              {patients.map((patient) => (
              <div key={patient.id} className="dashboard-patient-card">
                <div className="dashboard-patient-info">
                  <h3 className="dashboard-patient-name">{patient.name}</h3>
                  <div className="dashboard-patient-details">
                    <span>{patient.age} years old, {patient.gender}</span>
                    <span>•</span>
                    <span>{patient.condition}</span>
                    <span>•</span>
                    <span>{patient.requestTime}</span>
                  </div>
                </div>
                <div className="dashboard-patient-actions">
                  <div className={`dashboard-patient-status ${patient.status}`}>
                    {getStatusIcon(patient.status)}
                    {getStatusText(patient.status)}
                  </div>
                  <div className="dashboard-action-buttons">
                    <button 
                      className="dashboard-action-button" 
                      onClick={() => handleViewPatient(patient.id)}
                    >
                      <Eye size={16} />
                      Review
                    </button>
                    <button
                      className="dashboard-action-button danger"
                      onClick={() => handleDeletePatient(patient.id, patient.name)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
