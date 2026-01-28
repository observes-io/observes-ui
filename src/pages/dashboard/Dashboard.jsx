/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React, { useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useStore from '../../state/stores/store';

// LOGOS
// import AzureDevOpsLogo from './assets/ado.png';
// import GitHubLogo from './assets/github.png';
// import JenkinsLogo from './assets/jenkins.png';
// import AtlassianLogo from './assets/atlassian.png';


// Platform Dashboard Components
import MainGrid from './MainGrid';


export default function Dashboard() {
  // GLOBAL STATE
  const { platformSources, selectedPlatformSource, setSelectedPlatformSource, fetchPlatformSources, setCurrentPage } = useStore();

  useEffect(() => {
    setCurrentPage("Dashboard");
  }, [setCurrentPage]);

  useEffect(() => {
    // Selected organisation is set to the first organisation in the list if no organisation is selected
    fetchPlatformSources();
    if (!selectedPlatformSource && platformSources.length > 0) {
      setSelectedPlatformSource(platformSources[0]);
    }
  }, [fetchPlatformSources]);


  const handlePlatformSourceSelect = (platformSource) => {
    const selectedPlatformSource = platformSources.find(s => s.id === platformSource.id);
    setSelectedPlatformSource(selectedPlatformSource);
  };
  
  // No scan types for now
  const filteredplatformSources = platformSources
  
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
            <MainGrid platformSources={filteredplatformSources} onPlatformSourceSelect={handlePlatformSourceSelect} />
        </Box>
      </Box>
    </Box>
  );
}