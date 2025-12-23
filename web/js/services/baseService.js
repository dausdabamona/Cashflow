var BaseService = {
  getClient: function() {
    var client = window.supabaseClient;
    if (!client) throw new Error('Supabase client not initialized');
    return client;
  },
  
  getUserId: function() {
    if (window.AppStore && window.AppStore.getUserId) {
      return window.AppStore.getUserId();
    }
    if (window.currentUser && window.currentUser.id) {
      return window.currentUser.id;
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
  }
};

window.BaseService = BaseService;
console.log('✅ BaseService loaded (object literal)');
