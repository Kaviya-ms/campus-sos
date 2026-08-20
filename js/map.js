/**
 * Campus Silent SOS - Leaflet Campus Geolocation Map Controller
 */

class CampusMapController {
  constructor() {
    this.map = null;
    this.userMarker = null;
    this.sosMarker = null;
    this.towerMarkers = [];
    this.stationMarkers = [];
    this.corridorPolylines = [];
    this.currentFilter = 'all'; // 'all', 'towers', 'corridors'
  }

  init() {
    const mapElement = document.getElementById('campusMap');
    if (!mapElement) return;

    const center = window.state.campusCenter;

    // Initialize Leaflet Map
    this.map = L.map('campusMap', {
      center: center,
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // Add Zoom Control to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // High performance Dark Theme Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(this.map);

    // Render Campus Safety Layers
    this.renderInfrastructure();
    this.renderUserLocation();
    this.bindEvents();

    // Re-invalidate size when tab changes or window resizes
    setTimeout(() => this.map.invalidateSize(), 300);
  }

  renderInfrastructure() {
    const data = window.state.campusInfrastructure;

    // 1. Blue Light Emergency Towers
    data.towers.forEach(tower => {
      const towerIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-beacon" style="background:#3B82F6; box-shadow:0 0 10px #3B82F6;"><i data-lucide="radio" style="width:12px;height:12px;"></i></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([tower.lat, tower.lng], { icon: towerIcon })
        .bindPopup(`
          <div style="font-family:sans-serif; color:#0B0F19; padding:4px;">
            <strong style="color:#2563EB;">${tower.name}</strong><br>
            <span style="font-size:11px; color:#64748B;">24/7 Monitored • Direct Police Intercom</span><br>
            <span style="font-size:11px; color:#10B981;">● Active & Ready</span>
          </div>
        `);
      
      this.towerMarkers.push(marker);
      marker.addTo(this.map);
    });

    // 2. Campus Security Stations & Safe Havens
    data.stations.forEach(station => {
      const stationIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-beacon" style="background:#10B981; box-shadow:0 0 12px #10B981;"><i data-lucide="shield" style="width:12px;height:12px;"></i></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([station.lat, station.lng], { icon: stationIcon })
        .bindPopup(`
          <div style="font-family:sans-serif; color:#0B0F19; padding:4px;">
            <strong style="color:#059669;">${station.name}</strong><br>
            <span style="font-size:11px; color:#64748B;">Staffed 24/7 • Safe Haven Zone</span>
          </div>
        `);
      
      this.stationMarkers.push(marker);
      marker.addTo(this.map);
    });

    // 3. Lit Safe Walk Corridors
    data.corridors.forEach(corridor => {
      const poly = L.polyline(corridor.path, {
        color: '#10B981',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round'
      }).bindPopup(`<strong>${corridor.name}</strong><br><span style="font-size:11px;">High-illumination corridor with CCTV coverage</span>`);

      this.corridorPolylines.push(poly);
      poly.addTo(this.map);
    });

    // Re-initialize Lucide icons in newly rendered DOM markers
    if (window.lucide) window.lucide.createIcons();
  }

  renderUserLocation() {
    const loc = window.state.currentLocation;

    if (this.userMarker) {
      this.userMarker.setLatLng([loc.lat, loc.lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-beacon user-me"><div style="width:6px;height:6px;background:#fff;border-radius:50%;"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      this.userMarker = L.marker([loc.lat, loc.lng], { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup(`
          <div style="font-family:sans-serif; color:#0B0F19; padding:4px;">
            <strong style="color:#0EA5E9;">Your GPS Location</strong><br>
            <span style="font-size:11px;">${loc.building}</span><br>
            <span style="font-size:11px; color:#64748B;">${loc.floor} • ${loc.room}</span>
          </div>
        `);
      this.userMarker.addTo(this.map);
    }
  }

  showSosBeacon(loc) {
    if (this.sosMarker) {
      this.sosMarker.setLatLng([loc.lat, loc.lng]);
    } else {
      const sosIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="marker-beacon sos-alert">SOS</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      this.sosMarker = L.marker([loc.lat, loc.lng], { icon: sosIcon, zIndexOffset: 2000 })
        .bindPopup(`
          <div style="font-family:sans-serif; color:#991B1B; padding:4px;">
            <strong style="font-size:13px;">🚨 ACTIVE SILENT SOS</strong><br>
            <span style="color:#0B0F19; font-size:12px;">${loc.building} (${loc.room})</span>
          </div>
        `);
      this.sosMarker.addTo(this.map);
    }

    this.sosMarker.openPopup();
    this.map.panTo([loc.lat, loc.lng], { animate: true, duration: 1 });
  }

  removeSosBeacon() {
    if (this.sosMarker) {
      this.map.removeLayer(this.sosMarker);
      this.sosMarker = null;
    }
  }

  applyFilter(filterType) {
    this.currentFilter = filterType;

    // Towers
    this.towerMarkers.forEach(m => {
      if (filterType === 'all' || filterType === 'towers') {
        if (!this.map.hasLayer(m)) this.map.addLayer(m);
      } else {
        if (this.map.hasLayer(m)) this.map.removeLayer(m);
      }
    });

    // Corridors
    this.corridorPolylines.forEach(p => {
      if (filterType === 'all' || filterType === 'corridors') {
        if (!this.map.hasLayer(p)) this.map.addLayer(p);
      } else {
        if (this.map.hasLayer(p)) this.map.removeLayer(p);
      }
    });
  }

  bindEvents() {
    // Filter Buttons
    document.getElementById('btnFilterAll')?.addEventListener('click', (e) => {
      this.setFilterActive(e.target);
      this.applyFilter('all');
    });

    document.getElementById('btnFilterTowers')?.addEventListener('click', (e) => {
      this.setFilterActive(e.target);
      this.applyFilter('towers');
    });

    document.getElementById('btnFilterCorridors')?.addEventListener('click', (e) => {
      this.setFilterActive(e.target);
      this.applyFilter('corridors');
    });

    document.getElementById('btnCenterMap')?.addEventListener('click', () => {
      const loc = window.state.currentLocation;
      this.map.flyTo([loc.lat, loc.lng], 17, { animate: true });
      if (this.userMarker) this.userMarker.openPopup();
    });

    // React to state changes
    window.state.on('sos:triggered', (sos) => {
      this.showSosBeacon(sos);
    });

    window.state.on('sos:cancelled', () => {
      this.removeSosBeacon();
    });
  }

  setFilterActive(btn) {
    document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
}

window.campusMap = new CampusMapController();
