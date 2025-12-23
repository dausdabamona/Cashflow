/**
 * Initialize Default Data
 * File: web/js/initData.js
 * Jalankan sekali untuk membuat akun dan kategori default
 */

const InitData = {

  async createDefaultAccounts() {
    var userId = BaseService.getUserId();
    if (!userId) {
      console.error('User not logged in');
      return false;
    }

    var accounts = [
      { name: 'Dompet', type: 'cash', icon: '💵', color: '#10B981', opening_balance: 0, display_order: 1 },
      { name: 'Bank BRI', type: 'bank', bank_name: 'BRI', icon: '🏦', color: '#0066AE', opening_balance: 0, display_order: 2 },
      { name: 'Bank BNI', type: 'bank', bank_name: 'BNI', icon: '🏦', color: '#F15A22', opening_balance: 0, display_order: 3 },
      { name: 'Bank Mandiri', type: 'bank', bank_name: 'Mandiri', icon: '🏦', color: '#003D79', opening_balance: 0, display_order: 4 },
      { name: 'GoPay', type: 'ewallet', icon: '📱', color: '#00AA13', opening_balance: 0, display_order: 5 },
      { name: 'OVO', type: 'ewallet', icon: '📱', color: '#4C3494', opening_balance: 0, display_order: 6 },
      { name: 'Dana', type: 'ewallet', icon: '📱', color: '#108EE9', opening_balance: 0, display_order: 7 }
    ];

    console.log('Creating default accounts...');
    var created = 0;

    for (var i = 0; i < accounts.length; i++) {
      var acc = accounts[i];
      try {
        var result = await BaseService.getClient()
          .from('accounts')
          .insert({
            user_id: userId,
            name: acc.name,
            type: acc.type,
            bank_name: acc.bank_name || null,
            icon: acc.icon,
            color: acc.color,
            opening_balance: acc.opening_balance,
            current_balance: acc.opening_balance,
            display_order: acc.display_order,
            is_active: true
          })
          .select()
          .single();

        if (result.error) {
          console.warn('Skip account (mungkin sudah ada):', acc.name, result.error.message);
        } else {
          console.log('✓ Created account:', acc.name);
          created++;
        }
      } catch (e) {
        console.warn('Error creating account:', acc.name, e);
      }
    }

    console.log('Accounts created:', created);
    return true;
  },

  async createDefaultCategories() {
    var userId = BaseService.getUserId();
    if (!userId) {
      console.error('User not logged in');
      return false;
    }

    var categories = [
      // Income categories
      { name: 'Gaji', type: 'income', income_type: 'active', icon: '💼', color: '#10B981', display_order: 1 },
      { name: 'Bonus', type: 'income', income_type: 'active', icon: '🎁', color: '#059669', display_order: 2 },
      { name: 'Freelance', type: 'income', income_type: 'active', icon: '💻', color: '#0D9488', display_order: 3 },
      { name: 'Bisnis', type: 'income', income_type: 'active', icon: '🏪', color: '#0891B2', display_order: 4 },
      { name: 'Investasi', type: 'income', income_type: 'portfolio', icon: '📈', color: '#6366F1', display_order: 5 },
      { name: 'Dividen', type: 'income', income_type: 'portfolio', icon: '🪙', color: '#8B5CF6', display_order: 6 },
      { name: 'Sewa/Kos', type: 'income', income_type: 'passive', icon: '🏠', color: '#EC4899', display_order: 7 },
      { name: 'Royalti', type: 'income', income_type: 'passive', icon: '🎵', color: '#F43F5E', display_order: 8 },
      { name: 'Lainnya', type: 'income', income_type: 'active', icon: '➕', color: '#6B7280', display_order: 9 },

      // Expense categories
      { name: 'Makan & Minum', type: 'expense', icon: '🍽️', color: '#EF4444', display_order: 10 },
      { name: 'Transportasi', type: 'expense', icon: '🚗', color: '#F97316', display_order: 11 },
      { name: 'Bensin', type: 'expense', icon: '⛽', color: '#FB923C', display_order: 12 },
      { name: 'Belanja', type: 'expense', icon: '🛍️', color: '#FBBF24', display_order: 13 },
      { name: 'Tagihan', type: 'expense', icon: '📄', color: '#A855F7', display_order: 14 },
      { name: 'Listrik', type: 'expense', icon: '⚡', color: '#FACC15', display_order: 15 },
      { name: 'Internet', type: 'expense', icon: '📶', color: '#22D3EE', display_order: 16 },
      { name: 'Pulsa', type: 'expense', icon: '📱', color: '#2DD4BF', display_order: 17 },
      { name: 'Kesehatan', type: 'expense', icon: '💊', color: '#F43F5E', display_order: 18 },
      { name: 'Pendidikan', type: 'expense', icon: '🎓', color: '#3B82F6', display_order: 19 },
      { name: 'Hiburan', type: 'expense', icon: '🎮', color: '#8B5CF6', display_order: 20 },
      { name: 'Cicilan', type: 'expense', icon: '💳', color: '#DC2626', is_loan_payment: true, display_order: 21 },
      { name: 'Asuransi', type: 'expense', icon: '🛡️', color: '#0EA5E9', display_order: 22 },
      { name: 'Sedekah/Zakat', type: 'expense', icon: '🤲', color: '#10B981', display_order: 23 },
      { name: 'Lainnya', type: 'expense', icon: '📦', color: '#6B7280', display_order: 24 }
    ];

    console.log('Creating default categories...');
    var created = 0;

    for (var i = 0; i < categories.length; i++) {
      var cat = categories[i];
      try {
        var result = await BaseService.getClient()
          .from('categories')
          .insert({
            user_id: userId,
            name: cat.name,
            type: cat.type,
            income_type: cat.income_type || null,
            icon: cat.icon,
            color: cat.color,
            display_order: cat.display_order,
            is_loan_payment: cat.is_loan_payment || false,
            is_active: true
          })
          .select()
          .single();

        if (result.error) {
          console.warn('Skip category (mungkin sudah ada):', cat.name, result.error.message);
        } else {
          console.log('✓ Created category:', cat.name);
          created++;
        }
      } catch (e) {
        console.warn('Error creating category:', cat.name, e);
      }
    }

    console.log('Categories created:', created);
    return true;
  },

  async createSampleItems() {
    var userId = BaseService.getUserId();
    if (!userId) {
      console.error('User not logged in');
      return false;
    }

    var items = [
      {
        name: 'Motor PCX',
        type: 'asset',
        description: 'Honda PCX 160',
        acquired_date: '2024-01-15',
        acquired_via: 'credit',
        purchase_value: 35000000,
        current_value: 30000000
      },
      {
        name: 'Laptop',
        type: 'asset',
        description: 'Laptop untuk kerja',
        acquired_date: '2023-06-01',
        acquired_via: 'purchase',
        purchase_value: 12000000,
        current_value: 8000000
      },
      {
        name: 'Smartphone',
        type: 'neutral',
        description: 'HP untuk sehari-hari',
        acquired_date: '2024-03-01',
        acquired_via: 'purchase',
        purchase_value: 5000000,
        current_value: 4000000
      }
    ];

    console.log('Creating sample items...');
    var created = 0;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      try {
        var result = await BaseService.getClient()
          .from('items')
          .insert({
            user_id: userId,
            name: item.name,
            type: item.type,
            description: item.description,
            acquired_date: item.acquired_date,
            acquired_via: item.acquired_via,
            purchase_value: item.purchase_value,
            current_value: item.current_value,
            is_sold: false
          })
          .select()
          .single();

        if (result.error) {
          console.warn('Skip item (mungkin sudah ada):', item.name, result.error.message);
        } else {
          console.log('✓ Created item:', item.name);
          created++;
        }
      } catch (e) {
        console.warn('Error creating item:', item.name, e);
      }
    }

    console.log('Items created:', created);
    return true;
  },

  async initAll() {
    console.log('========================================');
    console.log('INITIALIZING DEFAULT DATA...');
    console.log('========================================');

    await this.createDefaultAccounts();
    console.log('');
    await this.createDefaultCategories();
    console.log('');
    await this.createSampleItems();

    console.log('');
    console.log('========================================');
    console.log('DONE! Refresh halaman untuk melihat data.');
    console.log('========================================');

    return true;
  }
};

// Helper function for easy access
async function initializeDefaultData() {
  try {
    Loading.show('Membuat data default...');
    await InitData.initAll();
    Loading.hide();
    Toast.success('Data default berhasil dibuat!');
    setTimeout(function() {
      location.reload();
    }, 1500);
  } catch (error) {
    Loading.hide();
    Toast.error('Gagal membuat data: ' + error.message);
    console.error(error);
  }
}

window.InitData = InitData;
window.initializeDefaultData = initializeDefaultData;

console.log('📦 InitData loaded. Jalankan InitData.initAll() untuk membuat data default.');
