var TransactionService = {
  tableName: 'transactions',
  
  getAll: async function(options) {
    options = options || {};
    try {
      var userId = BaseService.getUserId();
      if (!userId) return [];
      
      var query = BaseService.getClient()
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (options.startDate) query = query.gte('date', options.startDate);
      if (options.endDate) query = query.lte('date', options.endDate);
      if (options.type) query = query.eq('type', options.type);
      if (options.itemId) query = query.eq('item_id', options.itemId);
      if (options.limit) query = query.limit(options.limit);
      
      var result = await query;
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      console.error('[TransactionService.getAll]', error);
      return [];
    }
  },
  
  getMonthly: async function(month, year) {
    var m = month || BaseService.getCurrentMonth();
    var y = year || BaseService.getCurrentYear();
    var startDate = y + '-' + String(m).padStart(2, '0') + '-01';
    var lastDay = new Date(y, m, 0).getDate();
    var endDate = y + '-' + String(m).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
    return this.getAll({ startDate: startDate, endDate: endDate });
  },
  
  getByItem: async function(itemId) {
    return this.getAll({ itemId: itemId });
  },
  
  getRecent: async function(limit) {
    return this.getAll({ limit: limit || 5 });
  },
  
  create: async function(data) {
    try {
      var userId = BaseService.getUserId();
      var result = await BaseService.getClient()
        .from('transactions')
        .insert({
          user_id: userId,
          type: data.type,
          amount: data.amount,
          account_id: data.account_id || null,
          category_id: data.category_id || null,
          date: data.date || BaseService.getToday(),
          description: data.description || null,
          income_type: data.income_type || null,
          item_id: data.item_id || null,
          loan_id: data.loan_id || null
        })
        .select()
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('[TransactionService.create]', error);
      return null;
    }
  },
  
  update: async function(id, updates) {
    try {
      var result = await BaseService.getClient()
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('[TransactionService.update]', error);
      return null;
    }
  },
  
  delete: async function(id) {
    try {
      var result = await BaseService.getClient()
        .from('transactions')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (result.error) throw result.error;
      return true;
    } catch (error) {
      console.error('[TransactionService.delete]', error);
      return false;
    }
  },
  
  getSummary: function(transactions) {
    var income = 0, expense = 0, passiveIncome = 0;
    for (var i = 0; i < transactions.length; i++) {
      var t = transactions[i];
      var amount = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        income += amount;
        if (t.income_type === 'passive') passiveIncome += amount;
      } else if (t.type === 'expense') {
        expense += amount;
      }
    }
    return { income: income, expense: expense, passiveIncome: passiveIncome, net: income - expense };
  }
};

window.TransactionService = TransactionService;
console.log('✅ TransactionService loaded (object literal)');
