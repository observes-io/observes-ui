/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';
import { colorSchemes, typography, shadows, shape } from './themePrimitives';
import { storageManager } from '../../../utils/muiStorageManager';

interface AppThemeProps {
  children: React.ReactNode;
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  disableCustomTheme?: boolean;
  themeComponents?: ThemeOptions['components'];
}

export default function AppTheme({
  children,
  disableCustomTheme,
  themeComponents,
}: AppThemeProps) {
  // No manual mode logic; let MUI handle color scheme automatically

  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? {}
      : createTheme({
        cssVariables: {
          colorSchemeSelector: 'data-mui-color-scheme',
          cssVarPrefix: 'template',
        },
        colorSchemes: {
          dark: false
        },
        typography: {
          ...typography,
          fontFamily: "'Inter', 'Roboto', Arial, sans-serif"
        },
        shadows,
        shape,
        palette: {},
        components: {
          // ...inputsCustomizations,
          ...dataDisplayCustomizations,
          // ...feedbackCustomizations,
          // ...navigationCustomizations,
          ...surfacesCustomizations,
          // ...themeComponents,
        },
      });
  }, [disableCustomTheme, themeComponents]);
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}
