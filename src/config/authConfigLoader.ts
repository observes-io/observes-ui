/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

/**
 * Runtime Authentication Configuration Loader
 * 
 * Loads authentication configuration dynamically from:
 * 1. Global injected configuration object (window.__AUTH_CONFIG__)
 * 2. Runtime endpoint (/config/auth)
 * 3. Environment variables (fallback for development)
 * 
 * This enables marketplace-provisioned configuration without hardcoded secrets.
 */

export interface AuthConfiguration {
  /** Azure AD / Entra ID Client Application ID */
  clientId: string;
  /** Authority URL (e.g., https://login.microsoftonline.com/{tenantId} or CIAM URL) */
  authority: string;
  /** Redirect URI after authentication */
  redirectUri: string;
  /** Post-logout redirect URI */
  postLogoutRedirectUri: string;
  /** OAuth scopes to request */
  scopes: string[];
  /** Optional: Friendly name for the OAuth application (e.g., 'Observes.io', 'Contoso Internal App') */
  name?: string;
  /** Optional: Known authorities for multi-tenant scenarios */
  knownAuthorities?: string[];
  /** Optional: Enable navigation to login request URL */
  navigateToLoginRequestUrl?: boolean;
  /** Optional: Cache location ('sessionStorage' | 'localStorage') */
  cacheLocation?: 'sessionStorage' | 'localStorage';
  /** Optional: Store auth state in cookie for IE11 / Edge support */
  storeAuthStateInCookie?: boolean;
}

interface RuntimeAuthConfig {
  auth: AuthConfiguration;
  loaded: boolean;
  error?: string;
}

declare global {
  interface Window {
    __AUTH_CONFIG__?: Partial<AuthConfiguration>;
  }
}

// Module-level state for loaded configuration
let cachedConfig: RuntimeAuthConfig | null = null;

/**
 * Default configuration values (non-sensitive)
 * These can be overridden by runtime configuration
 */
const DEFAULT_CONFIG: Partial<AuthConfiguration> = {
  redirectUri: '/auth/callback',
  postLogoutRedirectUri: '/',
  scopes: ['openid', 'profile', 'email'],
  navigateToLoginRequestUrl: false,
  cacheLocation: 'sessionStorage',
  storeAuthStateInCookie: true,
};

/**
 * Validates that required configuration fields are present
 */
function validateConfig(config: Partial<AuthConfiguration>): config is AuthConfiguration {
  const requiredFields: (keyof AuthConfiguration)[] = ['clientId', 'authority'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    console.error(`[AuthConfigLoader] Missing required configuration fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Attempts to load configuration from global window object
 * This is typically injected by the deployment pipeline or backend server
 */
function loadFromGlobalConfig(): Partial<AuthConfiguration> | null {
  if (typeof window !== 'undefined' && window.__AUTH_CONFIG__) {
    console.info('[AuthConfigLoader] Loading configuration from global __AUTH_CONFIG__');
    return window.__AUTH_CONFIG__;
  }
  return null;
}

/**
 * Attempts to load configuration from runtime endpoint
 */
async function loadFromEndpoint(endpoint: string = '/config/auth'): Promise<Partial<AuthConfiguration> | null> {
  try {
    console.info(`[AuthConfigLoader] Fetching configuration from ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Include credentials for authenticated config endpoints
      credentials: 'same-origin',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[AuthConfigLoader] Configuration endpoint not found: ${endpoint}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const config = await response.json();
    console.info('[AuthConfigLoader] Configuration loaded from endpoint');
    return config;
  } catch (error) {
    console.log('[AuthConfigLoader] Failed to load from endpoint:', error);
    return null;
  }
}

/**
 * Attempts to load configuration from environment variables (Vite)
 * Only used as fallback for development
 */
function loadFromEnvironment(): Partial<AuthConfiguration> | null {
  // Check if we're in development with Vite env vars
  const clientId = import.meta.env?.VITE_AUTH_CLIENT_ID;
  const authority = import.meta.env?.VITE_AUTH_AUTHORITY;
  
  if (clientId && authority) {
    console.info('[AuthConfigLoader] Loading configuration from environment variables');
    return {
      clientId,
      authority,
      redirectUri: import.meta.env?.VITE_AUTH_REDIRECT_URI || DEFAULT_CONFIG.redirectUri,
      postLogoutRedirectUri: import.meta.env?.VITE_AUTH_POST_LOGOUT_REDIRECT_URI || DEFAULT_CONFIG.postLogoutRedirectUri,
      scopes: import.meta.env?.VITE_AUTH_SCOPES?.split(',') || DEFAULT_CONFIG.scopes,
      knownAuthorities: import.meta.env?.VITE_AUTH_KNOWN_AUTHORITIES?.split(','),
    };
  }
  
  return null;
}

/**
 * Loads authentication configuration from available sources
 * Priority: Global Config > Endpoint > Environment Variables
 * 
 * @param options Configuration loading options
 * @returns Promise resolving to the loaded configuration
 * @throws Error if no valid configuration can be loaded
 */
export async function loadAuthConfig(options: {
  /** Custom endpoint URL for configuration */
  endpoint?: string;
  /** Force reload even if config is cached */
  forceReload?: boolean;
  /** Skip endpoint fetch (useful for offline/testing) */
  skipEndpoint?: boolean;
} = {}): Promise<AuthConfiguration> {
  const { endpoint = '/config/auth', forceReload = false, skipEndpoint = false } = options;
  
  // Return cached config if available and not forcing reload
  if (cachedConfig?.loaded && !forceReload) {
    return cachedConfig.auth;
  }
  
  let config: Partial<AuthConfiguration> | null = null;
  
  // 1. Try global injected configuration first
  config = loadFromGlobalConfig();
  
  // 2. Try fetching from runtime endpoint
  if (!config && !skipEndpoint) {
    config = await loadFromEndpoint(endpoint);
  }
  
  // 3. Fallback to environment variables (development)
  if (!config) {
    config = loadFromEnvironment();
  }
  
  // Merge with defaults
  const mergedConfig: Partial<AuthConfiguration> = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  
  // Validate configuration
  if (!validateConfig(mergedConfig)) {
    // No valid OAuth config found - this is OK, app can run in guest-only mode
    const error = 'OAuth not configured - application will run in guest-only mode';
    console.log(`[AuthConfigLoader] ${error}`);
    cachedConfig = { auth: mergedConfig as AuthConfiguration, loaded: false, error };
    // Return the partial config as AuthConfiguration (with defaults filled in)
    // The app will check isOAuthReady in hostingConfig to determine if it's actually usable
    return mergedConfig as AuthConfiguration;
  }
  
  // Cache and return the valid configuration
  cachedConfig = { auth: mergedConfig, loaded: true };
  console.info('[AuthConfigLoader] Configuration loaded successfully');
  
  return mergedConfig;
}

/**
 * Gets the currently loaded configuration synchronously
 * Returns null if configuration hasn't been loaded yet
 * 
 * @returns The cached configuration or null
 */
export function getAuthConfig(): AuthConfiguration | null {
  return cachedConfig?.loaded ? cachedConfig.auth : null;
}

/**
 * Checks if configuration has been loaded
 * 
 * @returns True if configuration is loaded and valid
 */
export function isAuthConfigLoaded(): boolean {
  return cachedConfig?.loaded ?? false;
}

/**
 * Clears the cached configuration
 * Useful for testing or forcing a reload
 */
export function clearAuthConfigCache(): void {
  cachedConfig = null;
}

/**
 * Gets configuration loading error if any
 * 
 * @returns Error message or undefined
 */
export function getAuthConfigError(): string | undefined {
  return cachedConfig?.error;
}

export default {
  loadAuthConfig,
  getAuthConfig,
  isAuthConfigLoaded,
  clearAuthConfigCache,
  getAuthConfigError,
};
