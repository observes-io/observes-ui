/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { CssBaseline } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppTheme from './pages/theme/shared-theme/AppTheme';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import OAuthCallback from './pages/auth/OAuthCallback';
import ProtectedRoute from './pages/components/licenses/ProtectedRoute';
import { AppStartup } from './AppStartup';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
        <AppStartup>
          <AppTheme>
            <CssBaseline enableColorScheme />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Landing />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppTheme>
        </AppStartup>
    </AuthProvider>
  );
}

export default App;



