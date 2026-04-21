'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LogOut, 
  User, 
  Stethoscope, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Edit3
} from 'lucide-react';
import './styles/Dashboard.css';

// Mock data for patients
const mockPatients = [
  {
    id: '1',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    condition: 'Hypertension',
    status: 'pending',
    requestTime: '2024-01-15 10:30',
    urgency: 'normal'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    age: 32,
    gender: 'Female',
    condition: 'Diabetes Type 2',
    status: 'urgent',
    requestTime: '2024-01-15 09:15',
    urgency: 'high'
  },
  {
    id: '3',
    name: 'Michael Brown',
    age: 58,
    gender: 'Male',
    condition: 'Cardiovascular Disease',
    status: 'reviewed',
    requestTime: '2024-01-15 08:45',
    urgency: 'normal'
  },
  {
    id: '4',
    name: 'Emily Davis',
    age: 28,
    gender: 'Female',
    condition: 'Asthma',
    status: 'pending',
    requestTime: '2024-01-15 11:20',
    urgency: 'normal'
  }
];

function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState(mockPatients);

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/users')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        if (mounted && Array.isArray(data) && data.length) setPatients(data.map(p => ({
          id: p.id,
          name: p.name,
          age: p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : 0,
          gender: p.gender || 'Unknown',
          condition: p.condition || '—',
          status: p.status || 'pending',
          requestTime: p.created_at || ''
        })))
      } catch (err) {
        // keep mock data on error
        console.warn('Could not fetch patients', err)
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
                    {patient.status === 'pending' && (
                      <button className="dashboard-action-button primary">
                        <Edit3 size={16} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
