const BaseService = {
  getClient() {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase client not initialized');
    return client;
  },

  getUserId() {
    return window.AppStore?.getUserId() || window.currentUser?.id || null;
  },

  getToday() {
    return new Date().toISOString().split('T')[0];
  },

  getCurrentMonth() {
    return new Date().getMonth() + 1;
  },

  getCurrentYear() {
    return new Date().getFullYear();
  }
};

window.BaseService = BaseService;
console.log('✅ BaseService loaded');
