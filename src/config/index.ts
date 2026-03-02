/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

/**
 * Configuration Module
 * 
 * Provides runtime configuration loading for marketplace-provisioned deployments.
 */

export {
  loadAuthConfig,
  getAuthConfig,
  isAuthConfigLoaded,
  clearAuthConfigCache,
  getAuthConfigError,
} from './authConfigLoader';

export type { AuthConfiguration } from './authConfigLoader';

export {
  detectHostingMode,
  checkOAuthReadiness,
  getHostingConfiguration,
  getOAuthSetupInstructions,
  isGuestModeAvailable,
  HostingMode,
} from './hostingConfig';

export type { HostingConfiguration } from './hostingConfig';
