/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

/**
 * Example Authentication Configuration
 * 
 * This file demonstrates how to configure authentication for deployment.
 * DO NOT include actual secrets in this file - use environment injection.
 * 
 * Configuration can be provided via:
 * 1. Global window.__AUTH_CONFIG__ object (injected by server/deployment)
 * 2. Runtime endpoint /config/auth
 * 3. Environment variables (development only)
 */

/**
 * Example: Server-side injection in index.html
 * Add this script before your app bundle in index.html:
 * 
 * <script>
 *   window.__AUTH_CONFIG__ = {
 *     clientId: "your-client-id",
 *     authority: "https://login.microsoftonline.com/your-tenant-id",
 *     redirectUri: "/auth/callback",
 *     postLogoutRedirectUri: "/",
 *     scopes: ["openid", "profile", "email"],
 *     name: "Observes.io"  // Optional: Friendly name shown to users
 *   };
 * </script>
 */

/**
 * Example: Azure Static Web App configuration
 * For Azure SWA, create a staticwebapp.config.json with:
 * 
 * {
 *   "routes": [
 *     {
 *       "route": "/config/auth",
 *       "rewrite": "/.auth/config"
 *     }
 *   ]
 * }
 * 
 * And configure app settings in Azure portal with:
 * - AUTH_CLIENT_ID
 * - AUTH_AUTHORITY
 * - AUTH_REDIRECT_URI
 */

/**
 * Example: Backend API endpoint response
 * Your /config/auth endpoint should return JSON:
 * 
 * {
 *   "clientId": "your-client-id",
 *   "authority": "https://login.microsoftonline.com/common",
 *   "redirectUri": "/auth/callback",
 *   "postLogoutRedirectUri": "/",
 *   "scopes": ["openid", "profile", "email"],
 *   "name": "Observes.io",
 *   "knownAuthorities": ["login.microsoftonline.com"],
 *   "cacheLocation": "sessionStorage",
 *   "storeAuthStateInCookie": true
 * }
 */

/**
 * Configuration Schema
 */
export interface AuthConfigExample {
  // Required: Azure AD / Entra ID Application (Client) ID
  clientId: string;
  
  // Required: Authority URL
  // - Single tenant: https://login.microsoftonline.com/{tenant-id}
  // - Multi-tenant: https://login.microsoftonline.com/common
  // - B2C: https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}
  // - CIAM: https://{tenant}.ciamlogin.com/
  authority: string;
  
  // Optional: Redirect URI after authentication (default: "/auth/callback")
  redirectUri?: string;
  
  // Optional: Post-logout redirect URI (default: "/")
  postLogoutRedirectUri?: string;
  
  // Optional: OAuth scopes (default: ["openid", "profile", "email"])
  scopes?: string[];
  
  // Optional: Friendly name for the OAuth application
  // This is displayed to users on the login page to identify which OAuth app they're using
  // Examples: "Observes.io", "Contoso Internal App", "My Company SSO"
  // If not provided, shows a truncated Client ID instead
  name?: string;
  
  // Optional: Known authorities for multi-tenant (CIAM) scenarios
  knownAuthorities?: string[];
  
  // Optional: Cache location (default: "sessionStorage")
  cacheLocation?: 'sessionStorage' | 'localStorage';
  
  // Optional: Store auth state in cookie for IE11/Edge (default: true)
  storeAuthStateInCookie?: boolean;
}

/**
 * Example configurations for different scenarios
 */

// Single-tenant Azure AD
export const singleTenantExample: AuthConfigExample = {
  clientId: 'your-app-client-id',
  authority: 'https://login.microsoftonline.com/your-tenant-id',
  redirectUri: '/auth/callback',
  postLogoutRedirectUri: '/',
  scopes: ['openid', 'profile', 'email'],
};

// Multi-tenant Azure AD
export const multiTenantExample: AuthConfigExample = {
  clientId: 'your-app-client-id',
  authority: 'https://login.microsoftonline.com/common',
  redirectUri: '/auth/callback',
  postLogoutRedirectUri: '/',
  scopes: ['openid', 'profile', 'email'],
  knownAuthorities: ['login.microsoftonline.com'],
};

// Azure AD B2C
export const b2cExample: AuthConfigExample = {
  clientId: 'your-b2c-app-client-id',
  authority: 'https://contoso.b2clogin.com/contoso.onmicrosoft.com/B2C_1_signupsignin',
  redirectUri: '/auth/callback',
  postLogoutRedirectUri: '/',
  scopes: ['openid', 'profile'],
  knownAuthorities: ['contoso.b2clogin.com'],
};

// Azure AD External ID (CIAM)
export const ciamExample: AuthConfigExample = {
  clientId: 'your-ciam-app-client-id',
  authority: 'https://contoso.ciamlogin.com/',
  redirectUri: '/auth/callback',
  postLogoutRedirectUri: '/',
  scopes: ['openid', 'profile', 'email'],
  knownAuthorities: ['contoso.ciamlogin.com'],
};
