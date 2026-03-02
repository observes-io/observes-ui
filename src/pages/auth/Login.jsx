/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Stack,
    Snackbar,
    Alert,
    Divider,
    CircularProgress,
    Fade,
    Card,
    CardContent,
    Link,
    IconButton,
    Tooltip,
} from '@mui/material';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthBootstrap } from '../../auth';
import { getOAuthSetupInstructions, HostingMode } from '../../config/hostingConfig';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import LoginIcon from '@mui/icons-material/Login';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Login Component - Simplified version for pre-release
 * Uses dynamic authentication configuration from AuthBootstrap
 * Supports both SaaS and self-hosted deployments with appropriate fallback messaging
 */
const Login = () => {
    const { enterGuestMode, exitGuestMode, isAuthenticated, isGuestMode, loading } = useAuth();

    // useMsal() might not be available if OAuth is not configured
    let instance = null;
    try {
        const msalContext = useMsal();
        instance = msalContext.instance;
    } catch (error) {
        // MSAL not available - OAuth not configured
        console.debug('[Login] MSAL not available - OAuth not configured');
    }

    const { loginRequest, authConfig, isInitialized, error: authError, hostingConfig } = useAuthBootstrap();
    const navigate = useNavigate();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [loginError, setLoginError] = useState(null);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [showOAuthSetup, setShowOAuthSetup] = useState(false);

    // Get OAuth setup instructions based on hosting mode
    const setupInstructions = getOAuthSetupInstructions(hostingConfig.mode);

    // OAuth is ready to use
    const isOAuthReady = hostingConfig.isOAuthReady;

    // Determine if we should show the loading overlay
    // Only show overlay for authenticated users or when actively signing in
    const showLoadingOverlay = loading || (isAuthenticated && !isGuestMode) || isSigningIn;

    // Redirect authenticated users (OAuth or guest) to dashboard
    // Only show login page when user is not authenticated and not in guest mode
    React.useEffect(() => {
        if (!loading && (isAuthenticated || isGuestMode)) {
            // Small delay for smooth transition
            const timer = setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isGuestMode, loading, navigate]);

    /**
     * Handle sign in with MSAL redirect
     */
    const handleSignIn = async () => {
        // Check if OAuth is ready
        if (!isOAuthReady) {
            // Show setup instructions instead of trying to sign in
            setShowOAuthSetup(true);
            return;
        }

        if (!isInitialized || !loginRequest || !instance) {
            console.error('Auth not initialized');
            setLoginError('Authentication not ready. Please try again.');
            return;
        }

        try {
            setIsSigningIn(true);
            // Include redirectUri in login request for proper redirect flow
            const request = {
                ...loginRequest,
                redirectUri: authConfig?.redirectUri,
            };
            console.debug('[Login] Initiating login redirect with request:', request);
            await instance.loginRedirect(request);
        } catch (error) {
            console.error('Login error:', error);
            setIsSigningIn(false);
            setLoginError(error.message || 'Login failed. Please try again.');
        }
    };

    /**
     * Handle guest mode entry
     */
    const handleGuestMode = () => {
        if (isGuestMode) {
            // Already in guest mode, just navigate back to dashboard
            navigate('/dashboard');
        } else {
            // Enter guest mode
            setIsSigningIn(true);
            enterGuestMode();
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                gap: 2,
                py: 5,
                position: 'relative',
            }}
        >
            {/* Loading Overlay */}
            <Fade in={showLoadingOverlay} timeout={400}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        zIndex: 10,
                    }}
                >
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
                        {isAuthenticated ? 'Welcome back!' : isGuestMode ? 'Entering guest mode...' : 'Signing you in...'}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.8)',
                        }}
                    >
                        Please wait a moment
                    </Typography>
                </Box>
            </Fade>

            <Fade in={!showLoadingOverlay} timeout={400}>
                <Container maxWidth="sm">
                    <Paper
                        elevation={15}
                        sx={{
                            p: 4,
                            borderRadius: 2,
                        }}
                    >
                        {/* Header */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                                Observes.io
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Provable CI/CD Security and Compliance
                            </Typography>
                        </Box>
                        {/* Main Content */}
                        <Stack spacing={3}>

                            {/* Error Display */}
                            {(loginError || authError) && (
                                <Alert
                                    severity="error"
                                    onClose={() => setLoginError(null)}
                                    sx={{ mb: 2 }}
                                >
                                    {loginError || authError}
                                </Alert>
                            )}

                            {/* Sign In Button */}
                            <Box>
                                <Tooltip
                                    title={
                                        !isOAuthReady ? (
                                            <Box sx={{ p: 0.5 }}>
                                                <Typography variant="body2" sx={{ mb: 1, fontSize: '0.9rem' }}>
                                                    {setupInstructions.message}
                                                </Typography>
                                                <Link
                                                    href={
                                                        hostingConfig.mode === HostingMode.SAAS
                                                            ? `mailto:${setupInstructions.contactEmail || 'support@observes.io'}`
                                                            : (setupInstructions.docUrl || "https://observes.io/docshome")
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ color: 'inherit', fontSize: '0.85rem', textDecoration: 'underline' }}
                                                >
                                                    {setupInstructions.actionLabel || 'Learn More'} →
                                                </Link>
                                            </Box>
                                        ) : ""
                                    }
                                    arrow
                                    placement="right"
                                    enterDelay={100}
                                >
                                    <span>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={handleSignIn}
                                            disabled={!isInitialized || !isOAuthReady}
                                            startIcon={<LoginIcon />}
                                            sx={{
                                                py: 1.5,
                                                background: isOAuthReady
                                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                    : 'gray',
                                                fontWeight: 'bold',
                                                fontSize: '1rem',
                                                '&:hover': {
                                                    background: isOAuthReady
                                                        ? 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)'
                                                        : 'gray',
                                                },
                                                '&:disabled': {
                                                    opacity: 0.6,
                                                },
                                            }}
                                        >
                                            {isOAuthReady ? 'Register or Sign In' : 'Sign In Unavailable'}
                                        </Button>
                                    </span>
                                </Tooltip>

                                {/* OAuth App Name/ID Display */}
                                {isOAuthReady && authConfig && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            display: 'block',
                                            textAlign: 'center',
                                            mt: 0.5,
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {authConfig.name || `App ID: ${authConfig.clientId.substring(0, 8)}...`}
                                    </Typography>
                                )}

                            </Box>


                            {/* Continue as Guest Button */}
                            <Paper
                                onClick={handleGuestMode}
                                sx={{
                                    color: '#9b6de0',
                                    // fontWeight: 'bold',
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    p: 2,
                                    borderRadius: 2,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    '&:hover': {
                                        background: '#f1edf5',
                                    },
                                }}
                            >
                                {isGuestMode ? 'Return to Dashboard' : 'Continue in Guest Mode'}
                                <ArrowForwardIcon sx={{ ml: 1 }} />
                            </Paper>

                        </Stack>

                        {/* Footer */}
                        <Box sx={{ mt: 4, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                © 2025 Observes io LTD. All rights reserved.
                            </Typography>
                        </Box>
                    </Paper>
                </Container>
            </Fade>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Email copied to clipboard!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Login;
