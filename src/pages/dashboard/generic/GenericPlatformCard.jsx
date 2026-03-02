/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
import { isValidPlatformUrl } from '../../../utils/urlValidator';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExtensionIcon from '@mui/icons-material/Extension';
import {
    Box,
    Typography,
    Card,
    Button,
    CardContent,
    Chip,
    Tooltip,
} from "@mui/material";

const GenericPlatformCard = ({ plat_source, isSelected, onClick, onDelete, platform }) => {
    const source_type = plat_source.source_type || (plat_source.type === 'integrated' ? 'Integrated' : 'On-Demand');

    // Helper to format dates
    const formatScanDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    return (
        <Card
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                transition: 'all 0.3s ease',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 6,
                    transform: 'translateY(-4px)',
                },
            }}
        >
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                {/* Header with scan type badge */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {plat_source?.name || plat_source.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {platform || plat_source.type || "Platform"}
                        </Typography>
                    </Box>
                    <Chip
                        icon={source_type === 'Integrated' ? <RefreshIcon /> : <CloudUploadIcon />}
                        label={source_type}
                        size="small"
                        color={source_type === 'Integrated' ? 'success' : 'info'}
                        sx={{ fontWeight: 500 }}
                    />
                </Box>

                {/* Custom Platform Icon Display */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    my: 4,
                    py: 2
                }}>
                    <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        border: '2px dashed',
                        borderColor: 'divider'
                    }}>
                        <ExtensionIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Custom Platform
                    </Typography>
                    {plat_source.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center', px: 2 }}>
                            {plat_source.description}
                        </Typography>
                    )}
                </Box>

                {/* Scan Date and Actions */}
                <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon sx={{ fontSize: 14 }} />
                            {formatScanDate(plat_source?.scan?.start || plat_source?.scan_start || plat_source?.scan_end)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                                size="small"
                                variant="text"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const url = plat_source.url || plat_source.enterpriseUrl;

                                    if (!url || !isValidPlatformUrl(url)) {
                                        console.error('Invalid platform URL');
                                        return;
                                    }

                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }}
                                sx={{ minWidth: 'auto', px: 1, fontSize: '0.7rem' }}
                            >
                                Visit
                            </Button>
                            <Button
                                size="small"
                                variant="text"
                                color="error"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(plat_source.id);
                                }}
                                sx={{ minWidth: 'auto', px: 1, fontSize: '0.7rem' }}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default GenericPlatformCard;
