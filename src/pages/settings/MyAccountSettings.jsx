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


    const handleChange = (key, value) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setGlobalSettings(localSettings);
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
        </Box>
    );
};

export default MyAccountSettings;
