import React, { useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MainGrid from '../components/MainGrid';
import Typography from '@mui/material/Typography';
import AzureDevOpsLogo from './assets/ado.png';
import useStore from '../../state/stores/store';


export default function Dashboard() {
  // GLOBAL STATE
  const { scans, selectedScan, setSelectedScan, fetchScans, setCurrentPage } = useStore();

  // LOCAL STATE
  const [platformType, setPlatformType] = React.useState(selectedScan?.type || 'AzureDevOps');

  useEffect(() => {
    setCurrentPage("Overview");
  }, [setCurrentPage]);

  useEffect(() => {
    // Selected organisation is set to the first organisation in the list if no organisation is selected
    fetchScans();
    if (!selectedScan && scans.length > 0) {
      setSelectedScan(scans[0]);
    }
  }, [fetchScans]);

  const handlePlatformChange = (platformType) => {
    // Changing the platform type will not change the selected organisation (commented out)
    setPlatformType(platformType);
    setSelectedScan(null);
  };

  const handleScanSelect = (scan) => {
    const selectedScan = scans.find(s => s.id === scan.id);
    setSelectedScan(selectedScan);
    setPlatformType(scan.type);
  };
  
  // No scan types for now
  const filteredScans = scans
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex' }}>
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
            mt: 2,
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              Onboarded Azure DevOps organisations
            </Typography>
            <MainGrid platformType={platformType} scans={filteredScans} onScanSelect={handleScanSelect} />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}