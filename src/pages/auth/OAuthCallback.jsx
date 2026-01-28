/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * OAuth Callback Handler
 * Handles the redirect from OAuth providers and exchanges auth code for tokens
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    processCallback();
  }, []);

  /**
   * Process OAuth callback parameters
   */
  const processCallback = async () => {
    try {
      // Get parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        setError(errorDescription || `OAuth error: ${error}`);
        setLoading(false);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setError('Missing required authentication parameters');
        setLoading(false);
        return;
      }

      // Handle the callback and exchange for tokens
      const result = await handleCallback(code, state);

      if (result.success) {
        // Redirect to main application
        navigate('/dashboard', { replace: true });
      } else {
        setError('Authentication failed. Please try again.');
        setLoading(false);
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
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Completing authentication...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we securely log you in
              </Typography>
            </>
          ) : error ? (
            <>
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
            </>
          ) : null}
        </Box>
      </Container>
    </Box>
  );
};

export default OAuthCallback;
