/**
 * Campus Silent SOS - Main Application Orchestrator
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Toast System
  window.showToast = function(message, type = 'normal') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'danger' ? 'toast-danger' : (type === 'success' ? 'toast-success' : '')}`;
    
    let icon = 'info';
    if (type === 'danger') icon = 'alert-triangle';
    if (type === 'success') icon = 'check-circle-2';

    toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // 2. Initialize Subsystems
  if (window.campusMap) window.campusMap.init();
  if (window.sosEngine) window.sosEngine.init();
  if (window.camouflageController) window.camouflageController.init();
  if (window.safeWalkController) window.safeWalkController.init();
  if (window.dispatchController) window.dispatchController.init();
  if (window.safetyTools) window.safetyTools.init();
  if (window.adminController) window.adminController.init();
  if (window.authController) window.authController.init();

  // 3. Setup Navigation / View Switcher (Student Client vs Security Dispatch vs Admin)
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.view-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetId = tab.getAttribute('data-target');
      
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
        
        // Invalidate map size if switching back to student view
        if (targetId === 'view-student' && window.campusMap?.map) {
          setTimeout(() => window.campusMap.map.invalidateSize(), 150);
        }
      }
    });
  });

  // 4. Global Hotkey for Instant SOS Trigger: Ctrl + Shift + S
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      if (window.sosEngine && !window.state.activeSos && window.authController?.currentUser) {
        window.sosEngine.completeTrigger("HotKey Quick Silent SOS (Ctrl+Shift+S)");
      }
    }
  });

  // 5. Check if user already had active SOS from stored state
  if (window.state.activeSos) {
    window.sosEngine?.renderActiveDistress(window.state.activeSos);
    window.campusMap?.showSosBeacon(window.state.activeSos);
  }

  // 6. Update Active Alerts Badge
  const count = window.state.getActiveSosCount();
  const badge = document.getElementById('activeAlertsBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  // 7. Initial icon render
  if (window.lucide) window.lucide.createIcons();

  console.log("%c Campus Silent SOS Sentinel Active %c Secure Enclave Online ", "background:#EF4444; color:#fff; font-weight:bold;", "background:#0B0F19; color:#06B6D4;");
});
