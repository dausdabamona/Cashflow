var AccountService = {
  tableName: 'accounts',
  
  getAll: async function() {
    try {
      var userId = BaseService.getUserId();
      if (!userId) return [];
      
      var result = await BaseService.getClient()
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      console.error('[AccountService.getAll]', error);
      return [];
    }
  },
  
  getById: async function(id) {
    try {
      var result = await BaseService.getClient()
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('[AccountService.getById]', error);
      return null;
    }
  },
  
  create: async function(accountData) {
    try {
      var userId = BaseService.getUserId();
      var result = await BaseService.getClient()
        .from('accounts')
        .insert({
          user_id: userId,
          name: accountData.name,
          type: accountData.type || 'cash',
          bank_name: accountData.bank_name || null,
          icon: accountData.icon || 'wallet',
          color: accountData.color || '#6B7280',
          opening_balance: accountData.opening_balance || 0,
          current_balance: accountData.opening_balance || 0,
          display_order: accountData.display_order || 0,
          is_active: true
        })
        .select()
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('[AccountService.create]', error);
      return null;
    }
  },
  
  update: async function(id, updates) {
    try {
      var result = await BaseService.getClient()
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('[AccountService.update]', error);
      return null;
    }
  },
  
  getTotalBalance: async function() {
    var accounts = await this.getAll();
    var total = 0;
    for (var i = 0; i < accounts.length; i++) {
      if (!accounts[i].is_excluded_from_total) {
        total += parseFloat(accounts[i].current_balance) || 0;
      }
    }
    return total;
  }
};

window.AccountService = AccountService;
console.log('✅ AccountService loaded (object literal)');
