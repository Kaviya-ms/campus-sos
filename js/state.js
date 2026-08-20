/**
 * Campus Silent SOS - Central State Store & Persistence
 */

class AppState {
  constructor() {
    this.listeners = {};
    
    // Default Campus Geolocation Coordinates (Central University Quad)
    this.campusCenter = [37.4275, -122.1697];
    
    // User Profile
    this.user = {
      name: "Jane Doe",
      studentId: "ST-8841",
      phone: "+1 (555) 234-5678",
      battery: 94,
      bloodGroup: "O+",
      allergies: "Penicillin, Peanuts",
      dorm: "North Quad Hall, Room 314"
    };

    // Current Geolocation & Indoor Details
    this.currentLocation = {
      lat: 37.4275,
      lng: -122.1697,
      building: "Main Library - West Wing",
      floor: "Level 2 (Quiet Study Area)",
      room: "Study Pod 204B",
      situationNote: "",
      accuracy: 3.2
    };

    // Active Distress / SOS State
    this.activeSos = null; // null or { id, timestamp, building, floor, room, lat, lng, audioRecorded, situationNote, status: 'OPEN'|'DISPATCHED'|'RESOLVED' }

    // SafeWalk State
    this.safewalk = {
      isActive: false,
      destination: "Residential Quad - Dorm C",
      totalSeconds: 600,
      remainingSeconds: 600,
      pin: "1234",
      timerId: null
    };

    // Campus Infrastructure Data (Blue Light Towers, Security Posts, Lit Safe Corridors)
    this.campusInfrastructure = {
      towers: [
        { id: "BLT-101", name: "Tower 101 - Library Plaza", lat: 37.4278, lng: -122.1691, active: true },
        { id: "BLT-102", name: "Tower 102 - Science Quad Walk", lat: 37.4289, lng: -122.1705, active: true },
        { id: "BLT-103", name: "Tower 103 - North Dorm Walkway", lat: 37.4294, lng: -122.1678, active: true },
        { id: "BLT-104", name: "Tower 104 - Parking Structure B", lat: 37.4255, lng: -122.1718, active: true },
        { id: "BLT-105", name: "Tower 105 - Student Union Path", lat: 37.4262, lng: -122.1685, active: true },
        { id: "BLT-106", name: "Tower 106 - Athletic Quad", lat: 37.4248, lng: -122.1662, active: true }
      ],
      stations: [
        { id: "SEC-HQ", name: "Campus Police HQ (24/7)", lat: 37.4268, lng: -122.1672 },
        { id: "SEC-NORTH", name: "North Quad Security Kiosk", lat: 37.4298, lng: -122.1682 },
        { id: "SEC-WEST", name: "West Gate Patrol Depot", lat: 37.4258, lng: -122.1725 }
      ],
      corridors: [
        {
          name: "Main Illuminated Spine (Library to Dorms)",
          path: [
            [37.4275, -122.1697],
            [37.4278, -122.1691],
            [37.4285, -122.1685],
            [37.4294, -122.1678]
          ]
        },
        {
          name: "South Campus Lit Boulevard",
          path: [
            [37.4275, -122.1697],
            [37.4268, -122.1690],
            [37.4262, -122.1685],
            [37.4255, -122.1670]
          ]
        }
      ]
    };

    // Preloaded Dispatch Incidents Feed
    this.incidents = [
      {
        id: "INC-8839",
        studentName: "Marcus Vance",
        studentId: "ST-7719",
        phone: "+1 (555) 431-8890",
        battery: 78,
        type: "EMERGENCY_SOS",
        timeStr: "10:14 AM",
        timestamp: Date.now() - 3600000 * 2,
        building: "Science & Engineering Complex",
        floor: "Basement / Lower Level",
        room: "Lab 014",
        lat: 37.4289,
        lng: -122.1705,
        situationNote: "Door jammed, heard alarm",
        status: "RESOLVED",
        hasAudio: true,
        assignedUnit: "Patrol Unit #2"
      },
      {
        id: "INC-8840",
        studentName: "Chloe Zhang",
        studentId: "ST-9102",
        phone: "+1 (555) 672-1144",
        battery: 88,
        type: "SAFEWALK_EXPIRED",
        timeStr: "11:20 AM",
        timestamp: Date.now() - 3600000 * 0.5,
        building: "Campus Parking Structure B",
        floor: "Ground Floor",
        room: "Bay 12 South",
        lat: 37.4255,
        lng: -122.1718,
        situationNote: "SafeWalk timer elapsed without PIN",
        status: "DISPATCHED",
        hasAudio: false,
        assignedUnit: "Patrol Unit #1"
      }
    ];

    this.selectedIncidentId = null;

    // Load persisted state if exists
    this.loadState();
  }

  // Subscribe to state changes
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  // Emit event to subscribers
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  // Save to LocalStorage
  saveState() {
    try {
      const dataToSave = {
        user: this.user,
        currentLocation: this.currentLocation,
        activeSos: this.activeSos,
        incidents: this.incidents
      };
      localStorage.setItem('campus_sos_state', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Storage save error", e);
    }
  }

  // Load from LocalStorage
  loadState() {
    try {
      const raw = localStorage.getItem('campus_sos_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.user) this.user = { ...this.user, ...parsed.user };
        if (parsed.currentLocation) this.currentLocation = { ...this.currentLocation, ...parsed.currentLocation };
      }
    } catch (e) {
      console.warn("Storage load error", e);
    }
  }

  // Trigger Silent SOS
  triggerSos(customSituation = "") {
    const sosId = "INC-" + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newSos = {
      id: sosId,
      studentName: this.user.name,
      studentId: this.user.studentId,
      phone: this.user.phone,
      battery: this.user.battery,
      type: "EMERGENCY_SOS",
      timeStr: timeStr,
      timestamp: Date.now(),
      building: this.currentLocation.building,
      floor: this.currentLocation.floor,
      room: this.currentLocation.room,
      lat: this.currentLocation.lat,
      lng: this.currentLocation.lng,
      situationNote: customSituation || this.currentLocation.situationNote || "Discreet Silent SOS Activated",
      status: "OPEN",
      hasAudio: true,
      assignedUnit: null
    };

    this.activeSos = newSos;
    this.incidents.unshift(newSos);
    this.selectedIncidentId = sosId;
    this.saveState();

    this.emit('sos:triggered', newSos);
    this.emit('incidents:updated', this.incidents);
    return newSos;
  }

  // Cancel Active SOS
  cancelSos() {
    if (!this.activeSos) return;
    const sosId = this.activeSos.id;
    const found = this.incidents.find(i => i.id === sosId);
    if (found) {
      found.status = "RESOLVED";
      found.situationNote += " (Cancelled by Student PIN)";
    }
    this.activeSos = null;
    this.saveState();

    this.emit('sos:cancelled', { id: sosId });
    this.emit('incidents:updated', this.incidents);
  }

  // Update incident status from security dispatch
  updateIncidentStatus(id, newStatus, unitName = null) {
    const incident = this.incidents.find(i => i.id === id);
    if (incident) {
      incident.status = newStatus;
      if (unitName) incident.assignedUnit = unitName;
      if (this.activeSos && this.activeSos.id === id && newStatus === 'RESOLVED') {
        this.activeSos = null;
      }
      this.saveState();
      this.emit('incidents:updated', this.incidents);
      this.emit('incident:selected', incident);
    }
  }

  getActiveSosCount() {
    return this.incidents.filter(i => i.status === 'OPEN' || i.status === 'DISPATCHED').length;
  }
}

// Global singleton instance
window.state = new AppState();
