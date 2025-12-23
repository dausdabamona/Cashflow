/**
 * Loading Component
 * File: web/js/components/loading.js
 */
const Loading = {
  overlay: null,

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  show(message = 'Loading...') {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
    `;

    this.overlay.innerHTML = `
      <div style="
        background: white;
        padding: 30px 50px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      ">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3B82F6;
          border-radius: 50%;
          margin: 0 auto 15px;
          animation: spin 1s linear infinite;
        "></div>
        <p style="margin: 0; color: #374151;">${message}</p>
      </div>
    `;

    document.body.appendChild(this.overlay);
  },

  /**
   * Hide loading overlay
   */
  hide() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  },

  /**
   * Show inline loading spinner
   * @param {HTMLElement} container - Container element
   */
  inline(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: #6b7280;
      ">
        <div style="
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top-color: #3B82F6;
          border-radius: 50%;
          margin-right: 10px;
          animation: spin 1s linear infinite;
        "></div>
        <span>Memuat data...</span>
      </div>
    `;
  }
};

// Add spin animation
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinStyle);

window.Loading = Loading;

console.log('✅ Loading component loaded');
