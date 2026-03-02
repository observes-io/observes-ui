/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, CircularProgress, Typography, Alert, Button, Fade } from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * OAuth Callback Handler
 * Handles the redirect from MSAL authentication
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // useMsal() might not be available if OAuth is not configured
  let instance = null;
  let accounts = [];
  try {
    const msalContext = useMsal();
    instance = msalContext.instance;
    accounts = msalContext.accounts;
  } catch (error) {
    // MSAL not available - OAuth not configured
    console.error('[OAuthCallback] MSAL not available - redirecting to login');
  }
  
  const { handleCallback } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (!instance) {
      // OAuth not configured - redirect to login
      setError('OAuth not configured. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
      setLoading(false);
      return;
    }
    processCallback();
  }, [accounts, instance]);

  /**
   * Process MSAL callback
   */
  const processCallback = async () => {
    try {
      // Check for OAuth errors in URL
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setError(errorDescription || `Authentication error: ${errorParam}`);
        setLoading(false);
        return;
      }

      // MSAL handles the auth code exchange automatically
      // Check if we have an active account after MSAL processes the response
      const activeAccount = instance.getActiveAccount();
      
      if (activeAccount) {
        // Successfully authenticated - show success briefly then redirect
        setSuccessMessage(`Welcome, ${activeAccount.name || 'User'}!`);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 800);
        return;
      }

      // If there are accounts but none active, set the first one
      if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0]);
        setSuccessMessage(`Welcome, ${accounts[0].name || 'User'}!`);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 800);
        return;
      }

      // Wait a moment for MSAL to process
      // If still no account after processing, handle as legacy OAuth if code is present
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (code && state && handleCallback) {
        // Legacy OAuth flow
        const result = await handleCallback(code, state);
        if (result.success) {
          setSuccessMessage('Authentication successful!');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 800);
        } else {
          setError('Authentication failed. Please try again.');
          setLoading(false);
        }
      } else {
        // No account and no code - show loading briefly then redirect if no response
        setTimeout(() => {
          const account = instance.getActiveAccount();
          if (account) {
            setSuccessMessage(`Welcome, ${account.name || 'User'}!`);
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 800);
          } else {
            setError('Authentication was not completed. Please try again.');
            setLoading(false);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Callback processing error:', err);
      setError(err.message || 'An error occurred during authentication');
      setLoading(false);
    }
  };

  /**
   * Retry authentication
   */
  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={500}>
          <Box
            sx={{
              textAlign: 'center',
            }}
          >
            {(loading || successMessage) && !error ? (
              <>
                <CircularProgress 
                  size={56} 
                  sx={{ 
                    color: 'white',
                    mb: 3,
                  }} 
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 500,
                    mb: 1,
                  }}
                >
                  {successMessage || 'Completing sign in...'}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {successMessage ? 'Redirecting you now...' : 'Please wait a moment'}
                </Typography>
              </>
            ) : error ? (
              <Box
                sx={{
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  p: 4,
                }}
              >
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  {error}
                </Alert>
                <Typography variant="h5" gutterBottom color="error">
                  Authentication Failed
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  We couldn't complete your sign-in. Please try again.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleRetry}
                  sx={{ px: 4 }}
                >
                  Back to Login
                </Button>
              </Box>
            ) : null}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default OAuthCallback;
