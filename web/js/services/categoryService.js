var CategoryService = {
  tableName: 'categories',
  
  getAll: async function() {
    try {
      var userId = BaseService.getUserId();
      if (!userId) return [];
      
      var result = await BaseService.getClient()
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      console.error('[CategoryService.getAll]', error);
      return [];
    }
  },
  
  getByType: async function(type) {
    var all = await this.getAll();
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].type === type) {
        filtered.push(all[i]);
      }
    }
    return filtered;
  },
  
  getById: async function(id) {
    try {
      var result = await BaseService.getClient()
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('[CategoryService.getById]', error);
      return null;
    }
  }
};

window.CategoryService = CategoryService;
console.log('✅ CategoryService loaded (object literal)');
