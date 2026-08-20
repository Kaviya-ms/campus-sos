/**
 * Campus Silent SOS - Admin Dashboard Controller
 */

class AdminController {
  constructor() {
    this.broadcastActive = false;
  }

  init() {
    this.bindEvents();
    this.renderTowerTable();
    this.renderAuditLogs();
  }

  bindEvents() {
    // Campus-Wide Broadcast Alert Form
    const btnSendBroadcast = document.getElementById('btnSendBroadcast');
    const inputBroadcast = document.getElementById('inputBroadcastMsg');

    btnSendBroadcast?.addEventListener('click', () => {
      const msg = inputBroadcast?.value.trim();
      if (!msg) {
        alert("Please enter a broadcast announcement message.");
        return;
      }

      this.triggerCampusBroadcast(msg);
      if (inputBroadcast) inputBroadcast.value = '';
    });

    // Clear Audit Logs
    document.getElementById('btnClearAuditLogs')?.addEventListener('click', () => {
      if (confirm("Are you sure you want to clear historical incident logs?")) {
        window.state.incidents = window.state.incidents.filter(i => i.status !== 'RESOLVED');
        window.state.saveState();
        window.state.emit('incidents:updated', window.state.incidents);
        this.renderAuditLogs();
        if (window.showToast) window.showToast("Resolved incident archives cleared", "normal");
      }
    });

    // Listen to incident updates to refresh audit log
    window.state.on('incidents:updated', () => {
      this.renderAuditLogs();
    });
  }

  triggerCampusBroadcast(message) {
    if (window.showToast) {
      window.showToast(`📢 CAMPUS BROADCAST: ${message}`, "danger");
    }

    // Play alert sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  }

  renderTowerTable() {
    const tbody = document.getElementById('adminTowerTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const towers = window.state.campusInfrastructure.towers;

    towers.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${t.id}</strong></td>
        <td>${t.name}</td>
        <td><code>${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}</code></td>
        <td><span class="status-badge ${t.active ? 'status-online' : 'status-offline'}">${t.active ? 'Operational' : 'Maintenance'}</span></td>
        <td>
          <button class="btn-toggle-tower ${t.active ? 'active' : ''}" data-tower-id="${t.id}">
            ${t.active ? 'Active' : 'Offline'}
          </button>
        </td>
      `;

      const btnToggle = tr.querySelector('.btn-toggle-tower');
      btnToggle?.addEventListener('click', (e) => {
        t.active = !t.active;
        this.renderTowerTable();
        if (window.campusMap) window.campusMap.applyFilter(window.campusMap.currentFilter);
        if (window.showToast) {
          window.showToast(`${t.name} set to ${t.active ? 'Operational' : 'Maintenance'}`, t.active ? 'success' : 'normal');
        }
      });

      tbody.appendChild(tr);
    });
  }

  renderAuditLogs() {
    const container = document.getElementById('adminAuditLogsContainer');
    if (!container) return;

    container.innerHTML = '';
    const incidents = window.state.incidents;

    if (incidents.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted);">No incident records found.</div>`;
      return;
    }

    incidents.forEach(inc => {
      const row = document.createElement('div');
      row.className = 'audit-log-row';
      row.innerHTML = `
        <div class="audit-col-id">
          <span class="incident-badge ${inc.status === 'RESOLVED' ? 'badge-resolved' : 'badge-emergency'}">${inc.id}</span>
          <span class="audit-time">${inc.timeStr}</span>
        </div>
        <div class="audit-col-user">
          <strong>${inc.studentName}</strong> (${inc.studentId})
        </div>
        <div class="audit-col-loc">
          ${inc.building} • ${inc.room}
        </div>
        <div class="audit-col-status">
          <span class="audit-status-tag ${inc.status}">${inc.status}</span>
        </div>
      `;
      container.appendChild(row);
    });
  }
}

window.adminController = new AdminController();
