/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import AppTheme from './theme/shared-theme/AppTheme';
import { Box, Stack } from '@mui/material';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Overview from './dashboard/Dashboard';
import PlatformManagement from './platform/Platform';
import PolicyManagement from './policy/Policy';
import ResourceTracker from './resource/ResourceTracker';
import Settings from './settings/Settings';

import useStore from '../state/stores/store';



const Landing = () => {
  const navigate = useNavigate();
  const { currentPage, globalSettings, selectedScan, scans, fetchScans, setSelectedScan } = useStore();

  
  // Things I want to load anytime any of the routes are loaded: Orgnisations (Projects)
  useEffect(() => {
    fetchScans();
    if (!selectedScan && scans.length > 0) {
      setSelectedScan(scans[1]);
    }  
  }, [currentPage]);

  const handleMenuItemClick = (id, text) => {
    navigate(`/${id.toLowerCase()}`);
  };

  return (
    <>
      <AppTheme>
        { globalSettings.MenuLayout == 'Header' && (<Header onMenuItemClick={handleMenuItemClick} />)}
        <Box sx={{ display: 'flex' }}>
          { globalSettings.MenuLayout == 'Sidebar' && (<Sidebar onMenuItemClick={handleMenuItemClick} />)}
          <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                : theme.palette.background.default,
              overflow: 'auto',
            })}
          >
            <Stack
              spacing={2}
              sx={{
                mx: 3,
                pb: 5,
                mt: globalSettings.MenuLayout == 'Sidebar' ? 3 : 10
              }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/overview" replace />} />
                <Route path="/auth" element={<Navigate to="/overview" replace />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/platform" element={<PlatformManagement />} />
                <Route path="/resource" element={<ResourceTracker />} />
                {/* <Route path="/policy" element={<PolicyManagement />} /> */}
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Stack>
          </Box>
        </Box>
      </AppTheme>
    </>

  );
};

export default Landing;