// Kiyosaki Finance Tracker - Authentication Module

/**
 * Check if Supabase is ready
 * @returns {boolean} True if Supabase is ready
 */
function isSupabaseReady() {
  if (!window.db) {
    console.error('Supabase client not initialized');
    return false;
  }
  return true;
}

/**
 * Register new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} fullName - User full name
 * @returns {Promise<Object>} Registration result
 */
async function register(email, password, fullName) {
  try {
    showLoading();
    const { data, error } = await window.db.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) throw error;

    hideLoading();
    return { success: true, data };
  } catch (error) {
    hideLoading();
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login result
 */
async function login(email, password) {
  try {
    showLoading();
    const { data, error } = await window.db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    hideLoading();
    return { success: true, data };
  } catch (error) {
    hideLoading();
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Logout user
 * @returns {Promise<Object>} Logout result
 */
async function logout() {
  try {
    showLoading();
    const { error } = await window.db.auth.signOut();

    if (error) throw error;

    // Clear local storage
    removeStorage('user');
    removeStorage('lastSync');

    hideLoading();
    window.location.href = 'index.html';
    return { success: true };
  } catch (error) {
    hideLoading();
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>} Current user or null
 */
async function getCurrentUser() {
  try {
    const { data: { user } } = await window.db.auth.getUser();
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Get current session
 * @returns {Promise<Object|null>} Current session or null
 */
async function getSession() {
  try {
    const { data: { session } } = await window.db.auth.getSession();
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Check authentication state and redirect if needed
 * @returns {Promise<Object|null>} Current user or null
 */
async function checkAuth() {
  const user = await getCurrentUser();
  const isAuthPage = window.location.pathname.includes('index.html') ||
                     window.location.pathname.endsWith('/');

  if (!user && !isAuthPage) {
    // Not logged in and on protected page - redirect to login
    window.location.href = 'index.html';
    return null;
  }

  if (user && isAuthPage) {
    // Logged in but on auth page - redirect to app
    window.location.href = 'app.html';
    return user;
  }

  return user;
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset result
 */
async function requestPasswordReset(email) {
  try {
    showLoading();
    const { error } = await window.db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });

    if (error) throw error;

    hideLoading();
    return { success: true };
  } catch (error) {
    hideLoading();
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Update result
 */
async function updatePassword(newPassword) {
  try {
    showLoading();
    const { error } = await window.db.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    hideLoading();
    return { success: true };
  } catch (error) {
    hideLoading();
    console.error('Update password error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Update result
 */
async function updateProfile(updates) {
  try {
    showLoading();
    const { data, error } = await window.db.auth.updateUser({
      data: updates
    });

    if (error) throw error;

    hideLoading();
    return { success: true, data };
  } catch (error) {
    hideLoading();
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription
 */
function onAuthStateChange(callback) {
  return window.db.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Get user display name
 * @param {Object} user - User object
 * @returns {string} Display name
 */
function getUserDisplayName(user) {
  if (!user) return 'User';
  return user.user_metadata?.full_name ||
         user.email?.split('@')[0] ||
         'User';
}

/**
 * Initialize auth page (login/register)
 */
function initAuthPage() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegisterBtn = document.getElementById('showRegister');
  const showLoginBtn = document.getElementById('showLogin');
  const loginSection = document.getElementById('loginSection');
  const registerSection = document.getElementById('registerSection');

  // Toggle between login and register
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginSection?.classList.add('hidden');
      registerSection?.classList.remove('hidden');
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      registerSection?.classList.add('hidden');
      loginSection?.classList.remove('hidden');
    });
  }

  // Login form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      const result = await login(email, password);

      if (result.success) {
        showToast('Login berhasil!', 'success');
        setTimeout(() => {
          window.location.href = 'app.html';
        }, 500);
      } else {
        showToast(result.error || 'Login gagal', 'error');
      }
    });
  }

  // Register form submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('registerConfirmPassword').value;

      if (password !== confirmPassword) {
        showToast('Password tidak cocok', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password minimal 6 karakter', 'error');
        return;
      }

      const result = await register(email, password, fullName);

      if (result.success) {
        showToast('Registrasi berhasil! Silakan cek email untuk verifikasi.', 'success');
        registerSection?.classList.add('hidden');
        loginSection?.classList.remove('hidden');
      } else {
        showToast(result.error || 'Registrasi gagal', 'error');
      }
    });
  }

  // Check if user is already logged in
  checkAuth();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    getSession,
    checkAuth,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    onAuthStateChange,
    getUserDisplayName,
    initAuthPage
  };
}
