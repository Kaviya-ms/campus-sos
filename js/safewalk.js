/**
 * Campus Silent SOS - SafeWalk Dead-Man's Timer Engine
 */

class SafeWalkController {
  constructor() {
    this.timerInterval = null;
    this.selectedMinutes = 10;
  }

  init() {
    this.bindModal();
    this.bindWidget();
  }

  bindModal() {
    const modal = document.getElementById('modalSafeWalk');
    const btnOpen = document.getElementById('btnQuickSafeWalk');
    const btnClose = document.getElementById('btnCloseSafeWalkModal');
    const btnCancel = document.getElementById('btnCancelSafeWalkSetup');
    const btnStart = document.getElementById('btnStartSafeWalkTimer');

    btnOpen?.addEventListener('click', () => {
      modal?.classList.remove('hidden');
    });

    const hideModal = () => modal?.classList.add('hidden');
    btnClose?.addEventListener('click', hideModal);
    btnCancel?.addEventListener('click', hideModal);

    // Duration Chips
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        chips.forEach(c => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.selectedMinutes = parseInt(e.currentTarget.getAttribute('data-min'), 10) || 10;
      });
    });

    // Start SafeWalk
    btnStart?.addEventListener('click', () => {
      const destSelect = document.getElementById('swSelectDest');
      const pinInput = document.getElementById('swInputPin');

      const destination = destSelect?.value || "Residential Quad - Dorm C";
      const pin = pinInput?.value || "1234";

      this.startTimer(destination, this.selectedMinutes, pin);
      hideModal();
    });
  }

  bindWidget() {
    const btnCheckIn = document.getElementById('btnSafeCheckIn');
    btnCheckIn?.addEventListener('click', () => this.promptCheckIn());
  }

  startTimer(destination, minutes, pin) {
    const totalSeconds = minutes * 60;
    
    window.state.safewalk = {
      isActive: true,
      destination: destination,
      totalSeconds: totalSeconds,
      remainingSeconds: totalSeconds,
      pin: pin,
      timerId: null
    };

    // Show Widget
    const widget = document.getElementById('safewalkWidget');
    const destText = document.getElementById('safewalkDestText');
    if (widget) widget.classList.remove('hidden');
    if (destText) destText.textContent = `Route: Library → ${destination}`;

    this.updateDisplay();

    // Start Interval
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      window.state.safewalk.remainingSeconds--;
      this.updateDisplay();

      if (window.state.safewalk.remainingSeconds <= 0) {
        this.escalateTimeout();
      }
    }, 1000);

    if (window.showToast) {
      window.showToast(`SafeWalk Sentinel Active (${minutes} mins)`, "success");
    }
  }

  updateDisplay() {
    const sw = window.state.safewalk;
    const display = document.getElementById('safewalkDisplay');
    const bar = document.getElementById('safewalkBar');

    if (!sw.isActive) return;

    const mins = Math.floor(sw.remainingSeconds / 60);
    const secs = sw.remainingSeconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (display) display.textContent = timeStr;

    if (bar) {
      const percent = Math.max(0, (sw.remainingSeconds / sw.totalSeconds) * 100);
      bar.style.width = `${percent}%`;

      if (percent < 20) {
        bar.style.background = 'linear-gradient(90deg, #EF4444, #F59E0B)';
      }
    }
  }

  promptCheckIn() {
    const enteredPin = prompt("Enter your SafeWalk deactivation PIN:", "1234");
    if (enteredPin === window.state.safewalk.pin) {
      this.stopTimer();
      if (window.showToast) {
        window.showToast("SafeWalk Completed! Checked in safely.", "success");
      }
    } else if (enteredPin !== null) {
      alert("Incorrect PIN! SafeWalk timer continues.");
    }
  }

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    window.state.safewalk.isActive = false;

    const widget = document.getElementById('safewalkWidget');
    if (widget) widget.classList.add('hidden');
  }

  escalateTimeout() {
    this.stopTimer();

    // Auto-fire SOS
    const dest = window.state.safewalk.destination;
    window.state.triggerSos(`SafeWalk Timer Expired (Destination: ${dest}). Automatic Distress Escalation.`);

    if (window.sosEngine) {
      window.sosEngine.renderActiveDistress(window.state.activeSos);
      window.sosEngine.startAmbientRecording();
    }

    if (window.showToast) {
      window.showToast("🚨 SafeWalk Expired! Emergency SOS Dispatched!", "danger");
    }
  }
}

window.safeWalkController = new SafeWalkController();
