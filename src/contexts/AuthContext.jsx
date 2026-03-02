/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import authService from '../services/authService';
import { isValidOAuthUrl } from '../utils/urlValidator';


const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods to the application
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  // Get MSAL instance and accounts
  const { instance, accounts } = useMsal();

  // Check authentication status on mount and when MSAL accounts change
  useEffect(() => {
    checkAuth();

    // Listen for session expiration events
    const handleSessionExpired = () => {
      setUser(null);
      setError('Your session has expired. Please log in again.');
      // Optional: redirect to login
      // window.location.href = '/';
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [accounts]);

  // Set up token refresh interval
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        refreshAuthToken();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user]);

  /**
   * Check if user is authenticated on app load
   */
  const checkAuth = async () => {
    try {
      // First, check for MSAL authentication
      const activeAccount = instance.getActiveAccount();
      if (activeAccount) {
        // User is authenticated via MSAL
        setIsGuestMode(false);
        localStorage.removeItem('guestMode');
        setUser({
          email: activeAccount.username || activeAccount.idTokenClaims?.email,
          name: activeAccount.name || activeAccount.idTokenClaims?.name,
          tenantId: activeAccount.tenantId,
          tenantName: 'Microsoft Entra',
          isGuest: false,
          msalAccount: activeAccount,
        });
        setLoading(false);
        return;
      }

      // Check if there are any accounts (but none active)
      if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0]);
        const account = accounts[0];
        setIsGuestMode(false);
        localStorage.removeItem('guestMode');
        setUser({
          email: account.username || account.idTokenClaims?.email,
          name: account.name || account.idTokenClaims?.name,
          tenantId: account.tenantId,
          tenantName: 'Microsoft Entra',
          isGuest: false,
          msalAccount: account,
        });
        setLoading(false);
        return;
      }

      // Check if guest mode is enabled
      const guestMode = localStorage.getItem('guestMode') === 'true';
      if (guestMode) {
        setIsGuestMode(true);
        setUser({
          email: 'guest@observes.io',
          name: 'Guest User',
          tenantId: null,
          tenantName: 'Guest',
          isGuest: true,
        });
        setLoading(false);
        return;
      }

      // Check legacy authService authentication
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setIsGuestMode(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh authentication token
   */
  const refreshAuthToken = async () => {
    try {
      if (authService.isAuthenticated()) {
        await authService.refreshToken();
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
    }
  };

  /**
   * Get available OAuth providers for a tenant
   */
  const getTenantProviders = async (tenantId) => {
    try {
      setError(null);
      return await authService.getTenantProviders(tenantId);
    } catch (error) {
      //   setError(error.message);
      throw error;
    }
  };

  /**
   * Start OAuth login flow
   */
  const startLogin = async (tenantId, providerName) => {
    try {
      setError(null);
      const authUrl = await authService.startExternalLogin(tenantId, providerName);

      // Validate URL before redirect
      if (!isValidOAuthUrl(authUrl)) {
        throw new Error('Invalid OAuth provider URL');
      }

      window.location.href = authUrl;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  /**
   * Handle OAuth callback
   */
  const handleCallback = async (code, state) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.handleCallback(code, state);

      if (result.success) {
        setUser(result.user);
        return result;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    authService.logout();
    localStorage.removeItem('guestMode');
    setUser(null);
    setError(null);
    setIsGuestMode(false);
  };

  /**
   * Enter guest mode
   */
  const enterGuestMode = () => {
    localStorage.setItem('guestMode', 'true');
    setIsGuestMode(true);
    setUser({
      email: 'guest@observes.io',
      name: 'Guest User',
      tenantId: null,
      tenantName: 'Guest',
      isGuest: true,
    });
  };

  /**
   * Exit guest mode and go to login
   */
  const exitGuestMode = () => {
    localStorage.removeItem('guestMode');
    setIsGuestMode(false);
    setUser(null);
  };

  /**
   * Make authenticated API request
   */
  const authenticatedFetch = async (url, options = {}) => {
    try {
      return await authService.authenticatedFetch(url, options);
    } catch (error) {
      if (error.message === 'Not authenticated') {
        logout();
      }
      throw error;
    }
  };

  /**
   * Register a new tenant
   */
  const registerTenant = async (tenantData) => {
    try {
      setError(null);
      return await authService.registerTenant(tenantData);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  /**
   * Get tenant by name
   */
  const getTenantByName = async (name) => {
    try {
      setError(null);
      return await authService.getTenantByName(name);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  /**
   * Login with local account (email/password)
   */
  const loginLocal = async (tenantId, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.loginLocalAccount(tenantId, email, password);

      if (result.success) {
        result
        setUser(result.user);
        return result;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isGuestMode,
    getTenantProviders,
    startLogin,
    handleCallback,
    logout,
    authenticatedFetch,
    registerTenant,
    getTenantByName,
    loginLocal,
    enterGuestMode,
    exitGuestMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
