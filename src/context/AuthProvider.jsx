import { useState } from 'react';
import { AuthContext } from './authContext';
import { setAuthToken, clearAuthToken } from '../services/api';

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    isAuthenticated: false,
  });

  const login = (token, user) => {
    setAuthToken(token); // This updates both context and api service
    setAuthState({
      token,
      user,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    clearAuthToken(); // This clears token from both context and api service
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};