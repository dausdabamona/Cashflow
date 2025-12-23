/**
 * Toast Notification Component
 * File: web/js/components/toast.js
 */
const Toast = {
  container: null,

  /**
   * Initialize toast container
   */
  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(this.container);
  },

  /**
   * Show a toast message
   * @param {string} message - Message to show
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in ms
   */
  show(message, type = 'info', duration = 3000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const colors = {
      success: { bg: '#10B981', icon: '✓' },
      error: { bg: '#EF4444', icon: '✕' },
      warning: { bg: '#F59E0B', icon: '⚠' },
      info: { bg: '#3B82F6', icon: 'ℹ' }
    };

    const { bg, icon } = colors[type] || colors.info;

    toast.style.cssText = `
      background: ${bg};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 250px;
      animation: slideIn 0.3s ease;
    `;

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    this.container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Show success toast
   * @param {string} message - Message
   */
  success(message) {
    this.show(message, 'success');
  },

  /**
   * Show error toast
   * @param {string} message - Message
   */
  error(message) {
    this.show(message, 'error', 5000);
  },

  /**
   * Show warning toast
   * @param {string} message - Message
   */
  warning(message) {
    this.show(message, 'warning');
  },

  /**
   * Show info toast
   * @param {string} message - Message
   */
  info(message) {
    this.show(message, 'info');
  }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

window.Toast = Toast;

console.log('✅ Toast loaded');
