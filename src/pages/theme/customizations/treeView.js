/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { alpha } from '@mui/material/styles';

import { gray, brand } from '../shared-theme/themePrimitives';

/*  */
export const treeViewCustomizations = {
  MuiTreeItem2: {
    styleOverrides: {
      root: ({ theme }) => ({
        position: 'relative',
        boxSizing: 'border-box',
        padding: theme.spacing(0, 1),
        '& .groupTransition': {
          marginLeft: theme.spacing(2),
          padding: theme.spacing(0),
          borderLeft: '1px solid',
          borderColor: (theme.vars || theme).palette.divider,
        },
        '&:focus-visible .focused': {
          outline: `3px solid ${alpha(brand[500], 0.5)}`,
          outlineOffset: '2px',
          '&:hover': {
            backgroundColor: alpha(gray[300], 0.2),
            outline: `3px solid ${alpha(brand[500], 0.5)}`,
            outlineOffset: '2px',
          },
        },
      }),
      content: ({ theme }) => ({
        marginTop: theme.spacing(1),
        padding: theme.spacing(0.5, 1),
        overflow: 'clip',
        '&:hover': {
          backgroundColor: alpha(gray[300], 0.2),
        },
        '&.selected': {
          backgroundColor: alpha(gray[300], 0.4),
          '&:hover': {
            backgroundColor: alpha(gray[300], 0.6),
          },
        },
        ...theme.applyStyles('dark', {
          '&:hover': {
            backgroundColor: alpha(gray[500], 0.2),
          },
          '&:focus-visible': {
            '&:hover': {
              backgroundColor: alpha(gray[500], 0.2),
            },
          },
          '&.selected': {
            backgroundColor: alpha(gray[500], 0.4),
            '&:hover': {
              backgroundColor: alpha(gray[500], 0.6),
            },
          },
        }),
      }),
    },
  },
};
