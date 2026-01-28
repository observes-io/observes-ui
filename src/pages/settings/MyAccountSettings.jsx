/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useState, useEffect } from 'react';
import {
    Box,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Typography,
    Button,
    Card,
    CardContent,
    Divider,
    TextField,
    IconButton,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import useStore from '../../state/stores/store';
import { useAuth } from '../../contexts/AuthContext';

const MyAccountSettings = () => {
    const { globalSettings, setGlobalSettings } = useStore();
    const { isGuestMode } = useAuth();
    const [localSettings, setLocalSettings] = useState(globalSettings);

    // API Token state
    const [apiTokens, setApiTokens] = useState([]);
    const [newToken, setNewToken] = useState(null);
    const [tokenName, setTokenName] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    // Update local state when global settings change
    useEffect(() => {
        setLocalSettings(globalSettings);
    }, [globalSettings]);

    // Load API tokens
    useEffect(() => {
        loadApiTokens();
    }, []);

    const handleChange = (key, value) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setGlobalSettings(localSettings);
    };

    const loadApiTokens = async () => {
        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/tokens');
            // const data = await response.json();
            // setApiTokens(data);

            // Mock data for now
            setApiTokens([
                { id: '1', name: 'Development Token', created: new Date().toISOString(), lastUsed: new Date().toISOString() },
            ]);
        } catch (error) {
            console.error('Error loading API tokens:', error);
        }
    };

    const generateApiToken = async () => {
        if (!tokenName.trim()) {
            return;
        }

        try {
            // TODO: Replace with actual API call
            // const response = await fetch('/api/tokens', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ name: tokenName })
            // });
            // const data = await response.json();

            // Mock token generation
            const mockToken = `obs_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            setNewToken(mockToken);
            setTokenName('');
            await loadApiTokens();
        } catch (error) {
            console.error('Error generating token:', error);
        }
    };

    const deleteApiToken = async (tokenId) => {
        try {
            // TODO: Replace with actual API call
            // await fetch(`/api/tokens/${tokenId}`, { method: 'DELETE' });

            setApiTokens(apiTokens.filter(t => t.id !== tokenId));
        } catch (error) {
            console.error('Error deleting token:', error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <Box>
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom fontWeight="bold">
                        Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Tailor your Observes.io experience by adjusting the settings below.
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <FormControl fullWidth >
                        <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                            Menu Layout
                        </Typography>
                        <RadioGroup
                            row
                            value={localSettings.MenuLayout}
                            onChange={(e) => handleChange('MenuLayout', e.target.value)}
                        >
                            <FormControlLabel value="Header" control={<Radio />} label="Header" />
                            <FormControlLabel value="Sidebar" control={<Radio />} label="Sidebar" />
                        </RadioGroup>
                    </FormControl>

                    {/* Save Button */}
                    <Box mt={3} textAlign="right">
                        <Button variant="standard" color="primary" onClick={handleSave}>
                            Save Settings
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {!isGuestMode && (
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            API Tokens
                        </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Generate API tokens to authenticate with the Observes.io API. Keep your tokens secure and never share them publicly.
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {/* Token Generation */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Generate New Token
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Token Name"
                                placeholder="e.g., CI/CD Pipeline, Development"
                                value={tokenName}
                                onChange={(e) => setTokenName(e.target.value)}
                                size="small"
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={generateApiToken}
                                disabled={!tokenName.trim()}
                            >
                                Generate
                            </Button>
                        </Box>

                        {newToken && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                <Typography variant="body2" fontWeight="bold" gutterBottom>
                                    Token generated successfully! Copy it now - you won't be able to see it again.
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1, wordBreak: 'break-all' }}>
                                        {newToken}
                                    </Typography>
                                    <IconButton size="small" onClick={() => copyToClipboard(newToken)}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Alert>
                        )}

                        {copySuccess && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Token copied to clipboard!
                            </Alert>
                        )}
                    </Box>

                    {/* Token List */}
                    <Typography variant="h6" gutterBottom>
                        Active Tokens
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Last Used</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {apiTokens.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No API tokens yet. Generate one above to get started.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    apiTokens.map((token) => (
                                        <TableRow key={token.id}>
                                            <TableCell>{token.name}</TableCell>
                                            <TableCell>{new Date(token.created).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {token.lastUsed ? new Date(token.lastUsed).toLocaleDateString() : 'Never'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => deleteApiToken(token.id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
            )}
        </Box>
    );
};

export default MyAccountSettings;
