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

export class AppStartup extends React.Component<AppStartupProps, AppStartupState> {
  constructor(props: AppStartupProps) {
    super(props);
    this.state = { loading: true };
  }

  async componentDidMount() {
    // 10 second delay before DB init (if needed)
    //await new Promise(resolve => setTimeout(resolve, 10000));
    // Run all startup logic here
    await initIndexDb();
    // Fetch global settings (and any other startup actions)
    await useStore.getState().fetchGlobalSettings();
    // Add more startup actions as needed
    this.setState({ loading: false });
  }

  render() {
    if (this.state.loading) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
          <Box mt={2} fontSize={18} color="text.secondary">Initialising...</Box>
        </Box>
      );
    }
    return <>{this.props.children}</>;
  }
}
