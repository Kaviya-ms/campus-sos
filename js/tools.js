/**
 * Campus Silent SOS - Safety Toolkit (Fake Call, Loud Siren/Strobe, Contacts & Medical ID)
 */

class SafetyToolsController {
  constructor() {
    this.ringOscillator = null;
    this.ringInterval = null;
    this.sirenOscillator = null;
    this.sirenInterval = null;
    this.isSirenActive = false;
    this.callTimerInterval = null;
    this.callSeconds = 0;
  }

  init() {
    this.bindFakeCall();
    this.bindLoudAlarm();
    this.bindContactsModal();
    this.bindHelpModal();
  }

  // ==========================================
  // Fake Incoming Call Simulator
  // ==========================================
  bindFakeCall() {
    const btnTrigger = document.getElementById('btnFakeCall');
    const overlay = document.getElementById('fakeCallOverlay');
    const btnAccept = document.getElementById('btnAcceptCall');
    const btnDecline = document.getElementById('btnDeclineCall');
    const btnHangup = document.getElementById('btnHangupCall');

    btnTrigger?.addEventListener('click', () => {
      this.startIncomingCall();
    });

    btnDecline?.addEventListener('click', () => {
      this.endCall();
    });

    btnHangup?.addEventListener('click', () => {
      this.endCall();
    });

    btnAccept?.addEventListener('click', () => {
      this.acceptCall();
    });
  }

  startIncomingCall() {
    const overlay = document.getElementById('fakeCallOverlay');
    const incomingActions = document.getElementById('callActionsIncoming');
    const activeActions = document.getElementById('callActionsActive');
    const statusText = document.getElementById('fakeCallStatus');

    if (overlay) overlay.classList.remove('hidden');
    if (incomingActions) incomingActions.classList.remove('hidden');
    if (activeActions) activeActions.classList.add('hidden');
    if (statusText) statusText.textContent = "Incoming Call...";

    this.playRingtone();
  }

  playRingtone() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ringPattern = () => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(480, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      };

      ringPattern();
      this.ringInterval = setInterval(ringPattern, 3000);
    } catch (e) {}
  }

  acceptCall() {
    if (this.ringInterval) clearInterval(this.ringInterval);

    const incomingActions = document.getElementById('callActionsIncoming');
    const activeActions = document.getElementById('callActionsActive');
    const statusText = document.getElementById('fakeCallStatus');
    const timerDisplay = document.getElementById('fakeCallTimer');

    if (incomingActions) incomingActions.classList.add('hidden');
    if (activeActions) activeActions.classList.remove('hidden');
    if (statusText) statusText.textContent = "00:00";

    this.callSeconds = 0;
    this.callTimerInterval = setInterval(() => {
      this.callSeconds++;
      const mins = String(Math.floor(this.callSeconds / 60)).padStart(2, '0');
      const secs = String(this.callSeconds % 60).padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);

    // Speak synthetic voice message through browser speech synthesis
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance("Hey, are you almost outside? I am waiting right by the building entrance with the car running. Come out now!");
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
  }

  endCall() {
    if (this.ringInterval) clearInterval(this.ringInterval);
    if (this.callTimerInterval) clearInterval(this.callTimerInterval);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const overlay = document.getElementById('fakeCallOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ==========================================
  // Deterrent Loud Alarm & Strobe
  // ==========================================
  bindLoudAlarm() {
    const btnAlarm = document.getElementById('btnLoudAlarm');
    btnAlarm?.addEventListener('click', () => {
      this.toggleLoudAlarm();
    });
  }

  toggleLoudAlarm() {
    if (this.isSirenActive) {
      this.stopLoudAlarm();
    } else {
      this.startLoudAlarm();
    }
  }

  startLoudAlarm() {
    this.isSirenActive = true;
    const btn = document.getElementById('btnLoudAlarm');
    if (btn) {
      btn.innerHTML = `<i data-lucide="volume-x"></i><span>Silence Alarm</span>`;
      btn.classList.add('active');
    }

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();

      let freq = 700;
      let goingUp = true;
      this.sirenInterval = setInterval(() => {
        freq = goingUp ? freq + 60 : freq - 60;
        if (freq >= 1200) goingUp = false;
        if (freq <= 500) goingUp = true;
        try {
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        } catch (e) {}

        // Visual screen strobe effect
        document.body.style.backgroundColor = document.body.style.backgroundColor === 'rgb(239, 68, 68)' ? '#070B14' : '#EF4444';
      }, 80);

      this.sirenOscillator = { osc, audioCtx };
    } catch (e) {}

    if (window.lucide) window.lucide.createIcons();
    if (window.showToast) window.showToast("🚨 High-Decibel Deterrent Siren Active!", "danger");
  }

  stopLoudAlarm() {
    this.isSirenActive = false;
    if (this.sirenInterval) clearInterval(this.sirenInterval);
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.osc.stop();
        this.sirenOscillator.audioCtx.close();
      } catch (e) {}
    }

    document.body.style.backgroundColor = '';

    const btn = document.getElementById('btnLoudAlarm');
    if (btn) {
      btn.innerHTML = `<i data-lucide="volume-2"></i><span>Loud Alarm</span>`;
      btn.classList.remove('active');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
  // Contacts & Medical Profile Modal
  // ==========================================
  bindContactsModal() {
    const modal = document.getElementById('modalContacts');
    const btnOpen = document.getElementById('btnEmergencyContacts');
    const btnClose = document.getElementById('btnCloseContactsModal');
    const btnDone = document.getElementById('btnDoneContacts');

    const tabContacts = document.getElementById('pillContacts');
    const tabMedical = document.getElementById('pillMedical');
    const secContacts = document.getElementById('secContacts');
    const secMedical = document.getElementById('secMedical');

    btnOpen?.addEventListener('click', () => modal?.classList.remove('hidden'));
    
    const hide = () => modal?.classList.add('hidden');
    btnClose?.addEventListener('click', hide);
    btnDone?.addEventListener('click', hide);

    tabContacts?.addEventListener('click', () => {
      tabContacts.classList.add('active');
      tabMedical?.classList.remove('active');
      secContacts?.classList.add('active');
      secMedical?.classList.remove('active');
    });

    tabMedical?.addEventListener('click', () => {
      tabMedical.classList.add('active');
      tabContacts?.classList.remove('active');
      secMedical?.classList.add('active');
      secContacts?.classList.remove('active');
    });

    // Simulated Social SOS dispatch links
    document.getElementById('btnShareWhatsApp')?.addEventListener('click', () => {
      const loc = window.state.currentLocation;
      const text = encodeURIComponent(`🚨 EMERGENCY SOS from ${window.state.user.name}: I need urgent assistance at ${loc.building} (${loc.floor}, ${loc.room}). GPS: https://maps.google.com/?q=${loc.lat},${loc.lng}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    });

    document.getElementById('btnShareSMS')?.addEventListener('click', () => {
      const loc = window.state.currentLocation;
      const body = encodeURIComponent(`🚨 SOS: ${window.state.user.name} needs help at ${loc.building} (${loc.room}). Coordinates: ${loc.lat},${loc.lng}`);
      window.location.href = `sms:?body=${body}`;
    });
  }

  // ==========================================
  // Help & Shortcuts Modal
  // ==========================================
  bindHelpModal() {
    const modal = document.getElementById('modalHelp');
    const btnOpen = document.getElementById('btnHelpGuide');
    const btnClose = document.getElementById('btnCloseHelpModal');
    const btnDone = document.getElementById('btnDoneHelp');

    btnOpen?.addEventListener('click', () => modal?.classList.remove('hidden'));
    const hide = () => modal?.classList.add('hidden');
    btnClose?.addEventListener('click', hide);
    btnDone?.addEventListener('click', hide);
  }
}

window.safetyTools = new SafetyToolsController();
