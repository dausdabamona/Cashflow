// Cashflow Tracker - Utility Functions

/**
 * Format number to Indonesian Rupiah
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatRupiah(amount) {
  // Safely parse amount to number, default to 0 if invalid
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
}

/**
 * Format number to short Rupiah (e.g., 1.5jt)
 * @param {number} amount - The amount to format
 * @returns {string} Short formatted string
 */
function formatRupiahShort(amount) {
  // Safely parse amount to number, default to 0 if invalid
  const num = parseFloat(amount) || 0;
  if (Math.abs(num) >= 1000000000) {
    return `Rp ${(num / 1000000000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1000000) {
    return `Rp ${(num / 1000000).toFixed(1)}jt`;
  }
  if (Math.abs(num) >= 1000) {
    return `Rp ${(num / 1000).toFixed(0)}rb`;
  }
  return formatRupiah(num);
}

/**
 * Format date to Indonesian locale
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format date to full Indonesian format
 * @param {string} dateStr - ISO date string
 * @returns {string} Full formatted date
 */
function formatDateFull(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format relative time (e.g., "Hari ini", "Kemarin")
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time string
 */
function formatRelative(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffTime = now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return formatDate(dateStr);
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get first day of current month
 * @returns {string} First day of month
 */
function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Get last day of current month
 * @returns {string} Last day of month
 */
function getMonthEnd() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
}

/**
 * Get CSS class based on Cashflow status
 * @param {string} status - 'asset', 'liability', or 'neutral'
 * @returns {string} Tailwind CSS classes
 */
function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'asset':
      return 'bg-green-100 text-green-800 border-green-500';
    case 'liability':
      return 'bg-red-100 text-red-800 border-red-500';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-500';
  }
}

/**
 * Get badge class for status
 * @param {string} status - 'asset', 'liability', or 'neutral'
 * @returns {string} Tailwind CSS classes for badge
 */
function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'asset':
      return 'bg-green-500 text-white';
    case 'liability':
      return 'bg-red-500 text-white';
    default:
      return 'bg-yellow-500 text-white';
  }
}

/**
 * Get icon color class based on transaction type
 * @param {string} type - 'income' or 'expense'
 * @returns {string} Tailwind CSS classes
 */
function getTransactionColorClass(type) {
  return type === 'income' ? 'text-green-600' : 'text-red-600';
}

/**
 * Calculate progress percentage
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @returns {number} Percentage (0-100)
 */
function calcProgress(current, target) {
  if (target === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

/**
 * Get progress bar color based on percentage
 * @param {number} percentage - Progress percentage
 * @returns {string} Tailwind CSS background class
 */
function getProgressColor(percentage) {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Get motivational message based on Cashflow status
 * @param {string} status - Current financial status
 * @param {number} progress - Progress percentage
 * @returns {string} Motivational message
 */
function getProgressMessage(status, progress) {
  if (status === 'liability' && progress < 30) {
    return "Masih banyak LIABILITY, yuk kurangi!";
  }
  if (status === 'liability' && progress < 50) {
    return "Menuju ASSET! Terus semangat! 🟡";
  }
  if (progress < 80) {
    return "Hampir ASSET! Sedikit lagi! 💪";
  }
  if (progress < 100) {
    return "Kamu sudah ASSET! Pertahankan! 🟢";
  }
  return "LUAR BIASA! Financial Freedom dekat! 🌟";
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = 'success', duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  toast.className = `fixed bottom-20 left-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 transform transition-all duration-300`;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
    <span>${message}</span>
  `;
  toast.classList.remove('translate-y-full', 'opacity-0');

  // Re-initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  setTimeout(() => {
    toast.classList.add('translate-y-full', 'opacity-0');
  }, duration);
}

/**
 * Show loading overlay
 */
function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('hidden');
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} User's choice
 */
async function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const messageEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    if (!modal || !messageEl) {
      resolve(confirm(message));
      return;
    }

    messageEl.textContent = message;
    modal.classList.remove('hidden');

    const handleYes = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve(true);
    };

    const handleNo = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
    };

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
  });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Safely parse JSON
 * @param {string} str - JSON string
 * @param {*} fallback - Fallback value
 * @returns {*} Parsed value or fallback
 */
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Store data in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @param {*} fallback - Fallback value
 * @returns {*} Stored value or fallback
 */
function getStorage(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatRupiah,
    formatRupiahShort,
    formatDate,
    formatDateFull,
    formatRelative,
    getToday,
    getMonthStart,
    getMonthEnd,
    getStatusClass,
    getStatusBadgeClass,
    getTransactionColorClass,
    calcProgress,
    getProgressColor,
    getProgressMessage,
    showToast,
    showLoading,
    hideLoading,
    showConfirm,
    debounce,
    throttle,
    generateId,
    safeJsonParse,
    setStorage,
    getStorage,
    removeStorage
  };
}
