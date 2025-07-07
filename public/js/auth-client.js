class AuthClient {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (result.success !== false) {
        this.setTokens(result);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async register(email, password, displayName) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async refreshTokens() {
    if (!this.refreshToken) return false;
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      const result = await response.json();
      if (result.success) {
        this.accessToken = result.data.accessToken;
        this.refreshToken = result.data.refreshToken;
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async logout() {
    if (this.accessToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        // ignore
      }
    }
    this.clearTokens();
  }

  setTokens(data) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.user = data.user;
    localStorage.setItem('accessToken', this.accessToken);
    localStorage.setItem('refreshToken', this.refreshToken);
    localStorage.setItem('user', JSON.stringify(this.user));
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getAuthHeader() {
    return this.accessToken ? `Bearer ${this.accessToken}` : null;
  }

  isAuthenticated() {
    return !!this.accessToken && !!this.user;
  }

  startTokenRefreshTimer() {
    setInterval(async () => {
      if (this.isAuthenticated()) {
        await this.refreshTokens();
      }
    }, 14 * 60 * 1000);
  }
}

// Make AuthClient available globally
window.AuthClient = AuthClient;
window.authClient = new AuthClient();
window.authClient.startTokenRefreshTimer();
