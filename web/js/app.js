/**
 * Main Application
 * File: web/js/app.js
 */
const App = {
  /**
   * Initialize the application
   */
  async init() {
    console.log('🚀 Cashflow Tracker v2.0 starting...');

    // Debug: Check all services loaded
    this.checkServices();

    // Check authentication
    const isAuthenticated = await this.checkAuth();

    if (isAuthenticated) {
      await this.loadApp();
    } else {
      this.showLogin();
    }
  },

  /**
   * Check if all services are loaded
   */
  checkServices() {
    console.log('=== SERVICE CHECK ===');
    console.log('BaseService:', typeof BaseService);
    console.log('AccountService:', typeof AccountService);
    console.log('CategoryService:', typeof CategoryService);
    console.log('TransactionService:', typeof TransactionService);
    console.log('DashboardService:', typeof DashboardService);

    // Verify methods exist
    if (typeof AccountService !== 'undefined') {
      console.log('AccountService.getAll:', typeof AccountService.getAll);
    } else {
      console.error('❌ AccountService NOT LOADED!');
    }
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>}
   */
  async checkAuth() {
    try {
      if (!window.supabaseClient) {
        console.warn('Supabase client not initialized');
        return false;
      }

      const { data: { session } } = await window.supabaseClient.auth.getSession();

      if (session?.user) {
        AppStore.setUser(session.user);
        console.log('✅ User authenticated:', session.user.email);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  },

  /**
   * Load main application
   */
  async loadApp() {
    console.log('[App] Loading main application...');

    // Show main content
    document.getElementById('app-container')?.classList.remove('hidden');
    document.getElementById('login-container')?.classList.add('hidden');

    // Initialize dashboard
    await Dashboard.init();
  },

  /**
   * Show login screen
   */
  showLogin() {
    console.log('[App] Showing login screen');

    document.getElementById('app-container')?.classList.add('hidden');
    document.getElementById('login-container')?.classList.remove('hidden');
  },

  /**
   * Handle login
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async login(email, password) {
    try {
      Loading.show('Logging in...');

      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      AppStore.setUser(data.user);
      Toast.success('Login berhasil!');

      await this.loadApp();

    } catch (error) {
      Toast.error(error.message || 'Login gagal');
    } finally {
      Loading.hide();
    }
  },

  /**
   * Handle logout
   */
  async logout() {
    try {
      await window.supabaseClient.auth.signOut();
      AppStore.clear();
      Toast.info('Logged out');
      this.showLogin();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;

console.log('✅ App loaded');
