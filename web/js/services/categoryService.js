/**
 * Category Service
 * @type {Object}
 */
var CategoryService = {

  getAll: function() {
    return new Promise(function(resolve, reject) {
      try {
        var userId = BaseService.getUserId();
        if (!userId) {
          console.warn('[CategoryService] No user ID');
          resolve([]);
          return;
        }

        var client = BaseService.getClient();
        if (!client) {
          resolve([]);
          return;
        }

        client
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .then(function(response) {
            if (response.error) {
              console.error('[CategoryService.getAll]', response.error);
              resolve([]);
            } else {
              resolve(response.data || []);
            }
          })
          .catch(function(err) {
            console.error('[CategoryService.getAll]', err);
            resolve([]);
          });

      } catch (error) {
        console.error('[CategoryService.getAll]', error);
        resolve([]);
      }
    });
  },

  getByType: function(type) {
    var self = this;
    return new Promise(function(resolve) {
      self.getAll().then(function(categories) {
        var filtered = [];
        for (var i = 0; i < categories.length; i++) {
          if (categories[i].type === type) {
            filtered.push(categories[i]);
          }
        }
        resolve(filtered);
      });
    });
  },

  getById: function(id) {
    return new Promise(function(resolve) {
      var client = BaseService.getClient();
      if (!client) {
        resolve(null);
        return;
      }

      client
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()
        .then(function(response) {
          resolve(response.error ? null : response.data);
        })
        .catch(function() {
          resolve(null);
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
        .from('categories')
        .insert({
          user_id: userId,
          name: data.name,
          type: data.type,
          income_type: data.income_type || null,
          icon: data.icon || 'tag',
          color: data.color || '#6B7280',
          display_order: data.display_order || 0,
          is_active: true
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
window.CategoryService = CategoryService;
console.log('✅ CategoryService loaded successfully');
