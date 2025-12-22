// Kiyosaki Finance Tracker - Gamification Module

const STREAK_KEY = 'kiyosaki_streak';
const LAST_ACTIVITY_KEY = 'kiyosaki_last_activity';

/**
 * Get current streak
 */
function getStreak() {
  const streakData = localStorage.getItem(STREAK_KEY);
  if (!streakData) return { count: 0, lastDate: null };
  return JSON.parse(streakData);
}

/**
 * Update streak based on activity
 */
function updateStreak() {
  const today = new Date().toISOString().split('T')[0];
  const streak = getStreak();
  const lastDate = streak.lastDate;

  if (lastDate === today) {
    // Already recorded today
    return streak.count;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newCount;
  if (lastDate === yesterdayStr) {
    // Consecutive day
    newCount = streak.count + 1;
  } else {
    // Streak broken, start fresh
    newCount = 1;
  }

  const newStreak = { count: newCount, lastDate: today };
  localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));

  return newCount;
}

/**
 * Get streak display
 */
function getStreakDisplay() {
  const streak = getStreak();
  if (streak.count === 0) return null;

  return `
    <div class="streak-badge streak-fire">
      <span>🔥</span>
      <span>${streak.count} hari</span>
    </div>
  `;
}

/**
 * Show celebration after transaction
 */
function showCelebration(type = 'success') {
  // Show success overlay briefly
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.innerHTML = `
    <div class="success-checkmark">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12" class="checkmark-path"></polyline>
      </svg>
    </div>
    <p class="text-white text-lg font-semibold">Transaksi Berhasil!</p>
    <p class="text-white/80 text-sm mt-1">${getMotivationalQuote()}</p>
  `;
  document.body.appendChild(overlay);

  // Trigger confetti
  createConfetti();

  // Remove after delay
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  }, 1500);
}

/**
 * Create confetti effect
 */
function createConfetti() {
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const confettiCount = 30;

  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      document.body.appendChild(confetti);

      // Remove confetti after animation
      setTimeout(() => confetti.remove(), 4000);
    }, i * 50);
  }
}

/**
 * Get motivational quote
 */
function getMotivationalQuote() {
  const quotes = [
    'Langkah kecil, dampak besar! 💪',
    'Konsisten adalah kunci! 🔑',
    'Satu langkah lebih dekat ke kebebasan finansial! 🎯',
    'Rich Dad akan bangga padamu! 📈',
    'Catatan yang rapi, masa depan yang cerah! ✨',
    'Kamu luar biasa! Terus semangat! 🌟',
    'Kebiasaan baik dimulai dari sekarang! 🚀'
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Check and show streak notification
 */
function checkStreakNotification() {
  const streak = getStreak();
  const milestones = [7, 14, 30, 60, 90, 100, 365];

  if (milestones.includes(streak.count)) {
    showStreakMilestone(streak.count);
  }
}

/**
 * Show streak milestone achievement
 */
function showStreakMilestone(days) {
  const badges = {
    7: { icon: '🏅', title: 'Minggu Pertama!', desc: '7 hari berturut-turut' },
    14: { icon: '🥈', title: 'Dua Minggu!', desc: '14 hari berturut-turut' },
    30: { icon: '🥇', title: 'Satu Bulan!', desc: '30 hari berturut-turut' },
    60: { icon: '🏆', title: 'Dua Bulan!', desc: '60 hari berturut-turut' },
    90: { icon: '💎', title: 'Tiga Bulan!', desc: '90 hari berturut-turut' },
    100: { icon: '👑', title: '100 Hari!', desc: 'Konsistensi luar biasa!' },
    365: { icon: '🎖️', title: 'Satu Tahun!', desc: 'Kamu legenda!' }
  };

  const badge = badges[days];
  if (!badge) return;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-sm p-6 text-center animate-scale-in">
      <div class="text-6xl mb-4 animate-bounce">${badge.icon}</div>
      <h3 class="text-2xl font-bold text-gray-900 mb-2">${badge.title}</h3>
      <p class="text-gray-600 mb-4">${badge.desc}</p>
      <div class="streak-badge mx-auto">
        <span>🔥</span>
        <span>${days} hari streak!</span>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary w-full mt-6">
        Lanjutkan! 🚀
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove();
    }
  }, 5000);
}

/**
 * Animate number counter
 */
function animateCounter(element, start, end, duration = 1000) {
  const range = end - start;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out quad
    const easeOut = 1 - Math.pow(1 - progress, 2);
    const current = Math.round(start + range * easeOut);

    element.textContent = formatRupiah(current);

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }

  requestAnimationFrame(updateNumber);
}

/**
 * Show quick win notification
 */
function showQuickWin(message, type = 'success') {
  const colors = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };

  const notification = document.createElement('div');
  notification.className = `fixed top-4 left-4 right-4 ${colors[type]} text-white rounded-xl p-4 z-50 animate-scale-in`;
  notification.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-2xl">${type === 'success' ? '✨' : type === 'warning' ? '⚡' : '💡'}</span>
      <span class="font-medium">${message}</span>
    </div>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-100%)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Get progress towards goal
 */
function getGoalProgress(current, target) {
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * Render achievement badges
 */
function renderAchievementBadges(container) {
  const streak = getStreak();
  const badges = [];

  if (streak.count >= 7) badges.push({ icon: '🏅', label: '7 Hari' });
  if (streak.count >= 30) badges.push({ icon: '🥇', label: '30 Hari' });
  if (streak.count >= 100) badges.push({ icon: '👑', label: '100 Hari' });

  if (badges.length === 0) {
    container.innerHTML = '<p class="text-gray-400 text-sm">Belum ada badge</p>';
    return;
  }

  container.innerHTML = badges.map(b => `
    <div class="flex flex-col items-center p-2">
      <span class="text-2xl">${b.icon}</span>
      <span class="text-xs text-gray-500">${b.label}</span>
    </div>
  `).join('');
}

// Make functions globally available
window.getStreak = getStreak;
window.updateStreak = updateStreak;
window.getStreakDisplay = getStreakDisplay;
window.showCelebration = showCelebration;
window.createConfetti = createConfetti;
window.checkStreakNotification = checkStreakNotification;
window.animateCounter = animateCounter;
window.showQuickWin = showQuickWin;
window.getGoalProgress = getGoalProgress;
window.renderAchievementBadges = renderAchievementBadges;
