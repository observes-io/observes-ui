/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

/**
 * Authentication Module
 * 
 * Provides dynamic, marketplace-provisioned authentication for Azure Static Web Apps.
 * 
 * Usage:
 * ```tsx
 * import { AuthBootstrap, useAuthBootstrap } from './auth';
 * 
 * // Wrap your app
 * <AuthBootstrap>
 *   <App />
 * </AuthBootstrap>
 * 
 * // In components, use the hook
 * const { loginRequest, authConfig } = useAuthBootstrap();
 * ```
 */

export { AuthBootstrap, useAuthBootstrap } from './AuthBootstrap';
export { createMsalConfig, createLoginRequest, createSilentRequest } from './msalConfig';
export type { AuthConfiguration } from '../config/authConfigLoader';
