/**
 * Campus Silent SOS - Authentication Controller (Local Demo Authentication)
 */

class AuthController {
  constructor() {
    this.demoUsers = {
      'student@campus.com': {
        password: 'student123',
        role: 'student',
        name: 'Jane Doe',
        id: 'ST-8841',
        phone: '+1 (555) 234-5678',
        avatar: 'JD',
        roleLabel: 'Student (Resident)',
        battery: 94
      },
      'security@campus.com': {
        password: 'security123',
        role: 'security',
        name: 'Officer Vance',
        id: 'SEC-402',
        phone: '+1 (555) 911-CAMP',
        avatar: 'OV',
        roleLabel: 'Patrol Unit #4',
        battery: 98
      },
      'admin@campus.com': {
        password: 'admin123',
        role: 'admin',
        name: 'Chief Reynolds',
        id: 'ADM-001',
        phone: '+1 (555) 000-ADMN',
        avatar: 'CR',
        roleLabel: 'System Administrator',
        battery: 100
      }
    };

    // Alias usernames/IDs for flexible login
    this.aliases = {
      'student': 'student@campus.com',
      'st-8841': 'student@campus.com',
      'security': 'security@campus.com',
      'sec-402': 'security@campus.com',
      'admin': 'admin@campus.com',
      'adm-001': 'admin@campus.com'
    };

    this.currentUser = null;
  }

  init() {
    this.bindLoginForm();
    this.bindQuickDemoFillButtons();
    this.bindLogout();
    this.checkExistingSession();
  }

  checkExistingSession() {
    try {
      const stored = sessionStorage.getItem('campus_sos_auth_user');
      if (stored) {
        const user = JSON.parse(stored);
        this.setAuthenticatedSession(user, false);
      } else {
        this.showLoginView();
      }
    } catch (e) {
      this.showLoginView();
    }
  }

  bindLoginForm() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const errorBanner = document.getElementById('loginErrorBanner');
    const btnTogglePass = document.getElementById('btnTogglePassword');

    // Password visibility toggle
    btnTogglePass?.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      const icon = btnTogglePass.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', type === 'password' ? 'eye' : 'eye-off');
        if (window.lucide) window.lucide.createIcons();
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const identifier = emailInput?.value.trim().toLowerCase() || '';
      const password = passwordInput?.value.trim() || '';

      const resolvedEmail = this.aliases[identifier] || identifier;
      const user = this.demoUsers[resolvedEmail];

      if (user && user.password === password) {
        if (errorBanner) errorBanner.classList.add('hidden');
        this.setAuthenticatedSession(user, true);
      } else {
        if (errorBanner) {
          errorBanner.textContent = 'Invalid credentials. Please use the demo credentials below.';
          errorBanner.classList.remove('hidden');
        }
        if (navigator.vibrate) navigator.vibrate(50);
      }
    });
  }

  bindQuickDemoFillButtons() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const form = document.getElementById('loginForm');

    document.querySelectorAll('.demo-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-demo-role');
        if (role === 'student') {
          if (emailInput) emailInput.value = 'student@campus.com';
          if (passwordInput) passwordInput.value = 'student123';
        } else if (role === 'security') {
          if (emailInput) emailInput.value = 'security@campus.com';
          if (passwordInput) passwordInput.value = 'security123';
        } else if (role === 'admin') {
          if (emailInput) emailInput.value = 'admin@campus.com';
          if (passwordInput) passwordInput.value = 'admin123';
        }
        
        // Auto submit for instant experience if user clicks
        form?.dispatchEvent(new Event('submit'));
      });
    });
  }

  bindLogout() {
    const btnLogout = document.getElementById('btnLogout');
    btnLogout?.addEventListener('click', () => {
      this.logout();
    });
  }

  setAuthenticatedSession(user, showToastMsg = true) {
    this.currentUser = user;
    sessionStorage.setItem('campus_sos_auth_user', JSON.stringify(user));

    // Update global state user
    window.state.user = {
      ...window.state.user,
      name: user.name,
      studentId: user.id,
      phone: user.phone,
      battery: user.battery,
      role: user.role
    };

    // Update Header UI
    this.updateHeaderForUser(user);

    // Show App Header and hide Login View
    const header = document.getElementById('appHeader');
    const loginView = document.getElementById('view-login');
    if (header) header.classList.remove('hidden');
    if (loginView) loginView.classList.remove('active');

    // Route to appropriate view based on role
    this.routeUserToDashboard(user.role);

    if (showToastMsg && window.showToast) {
      window.showToast(`Logged in as ${user.name} (${user.roleLabel})`, 'success');
    }
  }

  updateHeaderForUser(user) {
    const avatarEl = document.getElementById('headerUserAvatar');
    const nameEl = document.getElementById('headerUserName');
    const idEl = document.getElementById('headerUserId');
    const rolePill = document.getElementById('headerRolePill');

    if (avatarEl) avatarEl.textContent = user.avatar;
    if (nameEl) nameEl.textContent = user.name;
    if (idEl) idEl.textContent = `${user.id}`;
    if (rolePill) {
      rolePill.textContent = user.role.toUpperCase();
      rolePill.className = `role-badge-tag role-${user.role}`;
    }

    // Role-based Nav Tabs display
    const tabStudent = document.getElementById('tabStudent');
    const tabDispatch = document.getElementById('tabDispatch');
    const tabAdmin = document.getElementById('tabAdmin');

    if (tabStudent) tabStudent.style.display = 'flex';
    if (tabDispatch) tabDispatch.style.display = (user.role === 'security' || user.role === 'admin') ? 'flex' : 'none';
    if (tabAdmin) tabAdmin.style.display = (user.role === 'admin') ? 'flex' : 'none';
  }

  routeUserToDashboard(role) {
    let targetViewId = 'view-student';
    let targetTabId = 'tabStudent';

    if (role === 'security') {
      targetViewId = 'view-dispatch';
      targetTabId = 'tabDispatch';
    } else if (role === 'admin') {
      targetViewId = 'view-admin';
      targetTabId = 'tabAdmin';
    }

    // Switch view
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    const panel = document.getElementById(targetViewId);
    const tab = document.getElementById(targetTabId);

    if (panel) panel.classList.add('active');
    if (tab) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    }

    // Map resize trigger if student or dispatch view
    if (window.campusMap?.map) {
      setTimeout(() => window.campusMap.map.invalidateSize(), 200);
    }
  }

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('campus_sos_auth_user');

    if (window.sosEngine && window.state.activeSos) {
      // Cancel active SOS if logging out
      window.state.cancelSos();
    }

    this.showLoginView();

    if (window.showToast) {
      window.showToast('Logged out successfully', 'normal');
    }
  }

  showLoginView() {
    // Hide header
    const header = document.getElementById('appHeader');
    if (header) header.classList.add('hidden');

    // Hide all view panels except login
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    const loginView = document.getElementById('view-login');
    if (loginView) loginView.classList.add('active');

    // Clear form inputs
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const errorBanner = document.getElementById('loginErrorBanner');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorBanner) errorBanner.classList.add('hidden');
  }
}

window.authController = new AuthController();
