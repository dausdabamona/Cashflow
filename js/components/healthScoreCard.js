/**
 * Health Score Card Component
 * Visualisasi skor kesehatan keuangan
 */

const HealthScoreCard = {
  /**
   * Render health score card
   * @param {Object} scoreData - Data dari DashboardService.calculateHealthScore()
   * @returns {string}
   */
  render(scoreData) {
    if (!scoreData) {
      return this.renderEmpty();
    }

    const { score, grade, label, color, factors } = scoreData;

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Skor Kesehatan Keuangan</h3>
          <button onclick="HealthScoreCard.showDetails()" class="text-blue-500 hover:text-blue-600 text-xs">
            Detail
          </button>
        </div>

        <div class="flex items-center gap-4 mb-4">
          <!-- Score Circle -->
          <div class="relative">
            ${this.renderCircle(score, color)}
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-bold ${this.getTextColor(color)}">${grade}</span>
            </div>
          </div>

          <!-- Score Info -->
          <div class="flex-1">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${score}</div>
            <div class="text-sm ${this.getTextColor(color)}">${label}</div>
          </div>
        </div>

        <!-- Quick Factors -->
        <div class="space-y-2">
          ${this.renderTopFactors(factors)}
        </div>
      </div>
    `;
  },

  /**
   * Render empty state
   * @returns {string}
   */
  renderEmpty() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Skor Kesehatan Keuangan</h3>
        </div>
        <div class="text-center py-4">
          <div class="text-gray-400 dark:text-gray-500">Belum ada data</div>
        </div>
      </div>
    `;
  },

  /**
   * Render progress circle
   * @param {number} score
   * @param {string} color
   * @returns {string}
   */
  renderCircle(score, color) {
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - (score / 100) * circumference;
    const strokeColor = this.getStrokeColor(color);

    return `
      <svg class="w-20 h-20 transform -rotate-90">
        <circle cx="40" cy="40" r="36" stroke-width="8"
                fill="none" class="stroke-gray-200 dark:stroke-gray-700" />
        <circle cx="40" cy="40" r="36" stroke-width="8"
                fill="none" class="${strokeColor}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                stroke-linecap="round"
                style="transition: stroke-dashoffset 0.5s ease-out" />
      </svg>
    `;
  },

  /**
   * Render top 3 factors
   * @param {Array} factors
   * @returns {string}
   */
  renderTopFactors(factors = []) {
    if (!factors.length) return '<div class="text-gray-400 text-sm">Tidak ada faktor</div>';

    // Show max 3 factors
    const topFactors = factors.slice(0, 3);

    return topFactors.map(factor => `
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600 dark:text-gray-400">${factor.name}</span>
        <span class="${factor.positive ? 'text-green-500' : 'text-red-500'} font-medium">
          ${factor.impact}
        </span>
      </div>
    `).join('');
  },

  /**
   * Get text color class
   * @param {string} color
   * @returns {string}
   */
  getTextColor(color) {
    const colors = {
      green: 'text-green-500',
      blue: 'text-blue-500',
      yellow: 'text-yellow-500',
      orange: 'text-orange-500',
      red: 'text-red-500'
    };
    return colors[color] || colors.blue;
  },

  /**
   * Get stroke color class
   * @param {string} color
   * @returns {string}
   */
  getStrokeColor(color) {
    const colors = {
      green: 'stroke-green-500',
      blue: 'stroke-blue-500',
      yellow: 'stroke-yellow-500',
      orange: 'stroke-orange-500',
      red: 'stroke-red-500'
    };
    return colors[color] || colors.blue;
  },

  /**
   * Show details modal
   */
  showDetails() {
    const scoreData = AppStore?.getDashboard()?.healthScoreDetails;
    if (!scoreData) return;

    const factorsHtml = (scoreData.factors || []).map(factor => `
      <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <span class="text-gray-700 dark:text-gray-300">${factor.name}</span>
        <span class="${factor.positive ? 'text-green-500 bg-green-50 dark:bg-green-900/30' : 'text-red-500 bg-red-50 dark:bg-red-900/30'} px-2 py-1 rounded text-sm font-medium">
          ${factor.impact}
        </span>
      </div>
    `).join('');

    Modal?.show({
      title: 'Detail Skor Kesehatan',
      type: 'info',
      size: 'md',
      showCancel: false,
      confirmText: 'Tutup',
      html: `
        <div class="text-left">
          <div class="flex items-center justify-center gap-4 mb-6">
            <div class="text-5xl font-bold ${this.getTextColor(scoreData.color)}">${scoreData.grade}</div>
            <div>
              <div class="text-3xl font-bold text-gray-900 dark:text-white">${scoreData.score}</div>
              <div class="text-sm ${this.getTextColor(scoreData.color)}">${scoreData.label}</div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Faktor Penilaian</h4>
            ${factorsHtml || '<p class="text-gray-400">Tidak ada faktor</p>'}
          </div>
        </div>
      `
    });
  },

  /**
   * Render compact version (for small spaces)
   * @param {Object} scoreData
   * @returns {string}
   */
  renderCompact(scoreData) {
    if (!scoreData) return '';

    const { score, grade, color } = scoreData;

    return `
      <div class="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="w-8 h-8 rounded-full flex items-center justify-center ${this.getBgColor(color)}">
          <span class="text-sm font-bold text-white">${grade}</span>
        </div>
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Skor</div>
          <div class="text-sm font-bold text-gray-900 dark:text-white">${score}</div>
        </div>
      </div>
    `;
  },

  /**
   * Get background color class
   * @param {string} color
   * @returns {string}
   */
  getBgColor(color) {
    const colors = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[color] || colors.blue;
  }
};

// Export global
window.HealthScoreCard = HealthScoreCard;
