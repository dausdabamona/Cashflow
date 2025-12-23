const AccountService = {
  tableName: 'accounts',

  async getAll() {
    try {
      const userId = BaseService.getUserId();
      if (!userId) return [];

      const { data, error } = await BaseService.getClient()
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[AccountService.getAll]', error);
      return [];
    }
  },

  async getById(id) {
    try {
      const { data, error } = await BaseService.getClient()
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[AccountService.getById]', error);
      return null;
    }
  },

  async create(accountData) {
    try {
      const userId = BaseService.getUserId();
      const { data, error } = await BaseService.getClient()
        .from(this.tableName)
        .insert({ ...accountData, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[AccountService.create]', error);
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
      console.error('[AccountService.update]', error);
      return null;
    }
  },

  async getTotalBalance() {
    const accounts = await this.getAll();
    return accounts
      .filter(a => !a.is_excluded_from_total)
      .reduce((sum, a) => sum + (parseFloat(a.current_balance) || 0), 0);
  }
};

window.AccountService = AccountService;
console.log('✅ AccountService loaded');
