const TransactionService = {
  tableName: 'transactions',

  async getAll(options = {}) {
    try {
      const userId = BaseService.getUserId();
      if (!userId) return [];

      let query = BaseService.getClient()
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (options.startDate) query = query.gte('date', options.startDate);
      if (options.endDate) query = query.lte('date', options.endDate);
      if (options.type) query = query.eq('type', options.type);
      if (options.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[TransactionService.getAll]', error);
      return [];
    }
  },

  async getMonthly(month, year) {
    const m = month || BaseService.getCurrentMonth();
    const y = year || BaseService.getCurrentYear();
    const startDate = y + '-' + String(m).padStart(2, '0') + '-01';
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = y + '-' + String(m).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
    return this.getAll({ startDate, endDate });
  },

  async getRecent(limit = 5) {
    return this.getAll({ limit });
  },

  async create(data) {
    try {
      const userId = BaseService.getUserId();
      const { data: result, error } = await BaseService.getClient()
        .from(this.tableName)
        .insert({ ...data, user_id: userId, date: data.date || BaseService.getToday() })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('[TransactionService.create]', error);
      return null;
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await BaseService.getClient()
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[TransactionService.update]', error);
      return null;
    }
  },

  async delete(id) {
    try {
      const { error } = await BaseService.getClient()
        .from(this.tableName)
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[TransactionService.delete]', error);
      return false;
    }
  },

  getSummary(transactions) {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const passiveIncome = transactions.filter(t => t.type === 'income' && t.income_type === 'passive').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return { income, expense, passiveIncome, net: income - expense };
  }
};

window.TransactionService = TransactionService;
console.log('✅ TransactionService loaded');
