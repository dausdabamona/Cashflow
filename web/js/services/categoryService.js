const CategoryService = {
  tableName: 'categories',

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
      console.error('[CategoryService.getAll]', error);
      return [];
    }
  },

  async getByType(type) {
    const all = await this.getAll();
    return all.filter(c => c.type === type);
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
      console.error('[CategoryService.getById]', error);
      return null;
    }
  }
};

window.CategoryService = CategoryService;
console.log('✅ CategoryService loaded');
