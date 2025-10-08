/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { CssBaseline } from '@mui/material';
import AppTheme from './pages/theme/shared-theme/AppTheme';
import Landing from './pages/Landing';
import { AppStartup } from './AppStartup';

function App() {
  return (
    <AppStartup>
      <AppTheme>
        <CssBaseline enableColorScheme />
        <Landing />
      </AppTheme>
    </AppStartup>
  );
}

export default App;



