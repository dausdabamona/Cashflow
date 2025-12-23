/**
 * Item Service
 * @type {Object}
 */
var ItemService = {

  getAll: function() {
    return new Promise(function(resolve) {
      var userId = BaseService.getUserId();
      var client = BaseService.getClient();

      if (!client || !userId) {
        resolve([]);
        return;
      }

      client
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })
        .then(function(response) {
          resolve(response.error ? [] : (response.data || []));
        })
        .catch(function() {
          resolve([]);
        });
    });
  },

  getActive: function() {
    return new Promise(function(resolve) {
      var userId = BaseService.getUserId();
      var client = BaseService.getClient();

      if (!client || !userId) {
        resolve([]);
        return;
      }

      client
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_sold', false)
        .order('name', { ascending: true })
        .then(function(response) {
          resolve(response.error ? [] : (response.data || []));
        })
        .catch(function() {
          resolve([]);
        });
    });
  },

  create: function(data) {
    return new Promise(function(resolve) {
      var userId = BaseService.getUserId();
      var client = BaseService.getClient();

      if (!client || !userId) {
        resolve(null);
        return;
      }

      client
        .from('items')
        .insert({
          user_id: userId,
          name: data.name,
          type: data.type || 'neutral',
          description: data.description || null,
          acquired_date: data.acquired_date || BaseService.getToday(),
          acquired_via: data.acquired_via || 'purchase',
          purchase_value: data.purchase_value || 0,
          current_value: data.current_value || data.purchase_value || 0,
          is_sold: false
        })
        .select()
        .single()
        .then(function(response) {
          resolve(response.error ? null : response.data);
        })
        .catch(function() {
          resolve(null);
        });
    });
  }
};

// Export to window
window.ItemService = ItemService;
console.log('✅ ItemService loaded successfully');
