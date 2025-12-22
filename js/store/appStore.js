/**
 * Application Store
 * Centralized State Management untuk Cashflow Tracker
 */

const AppStore = {
  // ================== STATE ==================
  state: {
    // User
    user: null,

    // Data
    accounts: [],
    categories: [],
    transactions: [],
    loans: [],
    items: [],

    // Dashboard Data
    dashboard: {
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      healthScore: 0,
      kiyosakiStatus: null,
      recentTransactions: [],
      budgetStatus: []
    },

    // UI State
    ui: {
      loading: false,
      currentPage: 'dashboard',
      selectedPeriod: 'month',
      filters: {}
    }
  },

  // ================== CACHE ==================
  _cache: {
    accounts: null,
    categories: null,
    transactions: null,
    dashboard: null
  },

  _cacheTimestamps: {
    accounts: 0,
    categories: 0,
    transactions: 0,
    dashboard: 0
  },

  // Cache TTL dari constants (5 menit default)
  get CACHE_TTL() {
    return window.APP_CONSTANTS?.CACHE_TTL || 5 * 60 * 1000;
  },

  // ================== CACHE METHODS ==================

  /**
   * Cek apakah cache masih valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  isCacheValid(key) {
    const timestamp = this._cacheTimestamps[key];
    if (!timestamp) return false;
    return (Date.now() - timestamp) < this.CACHE_TTL;
  },

  /**
   * Set cache dengan timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCache(key, data) {
    this._cache[key] = data;
    this._cacheTimestamps[key] = Date.now();
  },

  /**
   * Get cached data jika masih valid
   * @param {string} key - Cache key
   * @returns {any|null}
   */
  getCache(key) {
    if (this.isCacheValid(key)) {
      return this._cache[key];
    }
    return null;
  },

  /**
   * Clear semua cache
   */
  clearCache() {
    this._cache = {
      accounts: null,
      categories: null,
      transactions: null,
      dashboard: null
    };
    this._cacheTimestamps = {
      accounts: 0,
      categories: 0,
      transactions: 0,
      dashboard: 0
    };
    ErrorHandler.debug('Cache cleared');
  },

  /**
   * Invalidate cache tertentu
   * @param {string} key - Cache key to invalidate
   */
  invalidateCache(key) {
    if (this._cache.hasOwnProperty(key)) {
      this._cache[key] = null;
      this._cacheTimestamps[key] = 0;
      ErrorHandler.debug(`Cache invalidated: ${key}`);
    }
  },

  // ================== INITIALIZATION ==================

  /**
   * Initialize store
   * @param {Object} user - User object from auth
   */
  init(user) {
    this.state.user = user;
    this.clearCache();
    ErrorHandler.info('AppStore initialized for user:', user?.email);
  },

  /**
   * Reset store ke initial state
   */
  reset() {
    this.state = {
      user: null,
      accounts: [],
      categories: [],
      transactions: [],
      loans: [],
      items: [],
      dashboard: {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        healthScore: 0,
        kiyosakiStatus: null,
        recentTransactions: [],
        budgetStatus: []
      },
      ui: {
        loading: false,
        currentPage: 'dashboard',
        selectedPeriod: 'month',
        filters: {}
      }
    };
    this.clearCache();
    ErrorHandler.info('AppStore reset');
  },

  // ================== SETTERS ==================

  /**
   * Set accounts data
   * @param {Array} accounts
   */
  setAccounts(accounts) {
    this.state.accounts = accounts || [];
    this.setCache('accounts', this.state.accounts);
    this.notify('accounts', this.state.accounts);
  },

  /**
   * Set categories data
   * @param {Array} categories
   */
  setCategories(categories) {
    this.state.categories = categories || [];
    this.setCache('categories', this.state.categories);
    this.notify('categories', this.state.categories);
  },

  /**
   * Set transactions data
   * @param {Array} transactions
   */
  setTransactions(transactions) {
    this.state.transactions = transactions || [];
    this.setCache('transactions', this.state.transactions);
    this.notify('transactions', this.state.transactions);
  },

  /**
   * Set loans data
   * @param {Array} loans
   */
  setLoans(loans) {
    this.state.loans = loans || [];
    this.notify('loans', this.state.loans);
  },

  /**
   * Set items data
   * @param {Array} items
   */
  setItems(items) {
    this.state.items = items || [];
    this.notify('items', this.state.items);
  },

  /**
   * Set dashboard data
   * @param {Object} dashboardData
   */
  setDashboard(dashboardData) {
    this.state.dashboard = { ...this.state.dashboard, ...dashboardData };
    this.setCache('dashboard', this.state.dashboard);
    this.notify('dashboard', this.state.dashboard);
  },

  /**
   * Set UI state
   * @param {Object} uiState
   */
  setUI(uiState) {
    this.state.ui = { ...this.state.ui, ...uiState };
    this.notify('ui', this.state.ui);
  },

  /**
   * Set loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    this.state.ui.loading = loading;
    this.notify('loading', loading);
  },

  // ================== GETTERS ==================

  /**
   * Get current user
   * @returns {Object|null}
   */
  getUser() {
    return this.state.user;
  },

  /**
   * Get user ID
   * @returns {string|null}
   */
  getUserId() {
    return this.state.user?.id || null;
  },

  /**
   * Get all accounts
   * @returns {Array}
   */
  getAccounts() {
    return this.state.accounts;
  },

  /**
   * Get account by ID
   * @param {string} id
   * @returns {Object|undefined}
   */
  getAccountById(id) {
    return this.state.accounts.find(a => a.id === id);
  },

  /**
   * Get accounts by type
   * @param {string} type
   * @returns {Array}
   */
  getAccountsByType(type) {
    return this.state.accounts.filter(a => a.type === type);
  },

  /**
   * Get total balance across all accounts
   * @returns {number}
   */
  getTotalBalance() {
    return this.state.accounts.reduce((sum, acc) => {
      return sum + Validator.currency(acc.current_balance, 0);
    }, 0);
  },

  /**
   * Get all categories
   * @returns {Array}
   */
  getCategories() {
    return this.state.categories;
  },

  /**
   * Get category by ID
   * @param {string} id
   * @returns {Object|undefined}
   */
  getCategoryById(id) {
    return this.state.categories.find(c => c.id === id);
  },

  /**
   * Get categories by type (income/expense)
   * @param {string} type
   * @returns {Array}
   */
  getCategoriesByType(type) {
    return this.state.categories.filter(c => c.type === type);
  },

  /**
   * Get all transactions
   * @returns {Array}
   */
  getTransactions() {
    return this.state.transactions;
  },

  /**
   * Get transactions by type
   * @param {string} type - income, expense, transfer
   * @returns {Array}
   */
  getTransactionsByType(type) {
    return this.state.transactions.filter(t => t.type === type);
  },

  /**
   * Get transactions for a specific date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Array}
   */
  getTransactionsByDateRange(startDate, endDate) {
    return this.state.transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= startDate && txDate <= endDate;
    });
  },

  /**
   * Get transactions for current month
   * @returns {Array}
   */
  getMonthlyTransactions() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return this.getTransactionsByDateRange(startOfMonth, endOfMonth);
  },

  /**
   * Get all items
   * @returns {Array}
   */
  getItems() {
    return this.state.items;
  },

  /**
   * Get items by type
   * @param {string} type - asset, liability, consumable, idle
   * @returns {Array}
   */
  getItemsByType(type) {
    return this.state.items.filter(i => i.type === type);
  },

  /**
   * Get all loans
   * @returns {Array}
   */
  getLoans() {
    return this.state.loans;
  },

  /**
   * Get active loans
   * @returns {Array}
   */
  getActiveLoans() {
    return this.state.loans.filter(l => l.status === 'active');
  },

  /**
   * Get dashboard data
   * @returns {Object}
   */
  getDashboard() {
    return this.state.dashboard;
  },

  /**
   * Get UI state
   * @returns {Object}
   */
  getUI() {
    return this.state.ui;
  },

  /**
   * Check if currently loading
   * @returns {boolean}
   */
  isLoading() {
    return this.state.ui.loading;
  },

  // ================== REACTIVE LISTENERS ==================

  _listeners: {},

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    this._listeners[key].push(callback);

    // Return unsubscribe function
    return () => {
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    };
  },

  /**
   * Notify listeners of state change
   * @param {string} key - State key that changed
   * @param {any} data - New data
   */
  notify(key, data) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          ErrorHandler.error('Listener error:', error);
        }
      });
    }
  },

  // ================== COMPUTED VALUES ==================

  /**
   * Calculate monthly income
   * @returns {number}
   */
  calculateMonthlyIncome() {
    return this.getMonthlyTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Validator.currency(t.amount, 0), 0);
  },

  /**
   * Calculate monthly expense
   * @returns {number}
   */
  calculateMonthlyExpense() {
    return this.getMonthlyTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Validator.currency(t.amount, 0), 0);
  },

  /**
   * Calculate net cashflow for current month
   * @returns {number}
   */
  calculateMonthlyCashflow() {
    return this.calculateMonthlyIncome() - this.calculateMonthlyExpense();
  },

  /**
   * Get passive income total
   * @returns {number}
   */
  calculatePassiveIncome() {
    return this.getMonthlyTransactions()
      .filter(t => t.type === 'income' && t.income_type === 'passive')
      .reduce((sum, t) => sum + Validator.currency(t.amount, 0), 0);
  },

  /**
   * Get passive expense (loans, subscriptions, etc.)
   * @returns {number}
   */
  calculatePassiveExpense() {
    // Get from loans
    const loanExpense = this.getActiveLoans()
      .reduce((sum, l) => sum + Validator.currency(l.monthly_payment, 0), 0);

    // Could add recurring expenses here
    return loanExpense;
  },

  /**
   * Calculate Kiyosaki status
   * @returns {Object}
   */
  calculateKiyosakiStatus() {
    const passiveIncome = this.calculatePassiveIncome();
    const passiveExpense = this.calculatePassiveExpense();
    return Formatter.kiyosakiStatus(passiveIncome, passiveExpense);
  }
};

// Export global
window.AppStore = AppStore;

// Debug helper
if (window.location.hostname === 'localhost' || localStorage.getItem('debug') === 'true') {
  window._store = AppStore; // Easy access for debugging
}
