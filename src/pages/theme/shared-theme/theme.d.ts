/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import '@mui/material/styles';

// Define the shape of your custom palette
interface ResourceButtonPalette {
  light: {
    main: string;
    hoverBackground: string;
    hoverText: string;
    active: string;
    text: string;
    border: string;
    selectedBackground: string;
    selectedText: string;
  };
  dark: {
    main: string;
    hoverBackground: string;
    hoverText: string;
    active: string;
    text: string;
    border: string;
    selectedBackground: string;
    selectedText: string;
  };
}

declare module '@mui/material/styles' {
  interface Palette {
    resourceButton: ResourceButtonPalette;
  }
  interface PaletteOptions {
    resourceButton?: ResourceButtonPalette;
  }
}
