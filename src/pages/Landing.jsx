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

import Dashboard from './dashboard/Dashboard';
import PlatformManagement from './platform/Platform';
import ResourceTracker from './resource/ResourceTracker';
import Settings from './settings/Settings';

import useStore from '../state/stores/store';
import { useAuth } from '../contexts/AuthContext';

// ICONS
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import GavelIcon from '@mui/icons-material/Gavel';
import BadgeIcon from '@mui/icons-material/Badge';
import SettingsIcon from '@mui/icons-material/Settings';


const Landing = () => {
  const navigate = useNavigate();

  // FROM Store
  // Platform Source = One or collection of Scans
  const { currentPage, globalSettings, selectedPlatformSource, platformSources, fetchPlatformSources, setSelectedPlatformSource } = useStore();
  const { user } = useAuth();

  
  useEffect(() => {
    fetchPlatformSources();
    if (!selectedPlatformSource && platformSources.length > 0) {
      setSelectedPlatformSource(platformSources[0]);
    }  
  }, [currentPage]);

  const handleMenuItemClick = (id, text) => {
    navigate(`/${id.toLowerCase()}`);
  };

  const mainListItems = [
    { id: 'dashboard', text: 'Dashboard', icon: <HomeRoundedIcon /> },
    { id: 'resource', text: 'Tracker', icon: <ScatterPlotIcon /> },
    { id: 'platform', text: 'Platform Manager', icon: <BadgeIcon /> },
    { id: 'settings', text: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <>
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          { globalSettings.MenuLayout === 'Sidebar' ? (
            <Sidebar onMenuItemClick={handleMenuItemClick} mainListItems={mainListItems} />
          ) : (
            <Header onMenuItemClick={handleMenuItemClick} mainListItems={mainListItems} />
          )}
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
                mt: globalSettings.MenuLayout === 'Sidebar' ? 3 : 10
              }}
            >

              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/platform" element={<PlatformManagement />} />
                <Route path="/resource" element={<ResourceTracker />} />
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