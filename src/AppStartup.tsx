/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import useStore from './state/stores/store';
import { initIndexDb } from './utils/indexeddb';

interface AppStartupProps {
  children: React.ReactNode;
}

interface AppStartupState {
  loading: boolean;
}

interface AppStartupState {
  loading: boolean;
  showDbUpgrade: boolean;
}

export class AppStartup extends React.Component<AppStartupProps, AppStartupState> {
  constructor(props: AppStartupProps) {
    super(props);
    this.state = { loading: true, showDbUpgrade: false };
  }

  async componentDidMount() {
    // Run all startup logic here
    const dbUpgrade = await initIndexDb();
    // If a new store was added to an existing DB, show a warning
    if (dbUpgrade) {
      this.setState({ showDbUpgrade: true, loading: false });
      return;
    }
    // Fetch global settings (and any other startup actions)
    await useStore.getState().fetchGlobalSettings();
    // Add more startup actions as needed
    this.setState({ loading: false });
  }

  handleAcknowledgeDbUpgrade = () => {
    // Optionally, you could reload the app or redirect
    this.setState({ showDbUpgrade: false });
  };

  render() {
    if (this.state.loading) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
          <Box mt={2} fontSize={18} color="text.secondary" fontFamily={'sans-serif'}>Initialising...</Box>
        </Box>
      );
    }
    if (this.state.showDbUpgrade) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
          <Box mt={2} fontSize={18} color="error.main" textAlign="center" fontFamily={'sans-serif'}>
            The database structure has been modified.<br />
            Please upload a new scan to ensure data consistency.
          </Box>
          <Box mt={3}>
            <button onClick={this.handleAcknowledgeDbUpgrade} style={{ padding: '8px 24px', fontSize: 16 }}>OK</button>
          </Box>
        </Box>
      );
    }
    return <>{this.props.children}</>;
  }
}
