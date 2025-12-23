const ItemService = {
  tableName: 'items',

  async getAll() {
    try {
      var userId = BaseService.getUserId();
      if (!userId) return [];

      const { data, error } = await BaseService.getClient()
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('acquired_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ItemService.getAll]', error);
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
      console.error('[ItemService.getById]', error);
      return null;
    }
  },

  async getActive() {
    try {
      var userId = BaseService.getUserId();
      if (!userId) return [];

      const { data, error } = await BaseService.getClient()
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_sold', false)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ItemService.getActive]', error);
      return [];
    }
  },

  async create(itemData) {
    try {
      var userId = BaseService.getUserId();
      const { data, error } = await BaseService.getClient()
        .from(this.tableName)
        .insert({
          user_id: userId,
          name: itemData.name,
          description: itemData.description || null,
          type: itemData.type,
          acquired_date: itemData.acquired_date || BaseService.getToday(),
          acquired_via: itemData.acquired_via || 'purchase',
          purchase_value: itemData.purchase_value || 0,
          current_value: itemData.current_value || itemData.purchase_value || 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ItemService.create]', error);
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
      console.error('[ItemService.update]', error);
      return null;
    }
  },

  async getItemAnalysis(itemId) {
    try {
      var item = await this.getById(itemId);
      if (!item) return null;

      var transactions = await TransactionService.getByItem(itemId);

      var totalExpense = 0;
      var totalIncome = 0;

      for (var i = 0; i < transactions.length; i++) {
        var t = transactions[i];
        var amount = parseFloat(t.amount) || 0;
        if (t.type === 'expense') totalExpense += amount;
        if (t.type === 'income') totalIncome += amount;
      }

      var purchaseValue = parseFloat(item.purchase_value) || 0;
      var currentValue = parseFloat(item.current_value) || 0;
      var totalCost = purchaseValue + totalExpense;
      var netValue = currentValue + totalIncome - totalCost;

      return {
        item: item,
        transactions: transactions,
        summary: {
          purchaseValue: purchaseValue,
          totalExpense: totalExpense,
          totalIncome: totalIncome,
          totalCost: totalCost,
          currentValue: currentValue,
          netValue: netValue,
          isAsset: netValue >= 0 || totalIncome > totalExpense,
          isLiability: netValue < 0 && totalIncome <= totalExpense
        }
      };
    } catch (error) {
      console.error('[ItemService.getItemAnalysis]', error);
      return null;
    }
  },

  async getAllWithAnalysis() {
    try {
      var items = await this.getAll();
      var result = [];

      for (var i = 0; i < items.length; i++) {
        var analysis = await this.getItemAnalysis(items[i].id);
        if (analysis) result.push(analysis);
      }

      return result;
    } catch (error) {
      console.error('[ItemService.getAllWithAnalysis]', error);
      return [];
    }
  }
};

window.ItemService = ItemService;
console.log('✅ ItemService loaded');
