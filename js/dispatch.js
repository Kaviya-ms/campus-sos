/**
 * Campus Silent SOS - Campus Security Dispatch Command Controller
 */

class DispatchController {
  constructor() {
    this.selectedIncident = null;
    this.audioInterval = null;
    this.isPlayingAudio = false;
  }

  init() {
    this.bindEvents();
    this.renderIncidents();
    this.updateStats();

    // Listen to state updates
    window.state.on('incidents:updated', () => {
      this.renderIncidents();
      this.updateStats();
      if (this.selectedIncident) {
        const fresh = window.state.incidents.find(i => i.id === this.selectedIncident.id);
        if (fresh) this.showIncidentDetail(fresh);
      }
    });

    window.state.on('sos:triggered', (sos) => {
      this.showIncidentDetail(sos);
      this.playDispatchChime();
    });
  }

  bindEvents() {
    // Test Incoming Alert Simulation
    document.getElementById('btnSimulateIncoming')?.addEventListener('click', () => {
      this.simulateIncomingIncident();
    });

    // Dispatch Patrol Unit
    document.getElementById('btnDispatchUnit')?.addEventListener('click', () => {
      if (!this.selectedIncident) return;
      window.state.updateIncidentStatus(this.selectedIncident.id, 'DISPATCHED', 'Patrol Unit #4 (ETA 2 min)');
      if (window.showToast) {
        window.showToast("Patrol Unit #4 Dispatched to " + this.selectedIncident.building, "success");
      }
    });

    // Silent Two-Way Text Channel
    document.getElementById('btnContactStudent')?.addEventListener('click', () => {
      if (!this.selectedIncident) return;
      const msg = prompt(`Send silent prompt to ${this.selectedIncident.studentName} (Appears silently in notification):`, "Security unit arriving at your location in 2 minutes. Stay hidden.");
      if (msg) {
        if (window.showToast) {
          window.showToast(`Silent message sent to ${this.selectedIncident.studentName}`, "success");
        }
      }
    });

    // Mark Resolved
    document.getElementById('btnResolveIncident')?.addEventListener('click', () => {
      if (!this.selectedIncident) return;
      window.state.updateIncidentStatus(this.selectedIncident.id, 'RESOLVED');
      if (window.showToast) {
        window.showToast(`Incident ${this.selectedIncident.id} marked RESOLVED`, "success");
      }
    });

    // Play Ambient Audio
    document.getElementById('btnPlayAmbient')?.addEventListener('click', () => {
      this.toggleAudioPlayback();
    });
  }

  renderIncidents() {
    const container = document.getElementById('incidentListContainer');
    if (!container) return;

    container.innerHTML = '';
    const incidents = window.state.incidents;

    if (incidents.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:12px;">No incidents on record</div>`;
      return;
    }

    incidents.forEach(inc => {
      const isSelected = this.selectedIncident && this.selectedIncident.id === inc.id;
      const item = document.createElement('div');
      item.className = `incident-item ${inc.status === 'OPEN' ? 'urgent' : ''} ${isSelected ? 'selected' : ''}`;
      
      let badgeClass = 'badge-emergency';
      let badgeLabel = 'CRITICAL SOS';

      if (inc.status === 'RESOLVED') {
        badgeClass = 'badge-resolved';
        badgeLabel = 'RESOLVED';
      } else if (inc.type === 'SAFEWALK_EXPIRED') {
        badgeClass = 'badge-safewalk';
        badgeLabel = 'SAFEWALK TIMEOUT';
      } else if (inc.status === 'DISPATCHED') {
        badgeClass = 'badge-emergency';
        badgeLabel = 'UNIT EN ROUTE';
      }

      item.innerHTML = `
        <div class="item-top-row">
          <span class="incident-badge ${badgeClass}">${badgeLabel}</span>
          <span class="item-time">${inc.timeStr}</span>
        </div>
        <div class="item-student-name">${inc.studentName} (${inc.studentId})</div>
        <div class="item-location">
          <i data-lucide="map-pin"></i>
          <span>${inc.building} - ${inc.room}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        this.showIncidentDetail(inc);
      });

      container.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  showIncidentDetail(inc) {
    this.selectedIncident = inc;
    
    // Highlight list
    document.querySelectorAll('.incident-item').forEach(el => el.classList.remove('selected'));
    
    const emptyState = document.getElementById('emptyDetailState');
    const content = document.getElementById('activeDetailContent');

    if (emptyState) emptyState.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    // Populate data
    document.getElementById('detStudentName').textContent = inc.studentName;
    document.getElementById('detStudentId').textContent = inc.studentId;
    document.getElementById('detPhone').textContent = inc.phone;
    document.getElementById('detBattery').textContent = `${inc.battery}%`;
    document.getElementById('detTime').textContent = inc.timeStr;
    document.getElementById('detId').textContent = inc.id;

    document.getElementById('detLocation').textContent = inc.building;
    document.getElementById('detIndoor').textContent = `${inc.floor} • ${inc.room}`;
    document.getElementById('detCoords').textContent = `GPS: ${inc.lat.toFixed(4)}° N, ${Math.abs(inc.lng).toFixed(4)}° W (Accuracy ±3m)`;
    document.getElementById('detSituationNote').textContent = `"${inc.situationNote || 'No special note provided'}"`;

    const badge = document.getElementById('detBadge');
    if (badge) {
      badge.textContent = inc.status === 'RESOLVED' ? 'RESOLVED' : (inc.status === 'DISPATCHED' ? 'PATROL DISPATCHED' : 'CRITICAL SOS');
      badge.className = `incident-badge ${inc.status === 'RESOLVED' ? 'badge-resolved' : 'badge-emergency'}`;
    }

    if (window.campusMap) {
      window.campusMap.map.flyTo([inc.lat, inc.lng], 17);
    }
  }

  updateStats() {
    const activeCount = window.state.getActiveSosCount();
    const countEl = document.getElementById('countActiveSos');
    if (countEl) countEl.textContent = activeCount;

    const badge = document.getElementById('activeAlertsBadge');
    if (badge) {
      badge.textContent = activeCount;
      badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }
  }

  toggleAudioPlayback() {
    const btn = document.getElementById('btnPlayAmbient');
    const visual = document.getElementById('audioWaveVisual');
    const bars = visual?.querySelectorAll('.wave-bar');

    if (this.isPlayingAudio) {
      // Stop
      this.isPlayingAudio = false;
      if (this.audioInterval) clearInterval(this.audioInterval);
      if (btn) btn.innerHTML = `<i data-lucide="volume-2"></i> Play Recorded Ambient`;
      bars?.forEach(b => b.style.height = '6px');
    } else {
      // Start Simulated Ambient Playback with Synthesized Audio
      this.isPlayingAudio = true;
      if (btn) btn.innerHTML = `<i data-lucide="square"></i> Stop Playback`;
      
      this.playSyntheticAmbientAudio();

      this.audioInterval = setInterval(() => {
        bars?.forEach(b => {
          const h = Math.floor(6 + Math.random() * 26);
          b.style.height = `${h}px`;
        });
      }, 120);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  playSyntheticAmbientAudio() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();

      setTimeout(() => {
        try {
          osc.stop();
          audioCtx.close();
        } catch (e) {}
      }, 4000);
    } catch (e) {}
  }

  playDispatchChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3); // A4

      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
  }

  simulateIncomingIncident() {
    const buildings = [
      { name: "Student Union Center", room: "Food Court West", lat: 37.4262, lng: -122.1685 },
      { name: "Athletics Complex & Field", room: "Bleachers Row 4", lat: 37.4248, lng: -122.1662 },
      { name: "Arts & Humanities Hall", room: "Studio 102", lat: 37.4278, lng: -122.1691 }
    ];
    const b = buildings[Math.floor(Math.random() * buildings.length)];
    const names = ["Tyler Brooks", "Sophia Martinez", "Devon Cole"];
    const name = names[Math.floor(Math.random() * names.length)];

    const id = "INC-" + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newInc = {
      id: id,
      studentName: name,
      studentId: "ST-" + Math.floor(1000 + Math.random() * 8000),
      phone: "+1 (555) " + Math.floor(100 + Math.random() * 900) + "-" + Math.floor(1000 + Math.random() * 9000),
      battery: Math.floor(60 + Math.random() * 35),
      type: "EMERGENCY_SOS",
      timeStr: timeStr,
      timestamp: Date.now(),
      building: b.name,
      floor: "Level 1",
      room: b.room,
      lat: b.lat,
      lng: b.lng,
      situationNote: "Discreet SOS triggered from phone volume buttons",
      status: "OPEN",
      hasAudio: true,
      assignedUnit: null
    };

    window.state.incidents.unshift(newInc);
    window.state.emit('incidents:updated', window.state.incidents);
    this.showIncidentDetail(newInc);
    this.playDispatchChime();

    if (window.showToast) {
      window.showToast(`🚨 New Distress Alert: ${name} (${b.name})`, "danger");
    }
  }
}

window.dispatchController = new DispatchController();
