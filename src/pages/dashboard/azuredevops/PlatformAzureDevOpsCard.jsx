/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Divider,
  Button,
  TextField,
  Stack,
  Grid,
  Card,
  CardContent,
  MenuItem,
  IconButton,
  Menu,
  Chip,
  Tooltip,
} from "@mui/material";



const PlatformAzureDevOpsCard = ({ plat_source, isSelected, onClick, onDelete, platform }) => {
  const source_type = plat_source.source_type || (plat_source.type === 'integrated' ? 'Integrated' : 'On-Demand');
  const projectCount = plat_source.resource_counts?.projects || Object.keys(plat_source?.projects || {}).length || 0;
  const committerCount = plat_source.resource_counts?.committers || 0;
  const hasCommitterStats = committerCount > 0;
  const executionCount = plat_source.resource_counts?.builds || 0;

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
        {/* Header with plat_source type badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
              {plat_source?.name || plat_source.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {platform || "Platform"}
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

        {/* Key Metrics Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: hasCommitterStats ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: 1.5,
          mb: 2
        }}>
          <Tooltip title="Total Projects">
            <Box sx={{
              textAlign: 'center',
              p: 1,
              bgcolor: 'action.hover',
              borderRadius: 1,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'action.selected' }
            }}>
              <FolderIcon sx={{ fontSize: 20, color: 'primary.main', mb: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {projectCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Projects
              </Typography>
            </Box>
          </Tooltip>

          {hasCommitterStats && (
            <Tooltip title="Total Committers">
              <Box sx={{
                textAlign: 'center',
                p: 1,
                bgcolor: 'action.hover',
                borderRadius: 1,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'action.selected' }
              }}>
                <PeopleIcon sx={{ fontSize: 20, color: 'secondary.main', mb: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  {committerCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Committers
                </Typography>
              </Box>
            </Tooltip>
          )}

          <Tooltip title="Build Executions">
            <Box sx={{
              textAlign: 'center',
              p: 1,
              bgcolor: 'action.hover',
              borderRadius: 1,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'action.selected' }
            }}>
              <ScheduleIcon sx={{ fontSize: 20, color: 'success.main', mb: 0.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                {executionCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Executions
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* Additional Resource Counts - Compact view */}
        {plat_source.resource_counts && (
          <Box sx={{ mb: 2 }}>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {Object.entries(plat_source.resource_counts)
                .filter(([key]) => !['projects', 'builds', 'queue'].includes(key))
                .slice(0, 6) // Show max 6 additional resources
                .map(([key, value]) => {
                  let displayKey = key;
                  if (key === 'endpoint' || key === 'endpoints') displayKey = 'Service Connections';
                  else if (key === 'variablegroup') displayKey = 'Variable Groups';
                  else if (key === 'securefile') displayKey = 'Secure Files';
                  else if (key === 'builds') displayKey = 'Executions';
                  else if (key === 'repository') displayKey = 'Repositories';
                  else if (key === 'environment') displayKey = 'Environments';
                  else displayKey = key.charAt(0).toUpperCase() + key.slice(1);

                  return (
                    <Chip
                      key={key}
                      label={`${value} ${displayKey}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  );
                })}
            </Box>
          </Box>
        )}

        {/* plat_source Date and Actions */}
        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: 14 }} />
              {formatScanDate(plat_source?.scan_end)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(plat_source.url || plat_source.enterpriseUrl, '_blank', 'noopener,noreferrer');
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

export default PlatformAzureDevOpsCard;