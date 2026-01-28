/* Copyright Notice
SPDX-FileCopyrightText: 2025 Observes io LTD
SPDX-License-Identifier: LicenseRef-PolyForm-Internal-Use-1.0.0

Copyright (c) 2025 Observes io LTD, Scotland, Company No. SC864704
Licensed under PolyForm Internal Use 1.0.0, see LICENSE or https://polyformproject.org/licenses/internal-use/1.0.0
Internal use only; additional clarifications in LICENSE-CLARIFICATIONS.md
*/

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:45791';

/**
 * Authentication service for handling multi-tenant OAuth authentication
 */
class AuthService {
  constructor() {
    this.API_URL = `${API_BASE_URL}/api/auth`;
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
      const refreshToken = localStorage.getItem('refresh_token');
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
      console.error('Error refreshing token:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Get current access token
   * @returns {string|null} Access token or null if not authenticated
   */
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has valid token
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    sessionStorage.clear();
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
   * Make authenticated API request
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async authenticatedFetch(url, options = {}) {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Check if token needs refresh
    if (!this.isAuthenticated()) {
      await this.refreshToken();
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.getAccessToken()}`,
      'Content-Type': 'application/json',
    };

    return fetch(url, { ...options, headers });
  }

  // Private helper methods

  _storeTokens(tokenData) {
    if (tokenData.accessToken) {
      localStorage.setItem('access_token', tokenData.accessToken);
    }
    if (tokenData.refreshToken) {
      localStorage.setItem('refresh_token', tokenData.refreshToken);
    }
    if (tokenData.expiresIn) {
      const expiry = Date.now() + tokenData.expiresIn * 1000;
      localStorage.setItem('token_expiry', expiry.toString());
    }
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
}

export default new AuthService();
