/**
 * Campus Silent SOS - Stealth Camouflage Engine (Calculator & Notes App Disguise)
 */

class CamouflageController {
  constructor() {
    this.isOpen = false;
    this.currentMode = 'calc'; // 'calc' or 'notes'
    
    // Calculator State
    this.calcDisplay = "0";
    this.calcPrevVal = "";
    this.calcOperation = null;
    this.calcResetOnNextNum = false;
    this.calcInputSequence = "";
  }

  init() {
    this.bindOverlayEvents();
    this.bindCalculator();
    this.bindNotes();
  }

  bindOverlayEvents() {
    const btnToggle = document.getElementById('btnToggleCamouflage');
    const btnLaunch = document.getElementById('btnLaunchCamouflage');
    const btnExit = document.getElementById('btnExitCamouflage');
    const overlay = document.getElementById('camouflageOverlay');

    btnToggle?.addEventListener('click', () => this.toggle());
    btnLaunch?.addEventListener('click', () => this.open());
    btnExit?.addEventListener('click', () => this.close());

    // Switch between Calculator and Notes tabs
    document.getElementById('camoTabCalc')?.addEventListener('click', () => this.switchMode('calc'));
    document.getElementById('camoTabNotes')?.addEventListener('click', () => this.switchMode('notes'));

    // Global Key Listener for Quick Camouflage Toggle (Ctrl+Shift+C) and Esc to exit
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    const overlay = document.getElementById('camouflageOverlay');
    overlay?.classList.remove('hidden');
    this.isOpen = true;
  }

  close() {
    const overlay = document.getElementById('camouflageOverlay');
    overlay?.classList.add('hidden');
    this.isOpen = false;
  }

  switchMode(mode) {
    this.currentMode = mode;
    
    document.getElementById('camoTabCalc')?.classList.toggle('active', mode === 'calc');
    document.getElementById('camoTabNotes')?.classList.toggle('active', mode === 'notes');
    
    document.getElementById('camoScreenCalc')?.classList.toggle('active', mode === 'calc');
    document.getElementById('camoScreenNotes')?.classList.toggle('active', mode === 'notes');
  }

  // ==========================================
  // DISGUISE 1: Scientific Calculator Logic
  // ==========================================
  bindCalculator() {
    const keys = document.querySelectorAll('.calc-btn');
    keys.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.getAttribute('data-val');
        this.handleCalcKey(val);
      });
    });
  }

  handleCalcKey(val) {
    const displayEl = document.getElementById('calcCurrent');
    const historyEl = document.getElementById('calcHistory');

    // Track full input sequence for secret triggers
    this.calcInputSequence += val;

    if (val >= '0' && val <= '9' || val === '.') {
      if (this.calcResetOnNextNum || this.calcDisplay === "0") {
        this.calcDisplay = val === '.' ? "0." : val;
        this.calcResetOnNextNum = false;
      } else {
        if (val === '.' && this.calcDisplay.includes('.')) return;
        this.calcDisplay += val;
      }
    } else if (val === 'C') {
      this.calcDisplay = "0";
      this.calcPrevVal = "";
      this.calcOperation = null;
      this.calcInputSequence = "";
      if (historyEl) historyEl.textContent = "";
    } else if (val === '±') {
      this.calcDisplay = (parseFloat(this.calcDisplay) * -1).toString();
    } else if (val === '%') {
      this.calcDisplay = (parseFloat(this.calcDisplay) / 100).toString();
    } else if (['+', '-', '*', '/'].includes(val)) {
      this.calcPrevVal = this.calcDisplay;
      this.calcOperation = val;
      this.calcResetOnNextNum = true;
      if (historyEl) historyEl.textContent = `${this.calcPrevVal} ${val}`;
    } else if (val === '=') {
      // Check for SECRET EMERGENCY TRIGGER (e.g. 911=, 777=, 999=)
      if (this.calcDisplay === "911" || this.calcDisplay === "777" || this.calcDisplay === "999" || this.calcInputSequence.includes("911=")) {
        this.triggerCamouflageSos("Triggered from Camouflage Calculator");
        this.calcDisplay = "0";
        this.calcInputSequence = "";
        if (historyEl) historyEl.textContent = "Syntax Error";
      } else {
        // Normal Math Evaluation
        if (this.calcOperation && this.calcPrevVal) {
          const num1 = parseFloat(this.calcPrevVal);
          const num2 = parseFloat(this.calcDisplay);
          let result = 0;
          
          if (this.calcOperation === '+') result = num1 + num2;
          else if (this.calcOperation === '-') result = num1 - num2;
          else if (this.calcOperation === '*') result = num1 * num2;
          else if (this.calcOperation === '/') result = num2 !== 0 ? (num1 / num2) : "Error";

          if (historyEl) historyEl.textContent = `${num1} ${this.calcOperation} ${num2} =`;
          this.calcDisplay = typeof result === 'number' ? Math.round(result * 100000) / 100000 : result;
          this.calcOperation = null;
          this.calcResetOnNextNum = true;
        }
      }
    }

    if (displayEl) displayEl.textContent = this.calcDisplay;
  }

  // ==========================================
  // DISGUISE 2: Class Study Notes Logic
  // ==========================================
  bindNotes() {
    const notesArea = document.getElementById('camoNotesText');
    if (!notesArea) return;

    notesArea.addEventListener('input', (e) => {
      const text = e.target.value.toLowerCase();
      
      // Secret Word Trigger: 'sos911' or 'emergency911'
      if (text.includes('sos911') || text.includes('emergency911')) {
        // Clean out secret word from text silently
        notesArea.value = notesArea.value.replace(/sos911/gi, '...').replace(/emergency911/gi, '...');
        this.triggerCamouflageSos("Triggered from Camouflage Study Notes");
      }
    });
  }

  triggerCamouflageSos(originNote) {
    if (window.state.activeSos) return;

    // Trigger silent emergency in state
    window.state.triggerSos(originNote);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

    if (window.sosEngine) {
      window.sosEngine.renderActiveDistress(window.state.activeSos);
      window.sosEngine.startAmbientRecording();
    }

    // Discreet screen flash (subtle 100ms flash so user knows it went through)
    const overlay = document.getElementById('camouflageOverlay');
    if (overlay) {
      overlay.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
      setTimeout(() => {
        overlay.style.backgroundColor = '#000000';
      }, 150);
    }
  }
}

window.camouflageController = new CamouflageController();
