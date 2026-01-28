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
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ContactMailIcon from '@mui/icons-material/ContactMail';

/**
 * Login Component - Simplified version for pre-release
 * Only shows Guest Mode and Contact Us options
 */
const Login = () => {
    const { enterGuestMode } = useAuth();
    const navigate = useNavigate();
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    /**
     * Handle guest mode entry
     */
    const handleGuestMode = () => {
        enterGuestMode();
        navigate('/dashboard', { replace: true });
    };

    /**
     * Handle contact us - copy email to clipboard
     */
    const handleContactUs = async () => {
        try {
            await navigator.clipboard.writeText('contact@observes.io');
            setSnackbarOpen(true);
        } catch (err) {
            console.error('Failed to copy email:', err);
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
            }}
        >
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
                        <Divider/>

                        {/* Continue as Guest Button */}
                        <Paper
                            onClick={handleGuestMode}
                            sx={{
                                background: '#af8df1',
                                color: 'white',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '1rem',
                                p: 3,
                                borderRadius: 2,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: '0.2s',
                                '&:hover': {
                                    background: '#9b6de0',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                                },
                            }}
                        >
                            Continue in Guest Mode
                            <ArrowForwardIcon sx={{ ml: 1 }} />
                        </Paper>

                        {/* Contact Us Button */}
                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            onClick={handleContactUs}
                            startIcon={<ContactMailIcon />}
                            sx={{
                                py: 1.5,
                                borderColor: '#3c4ec3',
                                color: '#3c4ec3',
                                '&:hover': {
                                    borderColor: '#3c4ec3',
                                    background: 'rgba(60, 78, 195, 0.05)',
                                },
                            }}
                        >
                            Contact Us for Account Access
                        </Button>

                        <Typography variant="caption" textAlign="center" color="text.secondary" sx={{ pt: 2 }}>
                            Interested in full platform access? Reach out and we'll get you set up.
                        </Typography>
                    </Stack>

                    {/* Footer */}
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            © 2025 Observes io LTD. All rights reserved.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
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
