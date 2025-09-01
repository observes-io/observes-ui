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



