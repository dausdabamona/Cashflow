/**
 * Account Service
 * @type {Object}
 */
var AccountService = {

  getAll: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      try {
        var userId = BaseService.getUserId();
        if (!userId) {
          console.warn('[AccountService] No user ID');
          resolve([]);
          return;
        }

        var client = BaseService.getClient();
        if (!client) {
          resolve([]);
          return;
        }

        client
          .from('accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .then(function(response) {
            if (response.error) {
              console.error('[AccountService.getAll]', response.error);
              resolve([]);
            } else {
              resolve(response.data || []);
            }
          })
          .catch(function(err) {
            console.error('[AccountService.getAll]', err);
            resolve([]);
          });

      } catch (error) {
        console.error('[AccountService.getAll]', error);
        resolve([]);
      }
    });
  },

  getById: function(id) {
    return new Promise(function(resolve, reject) {
      var client = BaseService.getClient();
      if (!client) {
        resolve(null);
        return;
      }

      client
        .from('accounts')
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
    return new Promise(function(resolve, reject) {
      var userId = BaseService.getUserId();
      var client = BaseService.getClient();

      if (!client || !userId) {
        resolve(null);
        return;
      }

      client
        .from('accounts')
        .insert({
          user_id: userId,
          name: data.name,
          type: data.type || 'cash',
          bank_name: data.bank_name || null,
          icon: data.icon || 'wallet',
          color: data.color || '#6B7280',
          opening_balance: data.opening_balance || 0,
          current_balance: data.opening_balance || 0,
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
  },

  update: function(id, data) {
    return new Promise(function(resolve, reject) {
      var client = BaseService.getClient();
      if (!client) {
        resolve(null);
        return;
      }

      client
        .from('accounts')
        .update(data)
        .eq('id', id)
        .select()
        .single()
        .then(function(response) {
          resolve(response.error ? null : response.data);
        })
        .catch(function() {
          resolve(null);
        });
    });
  },

  getTotalBalance: function() {
    var self = this;
    return new Promise(function(resolve) {
      self.getAll().then(function(accounts) {
        var total = 0;
        for (var i = 0; i < accounts.length; i++) {
          if (!accounts[i].is_excluded_from_total) {
            total += parseFloat(accounts[i].current_balance) || 0;
          }
        }
        resolve(total);
      });
    });
  }
};

// Export to window
window.AccountService = AccountService;
console.log('✅ AccountService loaded successfully');
