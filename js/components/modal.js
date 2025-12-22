/**
 * Modal Component
 * Popup dialogs dengan confirm/alert
 */

const Modal = {
  activeModal: null,

  /**
   * Show modal dialog
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  show(options = {}) {
    return new Promise((resolve) => {
      const {
        title = '',
        message = '',
        type = 'info',
        confirmText = 'OK',
        cancelText = 'Batal',
        showCancel = true,
        html = null,
        size = 'sm'
      } = options;

      // Close existing modal
      if (this.activeModal) {
        this.close();
      }

      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
      backdrop.style.opacity = '0';
      backdrop.style.transition = 'opacity 0.2s ease-out';

      // Create modal
      const modal = document.createElement('div');
      modal.className = this.getModalClass(size);
      modal.style.transform = 'scale(0.95)';
      modal.style.opacity = '0';
      modal.style.transition = 'all 0.2s ease-out';

      modal.innerHTML = this.getModalContent({
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel,
        html
      });

      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      this.activeModal = backdrop;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Animate in
      requestAnimationFrame(() => {
        backdrop.style.opacity = '1';
        modal.style.transform = 'scale(1)';
        modal.style.opacity = '1';
      });

      // Event handlers
      const confirmBtn = modal.querySelector('[data-confirm]');
      const cancelBtn = modal.querySelector('[data-cancel]');
      const closeBtn = modal.querySelector('[data-close]');

      const handleConfirm = () => {
        this.close();
        resolve(true);
      };

      const handleCancel = () => {
        this.close();
        resolve(false);
      };

      if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
      if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
      if (closeBtn) closeBtn.addEventListener('click', handleCancel);

      // Close on backdrop click
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleCancel();
      });

      // Close on escape
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  },

  /**
   * Close active modal
   */
  close() {
    if (!this.activeModal) return;

    const backdrop = this.activeModal;
    const modal = backdrop.querySelector('div');

    backdrop.style.opacity = '0';
    if (modal) {
      modal.style.transform = 'scale(0.95)';
      modal.style.opacity = '0';
    }

    setTimeout(() => {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      document.body.style.overflow = '';
    }, 200);

    this.activeModal = null;
  },

  /**
   * Get modal CSS classes
   * @param {string} size
   * @returns {string}
   */
  getModalClass(size) {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };

    return `bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${sizeClasses[size] || sizeClasses.sm}`;
  },

  /**
   * Get modal content HTML
   * @param {Object} options
   * @returns {string}
   */
  getModalContent(options) {
    const { title, message, type, confirmText, cancelText, showCancel, html } = options;

    const icons = {
      success: '<div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4"><svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>',
      error: '<div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4"><svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></div>',
      warning: '<div class="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4"><svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>',
      info: '<div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4"><svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>',
      confirm: '<div class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4"><svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>'
    };

    const buttonStyles = {
      success: 'bg-green-500 hover:bg-green-600',
      error: 'bg-red-500 hover:bg-red-600',
      warning: 'bg-yellow-500 hover:bg-yellow-600',
      info: 'bg-blue-500 hover:bg-blue-600',
      confirm: 'bg-purple-500 hover:bg-purple-600'
    };

    return `
      <div class="p-6">
        <button data-close class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <div class="flex flex-col items-center text-center">
          ${icons[type] || icons.info}
          ${title ? `<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>` : ''}
          ${message ? `<p class="text-gray-600 dark:text-gray-300 mb-6">${message}</p>` : ''}
          ${html ? `<div class="w-full mb-6">${html}</div>` : ''}
        </div>

        <div class="flex gap-3 ${showCancel ? 'justify-between' : 'justify-center'}">
          ${showCancel ? `
            <button data-cancel class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              ${cancelText}
            </button>
          ` : ''}
          <button data-confirm class="flex-1 px-4 py-2 ${buttonStyles[type] || buttonStyles.info} text-white rounded-lg transition-colors">
            ${confirmText}
          </button>
        </div>
      </div>
    `;
  },

  // Shorthand methods
  async alert(message, title = 'Informasi') {
    return this.show({
      title,
      message,
      type: 'info',
      showCancel: false,
      confirmText: 'OK'
    });
  },

  async confirm(message, title = 'Konfirmasi') {
    return this.show({
      title,
      message,
      type: 'confirm',
      showCancel: true,
      confirmText: 'Ya',
      cancelText: 'Tidak'
    });
  },

  async success(message, title = 'Berhasil') {
    return this.show({
      title,
      message,
      type: 'success',
      showCancel: false
    });
  },

  async error(message, title = 'Error') {
    return this.show({
      title,
      message,
      type: 'error',
      showCancel: false
    });
  },

  async warning(message, title = 'Peringatan') {
    return this.show({
      title,
      message,
      type: 'warning',
      showCancel: true,
      confirmText: 'Lanjutkan',
      cancelText: 'Batal'
    });
  }
};

// Export global
window.Modal = Modal;
