/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

import { Configuration, LogLevel, BrowserCacheLocation } from '@azure/msal-browser';
import { AuthConfiguration } from '../config/authConfigLoader';

/**
 * Creates MSAL configuration dynamically from runtime configuration
 * 
 * @param authConfig The runtime authentication configuration
 * @returns MSAL browser configuration object
 */
export function createMsalConfig(authConfig: AuthConfiguration): Configuration {
  // Extract authority host for knownAuthorities if not explicitly provided
  let knownAuthorities = authConfig.knownAuthorities;
  if (!knownAuthorities || knownAuthorities.length === 0) {
    try {
      const authorityUrl = new URL(authConfig.authority);
      knownAuthorities = [authorityUrl.hostname];
    } catch (e) {
      console.warn('[MSAL Config] Could not parse authority URL for knownAuthorities');
    }
  }

  return {
    auth: {
      clientId: authConfig.clientId,
      authority: authConfig.authority,
      redirectUri: authConfig.redirectUri,
      postLogoutRedirectUri: authConfig.postLogoutRedirectUri,
      navigateToLoginRequestUrl: authConfig.navigateToLoginRequestUrl ?? false,
      knownAuthorities,
    },
    cache: {
      cacheLocation: (authConfig.cacheLocation as BrowserCacheLocation) ?? BrowserCacheLocation.SessionStorage,
      storeAuthStateInCookie: authConfig.storeAuthStateInCookie ?? true,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error('[MSAL]', message);
              return;
            case LogLevel.Info:
              console.info('[MSAL]', message);
              return;
            case LogLevel.Verbose:
              console.debug('[MSAL]', message);
              return;
            case LogLevel.Warning:
              console.warn('[MSAL]', message);
              return;
            default:
              return;
          }
        },
        logLevel: import.meta.env?.DEV ? LogLevel.Info : LogLevel.Warning,
        piiLoggingEnabled: false,
      },
      allowNativeBroker: false,
    },
  };
}

/**
 * Creates the login request configuration from runtime config
 * 
 * @param authConfig The runtime authentication configuration
 * @returns Login request object with scopes
 */
export function createLoginRequest(authConfig: AuthConfiguration) {
  return {
    scopes: authConfig.scopes || ['openid', 'profile', 'email'],
  };
}

/**
 * Creates silent request configuration for token refresh
 * 
 * @param authConfig The runtime authentication configuration
 * @returns Silent request object
 */
export function createSilentRequest(authConfig: AuthConfiguration) {
  return {
    scopes: authConfig.scopes || ['openid', 'profile', 'email'],
  };
}

export default {
  createMsalConfig,
  createLoginRequest,
  createSilentRequest,
};
