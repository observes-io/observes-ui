/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

/**
 * Hosting Configuration Module
 * 
 * Detects and manages hosting environment to support:
 * 1. SaaS mode - Application hosted by Observes.io on app.observes.io
 * 2. Self-hosted mode - Application hosted by customer on their own domain
 */

export enum HostingMode {
  /** SaaS: Hosted on Observes.io infrastructure */
  SAAS = 'saas',
  /** Self-hosted: Customer manages their own deployment */
  SELF_HOSTED = 'self-hosted',
  /** Unknown or undetermined */
  UNKNOWN = 'unknown',
}

export interface HostingConfiguration {
  /** The detected hosting mode */
  mode: HostingMode;
  /** The current domain the app is being accessed from */
  domain: string;
  /** Whether OAuth authentication is properly configured and ready */
  isOAuthReady: boolean;
  /** Optional error message if OAuth is not ready */
  oAuthError?: string;
}

/**
 * SaaS domains where the application is hosted by Observes.io
 * Add additional SaaS domains here as needed
 */
const SAAS_DOMAINS = [
  'app.observes.io',
  'observes.io',
];

/**
 * Localhost/development domains
 */
const DEV_DOMAINS = [
  'localhost',
  '127.0.0.1'
];

/**
 * Detects the current hosting mode based on the domain
 * 
 * @param hostname The hostname to check (defaults to window.location.hostname)
 * @returns The detected hosting mode
 */
export function detectHostingMode(hostname?: string): HostingMode {
  const currentHostname = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
  
  // Normalize hostname to lowercase for comparison
  const normalizedHostname = currentHostname.toLowerCase();
  
  // Check if running in development
  if (DEV_DOMAINS.some(domain => normalizedHostname.includes(domain))) {
    // In development, default to self-hosted mode for testing
    return HostingMode.SELF_HOSTED;
  }
  
  // Check if running on SaaS infrastructure
  if (SAAS_DOMAINS.some(domain => normalizedHostname === domain || normalizedHostname.endsWith(`.${domain}`))) {
    return HostingMode.SAAS;
  }
  
  // All other domains are considered self-hosted
  return HostingMode.SELF_HOSTED;
}

/**
 * Checks if OAuth is properly configured and ready to use
 * 
 * @param authConfig The loaded authentication configuration
 * @returns Object indicating if OAuth is ready and any error message
 */
export function checkOAuthReadiness(authConfig: any): { isReady: boolean; error?: string } {
  // No config loaded at all
  if (!authConfig) {
    return {
      isReady: false,
      error: 'OAuth configuration not loaded',
    };
  }
  
  // Check for required fields
  if (!authConfig.clientId || authConfig.clientId === '') {
    return {
      isReady: false,
      error: 'OAuth Client ID not configured',
    };
  }
  
  if (!authConfig.authority || authConfig.authority === '') {
    return {
      isReady: false,
      error: 'OAuth Authority not configured',
    };
  }
  
  // Validate authority URL format
  try {
    const authorityUrl = new URL(authConfig.authority);
    if (!authorityUrl.protocol.startsWith('https')) {
      return {
        isReady: false,
        error: 'OAuth Authority must use HTTPS',
      };
    }
  } catch (e) {
    return {
      isReady: false,
      error: 'Invalid OAuth Authority URL',
    };
  }
  
  // All checks passed
  return { isReady: true };
}

/**
 * Gets the complete hosting configuration including OAuth readiness
 * 
 * @param authConfig The loaded authentication configuration (optional)
 * @returns Complete hosting configuration
 */
export function getHostingConfiguration(authConfig?: any): HostingConfiguration {
  const mode = detectHostingMode();
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';
  const oAuthCheck = checkOAuthReadiness(authConfig);
  
  return {
    mode,
    domain,
    isOAuthReady: oAuthCheck.isReady,
    oAuthError: oAuthCheck.error,
  };
}

/**
 * 
 * @param mode The hosting mode
 * @returns Setup instructions message
 */
export function getOAuthSetupInstructions(mode: HostingMode): {
  title: string;
  message: string;
  actionLabel?: string;
  contactEmail?: string;
  docUrl?: string;
} {
  switch (mode) {
    case HostingMode.SAAS:
      return {
        title: 'SaaS Not Configured',
        message: 'This SaaS instance has not been configured for OAuth authentication yet. Please contact our support team to enable authentication for your organization. Alternatively check our docs for self-hosting options (https://observes.io/docshome).',
        actionLabel: 'Contact Support',
        contactEmail: 'support@observes.io',
      };
      
    case HostingMode.SELF_HOSTED:
      return {
        title: 'Self-Hosted OAuth Setup Required',
        message: 'To use OAuth authentication, you need to configure your OAuth provider.',
        actionLabel: 'Contact Support',
        contactEmail: 'support@observes.io',
      };
      
    default:
      return {
        title: 'Configuration Required',
        message: 'OAuth authentication is not configured. Please check your deployment configuration.',
        actionLabel: 'Contact Support',
        contactEmail: 'support@observes.io',
      };
  }
}

/**
 * Determines if guest mode should be available based on hosting mode
 * 
 * @param mode The hosting mode
 * @returns True if guest mode should be available
 */
export function isGuestModeAvailable(mode: HostingMode): boolean {
  // Guest mode is always available to allow users to explore the application
  // even if OAuth is not configured
  return true;
}

export default {
  detectHostingMode,
  checkOAuthReadiness,
  getHostingConfiguration,
  getOAuthSetupInstructions,
  isGuestModeAvailable,
  HostingMode,
};
