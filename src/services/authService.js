/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:45791';

/**
 * Authentication configuration
 * 
 * MIGRATION SETTINGS:
 * Set USE_STORAGE_FALLBACK to false for maximum security (requires re-auth on page refresh)
 * After migrating to httpOnly cookies, these settings become irrelevant
 */
const AUTH_CONFIG = {
  // Use localStorage fallback for page refresh (UX vs Security tradeoff)
  USE_STORAGE_FALLBACK: true, // Set to false for max security
  
  // Session timeout (30 minutes)
  SESSION_DURATION: 30 * 60 * 1000,
  
  // Auto-refresh interval (5 minutes before expiry)
  REFRESH_INTERVAL: 5 * 60 * 1000,
};

/**
 * Token storage - in-memory primary with optional localStorage fallback
 * 
 * IMPORTANT SECURITY NOTES:
 * - This does NOT protect against XSS attacks
 * - If an attacker can run JavaScript, they can steal tokens regardless of storage method
 * - The ONLY robust XSS protection is httpOnly cookies (see migration plan below)
 * 
 * What this provides:
 * - In-memory storage reduces token persistence (cleared on tab close)
 * - Reduces risk from storage-scraping malware/extensions
 * - Session timeout limits token lifetime
 * - localStorage fallback is for UX only (page refresh), NOT security
 * 
 * What this does NOT provide:
 * - XSS protection (attacker can read memory, call getAccessToken(), or read storage)
 * - Protection from malicious scripts running in same origin
 * - Meaningful encryption (obfuscation only, easily reversed if attacker has JS access)
 * 
 * Migration to httpOnly Cookies (REQUIRED for real XSS protection):
 * 1. Backend sets: Set-Cookie: __Host-access_token=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1800
 * 2. Backend sets: Set-Cookie: __Host-refresh_token=<token>; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=2592000
 * 3. Frontend: Remove Authorization header, use credentials: 'include'
 * 4. Backend: Implement CSRF protection (double-submit cookie or synchronizer token)
 * 5. Frontend: Remove this class entirely
 */
class SecureTokenStorage {
  constructor() {
    this.memoryStore = {
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
    };
    this.sessionTimeout = null;
    this.SESSION_DURATION = AUTH_CONFIG.SESSION_DURATION;
    // Note: Consider disabling localStorage fallback entirely for better security
    // Set to false to require re-authentication on page refresh
    this.USE_STORAGE_FALLBACK = AUTH_CONFIG.USE_STORAGE_FALLBACK;
    this._startSessionMonitor();
  }

  // Obfuscation only - does NOT protect against XSS
  // If an attacker can run JS, they can trivially reverse this or just call getAccessToken()
  _obfuscate(data) {
    if (!data) return data;
    try {
      // Simple base64 encoding for casual inspection only
      return btoa(data);
    } catch (error) {
      return data;
    }
  }

  _deobfuscate(data) {
    if (!data) return data;
    try {
      return atob(data);
    } catch (error) {
      return null;
    }
  }

  _startSessionMonitor() {
    // Clear tokens after session timeout
    this._resetSessionTimeout();
    
    // Monitor user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this._resetSessionTimeout(), { passive: true });
    });
  }

  _resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    if (this.memoryStore.accessToken) {
      this.sessionTimeout = setTimeout(() => {
        this.clear();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }, this.SESSION_DURATION);
    }
  }

  setTokens(tokenData) {
    // Store in memory (primary)
    if (tokenData.accessToken) {
      this.memoryStore.accessToken = tokenData.accessToken;
    }
    if (tokenData.refreshToken) {
      this.memoryStore.refreshToken = tokenData.refreshToken;
    }
    if (tokenData.expiresIn) {
      this.memoryStore.tokenExpiry = Date.now() + tokenData.expiresIn * 1000;
    }

    // Optional localStorage fallback (UX only - NOT SECURE)
    // WARNING: This does NOT protect against XSS. Any attacker with JS access can read these.
    // Consider setting USE_STORAGE_FALLBACK = false to disable entirely
    if (this.USE_STORAGE_FALLBACK) {
      try {
        if (tokenData.accessToken) {
          localStorage.setItem('_at', this._obfuscate(tokenData.accessToken));
        }
        if (tokenData.refreshToken) {
          localStorage.setItem('_rt', this._obfuscate(tokenData.refreshToken));
        }
        if (tokenData.expiresIn) {
          const expiry = Date.now() + tokenData.expiresIn * 1000;
          localStorage.setItem('_te', expiry.toString());
        }
      } catch (error) {
        // Silently fail if localStorage is unavailable
        if (import.meta.env.DEV) {
          console.warn('Failed to store tokens in localStorage:', error);
        }
      }
    }

    this._resetSessionTimeout();
  }

  getAccessToken() {
    // Try memory first
    if (this.memoryStore.accessToken) {
      return this.memoryStore.accessToken;
    }

    // Fallback to localStorage (if enabled)
    if (this.USE_STORAGE_FALLBACK) {
      try {
        const stored = localStorage.getItem('_at');
        if (stored) {
          const token = this._deobfuscate(stored);
          if (token) {
            this.memoryStore.accessToken = token;
            return token;
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to retrieve access token:', error);
        }
      }
    }

    return null;
  }

  getRefreshToken() {
    // Try memory first
    if (this.memoryStore.refreshToken) {
      return this.memoryStore.refreshToken;
    }

    // Fallback to localStorage (if enabled)
    if (this.USE_STORAGE_FALLBACK) {
      try {
        const stored = localStorage.getItem('_rt');
        if (stored) {
          const token = this._deobfuscate(stored);
          if (token) {
            this.memoryStore.refreshToken = token;
            return token;
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to retrieve refresh token:', error);
        }
      }
    }

    return null;
  }

  clear() {
    // Clear memory
    this.memoryStore.accessToken = null;
    this.memoryStore.refreshToken = null;
    this.memoryStore.tokenExpiry = null;

    // Clear localStorage
    try {
      localStorage.removeItem('_at');
      localStorage.removeItem('_rt');
      localStorage.removeItem('_te');
      // Legacy cleanup
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
    } catch (error) {
      // Silently fail
    }

    // Clear session storage
    try {
      sessionStorage.clear();
    } catch (error) {
      // Silently fail
    }

    // Clear timeout
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  isTokenExpired() {
    const expiry = this.memoryStore.tokenExpiry;
    if (!expiry && this.USE_STORAGE_FALLBACK) {
      try {
        const stored = localStorage.getItem('_te');
        if (stored) {
          const expiryTime = parseInt(stored, 10);
          if (!isNaN(expiryTime)) {
            this.memoryStore.tokenExpiry = expiryTime;
            return Date.now() >= expiryTime;
          }
        }
      } catch (error) {
        return true;
      }
      return true;
    }
    return Date.now() >= expiry;
  }
}

/**
 * Authentication service for handling multi-tenant OAuth authentication
 */
class AuthService {
  constructor() {
    this.API_URL = `${API_BASE_URL}/api/auth`;
    this.tokenStorage = new SecureTokenStorage();
  }

  /**
   * Get list of available OAuth providers for a tenant
   * @param {string} tenantId - The tenant identifier
   * @returns {Promise<Array>} List of provider configurations
   */
  async getTenantProviders(tenantId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        let errorMessage;
        
        switch (response.status) {
          case 404:
            errorMessage = 'OAuth providers endpoint not found. Please check your tenant configuration.';
            break;
          case 401:
            errorMessage = 'Unauthorized access to OAuth providers.';
            break;
          case 403:
            errorMessage = 'Access to OAuth providers is forbidden.';
            break;
          case 500:
            errorMessage = 'Server error while fetching OAuth providers. Please try again later.';
            break;
          case 503:
            errorMessage = 'OAuth provider service is temporarily unavailable.';
            break;
          default:
            errorMessage = `Failed to fetch OAuth providers: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.providers || [];
    } catch (error) {
      console.error('Error fetching tenant providers:', error);
      throw error;
    }
  }

  /**
   * Start external OAuth login flow
   * @param {string} tenantId - The tenant identifier
   * @param {string} providerName - OAuth provider name (microsoft, google, github)
   * @returns {Promise<string>} Authorization URL to redirect user to
   */
  async startExternalLogin(tenantId, providerName) {
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const state = this._generateRandomState();

      const response = await fetch(`${this.API_URL}/external/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          providerName,
          redirectUri,
          state,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start login');
      }

      const data = await response.json();
      
      // Store state in session for validation
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_tenant', tenantId);
      sessionStorage.setItem('oauth_provider', providerName);

      return data.authUrl;
    } catch (error) {
      console.error('Error starting external login:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   * @param {string} code - Authorization code from OAuth provider
   * @param {string} state - State parameter for CSRF protection
   * @returns {Promise<Object>} Authentication result with tokens
   */
  async handleCallback(code, state) {
    try {
      // Validate state
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Exchange code for one-time code
      const callbackResponse = await fetch(
        `${this.API_URL}/external/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!callbackResponse.ok) {
        const errorData = await callbackResponse.json();
        throw new Error(errorData.error || 'Callback failed');
      }

      const callbackData = await callbackResponse.json();

      if (!callbackData.success) {
        throw new Error(callbackData.error || 'Authentication failed');
      }

      // Exchange one-time code for tokens
      const tokenResponse = await fetch(`${this.API_URL}/external/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oneTimeCode: callbackData.oneTimeCode,
          userId: callbackData.userId,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || 'Token exchange failed');
      }

      const tokenData = await tokenResponse.json();

      // Store tokens securely
      this._storeTokens(tokenData);

      // Clear OAuth session data
      sessionStorage.removeItem('oauth_state');
      const tenantId = sessionStorage.getItem('oauth_tenant');
      const providerName = sessionStorage.getItem('oauth_provider');
      sessionStorage.removeItem('oauth_tenant');
      sessionStorage.removeItem('oauth_provider');

      return {
        success: true,
        user: {
          id: callbackData.userId,
          tenantId: tenantId,
          provider: providerName,
        },
        tokens: tokenData,
      };
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<Object>} New token set
   */
  async refreshToken() {
    try {
      const refreshToken = this.tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.API_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this._storeTokens(data);

      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error refreshing token:', error);
      }
      this.logout();
      throw error;
    }
  }

  /**
   * Get current access token
   * @returns {string|null} Access token or null if not authenticated
   */
  getAccessToken() {
    return this.tokenStorage.getAccessToken();
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has valid token
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    if (this.tokenStorage.isTokenExpired()) {
      return false;
    }

    const tokenData = this._decodeToken(token);
    if (!tokenData) return false;

    const now = Date.now() / 1000;
    return tokenData.exp > now;
  }

  /**
   * Get current user information from token
   * @returns {Object|null} User information or null
   */
  getCurrentUser() {
    const token = this.getAccessToken();
    if (!token) return null;

    const tokenData = this._decodeToken(token);
    if (!tokenData) return null;

    return {
      id: tokenData.sub || tokenData.userId,
      email: tokenData.email,
      tenantId: tokenData.tenantId,
      roles: tokenData.roles || [],
      licenseTier: tokenData.licenseTier || tokenData.license_tier || 'community',
      tenantName: tokenData.tenantName || tokenData.tenant_name,
    };
  }

  /**
   * Logout user and clear stored tokens
   */
  logout() {
    this.tokenStorage.clear();
  }

  /**
   * Register a new tenant with an admin user
   * @param {Object} tenantData - Tenant registration data
   * @returns {Promise<Object>} Registration result
   */
  async registerTenant(tenantData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantName: tenantData.tenantName,
          adminEmail: tenantData.adminEmail,
          adminPassword: tenantData.adminPassword,
          displayName: tenantData.displayName,
          description: tenantData.description,
          contactEmail: tenantData.contactEmail || tenantData.adminEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register tenant');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error registering tenant:', error);
      throw error;
    }
  }

  /**
   * Get list of all tenants (requires authentication)
   * @returns {Promise<Array>} List of tenants
   */
  async listTenants() {
    try {
      const response = await this.authenticatedFetch(`${API_BASE_URL}/api/tenants`);

      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }

      const data = await response.json();
      return data.tenants || [];
    } catch (error) {
      console.error('Error listing tenants:', error);
      throw error;
    }
  }

  /**
   * Get tenant by name
   * @param {string} name - Tenant name
   * @returns {Promise<Object>} Tenant information
   */
  async getTenantByName(name) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/by-name/${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Tenant not found');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching tenant by name:', error);
      throw error;
    }
  }

  /**
   * Login with local account (email and password)
   * @param {string} tenantId - The tenant identifier
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication result with tokens
   */
  async loginLocalAccount(tenantId, email, password) {
    try {
      const response = await fetch(`${this.API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid credentials');
      }

      const data = await response.json();

      // Store tokens securely
      this._storeTokens(data);

      return {
        success: true,
        user: {
          id: data.userId,
          tenantId: tenantId,
          email: email,
        },
        tokens: data,
      };
    } catch (error) {
      console.error('Error logging in with local account:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request with automatic token refresh
   * Supports both current JWT (Authorization header) and future httpOnly cookies
   * 
   * Migration Notes:
   * - Currently uses JWT in Authorization header
   * - After cookie migration: removes Authorization header, relies on httpOnly cookies
   * - CSRF protection via X-CSRF-Token header (defense in depth)
   * 
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async authenticatedFetch(url, options = {}) {
    // Get CSRF token if available (for cookie-based auth or defense in depth)
    const csrfToken = this._getCsrfToken();
    
    // Check if we're using JWT (current) or cookies (future)
    const token = this.getAccessToken();
    const usingJWT = !!token;
    
    if (usingJWT) {
      // Current: JWT-based authentication
      
      // Check if token needs refresh
      if (!this.isAuthenticated()) {
        try {
          await this.refreshToken();
        } catch (error) {
          throw new Error('Authentication required - please log in again');
        }
      }

      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.getAccessToken()}`,
        'Content-Type': 'application/json',
      };
      
      // Add CSRF token if available (defense in depth)
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      return fetch(url, { 
        ...options, 
        headers,
        // Include credentials for future cookie support
        credentials: 'include',
      });
    } else {
      // Future: httpOnly cookie-based authentication
      // No Authorization header - cookies sent automatically by browser
      
      const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
      };
      
      // CSRF protection REQUIRED for cookie-based auth
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      } else if (import.meta.env.DEV) {
        console.warn('CSRF token not found - request may fail if backend requires it');
      }

      const response = await fetch(url, { 
        ...options, 
        headers,
        credentials: 'include', // Send httpOnly cookies
      });

      // Handle 401 - attempt token refresh via cookie
      if (response.status === 401 && !options._isRetry) {
        try {
          const refreshed = await this._refreshWithCookie();
          if (refreshed) {
            // Retry original request once
            return this.authenticatedFetch(url, { ...options, _isRetry: true });
          }
        } catch (error) {
          // Refresh failed
          this.logout();
          throw new Error('Session expired - please log in again');
        }
      }

      return response;
    }
  }

  /**
   * Refresh token using httpOnly cookie (for cookie-based auth)
   * @private
   * @returns {Promise<boolean>} True if refresh succeeded
   */
  async _refreshWithCookie() {
    try {
      const csrfToken = this._getCsrfToken();
      const headers = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(`${this.API_URL}/refresh`, {
        method: 'POST',
        credentials: 'include', // Sends refresh_token cookie
        headers,
      });
      
      return response.ok;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Cookie-based refresh failed:', error);
      }
      return false;
    }
  }

  // Private helper methods

  _storeTokens(tokenData) {
    this.tokenStorage.setTokens(tokenData);
  }

  _decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  _generateRandomState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get CSRF token from cookie (double-submit pattern)
   * Used when migrated to httpOnly cookies
   * @returns {string|null} CSRF token or null
   */
  _getCsrfToken() {
    try {
      const cookies = document.cookie.split(';');
      // Look for __Host-csrf cookie (preferred) or fallback names
      const csrfCookie = cookies.find(c => {
        const trimmed = c.trim();
        return trimmed.startsWith('__Host-csrf=') || 
               trimmed.startsWith('csrf=') ||
               trimmed.startsWith('XSRF-TOKEN=');
      });
      
      if (csrfCookie) {
        const token = csrfCookie.split('=')[1];
        return decodeURIComponent(token);
      }
      
      return null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to extract CSRF token:', error);
      }
      return null;
    }
  }
}

export default new AuthService();
