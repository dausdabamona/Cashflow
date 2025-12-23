var ItemService = {
  tableName: 'items',
  
  getAll: async function() {
    try {
      var userId = BaseService.getUserId();
      if (!userId) return [];
      
      var result = await BaseService.getClient()
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('acquired_date', { ascending: false });
      
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      console.error('[ItemService.getAll]', error);
      return [];
    }
  },
  
  getActive: async function() {
    try {
      var userId = BaseService.getUserId();
      if (!userId) return [];
      
      var result = await BaseService.getClient()
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_sold', false)
        .order('name', { ascending: true });
      
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      console.error('[ItemService.getActive]', error);
      return [];
    }
  },
  
  getById: async function(id) {
    try {
      var result = await BaseService.getClient()
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('[ItemService.getById]', error);
      return null;
    }
  },
  
  create: async function(itemData) {
    try {
      var userId = BaseService.getUserId();
      var result = await BaseService.getClient()
        .from('items')
        .insert({
          user_id: userId,
          name: itemData.name,
          type: itemData.type || 'neutral',
          description: itemData.description || null,
          acquired_date: itemData.acquired_date || BaseService.getToday(),
          acquired_via: itemData.acquired_via || 'purchase',
          purchase_value: itemData.purchase_value || 0,
          current_value: itemData.current_value || itemData.purchase_value || 0,
          is_sold: false
        })
        .select()
        .single();
      
      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('[ItemService.create]', error);
      return null;
    }
  }
};

window.ItemService = ItemService;
console.log('✅ ItemService loaded (object literal)');
