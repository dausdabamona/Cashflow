/**
 * App Store - Simple State Management
 * File: web/js/store/appStore.js
 */
const AppStore = {
  // State
  state: {
    user: null,
    accounts: [],
    categories: [],
    transactions: [],
    isLoading: false,
    currentPage: 'dashboard'
  },

  // Listeners
  listeners: [],

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  },

  /**
   * Update state
   * @param {Object} updates - State updates
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  },

  /**
   * Subscribe to state changes
   * @param {Function} listener - Listener function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  },

  /**
   * Get current user ID
   * @returns {string|null} User ID or null
   */
  getUserId() {
    return this.state.user?.id || null;
  },

  /**
   * Set current user
   * @param {Object} user - User object
   */
  setUser(user) {
    this.setState({ user });
    window.currentUser = user;
  },

  /**
   * Set loading state
   * @param {boolean} isLoading - Loading state
   */
  setLoading(isLoading) {
    this.setState({ isLoading });
  },

  /**
   * Clear all state (logout)
   */
  clear() {
    this.state = {
      user: null,
      accounts: [],
      categories: [],
      transactions: [],
      isLoading: false,
      currentPage: 'dashboard'
    };
    window.currentUser = null;
    this.notifyListeners();
  }
};

window.AppStore = AppStore;

console.log('✅ AppStore loaded');
