/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';

const OrgCard = ({ scan, handleCardClick, isSelected, handleCardClickDelete }) => {
  // Format scan_end date for human viewing
  const formatScanEndDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = dayjs(dateStr);
    if (!date.isValid()) return 'N/A';
    return date.format('YYYY-MM-DD HH:mm');
  };

  const handleDeleteClick = async (scanId) => {
    if (handleCardClickDelete) {
      handleCardClickDelete(scanId);
    }
  };

  // console.log("Rendering OrgCard for:", scan.id);
  // console.log("Scan details:", scan);

  return (
    <Card
      onClick={() => handleCardClick(scan.id)}
      sx={() => {
        const boxShadowColor = scan.shadow_color || '0,0,0';
        return {
          border: '2px solid',
          borderColor: isSelected ? 'primary.main' : 'transparent',
          opacity: isSelected ? '100%' : '70%',
          boxShadow: isSelected 
            ? `0 0 20px 4px rgba(${boxShadowColor}, 0.8)` 
            : `0 0 10px 2px rgba(${boxShadowColor}, 0.5)`,
          transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: `0 0 20px 4px rgba(${boxShadowColor}, 0.8)`,
          },
        };
      }}
    >
      <CardContent>
        <Typography variant="h5" component="div">
          {scan?.name || scan.id}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          {scan.type || "?"}
        </Typography>

        {/* Resource counters row */}
        {scan.resource_counts && (
          (() => {
            // Filter and map keys for display
            const entries = Object.entries(scan.resource_counts)
              .filter(([key]) => key !== 'queue')
              .map(([key, value]) => {
                let displayKey = key;
                if (key === 'endpoint' || key === 'endpoints') displayKey = 'Svc Connect';
                else if (key === 'variablegroup' ) displayKey = 'Var Groups';
                else if (key === 'securefile' ) displayKey = 'Sec Files';
                else if (key === 'builds') displayKey = 'Executions';
                else displayKey = key.replace(/_/g, ' ');
                displayKey = displayKey.replace(/\b\w/g, c => c.toUpperCase());
                return [displayKey, value];
              });
            const mid = Math.ceil(entries.length / 2);
            return (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mr: 2 }}>
                  {entries.slice(0, mid).map(([displayKey, value]) => (
                    <Box key={displayKey} sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, borderRadius: 1, bgcolor: 'grey.100', fontSize: 13, fontWeight: 500, color: 'text.secondary', minWidth: 90 }}>
                      <span style={{ fontWeight: 700, color: '#1976d2', marginRight: 4 }}>{value}</span> {displayKey}
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {entries.slice(mid).map(([displayKey, value]) => (
                    <Box key={displayKey} sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, borderRadius: 1, bgcolor: 'grey.100', fontSize: 13, fontWeight: 500, color: 'text.secondary', minWidth: 90 }}>
                      <span style={{ fontWeight: 700, color: '#1976d2', marginRight: 4 }}>{value}</span> {displayKey}
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })()
        )}

        {/* <div style={{ textAlign: 'left' }}>
          <Typography variant="caption" sx={{ color: 'gray' }}>
            Scanned on {scan.scanned || 'N/A'}
          </Typography>
        </div> */}

        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            variant="text"
            color="primary"
            fullWidth
            onClick={() => window.open(scan.url || scan.url || scan.enterpriseUrl, '_blank', 'noopener,noreferrer')}
          >
            Visit
          </Button>
          <Button
            variant="text"
            color="error"
            fullWidth
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(scan.id); }}
          >
            Delete
          </Button>
        </Box>
        <Box display="flex" justifyContent="center" mt={2}>
          <Typography variant="caption" sx={{ color: 'gray' }}>
            Scanned on {formatScanEndDate(scan?.scan_end)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrgCard;