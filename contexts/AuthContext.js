'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status in local storage
    const savedAuth = localStorage.getItem('health-advisor-auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setIsAuthenticated(true);
        setUser(authData.user);
      } catch (error) {
        console.error('Failed to parse auth data:', error);
        localStorage.removeItem('health-advisor-auth');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      // Simulate API call
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          // Simulate doctor login verification
          if (credentials.username === 'doctor' && credentials.password === 'password') {
            resolve({
              success: true,
              user: {
                id: '1',
                name: 'Dr. Smith',
                role: 'doctor',
                department: 'Internal Medicine',
                email: 'doctor@hospital.com'
              }
            });
          } else {
            resolve({ success: false, message: 'Invalid username or password' });
          }
        }, 1000);
      });

      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user);
        localStorage.setItem('health-advisor-auth', JSON.stringify({
          user: response.user,
          timestamp: Date.now()
        }));
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Login failed, please try again' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('health-advisor-auth');
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
