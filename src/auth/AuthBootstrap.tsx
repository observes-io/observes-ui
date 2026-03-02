/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { loadAuthConfig, AuthConfiguration, getAuthConfig, isAuthConfigLoaded } from '../config/authConfigLoader';
import { createMsalConfig, createLoginRequest } from './msalConfig';
import { getHostingConfiguration, HostingConfiguration, HostingMode } from '../config/hostingConfig';

/**
 * Authentication Bootstrap Context
 * Provides access to auth config, login request, and hosting configuration
 */
interface AuthBootstrapContextValue {
  authConfig: AuthConfiguration | null;
  loginRequest: { scopes: string[] } | null;
  isInitialized: boolean;
  error: string | null;
  retry: () => void;
  hostingConfig: HostingConfiguration;
}

const AuthBootstrapContext = createContext<AuthBootstrapContextValue | null>(null);

/**
 * Hook to access authentication bootstrap context
 */
export function useAuthBootstrap(): AuthBootstrapContextValue {
  const context = useContext(AuthBootstrapContext);
  if (!context) {
    throw new Error('useAuthBootstrap must be used within an AuthBootstrap provider');
  }
  return context;
}

interface AuthBootstrapProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: (error: string, retry: () => void) => ReactNode;
  configEndpoint?: string;
  skipEndpoint?: boolean;
}

/**
 * Authentication Bootstrap Provider
 * 
 * Handles the following bootstrap flow:
 * 1. Load marketplace-provisioned configuration
 * 2. Initialize MSAL client dynamically
 * 3. Set up event handlers for login success
 * 4. Enable login and token acquisition
 * 
 * Usage:
 * ```tsx
 * <AuthBootstrap>
 *   <App />
 * </AuthBootstrap>
 * ```
 */

export function AuthBootstrap({
  children,
  loadingComponent,
  errorComponent,
  configEndpoint,
  skipEndpoint,
}: AuthBootstrapProps) {
  const [authConfig, setAuthConfig] = useState<AuthConfiguration | null>(null);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  /**
   * Clear stale MSAL interaction status from browser storage
   * This is a fallback for edge cases (e.g., browser crash during auth flow)
   * Normally handleRedirectPromise() cleans this up automatically
   */
  const clearStaleInteractionStatus = useCallback(() => {
    try {
      // Clear from sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach((key) => {
        if (key.includes('msal') && key.includes('interaction')) {
          console.debug('[AuthBootstrap] Clearing stale interaction status:', key);
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear from localStorage (if cacheLocation is localStorage)
      const localKeys = Object.keys(localStorage);
      localKeys.forEach((key) => {
        if (key.includes('msal') && key.includes('interaction')) {
          console.debug('[AuthBootstrap] Clearing stale interaction status:', key);
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('[AuthBootstrap] Failed to clear interaction status:', err);
    }
  }, []);

  /**
   * Initialize MSAL with loaded configuration
   */
  const initializeMsal = useCallback(async () => {
    try {
      setError(null);
      
      // Clear any stale interaction status before initializing
      // This handles edge cases like browser crashes during auth flow
      clearStaleInteractionStatus();
      
      // Load authentication configuration
      const config = await loadAuthConfig({
        endpoint: configEndpoint,
        forceReload: retryCount > 0,
        skipEndpoint,
      });
      
      // Log loaded config for debugging (without sensitive info)
      console.debug('[AuthBootstrap] Loaded config:', {
        clientId: config.clientId ? `${config.clientId.substring(0, 8)}...` : 'MISSING',
        authority: config.authority || 'MISSING',
        redirectUri: config.redirectUri || 'MISSING',
        scopes: config.scopes,
      });
      
      // Check if OAuth is configured
      if (!config.clientId || !config.authority || !config.authority.startsWith('https://')) {
        // OAuth not configured - allow app to run without it
        console.warn('[AuthBootstrap] OAuth not configured - app will run in guest-only mode');
        setAuthConfig(config);
        setIsInitialized(true);
        return;
      }
      
      setAuthConfig(config);
      
      // Create MSAL configuration from runtime config
      const msalConfig = createMsalConfig(config);
      
      // Create MSAL instance
      const instance = new PublicClientApplication(msalConfig);
      
      // Initialize MSAL
      await instance.initialize();
      
      // Handle any pending redirect responses
      // CRITICAL: This must be called on EVERY page load for redirect flow to work properly.
      // The redirect lifecycle is:
      // 1. Page invokes loginRedirect() which sets interaction state
      // 2. User is redirected to Azure AD for sign-in
      // 3. Azure AD redirects back to redirectUri
      // 4. redirectUri page calls handleRedirectPromise() and forwards to original page
      // 5. Original page calls handleRedirectPromise() to finalize token processing
      // Without this call, you'll get "interaction_in_progress" errors because
      // the interaction state never gets cleaned up properly.
      await instance.handleRedirectPromise();
      
      // Set up default account if available
      if (!instance.getActiveAccount() && instance.getAllAccounts().length > 0) {
        instance.setActiveAccount(instance.getAllAccounts()[0]);
      }
      
      // Listen for sign-in event and set active account
      instance.addEventCallback((event: EventMessage) => {
        if (
          event.eventType === EventType.LOGIN_SUCCESS &&
          event.payload
        ) {
          const payload = event.payload as AuthenticationResult;
          const account = payload.account;
          if (account) {
            instance.setActiveAccount(account);
          }
        }
      });
      
      setMsalInstance(instance);
      setIsInitialized(true);
      
      console.info('[AuthBootstrap] MSAL initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize authentication';
      console.error('[AuthBootstrap] Initialization failed:', errorMessage);
      setError(errorMessage);
      setIsInitialized(false);
    }
  }, [configEndpoint, skipEndpoint, retryCount, clearStaleInteractionStatus]);

  /**
   * Retry initialization
   */
  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  // Initialize on mount and when retry is triggered
  useEffect(() => {
    initializeMsal();
  }, [initializeMsal]);

  // Create login request from config
  const loginRequest = useMemo(() => {
    if (!authConfig) return null;
    return createLoginRequest(authConfig);
  }, [authConfig]);

  // Get hosting configuration with OAuth readiness check
  const hostingConfig = useMemo(() => {
    return getHostingConfiguration(authConfig);
  }, [authConfig]);

  // Context value
  const contextValue = useMemo<AuthBootstrapContextValue>(
    () => ({
      authConfig,
      loginRequest,
      isInitialized,
      error,
      retry,
      hostingConfig,
    }),
    [authConfig, loginRequest, isInitialized, error, retry, hostingConfig]
  );

  // Show loading state
  if (!isInitialized && !error) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={48} />
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          Initializing authentication...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent(error, retry)}</>;
    }
    
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
        p={3}
      >
        <Typography
          variant="h6"
          color="error"
          align="center"
          gutterBottom
        >
          Authentication Error
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={retry}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Render children with MSAL provider
  // If no MSAL instance (OAuth not configured), still render without it
  return (
    <AuthBootstrapContext.Provider value={contextValue}>
      {msalInstance ? (
        <MsalProvider instance={msalInstance}>
          {children}
        </MsalProvider>
      ) : (
        children
      )}
    </AuthBootstrapContext.Provider>
  );
}

export default AuthBootstrap;
