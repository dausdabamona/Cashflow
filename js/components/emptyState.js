/**
 * Empty State Component
 * Empty state displays dengan presets
 */

const EmptyState = {
  /**
   * Render empty state
   * @param {Object} options
   * @returns {string}
   */
  render(options = {}) {
    const {
      icon = 'inbox',
      title = 'Tidak ada data',
      description = '',
      actionText = '',
      actionHandler = '',
      size = 'md'
    } = options;

    const sizeClasses = {
      sm: 'py-4',
      md: 'py-8',
      lg: 'py-12'
    };

    const iconSizes = {
      sm: 'w-12 h-12',
      md: 'w-16 h-16',
      lg: 'w-20 h-20'
    };

    return `
      <div class="flex flex-col items-center justify-center text-center ${sizeClasses[size] || sizeClasses.md}">
        <div class="${iconSizes[size] || iconSizes.md} mb-4 text-gray-300 dark:text-gray-600">
          ${this.getIcon(icon)}
        </div>
        <h3 class="text-gray-600 dark:text-gray-400 font-medium mb-1">${title}</h3>
        ${description ? `<p class="text-gray-400 dark:text-gray-500 text-sm mb-4">${description}</p>` : ''}
        ${actionText ? `
          <button onclick="${actionHandler}" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
            ${actionText}
          </button>
        ` : ''}
      </div>
    `;
  },

  /**
   * Get icon SVG
   * @param {string} name
   * @returns {string}
   */
  getIcon(name) {
    const icons = {
      inbox: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>',
      wallet: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>',
      receipt: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path></svg>',
      category: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>',
      chart: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
      search: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>',
      error: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
      calendar: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
      bell: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>',
      loan: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>'
    };

    return icons[name] || icons.inbox;
  },

  /**
   * Presets for common empty states
   */
  presets: {
    transactions: {
      icon: 'receipt',
      title: 'Belum ada transaksi',
      description: 'Mulai catat pemasukan dan pengeluaran Anda',
      actionText: 'Tambah Transaksi',
      actionHandler: 'showTransactionModal()'
    },
    accounts: {
      icon: 'wallet',
      title: 'Belum ada akun',
      description: 'Tambahkan rekening atau dompet Anda',
      actionText: 'Tambah Akun',
      actionHandler: 'showAccountModal()'
    },
    categories: {
      icon: 'category',
      title: 'Belum ada kategori',
      description: 'Buat kategori untuk mengelompokkan transaksi',
      actionText: 'Tambah Kategori',
      actionHandler: 'showCategoryModal()'
    },
    searchResults: {
      icon: 'search',
      title: 'Tidak ditemukan',
      description: 'Coba kata kunci lain atau filter berbeda'
    },
    reports: {
      icon: 'chart',
      title: 'Belum ada data laporan',
      description: 'Laporan akan muncul setelah ada transaksi'
    },
    reminders: {
      icon: 'bell',
      title: 'Tidak ada pengingat',
      description: 'Anda sudah up to date!'
    },
    loans: {
      icon: 'loan',
      title: 'Tidak ada cicilan aktif',
      description: 'Tambahkan cicilan atau pinjaman untuk melacak'
    },
    error: {
      icon: 'error',
      title: 'Terjadi kesalahan',
      description: 'Coba muat ulang halaman',
      actionText: 'Muat Ulang',
      actionHandler: 'location.reload()'
    }
  },

  /**
   * Render preset empty state
   * @param {string} preset - Preset name
   * @param {string} size - Size
   * @returns {string}
   */
  preset(preset, size = 'md') {
    const options = this.presets[preset] || this.presets.searchResults;
    return this.render({ ...options, size });
  },

  /**
   * Insert empty state into container
   * @param {HTMLElement} container
   * @param {string} preset
   */
  show(container, preset = 'searchResults') {
    if (!container) return;
    container.innerHTML = this.preset(preset);
  }
};

// Export global
window.EmptyState = EmptyState;
