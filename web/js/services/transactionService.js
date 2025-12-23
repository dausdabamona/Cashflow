/**
 * Transaction Service
 * @type {Object}
 */
var TransactionService = {

  getAll: function(options) {
    options = options || {};
    return new Promise(function(resolve) {
      try {
        var userId = BaseService.getUserId();
        if (!userId) {
          resolve([]);
          return;
        }

        var client = BaseService.getClient();
        if (!client) {
          resolve([]);
          return;
        }

        var query = client
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        if (options.startDate) {
          query = query.gte('date', options.startDate);
        }
        if (options.endDate) {
          query = query.lte('date', options.endDate);
        }
        if (options.type) {
          query = query.eq('type', options.type);
        }
        if (options.limit) {
          query = query.limit(options.limit);
        }

        query.then(function(response) {
          resolve(response.error ? [] : (response.data || []));
        }).catch(function() {
          resolve([]);
        });

      } catch (error) {
        console.error('[TransactionService.getAll]', error);
        resolve([]);
      }
    });
  },

  getMonthly: function(month, year) {
    var m = month || BaseService.getCurrentMonth();
    var y = year || BaseService.getCurrentYear();
    var startDate = y + '-' + String(m).padStart(2, '0') + '-01';
    var lastDay = new Date(y, m, 0).getDate();
    var endDate = y + '-' + String(m).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
    return this.getAll({ startDate: startDate, endDate: endDate });
  },

  getRecent: function(limit) {
    return this.getAll({ limit: limit || 5 });
  },

  create: function(data) {
    return new Promise(function(resolve) {
      var userId = BaseService.getUserId();
      var client = BaseService.getClient();

      if (!client || !userId) {
        console.error('[TransactionService.create] No client or userId');
        resolve(null);
        return;
      }

      var insertData = {
        user_id: userId,
        type: data.type,
        amount: parseFloat(data.amount),
        account_id: data.account_id || null,
        category_id: data.category_id || null,
        date: data.date || BaseService.getToday(),
        description: data.description || null,
        income_type: data.income_type || null,
        item_id: data.item_id || null,
        loan_id: data.loan_id || null
      };

      console.log('[TransactionService.create] Inserting:', insertData);

      client
        .from('transactions')
        .insert(insertData)
        .select()
        .single()
        .then(function(response) {
          if (response.error) {
            console.error('[TransactionService.create] Error:', response.error);
            resolve(null);
          } else {
            console.log('[TransactionService.create] Success:', response.data);
            resolve(response.data);
          }
        })
        .catch(function(err) {
          console.error('[TransactionService.create] Catch:', err);
          resolve(null);
        });
    });
  },

  update: function(id, data) {
    return new Promise(function(resolve) {
      var client = BaseService.getClient();
      if (!client) {
        resolve(null);
        return;
      }

      client
        .from('transactions')
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

  delete: function(id) {
    return new Promise(function(resolve) {
      var client = BaseService.getClient();
      if (!client) {
        resolve(false);
        return;
      }

      client
        .from('transactions')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .then(function(response) {
          resolve(!response.error);
        })
        .catch(function() {
          resolve(false);
        });
    });
  },

  getSummary: function(transactions) {
    var income = 0;
    var expense = 0;
    var passiveIncome = 0;

    for (var i = 0; i < transactions.length; i++) {
      var t = transactions[i];
      var amount = parseFloat(t.amount) || 0;

      if (t.type === 'income') {
        income += amount;
        if (t.income_type === 'passive') {
          passiveIncome += amount;
        }
      } else if (t.type === 'expense') {
        expense += amount;
      }
    }

    return {
      income: income,
      expense: expense,
      passiveIncome: passiveIncome,
      net: income - expense
    };
  }
};

// Export to window
window.TransactionService = TransactionService;
console.log('✅ TransactionService loaded successfully');
