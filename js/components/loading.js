/**
 * Loading Component
 * Loading states: overlay, button, skeleton
 */

const Loading = {
  overlay: null,

  /**
   * Show full-page loading overlay
   * @param {string} message - Loading message
   */
  showOverlay(message = 'Memuat...') {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
    this.overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center';
    this.overlay.style.opacity = '0';
    this.overlay.style.transition = 'opacity 0.2s ease-out';

    this.overlay.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-4 shadow-2xl">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-700 dark:text-gray-300 font-medium">${message}</p>
      </div>
    `;

    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });
  },

  /**
   * Hide loading overlay
   */
  hideOverlay() {
    if (!this.overlay) return;

    this.overlay.style.opacity = '0';

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
      document.body.style.overflow = '';
    }, 200);
  },

  /**
   * Show loading state on button
   * @param {HTMLButtonElement} button
   * @param {string} loadingText
   */
  buttonStart(button, loadingText = 'Loading...') {
    if (!button) return;

    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.classList.add('opacity-75', 'cursor-not-allowed');
    button.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${loadingText}
      </span>
    `;
  },

  /**
   * Reset button to original state
   * @param {HTMLButtonElement} button
   */
  buttonEnd(button) {
    if (!button) return;

    button.disabled = false;
    button.classList.remove('opacity-75', 'cursor-not-allowed');
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  },

  /**
   * Create skeleton loading element
   * @param {string} type - Type: text, card, list, avatar
   * @param {number} count - Number of items
   * @returns {string}
   */
  skeleton(type = 'text', count = 1) {
    const skeletons = {
      text: '<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>',
      textShort: '<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>',
      card: `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      `,
      list: `
        <div class="flex items-center gap-3 p-3 animate-pulse">
          <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      `,
      avatar: '<div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>',
      button: '<div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-24"></div>',
      chart: `
        <div class="animate-pulse">
          <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
          <div class="flex justify-between">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        </div>
      `
    };

    const template = skeletons[type] || skeletons.text;

    if (count === 1) return template;

    return Array(count).fill(template).join('');
  },

  /**
   * Show inline loading spinner
   * @param {string} size - Size: sm, md, lg
   * @returns {string}
   */
  spinner(size = 'md') {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };

    return `
      <svg class="${sizes[size] || sizes.md} animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `;
  },

  /**
   * Show loading state in container
   * @param {HTMLElement} container
   * @param {string} type
   */
  showInContainer(container, type = 'card') {
    if (!container) return;

    container.dataset.originalContent = container.innerHTML;
    container.innerHTML = `
      <div class="p-4">
        ${this.skeleton(type, 3)}
      </div>
    `;
  },

  /**
   * Restore container content
   * @param {HTMLElement} container
   */
  hideInContainer(container) {
    if (!container || !container.dataset.originalContent) return;

    container.innerHTML = container.dataset.originalContent;
    delete container.dataset.originalContent;
  }
};

// Export global
window.Loading = Loading;
