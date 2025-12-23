/**
 * Base Service - Foundation for all services
 * @type {Object}
 */
var BaseService = {

  getClient: function() {
    if (!window.supabaseClient) {
      console.error('Supabase client not initialized!');
      return null;
    }
    return window.supabaseClient;
  },

  getUserId: function() {
    // Try multiple sources
    if (window.currentUser && window.currentUser.id) {
      return window.currentUser.id;
    }
    if (window.AppStore && typeof window.AppStore.getUserId === 'function') {
      return window.AppStore.getUserId();
    }
    if (window.AppStore && window.AppStore.state && window.AppStore.state.user) {
      return window.AppStore.state.user.id;
    }
    return null;
  },

  getToday: function() {
    return new Date().toISOString().split('T')[0];
  },

  getCurrentMonth: function() {
    return new Date().getMonth() + 1;
  },

  getCurrentYear: function() {
    return new Date().getFullYear();
  },

  formatCurrency: function(amount) {
    var num = parseFloat(amount) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
  }
};

// Export to window
window.BaseService = BaseService;
console.log('✅ BaseService loaded successfully');
