/**
 * ==============================================================================
 * Urban Flood Nowcasting System - Master Logic Engine
 * Drainage & Rainfall Coupling Hydrological Model + ML Predictive Analytics
 * Features:
 *  - ML Logistic Regression Inundation Predictor with Conic Gradient Gauge
 *  - Dual Leaflet GIS Map Sync (Embedded Dashboard Map + Fullscreen GIS Map)
 *  - Bidirectional Zone-to-Map Synchronization (Dropdown, Table, Presets, Markers)
 *  - Live Sensor Stream Ingestion & Dynamic Rolling Readings Table
 *  - Real-Time Chronological Event Log Streamer
 *  - Interactive SVG Hydrograph & Flood Probability Trend Chart
 *  - Nominatim Geocoding Search & Browser Geolocation API
 *  - Extreme Cloudburst Surge Scenario Simulation
 * ==============================================================================
 */

// Global Configuration
const CONFIG = {
  SIMULATION_INTERVAL_MS: 4000,
  DEFAULT_CENTER: [1.3521, 103.8198], // Singapore Marina/Kallang Basin Benchmark
  DEFAULT_ZOOM: 14,
  THRESHOLDS: {
    RAINFALL: { NORMAL: 25, HEAVY: 50, CRITICAL: 75 },
    DRAIN_LEVEL: { NORMAL: 40, WARNING: 65, CRITICAL: 80 },
    CAPACITY: { CRITICAL: 35, WARNING: 60, NORMAL: 80 }
  }
};

// ==============================================================================
// 1. Zone Registry & Hydrological Coupling Data
// ==============================================================================

const ZONES_DATABASE = {
  "Zone 3 - Central Market": {
    name: "Zone 3 - Central Market Core",
    shortName: "Zone 3 - Central",
    key: "Zone 3 - Central Market",
    latOffset: 0.002,
    lngOffset: -0.002,
    rainfall: 45.2,
    drainLevel: 68,
    capacity: 72,
    durationMin: 85,
    pressureKpa: 34.2,
    waterMeters: 1.85,
    blockages: 0,
    radius: 520,
    description: "High-density commercial core with subterranean metro ingress portals"
  },
  "Zone 1 - Residential": {
    name: "Zone 1 - Residential North",
    shortName: "Zone 1 - Residential",
    key: "Zone 1 - Residential",
    latOffset: 0.012,
    lngOffset: -0.015,
    rainfall: 18.5,
    drainLevel: 31,
    capacity: 88,
    durationMin: 45,
    pressureKpa: 22.1,
    waterMeters: 0.75,
    blockages: 0,
    radius: 450,
    description: "Elevated residential watershed with retention ponds and open swales"
  },
  "Zone 2 - School Area": {
    name: "Zone 2 - School Area Catchment",
    shortName: "Zone 2 - School Area",
    key: "Zone 2 - School Area",
    latOffset: 0.010,
    lngOffset: 0.012,
    rainfall: 29.4,
    drainLevel: 49,
    capacity: 79,
    durationMin: 60,
    pressureKpa: 28.5,
    waterMeters: 1.20,
    blockages: 0,
    radius: 480,
    description: "Institutional school zone with expansive sports fields for localized retention"
  },
  "Zone 4 - Industrial": {
    name: "Zone 4 - Industrial Lowlands",
    shortName: "Zone 4 - Industrial",
    key: "Zone 4 - Industrial",
    latOffset: -0.010,
    lngOffset: -0.008,
    rainfall: 88.0,
    drainLevel: 84,
    capacity: 44,
    durationMin: 110,
    pressureKpa: 58.4,
    waterMeters: 2.55,
    blockages: 1,
    radius: 620,
    description: "Depressed heavy industrial corridor prone to siltation and runoff surcharge"
  },
  "Zone 5 - Riverside": {
    name: "Zone 5 - Riverside District",
    shortName: "Zone 5 - Riverside",
    key: "Zone 5 - Riverside",
    latOffset: -0.006,
    lngOffset: 0.014,
    rainfall: 15.8,
    drainLevel: 35,
    capacity: 92,
    durationMin: 35,
    pressureKpa: 19.8,
    waterMeters: 0.85,
    blockages: 0,
    radius: 500,
    description: "Riparian buffer zone with natural floodplain wetlands and tidal sluice gates"
  },
  "Zone 6 - Residential": {
    name: "Zone 6 - Coastal Outfall & Harbor",
    shortName: "Zone 6 - Coastal Outfall",
    key: "Zone 6 - Residential",
    latOffset: 0.004,
    lngOffset: -0.018,
    rainfall: 34.2,
    drainLevel: 55,
    capacity: 70,
    durationMin: 70,
    pressureKpa: 31.0,
    waterMeters: 1.45,
    blockages: 0,
    radius: 460,
    description: "Coastal discharge junction subject to storm surge and tidal backwater impedance"
  }
};

// ==============================================================================
// 2. ML Logistic Regression Flood Predictor
// ==============================================================================

/**
 * Hydrological Logistic Regression Model
 * Combines rainfall intensity, drainage capacity, water level, storm duration, and blockages
 */
function calculateFloodProbability(r, d, c, durationMin = 85, blockages = 0) {
  const rNorm = r / 200;
  const cNorm = c / 100;
  const dNorm = d / 100;
  const tNorm = (durationMin / 60) * 0.24;
  const bPenalty = blockages * 0.45;

  // Formula from Design 1 extended with duration and debris blockage penalties
  const logit = -4.0 + 5.2 * rNorm - 2.8 * cNorm + 2.1 * dNorm + 1.2 * tNorm + bPenalty;
  const prob = 100 / (1 + Math.exp(-logit));
  return Math.min(99, Math.max(1, Math.round(prob)));
}

function getRiskCategory(prob) {
  if (prob >= 75) {
    return {
      level: 'CRITICAL',
      tag: '⚠ CRITICAL RISK',
      desc: 'Critical flood inundation imminent. Drainage conduits surcharging. Immediate municipal emergency response required.',
      color: '#ef4444',
      badgeClass: 'status-critical',
      tableClass: 'warning'
    };
  } else if (prob >= 50) {
    return {
      level: 'HIGH',
      tag: '⚠ HIGH RISK',
      desc: 'Flood risk is high in this zone. Storm sewer capacity strained. Take emergency precautions and prepare retention gates.',
      color: '#f97316',
      badgeClass: 'status-high',
      tableClass: 'action'
    };
  } else if (prob >= 25) {
    return {
      level: 'MODERATE',
      tag: '● MODERATE RISK',
      desc: 'Flood conditions are developing. Surface runoff accumulating. Continue monitoring telemetry streams closely.',
      color: '#eab308',
      badgeClass: 'status-warning',
      tableClass: 'monitor'
    };
  } else {
    return {
      level: 'LOW',
      tag: '● LOW RISK',
      desc: 'Flood risk is low in this zone. Runoff is well within canal conveyance and drainage retention thresholds.',
      color: '#10b981',
      badgeClass: 'status-normal',
      tableClass: 'normal'
    };
  }
}

// ==============================================================================
// 3. Application State Store
// ==============================================================================

class NowcastingStore {
  constructor() {
    this.centerLat = CONFIG.DEFAULT_CENTER[0];
    this.centerLng = CONFIG.DEFAULT_CENTER[1];
    this.activeZoneKey = "Zone 3 - Central Market";
    this.scenarioMode = "normal"; // 'normal' | 'cloudburst'
    this.baseMapStyle = "dark";   // 'dark' | 'osm'
    this.currentView = "dashboard";
    this.chartHours = 6;
    this.recentReadings = [];
    this.systemLogs = [];
    this.sensors = [];
    this.riskZones = [];

    this.initSensorsAndZones();
    this.seedInitialReadings();
    this.seedInitialLogs();
  }

  initSensorsAndZones() {
    const lat = this.centerLat;
    const lng = this.centerLng;

    // Build geographic zones
    this.riskZones = Object.keys(ZONES_DATABASE).map(key => {
      const z = ZONES_DATABASE[key];
      const prob = calculateFloodProbability(z.rainfall, z.drainLevel, z.capacity, z.durationMin, z.blockages);
      const risk = getRiskCategory(prob);
      return {
        key: key,
        name: z.name,
        shortName: z.shortName,
        center: [lat + z.latOffset, lng + z.lngOffset],
        radius: z.radius,
        prob: prob,
        risk: risk,
        rainfall: z.rainfall,
        drainLevel: z.drainLevel,
        capacity: z.capacity
      };
    });

    // Build IoT Sensors Array
    this.sensors = [
      {
        id: "RF-01",
        name: "Central Doppler Radar Station",
        type: "rainfall",
        zoneKey: "Zone 3 - Central Market",
        lat: lat + 0.003,
        lng: lng - 0.001,
        val: 45.2,
        unit: "mm/hr",
        icon: "fa-cloud-showers-heavy"
      },
      {
        id: "WL-01",
        name: "Central Canal Sluice Sump",
        type: "water",
        zoneKey: "Zone 3 - Central Market",
        lat: lat + 0.001,
        lng: lng - 0.003,
        val: 1.85,
        unit: "m",
        icon: "fa-water"
      },
      {
        id: "PS-01",
        name: "Subway Underpass Monometer",
        type: "pressure",
        zoneKey: "Zone 3 - Central Market",
        lat: lat + 0.004,
        lng: lng + 0.001,
        val: 34.2,
        unit: "kPa",
        icon: "fa-gauge"
      },
      {
        id: "RF-02",
        name: "North Ridge Pluviometer",
        type: "rainfall",
        zoneKey: "Zone 1 - Residential",
        lat: lat + 0.014,
        lng: lng - 0.016,
        val: 18.5,
        unit: "mm/hr",
        icon: "fa-cloud-showers-heavy"
      },
      {
        id: "WL-02",
        name: "North Lake Spillway Gauge",
        type: "water",
        zoneKey: "Zone 1 - Residential",
        lat: lat + 0.011,
        lng: lng - 0.014,
        val: 0.75,
        unit: "m",
        icon: "fa-water"
      },
      {
        id: "RF-03",
        name: "Industrial Basin Radar Node",
        type: "rainfall",
        zoneKey: "Zone 4 - Industrial",
        lat: lat - 0.008,
        lng: lng - 0.006,
        val: 88.0,
        unit: "mm/hr",
        icon: "fa-cloud-showers-heavy"
      },
      {
        id: "WL-03",
        name: "Industrial Culvert Sensor",
        type: "water",
        zoneKey: "Zone 4 - Industrial",
        lat: lat - 0.012,
        lng: lng - 0.009,
        val: 2.55,
        unit: "m",
        icon: "fa-water"
      },
      {
        id: "BK-01",
        name: "Industrial Trash Screen Debris Node",
        type: "blockage",
        zoneKey: "Zone 4 - Industrial",
        lat: lat - 0.011,
        lng: lng - 0.011,
        val: 1, // 1 = Detected
        status: "Detected",
        icon: "fa-triangle-exclamation"
      },
      {
        id: "WL-04",
        name: "Harbor Tidal Flap Gate",
        type: "water",
        zoneKey: "Zone 6 - Residential",
        lat: lat + 0.005,
        lng: lng - 0.020,
        val: 1.45,
        unit: "m",
        icon: "fa-water"
      }
    ];
  }

  seedInitialReadings() {
    const now = new Date();
    const baseRain = [45.2, 43.8, 41.5, 38.2, 34.0, 30.5];
    this.recentReadings = baseRain.map((r, i) => {
      const t = new Date(now.getTime() - i * 5 * 60000);
      return {
        timeStr: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        rainfall: r.toFixed(1),
        drain: (68 - i * 3) + "%",
        capacity: (72 + i * 2) + "%"
      };
    });
  }

  seedInitialLogs() {
    const now = new Date();
    const formatT = (offsetMin) => {
      const d = new Date(now.getTime() - offsetMin * 60000);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    };

    this.systemLogs = [
      {
        type: "high",
        time: formatT(2),
        badge: "🟠",
        title: "ML Prediction completed",
        detail: "Zone 3 - Central Market Core: Flood probability 68% (High Risk). Advisory dispatched."
      },
      {
        type: "info",
        time: formatT(4),
        badge: "🟢",
        title: "Sensor telemetry ingested",
        detail: "Ingested packet from 9 Catchment IoT Nodes (Pluviometers & Sluice Gauges)."
      },
      {
        type: "warn",
        time: formatT(8),
        badge: "🟡",
        title: "Drainage backpressure rise",
        detail: "Zone 4 Industrial culvert pressure rose to 58.4 kPa (Conveyance capacity 44%)."
      },
      {
        type: "crit",
        time: formatT(14),
        badge: "🔴",
        title: "Trash-screen debris alert",
        detail: "Debris blockage detected at Sector 4 Intake #12. Automated clearing cycle active."
      },
      {
        type: "info",
        time: formatT(22),
        badge: "⚪",
        title: "Hydro-ML Model inference",
        detail: "Coupled Logistic & Random Forest ensemble runtime: 0.42s. ROC-AUC: 0.94."
      }
    ];
  }

  recenter(lat, lng) {
    this.centerLat = lat;
    this.centerLng = lng;
    this.initSensorsAndZones();
  }

  tickSimulation() {
    const isStorm = (this.scenarioMode === "cloudburst");

    // Slightly evolve zone parameters realistically
    Object.keys(ZONES_DATABASE).forEach(k => {
      const z = ZONES_DATABASE[k];
      if (isStorm) {
        // High surge in storm mode
        if (k === "Zone 4 - Industrial" || k === "Zone 3 - Central Market") {
          z.rainfall = parseFloat(Math.min(130, z.rainfall + 4.5 + Math.random() * 2).toFixed(1));
          z.drainLevel = Math.min(96, z.drainLevel + 2);
          z.capacity = Math.max(15, z.capacity - 3);
          z.waterMeters = parseFloat(Math.min(3.6, z.waterMeters + 0.12).toFixed(2));
          z.pressureKpa = parseFloat(Math.min(85, z.pressureKpa + 2.5).toFixed(1));
          z.blockages = 1;
        } else {
          z.rainfall = parseFloat(Math.min(85, z.rainfall + 3.0).toFixed(1));
          z.drainLevel = Math.min(80, z.drainLevel + 2);
          z.capacity = Math.max(30, z.capacity - 2);
        }
      } else {
        // Natural gentle oscillation
        const rainDelta = (Math.random() * 3.0 - 1.4);
        z.rainfall = parseFloat(Math.max(8.0, Math.min(95, z.rainfall + rainDelta)).toFixed(1));
        const drainDelta = Math.round(Math.random() * 2 - 1);
        z.drainLevel = Math.max(20, Math.min(90, z.drainLevel + drainDelta));
        const capDelta = Math.round(Math.random() * 2 - 1);
        z.capacity = Math.max(20, Math.min(98, z.capacity - capDelta));
        z.waterMeters = parseFloat((0.4 + (z.drainLevel / 100) * 2.2).toFixed(2));
        z.pressureKpa = parseFloat((16 + (z.drainLevel / 100) * 42).toFixed(1));
      }
    });

    // Update active zone in readings stream
    const activeZ = ZONES_DATABASE[this.activeZoneKey];
    const now = new Date();
    const newEntry = {
      timeStr: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      rainfall: (activeZ.rainfall + (Math.sin(Date.now() / 4000) * 0.8)).toFixed(1),
      drain: activeZ.drainLevel + "%",
      capacity: activeZ.capacity + "%"
    };
    this.recentReadings.unshift(newEntry);
    if (this.recentReadings.length > 8) this.recentReadings.pop();

    // Randomly append a fresh log entry occasionally
    if (Math.random() < 0.45) {
      const activeProb = calculateFloodProbability(activeZ.rainfall, activeZ.drainLevel, activeZ.capacity, activeZ.durationMin, activeZ.blockages);
      const risk = getRiskCategory(activeProb);
      let logType = "info";
      let badge = "🟢";
      if (risk.level === "CRITICAL") { logType = "crit"; badge = "🔴"; }
      else if (risk.level === "HIGH") { logType = "high"; badge = "🟠"; }
      else if (risk.level === "MODERATE") { logType = "warn"; badge = "🟡"; }

      this.systemLogs.unshift({
        type: logType,
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
        badge: badge,
        title: `Prediction update: ${activeZ.shortName}`,
        detail: `Nowcast probability: ${activeProb}% (${risk.tag}). Sensor inflow: ${activeZ.rainfall} mm/hr.`
      });
      if (this.systemLogs.length > 25) this.systemLogs.pop();
    }
  }
}

// ==============================================================================
// 4. Map Engine: Dual Leaflet Support (Dashboard Mini-Map & Full GIS Map)
// ==============================================================================

class DualMapEngine {
  constructor(store) {
    this.store = store;
    this.dashMap = null;
    this.fullMap = null;
    this.dashLayers = { zones: null, sensors: null, baseDark: null, baseOSM: null };
    this.fullLayers = { zones: null, sensors: null, blockages: null, baseDark: null, baseOSM: null, userLoc: null };
    this.currentBaseStyle = "dark";
    this.visibleLayers = { risk: true, sensors: true, blockages: true };

    this.initDashboardMap();
  }

  initDashboardMap() {
    const center = [this.store.centerLat, this.store.centerLng];

    // 1. Initialize Dashboard Embedded Map
    const dashEl = document.getElementById("dashboard-map");
    if (dashEl) {
      this.dashMap = L.map("dashboard-map", {
        center: center,
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      this.dashLayers.baseOSM = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.dashMap);

      this.dashLayers.zones = L.layerGroup().addTo(this.dashMap);
      this.dashLayers.sensors = L.layerGroup().addTo(this.dashMap);
    }

    // 2. Render initial entities
    this.renderAll();
  }

  initFullscreenMap() {
    if (this.fullMap) return;
    const fullEl = document.getElementById("full-map");
    if (!fullEl) return;

    const center = [this.store.centerLat, this.store.centerLng];
    this.fullMap = L.map("full-map", {
      center: center,
      zoom: CONFIG.DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true
    });

    L.control.zoom({ position: "topleft" }).addTo(this.fullMap);

    this.fullLayers.baseOSM = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.fullMap);

    this.fullLayers.zones = L.layerGroup().addTo(this.fullMap);
    this.fullLayers.sensors = L.layerGroup().addTo(this.fullMap);
    this.fullLayers.blockages = L.layerGroup().addTo(this.fullMap);
    this.fullLayers.userLoc = L.layerGroup().addTo(this.fullMap);

    this.renderAll();
  }

  renderAll() {
    this.renderZones();
    this.renderSensors();
  }

  renderZones() {
    const riskColors = {
      LOW: { fill: '#10b981', stroke: '#059669' },
      MODERATE: { fill: '#eab308', stroke: '#ca8a04' },
      HIGH: { fill: '#f97316', stroke: '#ea580c' },
      CRITICAL: { fill: '#ef4444', stroke: '#dc2626' }
    };

    // Render to DashMap
    if (this.dashMap && this.dashLayers.zones) {
      this.dashLayers.zones.clearLayers();
      this.store.riskZones.forEach(z => {
        const c = riskColors[z.risk.level] || riskColors.LOW;
        const isSelected = (z.key === this.store.activeZoneKey);
        const circle = L.circle(z.center, {
          radius: z.radius,
          color: isSelected ? '#38bdf8' : c.stroke,
          weight: isSelected ? 3 : 1.8,
          fillColor: c.fill,
          fillOpacity: isSelected ? 0.5 : 0.32
        });

        circle.bindPopup(this.createZonePopup(z));
        circle.on('click', () => {
          window.appUI.selectZone(z.key);
        });
        this.dashLayers.zones.addLayer(circle);
      });
    }

    // Render to FullMap
    if (this.fullMap && this.fullLayers.zones) {
      this.fullLayers.zones.clearLayers();
      this.store.riskZones.forEach(z => {
        const c = riskColors[z.risk.level] || riskColors.LOW;
        const isSelected = (z.key === this.store.activeZoneKey);
        const circle = L.circle(z.center, {
          radius: z.radius,
          color: isSelected ? '#38bdf8' : c.stroke,
          weight: isSelected ? 3.5 : 2,
          fillColor: c.fill,
          fillOpacity: isSelected ? 0.55 : 0.35
        });

        circle.bindPopup(this.createZonePopup(z));
        circle.on('click', () => {
          window.appUI.selectZone(z.key);
        });
        this.fullLayers.zones.addLayer(circle);
      });
    }
  }

  createZonePopup(z) {
    return `
      <div class="sensor-popup-card">
        <div class="popup-header">
          <div class="popup-type-badge" style="background: ${z.risk.color}26; color: ${z.risk.color}">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <div>
            <div class="popup-name">${z.name}</div>
            <div class="popup-location"><i class="fa-solid fa-location-crosshairs"></i> Inundation Catchment</div>
          </div>
        </div>
        <div class="popup-body">
          <div class="popup-reading-row">
            <span class="popup-reading-label">Flood Probability</span>
            <div>
              <span class="popup-reading-value mono-num" style="color:${z.risk.color}">${z.prob}%</span>
            </div>
          </div>
          <div class="popup-bar-track">
            <div class="popup-bar-fill" style="width: ${z.prob}%; background: ${z.risk.color}"></div>
          </div>
          <div class="popup-meta-grid">
            <div class="popup-meta-item">
              <span class="popup-meta-label">Rainfall</span>
              <span class="popup-meta-val mono-num">${z.rainfall} mm/hr</span>
            </div>
            <div class="popup-meta-item">
              <span class="popup-meta-label">Drain Level</span>
              <span class="popup-meta-val mono-num">${z.drainLevel}%</span>
            </div>
            <div class="popup-meta-item">
              <span class="popup-meta-label">Capacity</span>
              <span class="popup-meta-val mono-num">${z.capacity}% Free</span>
            </div>
            <div class="popup-meta-item">
              <span class="popup-meta-label">Status</span>
              <span class="popup-meta-val" style="color:${z.risk.color}; font-weight:700;">${z.risk.level}</span>
            </div>
          </div>
        </div>
        <div class="popup-footer">
          <span>Coupled Hydro-ML v2</span>
          <span class="popup-status-pill" style="background:${z.risk.color}26; color:${z.risk.color}">${z.risk.tag}</span>
        </div>
      </div>
    `;
  }

  renderSensors() {
    const createMarker = (s) => {
      let typeClass = "marker-rain";
      let pillText = `${s.val} ${s.unit || ""}`;
      let shouldPulse = false;

      if (s.type === "rainfall") {
        typeClass = "marker-rain";
        if (s.val >= 60) shouldPulse = true;
      } else if (s.type === "water") {
        typeClass = "marker-water";
        if (s.val >= 2.0) shouldPulse = true;
      } else if (s.type === "pressure") {
        typeClass = "marker-pressure";
        if (s.val >= 50) shouldPulse = true;
      } else if (s.type === "blockage") {
        typeClass = "marker-blockage active-blockage";
        pillText = s.val === 1 ? "BLOCKAGE" : "CLEAR";
        shouldPulse = (s.val === 1);
      }

      const pulseHtml = shouldPulse ? '<div class="marker-pulse-ring"></div>' : '';
      const html = `
        <div class="custom-marker ${typeClass} ${shouldPulse ? 'pulse' : ''}">
          ${pulseHtml}
          <div class="marker-inner">
            <i class="fa-solid ${s.icon}"></i>
          </div>
          <div class="marker-pill mono-num">${pillText}</div>
        </div>
      `;

      const icon = L.divIcon({
        html: html,
        className: 'leaflet-custom-div-icon',
        iconSize: [36, 48],
        iconAnchor: [18, 20],
        popupAnchor: [0, -18]
      });

      const popupHtml = `
        <div class="sensor-popup-card">
          <div class="popup-header">
            <div class="popup-type-badge ${s.type}-color">
              <i class="fa-solid ${s.icon}"></i>
            </div>
            <div>
              <div class="popup-name">${s.name}</div>
              <div class="popup-location">${s.zoneKey}</div>
            </div>
          </div>
          <div class="popup-body">
            <div class="popup-reading-row">
              <span class="popup-reading-label">Current Reading</span>
              <div>
                <span class="popup-reading-value mono-num">${s.val}</span>
                <span class="popup-reading-unit">${s.unit || ""}</span>
              </div>
            </div>
            <div class="popup-meta-grid">
              <div class="popup-meta-item">
                <span class="popup-meta-label">Sensor ID</span>
                <span class="popup-meta-val mono-num">${s.id}</span>
              </div>
              <div class="popup-meta-item">
                <span class="popup-meta-label">Sensor Type</span>
                <span class="popup-meta-val">${s.type.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <span>● Real-time Telemetry</span>
            <span class="popup-status-pill status-normal">NORMAL</span>
          </div>
        </div>
      `;

      const m = L.marker([s.lat, s.lng], { icon: icon });
      m.bindPopup(popupHtml, { maxWidth: 300 });
      return m;
    };

    // Render to DashMap
    if (this.dashMap && this.dashLayers.sensors) {
      this.dashLayers.sensors.clearLayers();
      this.store.sensors.forEach(s => {
        this.dashLayers.sensors.addLayer(createMarker(s));
      });
    }

    // Render to FullMap
    if (this.fullMap && this.fullLayers.sensors) {
      this.fullLayers.sensors.clearLayers();
      this.fullLayers.blockages.clearLayers();
      this.store.sensors.forEach(s => {
        const m = createMarker(s);
        if (s.type === "blockage") {
          this.fullLayers.blockages.addLayer(m);
        } else {
          this.fullLayers.sensors.addLayer(m);
        }
      });
    }
  }

  focusZone(zoneKey) {
    const z = ZONES_DATABASE[zoneKey];
    if (!z) return;
    const targetLat = this.store.centerLat + z.latOffset;
    const targetLng = this.store.centerLng + z.lngOffset;

    if (this.dashMap) {
      this.dashMap.flyTo([targetLat, targetLng], 14, { duration: 1.0 });
    }
    if (this.fullMap) {
      this.fullMap.flyTo([targetLat, targetLng], 15, { duration: 1.2 });
    }
    this.renderZones();
  }

  toggleBasemapStyle() {
    const isDark = (this.currentBaseStyle === "dark");
    const nextStyle = isDark ? "standard" : "dark";

    const dashContainer = document.getElementById("dashboard-map");
    const fullContainer = document.getElementById("full-map");

    if (nextStyle === "standard") {
      if (dashContainer) dashContainer.classList.remove("osm-dark-tiles");
      if (fullContainer) fullContainer.classList.remove("osm-dark-tiles");
      this.currentBaseStyle = "standard";
      return "OSM Standard";
    } else {
      if (dashContainer) dashContainer.classList.add("osm-dark-tiles");
      if (fullContainer) fullContainer.classList.add("osm-dark-tiles");
      this.currentBaseStyle = "dark";
      return "OSM Dark";
    }
  }

  toggleLayer(layerKey) {
    if (layerKey === 'risk') {
      this.visibleLayers.risk = !this.visibleLayers.risk;
      const isVis = this.visibleLayers.risk;
      if (this.dashMap && this.dashLayers.zones) {
        if (isVis) this.dashMap.addLayer(this.dashLayers.zones);
        else this.dashMap.removeLayer(this.dashLayers.zones);
      }
      if (this.fullMap && this.fullLayers.zones) {
        if (isVis) this.fullMap.addLayer(this.fullLayers.zones);
        else this.fullMap.removeLayer(this.fullLayers.zones);
      }
      return isVis;
    } else if (layerKey === 'sensors') {
      this.visibleLayers.sensors = !this.visibleLayers.sensors;
      const isVis = this.visibleLayers.sensors;
      if (this.dashMap && this.dashLayers.sensors) {
        if (isVis) this.dashMap.addLayer(this.dashLayers.sensors);
        else this.dashMap.removeLayer(this.dashLayers.sensors);
      }
      if (this.fullMap && this.fullLayers.sensors) {
        if (isVis) this.fullMap.addLayer(this.fullLayers.sensors);
        else this.fullMap.removeLayer(this.fullLayers.sensors);
      }
      return isVis;
    } else if (layerKey === 'blockages') {
      this.visibleLayers.blockages = !this.visibleLayers.blockages;
      const isVis = this.visibleLayers.blockages;
      if (this.fullMap && this.fullLayers.blockages) {
        if (isVis) this.fullMap.addLayer(this.fullLayers.blockages);
        else this.fullMap.removeLayer(this.fullLayers.blockages);
      }
      return isVis;
    }
  }

  setUserLocation(lat, lng, accuracy) {
    if (!this.fullMap) return;
    this.fullLayers.userLoc.clearLayers();

    const userIcon = L.divIcon({
      html: `
        <div class="custom-marker marker-user pulse">
          <div class="marker-pulse-ring"></div>
          <div class="marker-inner">
            <i class="fa-solid fa-location-crosshairs"></i>
          </div>
          <div class="marker-pill">My Location</div>
        </div>
      `,
      className: 'leaflet-custom-div-icon',
      iconSize: [36, 48],
      iconAnchor: [18, 20],
      popupAnchor: [0, -18]
    });

    const m = L.marker([lat, lng], { icon: userIcon });
    m.bindPopup(`
      <div class="sensor-popup-card">
        <div class="popup-header">
          <div class="popup-type-badge user-color" style="background: rgba(59,130,246,0.2); color: #3b82f6;">
            <i class="fa-solid fa-location-crosshairs"></i>
          </div>
          <div>
            <div class="popup-name">Your Location</div>
            <div class="popup-location">Detected via Browser Geolocation API</div>
          </div>
        </div>
        <div class="popup-body">
          <div class="popup-meta-grid">
            <div class="popup-meta-item">
              <span class="popup-meta-label">Coordinates</span>
              <span class="popup-meta-val mono-num">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
            </div>
            <div class="popup-meta-item">
              <span class="popup-meta-label">Accuracy</span>
              <span class="popup-meta-val mono-num">&plusmn;${Math.round(accuracy || 20)} m</span>
            </div>
          </div>
        </div>
      </div>
    `);

    this.fullLayers.userLoc.addLayer(m);
    this.fullMap.flyTo([lat, lng], 14, { duration: 1.5 });
  }

  invalidateSizes() {
    setTimeout(() => {
      if (this.dashMap) this.dashMap.invalidateSize();
      if (this.fullMap) this.fullMap.invalidateSize();
    }, 200);
  }
}

// ==============================================================================
// 5. User Interface & State Controller
// ==============================================================================

class UnifiedUIController {
  constructor(store, mapEngine) {
    this.store = store;
    this.map = mapEngine;

    this.initDOM();
    this.bindEvents();
    this.startClock();
    this.startSimulationLoop();
    this.updateAllUI();
  }

  initDOM() {
    this.dom = {
      // Clock & Meta
      clock: document.getElementById("system-clock"),
      zoneSelect: document.getElementById("zone-select"),
      dashRefreshBtn: document.getElementById("btn-manual-refresh"),
      dashRefreshIcon: document.getElementById("dash-refresh-icon"),

      // Metric Cards
      rainVal: document.getElementById("metric-rain-val"),
      rainBadge: document.getElementById("metric-rain-badge"),
      rainTrend: document.getElementById("metric-rain-trend"),
      rainBar: document.getElementById("metric-rain-bar"),

      drainVal: document.getElementById("metric-drain-val"),
      drainBadge: document.getElementById("metric-drain-badge"),
      drainTrend: document.getElementById("metric-drain-trend"),
      drainBar: document.getElementById("metric-drain-bar"),
      drainDepth: document.getElementById("metric-drain-depth"),

      capVal: document.getElementById("metric-cap-val"),
      capBadge: document.getElementById("metric-cap-badge"),
      capTrend: document.getElementById("metric-cap-trend"),
      capBar: document.getElementById("metric-cap-bar"),
      pressureVal: document.getElementById("metric-pressure-val"),

      durationVal: document.getElementById("metric-duration-val"),

      // ML Prediction Card
      gaugeConic: document.getElementById("gauge-conic"),
      gaugeProbText: document.getElementById("gauge-prob-text"),
      riskTag: document.getElementById("risk-tag"),
      riskDescText: document.getElementById("risk-desc-text"),
      scaleMarkerPin: document.getElementById("scale-marker-pin"),
      riskBox: document.getElementById("risk-box"),

      // Chart
      chartZoneTag: document.getElementById("chart-zone-tag"),
      trendPolyline: document.getElementById("trend-polyline"),
      trendAreaPath: document.getElementById("trend-area-path"),
      rainPolyline: document.getElementById("rain-polyline"),
      chartTimelineLabels: document.getElementById("chart-timeline-labels"),

      // Tables & Logs
      zoneTableBody: document.getElementById("zone-table-body"),
      recentReadingsBody: document.getElementById("recent-readings-body"),
      systemLogFeed: document.getElementById("system-log-feed"),
      btnClearLog: document.getElementById("btn-clear-log"),

      // Full Map HUD
      hudRiskBadge: document.getElementById("hud-risk-badge"),
      hudRiskScoreVal: document.getElementById("hud-risk-score-value"),
      hudRiskMeterFill: document.getElementById("hud-risk-meter-fill"),
      hudRiskSummary: document.getElementById("hud-risk-summary"),
      hudRiskIconWrapper: document.getElementById("hud-risk-icon-wrapper"),
      hudRiskIcon: document.getElementById("hud-risk-icon"),
      hudRainVal: document.getElementById("hud-rainfall-val"),
      hudRainBadge: document.getElementById("hud-rainfall-status-badge"),
      hudRainFill: document.getElementById("hud-rainfall-fill"),
      hudWaterVal: document.getElementById("hud-water-val"),
      hudWaterBadge: document.getElementById("hud-water-status-badge"),
      hudWaterFill: document.getElementById("hud-water-fill"),
      hudPressureVal: document.getElementById("hud-pressure-val"),
      hudPressureFill: document.getElementById("hud-pressure-fill"),
      hudBlockageVal: document.getElementById("hud-blockage-val"),
      hudBlockageBadge: document.getElementById("hud-blockage-status-badge"),
      hudBlockageFill: document.getElementById("hud-blockage-fill"),
      hudLastUpdatedText: document.getElementById("hud-last-updated-text"),
      hudUpdateTimerBar: document.getElementById("hud-update-timer-bar"),

      // Actions & Controls
      scenarioToggleBtn: document.getElementById("scenario-toggle-btn"),
      scenarioBtnText: document.getElementById("scenario-btn-text"),
      mapStyleToggle: document.getElementById("map-style-toggle"),
      mapStyleText: document.getElementById("map-style-text"),
      searchForm: document.getElementById("search-form"),
      searchInput: document.getElementById("search-input"),
      searchClearBtn: document.getElementById("search-clear-btn"),
      quickBasinPills: document.getElementById("quick-basin-pills"),
      btnExpandFullMap: document.getElementById("btn-expand-fullmap"),

      // Sidebar & Navigation
      appSidebar: document.getElementById("app-sidebar"),
      mobileSidebarToggle: document.getElementById("mobile-sidebar-toggle"),
      viewButtons: document.querySelectorAll(".view-btn"),
      navItems: document.querySelectorAll(".sidebar-nav .nav-item"),
      viewContainers: document.querySelectorAll(".view-container"),

      // Map Controls Toolbar
      btnMyLocation: document.getElementById("btn-my-location"),
      btnToggleRisk: document.getElementById("btn-toggle-risk"),
      btnToggleSensors: document.getElementById("btn-toggle-sensors"),
      btnToggleBlockages: document.getElementById("btn-toggle-blockages"),
      btnRefreshData: document.getElementById("btn-refresh-data"),
      refreshIcon: document.getElementById("refresh-icon"),

      // Panels
      floatingHudPanel: document.getElementById("floating-hud-panel"),
      hudCollapseBtn: document.getElementById("hud-collapse-btn"),
      hudCollapseChevron: document.getElementById("hud-collapse-chevron"),
      legendPanel: document.getElementById("legend-panel"),
      legendToggleBtn: document.getElementById("legend-toggle-btn"),
      toastContainer: document.getElementById("toast-container")
    };
  }

  bindEvents() {
    // 1. Zone dropdown selection
    if (this.dom.zoneSelect) {
      this.dom.zoneSelect.addEventListener("change", (e) => {
        this.selectZone(e.target.value);
      });
    }

    // 2. Zone status table row click
    if (this.dom.zoneTableBody) {
      this.dom.zoneTableBody.addEventListener("click", (e) => {
        const row = e.target.closest(".zone-row");
        if (!row) return;
        const key = row.dataset.zoneKey;
        if (key) this.selectZone(key);
      });
    }

    // 3. Quick Basin Pills
    if (this.dom.quickBasinPills) {
      this.dom.quickBasinPills.addEventListener("click", (e) => {
        const pill = e.target.closest(".basin-pill");
        if (!pill) return;
        document.querySelectorAll(".basin-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const idx = parseInt(pill.dataset.zoneIdx, 10);
        const keys = Object.keys(ZONES_DATABASE);
        if (keys[idx]) this.selectZone(keys[idx]);
      });
    }

    // 4. View Switching (Sidebar & Top Nav)
    const switchView = (targetView) => {
      this.store.currentView = targetView;
      this.dom.viewContainers.forEach(c => {
        c.classList.toggle("active", c.id === `view-${targetView}`);
      });
      this.dom.viewButtons.forEach(b => {
        b.classList.toggle("active", b.dataset.view === targetView);
      });
      this.dom.navItems.forEach(n => {
        n.classList.toggle("active", n.dataset.view === targetView);
      });

      if (targetView === "live-map") {
        this.map.initFullscreenMap();
      }
      this.map.invalidateSizes();
    };

    this.dom.viewButtons.forEach(btn => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    this.dom.navItems.forEach(item => {
      item.addEventListener("click", () => switchView(item.dataset.view));
    });

    if (this.dom.btnExpandFullMap) {
      this.dom.btnExpandFullMap.addEventListener("click", () => switchView("live-map"));
    }

    // 5. Scenario Toggle (Demo Cloudburst)
    if (this.dom.scenarioToggleBtn) {
      this.dom.scenarioToggleBtn.addEventListener("click", () => {
        if (this.store.scenarioMode === "normal") {
          this.store.scenarioMode = "cloudburst";
          this.dom.scenarioToggleBtn.classList.add("active-storm");
          this.dom.scenarioBtnText.textContent = "Active: Cloudburst";
          this.showToast("⚠️ Simulating Extreme Monsoon Cloudburst Surge!", "alert");
        } else {
          this.store.scenarioMode = "normal";
          this.dom.scenarioToggleBtn.classList.remove("active-storm");
          this.dom.scenarioBtnText.textContent = "Demo: Cloudburst";
          this.showToast("Normal baseline weather restored", "success");
        }
        this.store.tickSimulation();
        this.map.renderAll();
        this.updateAllUI();
      });
    }

    // 6. Basemap Switcher
    if (this.dom.mapStyleToggle) {
      this.dom.mapStyleToggle.addEventListener("click", () => {
        const newStyle = this.map.toggleBasemapStyle();
        this.dom.mapStyleText.textContent = newStyle;
        this.showToast(`Switched basemap to ${newStyle}`);
      });
    }

    // 7. Search Form & Clear
    if (this.dom.searchForm) {
      this.dom.searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = this.dom.searchInput.value.trim();
        if (q) this.geocodeSearch(q);
      });
    }

    if (this.dom.searchInput) {
      this.dom.searchInput.addEventListener("input", () => {
        this.dom.searchClearBtn.style.display = this.dom.searchInput.value ? "block" : "none";
      });
    }

    if (this.dom.searchClearBtn) {
      this.dom.searchClearBtn.addEventListener("click", () => {
        this.dom.searchInput.value = "";
        this.dom.searchClearBtn.style.display = "none";
        this.dom.searchInput.focus();
      });
    }

    // 8. Manual Refresh Buttons
    const handleRefresh = () => {
      if (this.dom.dashRefreshIcon) {
        this.dom.dashRefreshIcon.classList.add("spin-anim");
        setTimeout(() => this.dom.dashRefreshIcon.classList.remove("spin-anim"), 800);
      }
      if (this.dom.refreshIcon) {
        this.dom.refreshIcon.classList.add("spin-anim");
        setTimeout(() => this.dom.refreshIcon.classList.remove("spin-anim"), 800);
      }
      this.store.tickSimulation();
      this.map.renderAll();
      this.updateAllUI();
      this.showToast("Telemetry refreshed from coupled sensor array", "success");
    };

    if (this.dom.dashRefreshBtn) this.dom.dashRefreshBtn.addEventListener("click", handleRefresh);
    if (this.dom.btnRefreshData) this.dom.btnRefreshData.addEventListener("click", handleRefresh);

    // 9. My Location (Geolocation API)
    if (this.dom.btnMyLocation) {
      this.dom.btnMyLocation.addEventListener("click", () => {
        this.locateUser();
      });
    }

    // 10. Map Control Toolbar Layer Toggles
    if (this.dom.btnToggleRisk) {
      this.dom.btnToggleRisk.addEventListener("click", () => {
        const active = this.map.toggleLayer("risk");
        this.dom.btnToggleRisk.classList.toggle("active", active);
        this.showToast(active ? "Flood Risk Zones visible" : "Flood Risk Zones hidden");
      });
    }

    if (this.dom.btnToggleSensors) {
      this.dom.btnToggleSensors.addEventListener("click", () => {
        const active = this.map.toggleLayer("sensors");
        this.dom.btnToggleSensors.classList.toggle("active", active);
        this.showToast(active ? "IoT Sensors visible" : "IoT Sensors hidden");
      });
    }

    if (this.dom.btnToggleBlockages) {
      this.dom.btnToggleBlockages.addEventListener("click", () => {
        const active = this.map.toggleLayer("blockages");
        this.dom.btnToggleBlockages.classList.toggle("active", active);
        this.showToast(active ? "Drain Blockages visible" : "Drain Blockages hidden");
      });
    }

    // 11. Chart Time Range Buttons
    document.querySelectorAll(".time-range-group .range-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".time-range-group .range-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.store.chartHours = parseInt(btn.dataset.hours, 10);
        this.updateTrendChart();
      });
    });

    // 12. Floating HUD Collapse
    if (this.dom.hudCollapseBtn) {
      this.dom.hudCollapseBtn.addEventListener("click", () => {
        this.dom.floatingHudPanel.classList.toggle("collapsed");
        const isCollapsed = this.dom.floatingHudPanel.classList.contains("collapsed");
        this.dom.hudCollapseChevron.className = isCollapsed ? "fa-solid fa-chevron-right" : "fa-solid fa-chevron-left";
      });
    }

    // 13. Legend Collapse
    if (this.dom.legendToggleBtn) {
      this.dom.legendToggleBtn.addEventListener("click", () => {
        this.dom.legendPanel.classList.toggle("collapsed");
      });
    }

    // 14. Clear Log
    if (this.dom.btnClearLog) {
      this.dom.btnClearLog.addEventListener("click", () => {
        this.store.systemLogs = [];
        this.renderSystemLogs();
        this.showToast("Event log cleared");
      });
    }

    // 15. Mobile Sidebar Toggle
    if (this.dom.mobileSidebarToggle) {
      this.dom.mobileSidebarToggle.addEventListener("click", () => {
        this.dom.appSidebar.classList.toggle("open-mobile");
      });
    }
  }

  selectZone(zoneKey) {
    if (!ZONES_DATABASE[zoneKey]) return;
    this.store.activeZoneKey = zoneKey;
    if (this.dom.zoneSelect) this.dom.zoneSelect.value = zoneKey;

    // Highlight row in table
    document.querySelectorAll("#zone-table-body .zone-row").forEach(r => {
      r.classList.toggle("selected-row", r.dataset.zoneKey === zoneKey);
    });

    // Update map camera
    this.map.focusZone(zoneKey);

    // Update UI components
    this.updateAllUI();
    this.showToast(`Switched active view to ${ZONES_DATABASE[zoneKey].shortName}`);
  }

  updateAllUI() {
    const zone = ZONES_DATABASE[this.store.activeZoneKey];
    if (!zone) return;

    // 1. Calculate ML Probability & Risk
    const prob = calculateFloodProbability(zone.rainfall, zone.drainLevel, zone.capacity, zone.durationMin, zone.blockages);
    const risk = getRiskCategory(prob);

    // 2. Metric Cards
    if (this.dom.rainVal) this.dom.rainVal.textContent = zone.rainfall.toFixed(1);
    if (this.dom.rainBar) this.dom.rainBar.style.width = `${Math.min(100, (zone.rainfall / 90) * 100)}%`;
    if (this.dom.rainBadge) {
      const rBadge = (zone.rainfall >= 70) ? "Extreme" : (zone.rainfall >= 40) ? "Heavy" : "Normal";
      this.dom.rainBadge.textContent = rBadge;
      this.dom.rainBadge.className = `metric-badge ${zone.rainfall >= 70 ? 'status-critical' : zone.rainfall >= 40 ? 'status-high' : 'status-normal'}`;
    }

    if (this.dom.drainVal) this.dom.drainVal.textContent = zone.drainLevel;
    if (this.dom.drainDepth) this.dom.drainDepth.textContent = `(${zone.waterMeters} m)`;
    if (this.dom.drainBar) this.dom.drainBar.style.width = `${zone.drainLevel}%`;
    if (this.dom.drainBadge) {
      const dBadge = (zone.drainLevel >= 75) ? "Critical" : (zone.drainLevel >= 55) ? "Warning" : "Normal";
      this.dom.drainBadge.textContent = dBadge;
      this.dom.drainBadge.className = `metric-badge ${zone.drainLevel >= 75 ? 'status-critical' : zone.drainLevel >= 55 ? 'status-warning' : 'status-normal'}`;
    }

    if (this.dom.capVal) this.dom.capVal.textContent = zone.capacity;
    if (this.dom.pressureVal) this.dom.pressureVal.textContent = `(${zone.pressureKpa} kPa)`;
    if (this.dom.capBar) this.dom.capBar.style.width = `${zone.capacity}%`;
    if (this.dom.capBadge) {
      this.dom.capBadge.textContent = `${zone.capacity}% Free`;
      this.dom.capBadge.className = `metric-badge ${zone.capacity <= 40 ? 'status-critical' : zone.capacity <= 65 ? 'status-warning' : 'status-normal'}`;
    }

    if (this.dom.durationVal) {
      const hrs = Math.floor(zone.durationMin / 60);
      const mins = zone.durationMin % 60;
      this.dom.durationVal.textContent = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
    }

    // 3. ML Prediction Circular Gauge (Design 1 Conic Gradient)
    if (this.dom.gaugeProbText) this.dom.gaugeProbText.textContent = `${prob}%`;
    if (this.dom.gaugeConic) {
      this.dom.gaugeConic.style.background = `conic-gradient(${risk.color} 0 ${prob}%, #162a4a ${prob}% 100%)`;
    }
    if (this.dom.riskTag) {
      this.dom.riskTag.textContent = risk.tag;
      this.dom.riskTag.style.color = risk.color;
    }
    if (this.dom.riskDescText) this.dom.riskDescText.textContent = risk.desc;
    if (this.dom.scaleMarkerPin) this.dom.scaleMarkerPin.style.left = `${prob}%`;
    if (this.dom.riskBox) {
      this.dom.riskBox.style.borderColor = `${risk.color}66`;
    }

    // 4. Update Tables & Logs
    this.renderZoneStatusTable();
    this.renderRecentReadings();
    this.renderSystemLogs();
    this.updateTrendChart();

    // 5. Update Full Map HUD Telemetry
    if (this.dom.hudRiskBadge) {
      this.dom.hudRiskBadge.textContent = risk.level;
      this.dom.hudRiskBadge.style.color = risk.color;
    }
    if (this.dom.hudRiskScoreVal) this.dom.hudRiskScoreVal.textContent = `${prob} / 100`;
    if (this.dom.hudRiskMeterFill) this.dom.hudRiskMeterFill.style.width = `${prob}%`;
    if (this.dom.hudRiskSummary) this.dom.hudRiskSummary.textContent = risk.desc;
    if (this.dom.hudRiskIconWrapper) {
      this.dom.hudRiskIconWrapper.style.borderColor = risk.color;
      this.dom.hudRiskIconWrapper.style.color = risk.color;
    }
    if (this.dom.hudRainVal) this.dom.hudRainVal.textContent = zone.rainfall.toFixed(1);
    if (this.dom.hudRainFill) this.dom.hudRainFill.style.width = `${Math.min(100, (zone.rainfall / 90) * 100)}%`;
    if (this.dom.hudWaterVal) this.dom.hudWaterVal.textContent = zone.waterMeters.toFixed(2);
    if (this.dom.hudWaterFill) this.dom.hudWaterFill.style.width = `${zone.drainLevel}%`;
    if (this.dom.hudPressureVal) this.dom.hudPressureVal.textContent = zone.pressureKpa.toFixed(1);
    if (this.dom.hudPressureFill) this.dom.hudPressureFill.style.width = `${Math.min(100, (zone.pressureKpa / 80) * 100)}%`;
    if (this.dom.hudBlockageVal) this.dom.hudBlockageVal.textContent = zone.blockages;
    if (this.dom.hudBlockageBadge) {
      this.dom.hudBlockageBadge.textContent = zone.blockages > 0 ? "Detected" : "Clear";
      this.dom.hudBlockageBadge.className = `metric-badge ${zone.blockages > 0 ? 'status-critical' : 'status-normal'}`;
    }
    if (this.dom.hudBlockageFill) this.dom.hudBlockageFill.style.width = zone.blockages > 0 ? "100%" : "0%";
  }

  renderZoneStatusTable() {
    if (!this.dom.zoneTableBody) return;
    const rowsHtml = Object.keys(ZONES_DATABASE).map(k => {
      const z = ZONES_DATABASE[k];
      const p = calculateFloodProbability(z.rainfall, z.drainLevel, z.capacity, z.durationMin, z.blockages);
      const r = getRiskCategory(p);
      const isSelected = (k === this.store.activeZoneKey);

      let dotColor = "green";
      if (r.level === "CRITICAL") dotColor = "red";
      else if (r.level === "HIGH") dotColor = "orange";
      else if (r.level === "MODERATE") dotColor = "yellow";

      let statusBadgeLabel = "Normal";
      if (r.level === "CRITICAL") statusBadgeLabel = "Warning";
      else if (r.level === "HIGH") statusBadgeLabel = "Take Action";
      else if (r.level === "MODERATE") statusBadgeLabel = "Monitor";

      return `
        <tr data-zone-key="${k}" class="zone-row ${isSelected ? 'selected-row' : ''}">
          <td><span class="dot ${dotColor}"></span> ${z.shortName}</td>
          <td><span class="risk-pill-text ${r.level.toLowerCase()}">${r.level}</span></td>
          <td class="mono-num">${p}%</td>
          <td class="mono-num">${z.capacity}%</td>
          <td><span class="status-badge ${r.tableClass}">${statusBadgeLabel}</span></td>
        </tr>
      `;
    }).join("");

    this.dom.zoneTableBody.innerHTML = rowsHtml;
  }

  renderRecentReadings() {
    if (!this.dom.recentReadingsBody) return;
    const html = this.store.recentReadings.map(r => `
      <tr>
        <td class="mono-num">${r.timeStr}</td>
        <td class="mono-num">${r.rainfall} mm/h</td>
        <td class="mono-num">${r.drain}</td>
        <td class="mono-num">${r.capacity}</td>
      </tr>
    `).join("");
    this.dom.recentReadingsBody.innerHTML = html;
  }

  renderSystemLogs() {
    if (!this.dom.systemLogFeed) return;
    const html = this.store.systemLogs.map(l => `
      <div class="log-entry log-${l.type}">
        <span class="log-time">${l.time}</span>
        <span>${l.badge} <strong>${l.title}</strong></span>
        <div style="font-size: 9.5px; opacity: 0.9; margin-top: 2px;">${l.detail}</div>
      </div>
    `).join("");
    this.dom.systemLogFeed.innerHTML = html;
  }

  updateTrendChart() {
    const zone = ZONES_DATABASE[this.store.activeZoneKey];
    if (!zone) return;
    if (this.dom.chartZoneTag) this.dom.chartZoneTag.textContent = zone.shortName;

    // Generate trend coordinates based on active probability
    const activeProb = calculateFloodProbability(zone.rainfall, zone.drainLevel, zone.capacity, zone.durationMin, zone.blockages);
    const hours = this.store.chartHours || 6;
    const numPoints = 7;
    const stepX = (900 - 50) / (numPoints - 1);

    // Timeline labels
    const now = new Date();
    const timelineLabels = [];
    for (let i = numPoints - 1; i >= 0; i--) {
      const t = new Date(now.getTime() - (i * (hours / (numPoints - 1))) * 3600000);
      timelineLabels.push(t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    }

    if (this.dom.chartTimelineLabels) {
      this.dom.chartTimelineLabels.innerHTML = timelineLabels.map((lbl, idx) => {
        const x = 50 + idx * stepX - 12;
        return `<text x="${x}" y="154">${lbl}</text>`;
      }).join("");
    }

    // Historical simulation curve heading toward current activeProb
    const curvePoints = [];
    const rainPoints = [];
    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1);
      // Smoothed curve converging to activeProb
      const startProb = Math.max(10, activeProb - 35);
      const currentVal = startProb + (activeProb - startProb) * Math.pow(progress, 1.2) + Math.sin(i * 1.5) * 4;
      // Map 0 - 100% to Y: 135 (0%) down to 20 (100%)
      const y = 135 - (currentVal / 100) * (135 - 20);
      const x = 50 + i * stepX;
      curvePoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);

      // Rain curve scaled
      const rainY = 135 - (Math.min(90, zone.rainfall * (0.4 + progress * 0.6)) / 90) * (135 - 35);
      rainPoints.push(`${x.toFixed(1)},${rainY.toFixed(1)}`);
    }

    const pointsStr = curvePoints.join(" ");
    if (this.dom.trendPolyline) this.dom.trendPolyline.setAttribute("points", pointsStr);

    const firstPt = curvePoints[0].split(",");
    const lastPt = curvePoints[curvePoints.length - 1].split(",");
    const areaStr = `M50,135 L${curvePoints.join(" L")} L${lastPt[0]},135 Z`;
    if (this.dom.trendAreaPath) this.dom.trendAreaPath.setAttribute("d", areaStr);

    if (this.dom.rainPolyline) this.dom.rainPolyline.setAttribute("points", rainPoints.join(" "));
  }

  startClock() {
    const updateTime = () => {
      const d = new Date();
      if (this.dom.clock) {
        this.dom.clock.textContent = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }) + " " + d.toLocaleTimeString();
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  startSimulationLoop() {
    let secondsSinceLast = 0;
    setInterval(() => {
      secondsSinceLast += 1;
      if (secondsSinceLast >= CONFIG.SIMULATION_INTERVAL_MS / 1000) {
        this.store.tickSimulation();
        this.map.renderAll();
        this.updateAllUI();
        secondsSinceLast = 0;
      }

      if (this.dom.hudLastUpdatedText) {
        this.dom.hudLastUpdatedText.textContent = secondsSinceLast <= 1 ? "Just now" : `${secondsSinceLast}s ago`;
      }
      if (this.dom.hudUpdateTimerBar) {
        const pct = Math.max(0, 100 - (secondsSinceLast / (CONFIG.SIMULATION_INTERVAL_MS / 1000)) * 100);
        this.dom.hudUpdateTimerBar.style.width = `${pct}%`;
      }
    }, 1000);
  }

  async geocodeSearch(query) {
    this.showToast(`Searching location "${query}"...`);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        this.store.recenter(lat, lng);
        this.map.dashMap.flyTo([lat, lng], 13, { duration: 1.5 });
        if (this.map.fullMap) this.map.fullMap.flyTo([lat, lng], 14, { duration: 1.5 });
        this.map.renderAll();
        this.updateAllUI();
        this.showToast(`Relocated sensor network to: ${data[0].display_name.split(",")[0]}`, "success");
      } else {
        this.showToast(`No location found for "${query}"`, "alert");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      this.showToast("Geocoding service unavailable.", "alert");
    }
  }

  locateUser() {
    if (!navigator.geolocation) {
      this.showToast("Geolocation not supported by browser.", "alert");
      return;
    }
    this.showToast("Detecting position via GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        this.store.recenter(latitude, longitude);
        this.map.setUserLocation(latitude, longitude, accuracy);
        this.map.renderAll();
        this.updateAllUI();
        this.showToast(`Position calibrated (±${Math.round(accuracy)}m)`, "success");
      },
      (err) => {
        this.showToast("Unable to fetch location: " + err.message, "alert");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  showToast(message, type = "info") {
    if (!this.dom.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast-item ${type === 'alert' ? 'toast-alert' : (type === 'success' ? 'toast-success' : '')}`;
    let icon = "fa-circle-info";
    if (type === "alert") icon = "fa-triangle-exclamation";
    else if (type === "success") icon = "fa-circle-check";

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "toast-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// ==============================================================================
// 6. Application Bootstrap
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  const store = new NowcastingStore();
  const mapEngine = new DualMapEngine(store);
  window.appUI = new UnifiedUIController(store, mapEngine);

  console.log("%c Urban Flood Nowcasting System (Combined Unified Build) Loaded ", "background: #0284c7; color: #fff; font-weight: bold; border-radius: 4px; padding: 4px 8px;");
  console.log("ML Logistic Predictor + Leaflet Dual GIS Maps + Coupled IoT Telemetry Stream running.");
});
