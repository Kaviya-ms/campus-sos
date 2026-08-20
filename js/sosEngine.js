/**
 * Campus Silent SOS - Core SOS Engine (Hold-to-Activate, Stealth Dispatch, Ambient Audio)
 */

class SosEngine {
  constructor() {
    this.holdDurationMs = 2800; // 2.8 seconds hold to trigger
    this.holdTimer = null;
    this.holdStartTime = null;
    this.animationFrame = null;
    this.isHolding = false;
    this.tapCount = 0;
    this.lastTapTime = 0;
    this.audioMediaRecorder = null;
    this.audioChunks = [];
  }

  init() {
    const triggerBtn = document.getElementById('sosTriggerBtn');
    const cancelBtn = document.getElementById('btnCancelSos');

    if (triggerBtn) {
      // Pointer down / start hold
      triggerBtn.addEventListener('pointerdown', (e) => this.startHold(e));
      
      // Pointer up / leave / cancel hold
      window.addEventListener('pointerup', () => this.cancelHold());
      window.addEventListener('pointercancel', () => this.cancelHold());
      triggerBtn.addEventListener('mouseleave', () => this.cancelHold());

      // Triple Tap Detection
      triggerBtn.addEventListener('click', () => this.handleTap());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.promptCancelSos());
    }

    // Refresh GPS Coordinates button
    document.getElementById('btnRefreshGPS')?.addEventListener('click', () => {
      this.syncLiveGPS();
    });

    // Indoor form changes
    this.bindLocationInputs();
  }

  startHold(e) {
    if (window.state.activeSos) return; // Already active

    this.isHolding = true;
    this.holdStartTime = performance.now();
    
    const triggerBtn = document.getElementById('sosTriggerBtn');
    triggerBtn?.classList.add('holding');

    // Haptic pulse if mobile
    if (navigator.vibrate) navigator.vibrate(40);

    this.updateFeedback("Arming Silent SOS... Keep holding");

    // Animate progress ring
    const animate = () => {
      if (!this.isHolding) return;

      const elapsed = performance.now() - this.holdStartTime;
      const progress = Math.min(elapsed / this.holdDurationMs, 1);
      this.setProgress(progress);

      if (progress >= 1) {
        this.completeTrigger();
      } else {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  cancelHold() {
    if (!this.isHolding) return;
    this.isHolding = false;

    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    
    const triggerBtn = document.getElementById('sosTriggerBtn');
    triggerBtn?.classList.remove('holding');

    // Animate resetting progress ring
    this.setProgress(0);
    
    if (!window.state.activeSos) {
      this.updateFeedback("System armed and ready. Ready to transmit encrypted alert.");
    }
  }

  setProgress(ratio) {
    const circle = document.getElementById('sosProgressBar');
    if (!circle) return;

    const circumference = 2 * Math.PI * 90; // 565.48
    const offset = circumference - (ratio * circumference);
    circle.style.strokeDashoffset = offset;
  }

  handleTap() {
    const now = Date.now();
    if (now - this.lastTapTime < 400) {
      this.tapCount++;
    } else {
      this.tapCount = 1;
    }
    this.lastTapTime = now;

    if (this.tapCount === 3 && !window.state.activeSos) {
      this.tapCount = 0;
      this.completeTrigger("Rapid Triple-Tap Stealth Alert");
    }
  }

  completeTrigger(customNote = "") {
    this.cancelHold();

    // Haptic burst
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    // Start silent ambient audio recording
    this.startAmbientRecording();

    // Fire SOS in central state
    const sos = window.state.triggerSos(customNote);

    // Update UI elements
    this.renderActiveDistress(sos);
    this.updateFeedback("🚨 SILENT SOS TRANSMITTED to Security Dispatch!");

    // Show toast
    if (window.showToast) {
      window.showToast("Silent Emergency SOS Dispatched to Campus Police", "danger");
    }
  }

  renderActiveDistress(sos) {
    const banner = document.getElementById('activeSosBanner');
    const controllerCard = document.getElementById('sosControllerCard');

    if (banner) banner.classList.remove('hidden');
    if (controllerCard) controllerCard.style.borderColor = 'var(--accent-danger)';

    // Update Dispatch Badge
    const badge = document.getElementById('activeAlertsBadge');
    if (badge) {
      const count = window.state.getActiveSosCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  promptCancelSos() {
    const pin = prompt("Enter Safe PIN to cancel emergency alert:", "1234");
    if (pin === "1234" || pin === window.state.safewalk.pin) {
      this.stopAmbientRecording();
      window.state.cancelSos();
      
      const banner = document.getElementById('activeSosBanner');
      if (banner) banner.classList.add('hidden');
      
      const controllerCard = document.getElementById('sosControllerCard');
      if (controllerCard) controllerCard.style.borderColor = 'rgba(239, 68, 68, 0.2)';

      this.updateFeedback("Emergency SOS cancelled safely.");
      this.setProgress(0);

      // Update Dispatch Badge
      const badge = document.getElementById('activeAlertsBadge');
      if (badge) {
        const count = window.state.getActiveSosCount();
        badge.textContent = count;
      }

      if (window.showToast) {
        window.showToast("SOS Alert Cancelled with Safe PIN", "success");
      }
    } else if (pin !== null) {
      alert("Incorrect PIN. Alert remains active.");
    }
  }

  updateFeedback(msg) {
    const fb = document.getElementById('sosFeedbackText');
    if (fb) fb.textContent = msg;
  }

  bindLocationInputs() {
    const selBuilding = document.getElementById('selectBuilding');
    const selFloor = document.getElementById('inputFloor');
    const txtRoom = document.getElementById('inputRoom');
    const txtNote = document.getElementById('inputSituationNote');

    const updateLoc = () => {
      window.state.currentLocation.building = selBuilding?.value || "";
      window.state.currentLocation.floor = selFloor?.value || "";
      window.state.currentLocation.room = txtRoom?.value || "";
      window.state.currentLocation.situationNote = txtNote?.value || "";
      window.state.saveState();
    };

    selBuilding?.addEventListener('change', updateLoc);
    selFloor?.addEventListener('change', updateLoc);
    txtRoom?.addEventListener('input', updateLoc);
    txtNote?.addEventListener('input', updateLoc);
  }

  syncLiveGPS() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          window.state.currentLocation.lat = pos.coords.latitude;
          window.state.currentLocation.lng = pos.coords.longitude;
          window.state.currentLocation.accuracy = pos.coords.accuracy || 3;
          if (window.campusMap) window.campusMap.renderUserLocation();
          if (window.showToast) window.showToast("GPS Synchronized ±" + Math.round(pos.coords.accuracy) + "m", "success");
        },
        (err) => {
          console.warn("GPS lookup defaulted to campus coordinates", err);
          if (window.showToast) window.showToast("Simulated Campus GPS Synced (Stanford Quad)", "success");
        },
        { timeout: 4000 }
      );
    }
  }

  startAmbientRecording() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          this.audioMediaRecorder = new MediaRecorder(stream);
          this.audioChunks = [];
          this.audioMediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
          this.audioMediaRecorder.start();
        }).catch(err => {
          console.log("Mic access simulated", err);
        });
      }
    } catch (e) {
      console.log("Audio capture simulated", e);
    }
  }

  stopAmbientRecording() {
    if (this.audioMediaRecorder && this.audioMediaRecorder.state !== 'inactive') {
      try {
        this.audioMediaRecorder.stop();
      } catch (e) {}
    }
  }
}

window.sosEngine = new SosEngine();
