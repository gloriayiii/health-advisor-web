'use client'

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, AlertCircle } from 'lucide-react';
import './styles/Login.css';

function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(credentials);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Health Advisor System</h1>
          <p className="login-subtitle">Doctor Login</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="input-label">Username</label>
            <div className="input-container">
              <div className="input-icon">
                <User size={18} />
              </div>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                placeholder="Enter username"
                className="input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Password</label>
            <div className="input-container">
              <div className="input-icon">
                <Lock size={18} />
              </div>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="input"
                required
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-credentials">
          <div className="demo-title">Demo Credentials</div>
          <div className="demo-text">Username: doctor</div>
          <div className="demo-text">Password: password</div>
        </div>
      </div>
    </div>
  );
}

export default Login;
