/**
 * Urban Flood Nowcasting System - Master Application Controller
 *
 * Coordinates:
 * - Real-time state store and zone telemetry
 * - Interactive Leaflet GIS Map synchronization
 * - Hydrological Calculation Engine
 * - ML Flood Prediction Service integration
 * - Time-series Chart.js sensor trend graphs
 * - Real-time Alert System
 * - Manual Sensor Override controls
 * - Drain Blockage simulation
 * - Dynamic Safe Route planning
 * - Multi-city switching
 *
 * Supported cities:
 * - Guntur
 * - Vijayawada
 * - Hyderabad
 *
 * NOTE:
 * Vijayawada and Hyderabad fallback zones are PROTOTYPE/DEMO
 * catchments generated around the configured city center.
 */

class UrbanFloodApp {

  constructor() {

    this.cityConfig = window.CITY_CONFIG || {
      activeCityKey: "Guntur",
      cities: {}
    };

    this.currentCityKey = "Guntur";

    this.zones = [];

    this.activeZoneId = "ZONE-01";

    this.activeView = "dashboard";

    this.alerts = [];

    this.eventLogs = [];

    this.demoMode = {
      active: false,
      stage: 1,
      timer: null,
      stageDurationSeconds: 6,
      currentSecond: 0,
      secondInterval: null
    };

    this.routingState = {
      startZoneId: "ZONE-01",
      destZoneId: "ZONE-05",
      routeInfo: null
    };

    this.autoSimInterval = null;
  }


  /**
   * ============================================================
   * APPLICATION INITIALIZATION
   * ============================================================
   */

  async init() {

    // Make sure all required city presets exist.
    this.prepareCityPresets();

    // Use configured active city if available.
    const configuredCity =
      this.cityConfig.activeCityKey &&
      this.cityConfig.cities[this.cityConfig.activeCityKey]
        ? this.cityConfig.activeCityKey
        : "Guntur";

    this.currentCityKey = configuredCity;

    this.loadCityData(this.currentCityKey);

    this.initDOMListeners();

    this.initMap();

    this.initCharts();

    this.updateAllCalculations();

    this.renderDashboard();

    this.updateCityUI();

    this.startSystemClock();

    this.seedInitialEventLogs();

    this.checkBackendHealth();
  }


  /**
   * ============================================================
   * CITY CONFIGURATION
   * ============================================================
   *
   * This section prevents the application from being stuck
   * with only the data supplied by cityConfig.js.
   */

  prepareCityPresets() {

    if (!this.cityConfig.cities) {
      this.cityConfig.cities = {};
    }


    /*
     * ------------------------------------------------------------
     * VIJAYAWADA
     * ------------------------------------------------------------
     */

    const vijayawadaCenter = [16.5062, 80.6480];

    if (!this.cityConfig.cities["Vijayawada"]) {

      this.cityConfig.cities["Vijayawada"] =
        this.createPrototypeCity(
          "Vijayawada",
          "Vijayawada",
          "Andhra Pradesh",
          vijayawadaCenter,
          13
        );

    } else {

      // If Vijayawada exists but has fewer than 6 zones,
      // add prototype zones until there are 6.
      this.expandCityZones(
        this.cityConfig.cities["Vijayawada"],
        "Vijayawada",
        "Andhra Pradesh",
        vijayawadaCenter,
        6
      );
    }


    /*
     * ------------------------------------------------------------
     * HYDERABAD
     * ------------------------------------------------------------
     */

    const hyderabadCenter = [17.3850, 78.4867];

    if (!this.cityConfig.cities["Hyderabad"]) {

      this.cityConfig.cities["Hyderabad"] =
        this.createPrototypeCity(
          "Hyderabad",
          "Hyderabad",
          "Telangana",
          hyderabadCenter,
          13
        );

    } else {

      this.expandCityZones(
        this.cityConfig.cities["Hyderabad"],
        "Hyderabad",
        "Telangana",
        hyderabadCenter,
        6
      );
    }


    /*
     * ------------------------------------------------------------
     * GUNTUR
     * ------------------------------------------------------------
     *
     * Do not replace the user's existing Guntur data.
     * Only create fallback data if it is completely missing.
     */

    if (!this.cityConfig.cities["Guntur"]) {

      this.cityConfig.cities["Guntur"] =
        this.createPrototypeCity(
          "Guntur",
          "Guntur",
          "Andhra Pradesh",
          [16.3067, 80.4365],
          13
        );

    }
  }


  /**
   * Create a complete prototype city.
   */
  createPrototypeCity(
    key,
    name,
    state,
    center,
    zoom
  ) {

    const city = {
      name: name,
      state: state,
      center: center,
      zoom: zoom,
      zones: []
    };

    const zoneNames = this.getPrototypeZoneNames(name);

    zoneNames.forEach((zoneName, index) => {

      city.zones.push(
        this.createPrototypeZone(
          index + 1,
          zoneName,
          center
        )
      );

    });

    return city;
  }


  /**
   * Zone names for prototype city maps.
   */
  getPrototypeZoneNames(cityName) {

    if (cityName === "Vijayawada") {

      return [
        "Benz Circle Catchment",
        "Moghalrajpuram Catchment",
        "Governorpet Catchment",
        "Bhavanipuram Catchment",
        "Auto Nagar Catchment",
        "Kanuru Catchment"
      ];

    }


    if (cityName === "Hyderabad") {

      return [
        "Khairatabad Catchment",
        "Banjara Hills Catchment",
        "Begumpet Catchment",
        "Ameerpet Catchment",
        "Kukatpally Catchment",
        "Mehdipatnam Catchment"
      ];

    }


    return [
      "Central Catchment",
      "North Catchment",
      "South Catchment",
      "East Catchment",
      "West Catchment",
      "Industrial Catchment"
    ];
  }


  /**
   * Create one prototype monitoring zone.
   *
   * These are simulated values for the working prototype.
   */
  createPrototypeZone(index, zoneName, cityCenter) {

    const offsets = [
      [0.0100, 0.0000],
      [0.0040, 0.0090],
      [-0.0060, 0.0080],
      [-0.0100, -0.0020],
      [-0.0030, -0.0100],
      [0.0080, -0.0080]
    ];

    const offset =
      offsets[(index - 1) % offsets.length];

    const rainfallValues = [
      28,
      34,
      41,
      30,
      38,
      45
    ];

    const waterValues = [
      30,
      36,
      43,
      33,
      39,
      47
    ];

    const pressureValues = [
      22,
      25,
      29,
      23,
      27,
      31
    ];

    const capacityValues = [
      120,
      110,
      95,
      130,
      105,
      90
    ];

    const rainfall =
      rainfallValues[(index - 1) % rainfallValues.length];

    const waterLevel =
      waterValues[(index - 1) % waterValues.length];

    const pressure =
      pressureValues[(index - 1) % pressureValues.length];

    const capacity =
      capacityValues[(index - 1) % capacityValues.length];


    return {

      zoneId: `ZONE-${String(index).padStart(2, "0")}`,

      name: zoneName,

      areaName: `${zoneName} - Prototype Monitoring Area`,

      center: [
        cityCenter[0] + offset[0],
        cityCenter[1] + offset[1]
      ],

      baselineRainfall: rainfall,

      baselineWaterLevel: waterLevel,

      baselinePressure: pressure,

      drainageCapacity: capacity,

      runoffCoefficient: 0.65,

      drainageArea: 1.5,

      recommendedActions: {
        LOW: "Continue routine monitoring.",
        MODERATE: "Monitor rainfall and drainage utilization.",
        HIGH: "Prepare traffic warning and inspect drainage section.",
        CRITICAL: "Immediate inspection, pumping and traffic control required."
      }

    };
  }


  /**
   * Add zones if an existing city has too few.
   */
  expandCityZones(
    city,
    cityName,
    state,
    center,
    minimumZones
  ) {

    if (!city.zones) {
      city.zones = [];
    }

    if (!city.center) {
      city.center = center;
    }

    if (!city.zoom) {
      city.zoom = 13;
    }

    if (!city.name) {
      city.name = cityName;
    }

    if (!city.state) {
      city.state = state;
    }


    /*
     * Preserve existing zones.
     * Only create additional zones.
     */

    const existingCount = city.zones.length;

    if (existingCount >= minimumZones) {
      return;
    }


    const zoneNames =
      this.getPrototypeZoneNames(cityName);


    for (
      let i = existingCount;
      i < minimumZones;
      i++
    ) {

      const newZone =
        this.createPrototypeZone(
          i + 1,
          zoneNames[i] ||
          `${cityName} Catchment ${i + 1}`,
          city.center || center
        );


      /*
       * Make sure the generated zone IDs do not
       * duplicate existing IDs.
       */

      const existingIds =
        city.zones.map(z => z.zoneId);

      let newId =
        `ZONE-${String(i + 1).padStart(2, "0")}`;

      if (existingIds.includes(newId)) {

        let counter = city.zones.length + 1;

        while (
          existingIds.includes(
            `ZONE-${String(counter).padStart(2, "0")}`
          )
        ) {
          counter++;
        }

        newId =
          `ZONE-${String(counter).padStart(2, "0")}`;
      }

      newZone.zoneId = newId;

      city.zones.push(newZone);
    }
  }


  /**
   * ============================================================
   * LOAD CITY DATA
   * ============================================================
   */

  loadCityData(cityKey) {

    const city =
      this.cityConfig.cities[cityKey];

    if (!city) {
      console.error(
        `City configuration not found: ${cityKey}`
      );
      return;
    }


    /*
     * Make sure city has enough zones.
     */

    this.expandCityZones(
      city,
      city.name || cityKey,
      city.state || "",
      city.center,
      6
    );


    this.currentCityKey = cityKey;

    this.cityConfig.activeCityKey = cityKey;


    /*
     * Convert raw configuration zones into
     * live application zones.
     */

    this.zones = city.zones.map(z => {

      const rainfall =
        z.baselineRainfall || 30.0;

      const waterLevel =
        z.baselineWaterLevel || 32.0;

      const pressure =
        z.baselinePressure || 24.0;

      const capacity =
        z.drainageCapacity || 100;


      const calc =
        window.floodCalculator.calculateRisk({
          rainfallIntensity: rainfall,
          waterLevel: waterLevel,
          pressure: pressure,
          drainageCapacity: capacity,
          runoffCoefficient: z.runoffCoefficient,
          drainageArea: z.drainageArea
        });


      return {

        ...z,

        rainfall: rainfall,

        waterLevel: waterLevel,

        pressure: pressure,

        drainageCapacity: capacity,

        nominalCapacity: capacity,

        isBlocked: false,

        estimatedInflow:
          calc.estimatedInflow,

        drainageUtilization:
          calc.drainageUtilization,

        floodRiskScore:
          calc.score,

        riskStatus:
          calc.status,

        riskLevel:
          calc.level,

        riskColor:
          calc.color,

        predictedFloodProbability:
          calc.predictedFloodProbability,

        recommendedAction:
          z.recommendedActions
            ? z.recommendedActions[calc.status]
            : "Monitor drainage section.",

        calculationBreakdown:
          calc.breakdown

      };

    });


    /*
     * Select first zone.
     */

    if (this.zones.length > 0) {

      this.activeZoneId =
        this.zones[0].zoneId;

      this.routingState.startZoneId =
        this.zones[0].zoneId;

      this.routingState.destZoneId =
        this.zones[
          Math.min(4, this.zones.length - 1)
        ].zoneId;
    }


    /*
     * Update city information on screen.
     */

    this.updateCityUI();
  }


  /**
   * ============================================================
   * DYNAMIC CITY UI
   * ============================================================
   */

  updateCityUI() {

    const city =
      this.cityConfig.cities[
        this.currentCityKey
      ];

    if (!city) return;


    const cityName =
      city.name || this.currentCityKey;

    const state =
      city.state || "";


    /*
     * Sidebar city badge
     */

    this.setText(
      "sidebar-city-name",
      `${cityName}, ${state === "Telangana" ? "TS" : "AP"}`
    );


    /*
     * Top location text
     */

    const locationTags =
      document.querySelectorAll(
        ".location-tag"
      );

    locationTags.forEach(el => {

      el.innerHTML =
        `<i class="fa-solid fa-location-dot"></i> ` +
        `${cityName}, ${state}, India`;

    });


    /*
     * Dashboard map title
     */

    const mapHeaders =
      document.querySelectorAll(
        ".map-card-title, .dashboard-map-title"
      );

    mapHeaders.forEach(el => {

      if (
        el.textContent.includes(
          "Interactive Urban Flood Map"
        )
      ) {

        el.innerHTML =
          `Interactive Urban Flood Map &bull; ` +
          `${cityName}, ${state}`;

      }

    });


    /*
     * Replace hardcoded Guntur text wherever
     * the corresponding element exists.
     */

    const textElements = [
      "zone-overview-title",
      "catchment-status-title",
      "fullscreen-map-title"
    ];


    textElements.forEach(id => {

      const el =
        document.getElementById(id);

      if (!el) return;

      if (
        el.textContent.includes(
          "Catchment Status Overview"
        )
      ) {

        el.textContent =
          `Catchment Status Overview • ${cityName} Urban`;

      }

      if (
        el.textContent.includes(
          "Guntur Urban Catchments"
        )
      ) {

        el.innerHTML =
          `<i class="fa-solid fa-earth-americas"></i> ` +
          `${cityName} Urban Catchments • Real-time GIS Surcharge Layer`;

      }

    });


    /*
     * Synchronize city dropdown.
     */

    const citySelect =
      document.getElementById(
        "settings-city-select"
      );

    if (citySelect) {
      citySelect.value =
        this.currentCityKey;
    }


    /*
     * Update page title.
     */

    document.title =
      `Urban Flood Nowcasting System | ` +
      `${cityName} Drainage & Rainfall Hydro-ML Engine`;
  }


  /**
   * ============================================================
   * MAP INITIALIZATION
   * ============================================================
   */

  initMap() {

    const city =
      this.cityConfig.cities[
        this.currentCityKey
      ];

    if (!city) return;


    window.floodMapManager.init(
      city.center,
      city.zoom
    );


    window.floodMapManager.onZoneSelectCallback =
      (zoneId) => this.selectZone(zoneId);


    window.floodMapManager.renderZones(
      this.zones,
      this.activeZoneId
    );
  }


  /**
   * ============================================================
   * CHART INITIALIZATION
   * ============================================================
   */

  initCharts() {

    const activeZone =
      this.getActiveZone();

    if (
      activeZone &&
      window.trendCharts
    ) {

      window.trendCharts.init(
        activeZone
      );
    }
  }


  /**
   * ============================================================
   * CALCULATIONS
   * ============================================================
   */

  updateAllCalculations() {

    this.zones.forEach(zone => {

      const effectiveCap =
        zone.isBlocked
          ? Math.round(
              zone.nominalCapacity * 0.45
            )
          : zone.nominalCapacity;


      zone.drainageCapacity =
        effectiveCap;


      const calc =
        window.floodCalculator.calculateRisk({
          rainfallIntensity:
            zone.rainfall,

          waterLevel:
            zone.waterLevel,

          pressure:
            zone.pressure,

          drainageCapacity:
            effectiveCap,

          runoffCoefficient:
            zone.runoffCoefficient,

          drainageArea:
            zone.drainageArea
        });


      zone.estimatedInflow =
        calc.estimatedInflow;

      zone.drainageUtilization =
        calc.drainageUtilization;

      zone.floodRiskScore =
        calc.score;

      zone.riskStatus =
        calc.status;

      zone.riskLevel =
        calc.level;

      zone.riskColor =
        calc.color;

      zone.predictedFloodProbability =
        calc.predictedFloodProbability;

      zone.recommendedAction =
        zone.recommendedActions
          ? zone.recommendedActions[
              calc.status
            ]
          : "Monitor drainage section.";

      zone.calculationBreakdown =
        calc.breakdown;


      this.evaluateAlertConditions(zone);

    });
  }


  /**
   * ============================================================
   * ALERT SYSTEM
   * ============================================================
   */

  evaluateAlertConditions(zone) {

    const alertsToTrigger = [];


    if (zone.floodRiskScore >= 76) {

      alertsToTrigger.push({
        severity: "CRITICAL",
        zoneId: zone.zoneId,
        title:
          `🔴 CRITICAL FLOOD RISK: ${zone.name}`,
        message:
          `Flood risk score is ${zone.floodRiskScore}/100. Surcharge overflow imminent! Immediate inspection & pumping required.`,
        icon:
          "fa-solid fa-triangle-exclamation"
      });

    } else if (zone.floodRiskScore >= 51) {

      alertsToTrigger.push({
        severity: "HIGH",
        zoneId: zone.zoneId,
        title:
          `🟠 HIGH FLOOD RISK: ${zone.name}`,
        message:
          `Flood risk score reached ${zone.floodRiskScore}/100. Conduit utilization high (${zone.drainageUtilization}%). Prepare traffic warning.`,
        icon:
          "fa-solid fa-cloud-showers-heavy"
      });
    }


    if (zone.drainageUtilization >= 80) {

      alertsToTrigger.push({
        severity:
          zone.drainageUtilization >= 100
            ? "CRITICAL"
            : "HIGH",

        zoneId: zone.zoneId,

        title:
          `⚠️ DRAINAGE UTILIZATION EXCEEDED: ${zone.zoneId}`,

        message:
          `Drainage utilization is ${zone.drainageUtilization}% (Inflow: ${zone.estimatedInflow} L/s vs Capacity: ${zone.drainageCapacity} L/s).`,

        icon:
          "fa-solid fa-gauge-high"
      });
    }


    if (zone.waterLevel >= 70) {

      alertsToTrigger.push({
        severity:
          zone.waterLevel >= 85
            ? "CRITICAL"
            : "HIGH",

        zoneId: zone.zoneId,

        title:
          `💧 WATER LEVEL THRESHOLD EXCEEDED: ${zone.zoneId}`,

        message:
          `Water level measured at ${zone.waterLevel} cm in drainage channel.`,

        icon:
          "fa-solid fa-water"
      });
    }


    if (zone.isBlocked) {

      alertsToTrigger.push({
        severity: "CRITICAL",

        zoneId: zone.zoneId,

        title:
          `🚧 CONDUIT BLOCKAGE DETECTED: ${zone.zoneId}`,

        message:
          `Severe silt/debris blockage simulated. Effective drainage capacity reduced to ${zone.drainageCapacity} L/s.`,

        icon:
          "fa-solid fa-road-barrier"
      });
    }


    alertsToTrigger.forEach(
      newAlert => {

        const exists =
          this.alerts.some(
            a =>
              a.zoneId === newAlert.zoneId &&
              a.title === newAlert.title &&
              Date.now() - a.timestamp < 30000
          );


        if (!exists) {

          newAlert.id =
            "alert-" +
            Date.now() +
            "-" +
            Math.floor(
              Math.random() * 1000
            );

          newAlert.timestamp =
            Date.now();

          newAlert.timeStr =
            new Date().toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              }
            );


          this.alerts.unshift(
            newAlert
          );


          if (this.alerts.length > 50) {
            this.alerts.pop();
          }


          this.showToast(
            newAlert
          );


          this.addEventLog(
            newAlert.severity.toLowerCase(),
            newAlert.title,
            newAlert.message
          );
        }

      }
    );


    this.renderAlertsCount();
  }


  /**
   * ============================================================
   * DASHBOARD
   * ============================================================
   */

  renderDashboard() {

    this.renderTopStats();

    this.renderZoneSelector();

    this.renderActiveZoneTelemetry();

    this.renderZoneDetailsPanel();

    this.renderRiskMeter();

    this.renderStatusTable();

    this.renderAlertsPanel();

    this.renderCalculationModal();


    if (
      window.floodMapManager
    ) {

      window.floodMapManager.renderZones(
        this.zones,
        this.activeZoneId
      );

    }


    const activeZ =
      this.getActiveZone();


    if (
      activeZ &&
      window.trendCharts
    ) {

      window.trendCharts.pushData(
        activeZ
      );
    }


    this.updateRoutingSelectors();
  }


  /**
   * ============================================================
   * TOP STATISTICS
   * ============================================================
   */

  renderTopStats() {

    let low = 0;
    let mod = 0;
    let high = 0;
    let crit = 0;


    this.zones.forEach(z => {

      if (z.riskStatus === "LOW") {
        low++;
      } else if (z.riskStatus === "MODERATE") {
        mod++;
      } else if (z.riskStatus === "HIGH") {
        high++;
      } else if (z.riskStatus === "CRITICAL") {
        crit++;
      }

    });


    this.setText(
      "stat-total-zones",
      this.zones.length
    );

    this.setText(
      "stat-low-zones",
      low
    );

    this.setText(
      "stat-mod-zones",
      mod
    );

    this.setText(
      "stat-high-zones",
      high
    );

    this.setText(
      "stat-crit-zones",
      crit
    );

    this.setText(
      "sidebar-alert-badge",
      crit + high
    );
  }


  /**
   * ============================================================
   * ZONE SELECTOR
   * ============================================================
   */

  renderZoneSelector() {

    const select =
      document.getElementById(
        "zone-select"
      );

    if (!select) return;


    select.innerHTML = "";


    this.zones.forEach(z => {

      const opt =
        document.createElement(
          "option"
        );

      opt.value =
        z.zoneId;

      opt.textContent =
        `${z.zoneId}: ${z.name} [${z.riskStatus}]`;

      if (
        z.zoneId ===
        this.activeZoneId
      ) {
        opt.selected = true;
      }

      select.appendChild(opt);
    });
  }


  /**
   * ============================================================
   * ROUTING SELECTORS
   * ============================================================
   */

  updateRoutingSelectors() {

    const startSelect =
      document.getElementById(
        "route-start-select"
      );

    const destSelect =
      document.getElementById(
        "route-dest-select"
      );


    if (startSelect) {

      startSelect.innerHTML = "";

      this.zones.forEach(z => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          z.zoneId;

        option.textContent =
          `${z.zoneId}: ${z.name}`;

        if (
          z.zoneId ===
          this.routingState.startZoneId
        ) {
          option.selected = true;
        }

        startSelect.appendChild(
          option
        );
      });
    }


    if (destSelect) {

      destSelect.innerHTML = "";

      this.zones.forEach(z => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          z.zoneId;

        option.textContent =
          `${z.zoneId}: ${z.name}`;

        if (
          z.zoneId ===
          this.routingState.destZoneId
        ) {
          option.selected = true;
        }

        destSelect.appendChild(
          option
        );
      });
    }
  }


  /**
   * ============================================================
   * SENSOR TELEMETRY
   * ============================================================
   */

  renderActiveZoneTelemetry() {

    const z =
      this.getActiveZone();

    if (!z) return;


    this.setText(
      "metric-rain-val",
      z.rainfall.toFixed(1)
    );

    this.setBarWidth(
      "metric-rain-bar",
      Math.min(
        100,
        (z.rainfall / 120) * 100
      )
    );


    this.setText(
      "metric-water-val",
      Math.round(
        z.waterLevel
      )
    );

    this.setText(
      "metric-water-depth",
      `(${(
        z.waterLevel / 100
      ).toFixed(2)} m)`
    );

    this.setBarWidth(
      "metric-water-bar",
      Math.min(
        100,
        (z.waterLevel / 100) * 100
      )
    );


    this.setText(
      "metric-pressure-val",
      z.pressure.toFixed(1)
    );

    this.setBarWidth(
      "metric-pressure-bar",
      Math.min(
        100,
        (z.pressure / 70) * 100
      )
    );


    this.setText(
      "metric-cap-val",
      z.drainageCapacity
    );

    this.setText(
      "metric-inflow-val",
      `${z.estimatedInflow} L/s`
    );

    this.setText(
      "metric-util-val",
      `${z.drainageUtilization}%`
    );

    this.setBarWidth(
      "metric-util-bar",
      Math.min(
        100,
        z.drainageUtilization
      )
    );


    this.setInputValue(
      "input-rain-slider",
      z.rainfall
    );

    this.setInputValue(
      "input-rain-number",
      z.rainfall
    );

    this.setInputValue(
      "input-water-slider",
      z.waterLevel
    );

    this.setInputValue(
      "input-water-number",
      z.waterLevel
    );

    this.setInputValue(
      "input-pressure-slider",
      z.pressure
    );

    this.setInputValue(
      "input-pressure-number",
      z.pressure
    );

    this.setInputValue(
      "input-cap-slider",
      z.nominalCapacity
    );

    this.setInputValue(
      "input-cap-number",
      z.nominalCapacity
    );


    const blockageBtn =
      document.getElementById(
        "btn-toggle-blockage"
      );


    if (blockageBtn) {

      if (z.isBlocked) {

        blockageBtn.classList.add(
          "active-blockage"
        );

        blockageBtn.innerHTML =
          `<i class="fa-solid fa-road-barrier"></i> ` +
          `<span>Blockage Active (-50% Cap)</span>`;

      } else {

        blockageBtn.classList.remove(
          "active-blockage"
        );

        blockageBtn.innerHTML =
          `<i class="fa-solid fa-road-barrier"></i> ` +
          `<span>Simulate Drain Blockage</span>`;
      }
    }
  }


  /**
   * ============================================================
   * RISK METER
   * ============================================================
   */

  renderRiskMeter() {

    const z =
      this.getActiveZone();

    if (!z) return;


    const score =
      z.floodRiskScore;

    const status =
      z.riskStatus;

    const color =
      z.riskColor;


    this.setText(
      "gauge-score-text",
      score
    );

    this.setText(
      "gauge-status-text",
      status
    );


    const gaugeStatus =
      document.getElementById(
        "gauge-status-text"
      );

    if (gaugeStatus) {
      gaugeStatus.style.color =
        color;
    }


    const gaugeConic =
      document.getElementById(
        "gauge-conic"
      );


    if (gaugeConic) {

      const degrees =
        Math.round(
          (score / 100) * 270
        );

      gaugeConic.style.background =
        `conic-gradient(
          from -135deg,
          ${color} 0deg,
          ${color} ${degrees}deg,
          rgba(255,255,255,0.08)
          ${degrees}deg 270deg
        )`;
    }


    const pin =
      document.getElementById(
        "scale-marker-pin"
      );


    if (pin) {

      pin.style.left =
        `${Math.min(
          98,
          Math.max(2, score)
        )}%`;
    }


    this.setText(
      "risk-tag",
      `${
        z.riskColor === "#10b981"
          ? "🟢"
          : z.riskColor === "#eab308"
          ? "🟡"
          : z.riskColor === "#f97316"
          ? "🟠"
          : "🔴"
      } ${z.riskLevel}`
    );


    this.setText(
      "risk-desc-text",
      z.recommendedAction
    );


    const riskTag =
      document.getElementById(
        "risk-tag"
      );


    if (riskTag) {

      riskTag.style.color =
        color;

      riskTag.style.borderColor =
        `${color}66`;

      riskTag.style.background =
        `${color}18`;
    }


    this.setText(
      "ml-prob-val",
      `${z.predictedFloodProbability}%`
    );

    this.setText(
      "ml-risk-score-val",
      `${score}/100`
    );

    this.setText(
      "ml-risk-category-val",
      status
    );


    const mlProbFill =
      document.getElementById(
        "ml-prob-fill"
      );


    if (mlProbFill) {

      mlProbFill.style.width =
        `${z.predictedFloodProbability}%`;

      mlProbFill.style.background =
        color;
    }
  }


  /**
   * ============================================================
   * ZONE DETAILS
   * ============================================================
   */

  renderZoneDetailsPanel() {

    const z =
      this.getActiveZone();

    if (!z) return;


    this.setText(
      "zd-zone-id",
      z.zoneId
    );

    this.setText(
      "zd-zone-name",
      z.name
    );

    this.setText(
      "zd-location",
      `[${z.center[0].toFixed(4)}° N, ` +
      `${z.center[1].toFixed(4)}° E] / ` +
      `${z.areaName}`
    );

    this.setText(
      "zd-rainfall",
      `${z.rainfall.toFixed(1)} mm/hr`
    );

    this.setText(
      "zd-water-level",
      `${Math.round(z.waterLevel)} cm`
    );

    this.setText(
      "zd-pressure",
      `${z.pressure.toFixed(1)} kPa`
    );

    this.setText(
      "zd-capacity",
      `${z.drainageCapacity} L/s ` +
      `${z.isBlocked ? "(Blocked)" : ""}`
    );

    this.setText(
      "zd-inflow",
      `${z.estimatedInflow} L/s`
    );

    this.setText(
      "zd-utilization",
      `${z.drainageUtilization}%`
    );

    this.setText(
      "zd-risk-score",
      `${z.floodRiskScore}/100`
    );

    this.setText(
      "zd-status",
      z.riskLevel
    );

    this.setText(
      "zd-predicted-prob",
      `${z.predictedFloodProbability}%`
    );

    this.setText(
      "zd-action",
      z.recommendedAction
    );


    const statusEl =
      document.getElementById(
        "zd-status"
      );

    if (statusEl) {
      statusEl.style.color =
        z.riskColor;
    }
  }


  /**
   * ============================================================
   * STATUS TABLE
   * ============================================================
   */

  renderStatusTable() {

    const tbody =
      document.getElementById(
        "zone-table-body"
      );

    if (!tbody) return;


    tbody.innerHTML = "";


    this.zones.forEach(z => {

      const tr =
        document.createElement(
          "tr"
        );


      tr.className =
        `zone-row ${
          z.zoneId === this.activeZoneId
            ? "selected-row"
            : ""
        }`;


      tr.onclick =
        () => this.selectZone(
          z.zoneId
        );


      const dotClass =
        z.riskStatus === "LOW"
          ? "green"
          : z.riskStatus === "MODERATE"
          ? "yellow"
          : z.riskStatus === "HIGH"
          ? "orange"
          : "red";


      const pillClass =
        z.riskStatus === "LOW"
          ? "safe"
          : z.riskStatus === "MODERATE"
          ? "mod"
          : z.riskStatus === "HIGH"
          ? "high"
          : "crit";


      const actionBadge =
        z.riskStatus === "CRITICAL"
          ? "critical"
          : z.riskStatus === "HIGH"
          ? "action"
          : z.riskStatus === "MODERATE"
          ? "monitor"
          : "normal";


      tr.innerHTML = `
        <td>
          <span class="dot ${dotClass}"></span>
          <strong>${z.zoneId}</strong> -
          ${z.name}
        </td>

        <td>
          <span class="risk-pill-text ${pillClass}">
            ${z.riskStatus}
          </span>
        </td>

        <td class="mono-num">
          ${z.floodRiskScore}/100
        </td>

        <td class="mono-num ${
          z.drainageUtilization > 80
            ? "warn-val"
            : ""
        }">
          ${z.drainageUtilization}%
        </td>

        <td class="mono-num">
          ${z.drainageCapacity} L/s
        </td>

        <td>
          <span class="status-badge ${actionBadge}">
            ${actionBadge.toUpperCase()}
          </span>
        </td>
      `;


      tbody.appendChild(tr);
    });
  }


  /**
   * ============================================================
   * ALERT PANEL
   * ============================================================
   */

  renderAlertsPanel() {

    const container =
      document.getElementById(
        "full-alerts-stream"
      );

    if (!container) return;


    if (this.alerts.length === 0) {

      container.innerHTML =
        `<div class="empty-alerts-msg">
          <i class="fa-solid fa-circle-check"></i>
          No active municipal flood warnings.
          Conduits flowing within safety bounds.
        </div>`;

      return;
    }


    container.innerHTML = "";


    this.alerts.forEach(a => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        `alert-item ${
          a.severity.toLowerCase()
        }`;


      item.innerHTML = `
        <div class="alert-icon-wrap ${
          a.severity.toLowerCase()
        }">
          <i class="${a.icon}"></i>
        </div>

        <div class="alert-content">

          <div class="alert-title-row">

            <span class="alert-title">
              ${a.title}
            </span>

            <span class="alert-time mono-num">
              ${a.timeStr}
            </span>

          </div>

          <p class="alert-msg">
            ${a.message}
          </p>

        </div>

        <button
          type="button"
          class="alert-ack-btn"
          onclick="window.app.dismissAlert('${a.id}')"
          title="Acknowledge Alert"
        >
          <i class="fa-solid fa-check"></i>
        </button>
      `;


      container.appendChild(item);
    });
  }


  renderAlertsCount() {

    const count =
      this.alerts.filter(
        a =>
          a.severity === "CRITICAL" ||
          a.severity === "HIGH"
      ).length;


    this.setText(
      "sidebar-alert-badge",
      count
    );
  }


  dismissAlert(id) {

    this.alerts =
      this.alerts.filter(
        a => a.id !== id
      );

    this.renderAlertsPanel();

    this.renderAlertsCount();
  }


  /**
   * ============================================================
   * CALCULATION MODAL
   * ============================================================
   */

  renderCalculationModal() {

    const z =
      this.getActiveZone();

    if (
      !z ||
      !z.calculationBreakdown
    ) return;


    const b =
      z.calculationBreakdown;


    this.setText(
      "cb-raw-rain",
      `${b.rawInputs.rainfallIntensity} mm/hr`
    );

    this.setText(
      "cb-raw-water",
      `${b.rawInputs.waterLevel} cm`
    );

    this.setText(
      "cb-raw-util",
      `${z.drainageUtilization}%`
    );

    this.setText(
      "cb-raw-press",
      `${b.rawInputs.pressure} kPa`
    );


    this.setText(
      "cb-norm-rain",
      `${b.normalized.rainfallNorm}%`
    );

    this.setText(
      "cb-norm-water",
      `${b.normalized.waterLevelNorm}%`
    );

    this.setText(
      "cb-norm-util",
      `${b.normalized.utilizationNorm}%`
    );

    this.setText(
      "cb-norm-press",
      `${b.normalized.pressureNorm}%`
    );


    this.setText(
      "cb-contrib-rain",
      `+${b.contributions.rainfall}`
    );

    this.setText(
      "cb-contrib-water",
      `+${b.contributions.waterLevel}`
    );

    this.setText(
      "cb-contrib-util",
      `+${b.contributions.utilization}`
    );

    this.setText(
      "cb-contrib-press",
      `+${b.contributions.pressure}`
    );


    this.setText(
      "cb-total-score",
      `${z.floodRiskScore} / 100`
    );

    this.setText(
      "cb-final-class",
      z.riskLevel
    );
  }


  /**
   * ============================================================
   * ZONE SELECTION
   * ============================================================
   */

  selectZone(zoneId) {

    this.activeZoneId =
      zoneId;


    const z =
      this.getActiveZone();


    if (!z) return;


    window.floodMapManager.focusZone(
      zoneId
    );


    if (window.trendCharts) {

      window.trendCharts.switchZone(
        z
      );
    }


    this.renderDashboard();
  }


  getActiveZone() {

    return (
      this.zones.find(
        z =>
          z.zoneId ===
          this.activeZoneId
      ) ||
      this.zones[0]
    );
  }


  /**
   * ============================================================
   * SENSOR SIMULATION
   * ============================================================
   */

  simulateSensorUpdate() {

    const activeZ =
      this.getActiveZone();

    if (!activeZ) return;


    const rainDelta =
      Math.random() * 8.0 - 3.5;

    const waterDelta =
      Math.random() * 6.0 - 2.5;

    const pressDelta =
      Math.random() * 4.0 - 1.8;


    activeZ.rainfall =
      parseFloat(
        Math.max(
          2.0,
          Math.min(
            130.0,
            activeZ.rainfall +
            rainDelta
          )
        ).toFixed(1)
      );


    activeZ.waterLevel =
      parseFloat(
        Math.max(
          5.0,
          Math.min(
            110.0,
            activeZ.waterLevel +
            waterDelta
          )
        ).toFixed(1)
      );


    activeZ.pressure =
      parseFloat(
        Math.max(
          10.0,
          Math.min(
            68.0,
            activeZ.pressure +
            pressDelta
          )
        ).toFixed(1)
      );


    this.zones.forEach(z => {

      if (
        z.zoneId !==
        activeZ.zoneId
      ) {

        z.rainfall =
          parseFloat(
            Math.max(
              2.0,
              Math.min(
                120.0,
                z.rainfall +
                (Math.random() * 4.0 - 2.0)
              )
            ).toFixed(1)
          );


        z.waterLevel =
          parseFloat(
            Math.max(
              5.0,
              Math.min(
                100.0,
                z.waterLevel +
                (Math.random() * 3.0 - 1.5)
              )
            ).toFixed(1)
          );


        z.pressure =
          parseFloat(
            Math.max(
              10.0,
              Math.min(
                65.0,
                z.pressure +
                (Math.random() * 2.0 - 1.0)
              )
            ).toFixed(1)
          );
      }

    });


    this.updateAllCalculations();

    this.renderDashboard();


    this.showToast({

      severity: "NORMAL",

      title:
        "📡 Telemetry Updated",

      message:
        `Updated sensor readings for ${this.zones.length} urban monitoring zones.`

    });


    this.addEventLog(
      "info",
      "Telemetry Ingested",
      `Real-time sensor sweep completed. Active zone ${activeZ.zoneId} updated.`
    );
  }


  /**
   * ============================================================
   * DRAIN BLOCKAGE
   * ============================================================
   */

  toggleDrainBlockage() {

    const activeZ =
      this.getActiveZone();

    if (!activeZ) return;


    activeZ.isBlocked =
      !activeZ.isBlocked;


    if (activeZ.isBlocked) {

      activeZ.waterLevel =
        Math.min(
          105,
          activeZ.waterLevel + 22
        );

      activeZ.pressure =
        Math.min(
          68,
          activeZ.pressure + 16
        );
    }


    this.updateAllCalculations();

    this.renderDashboard();


    if (activeZ.isBlocked) {

      this.showToast({

        severity: "CRITICAL",

        title:
          `🚧 DRAIN BLOCKAGE ACTIVATED: ${activeZ.zoneId}`,

        message:
          `Debris blockage simulated in ${activeZ.name}. Effective capacity reduced to ${activeZ.drainageCapacity} L/s!`

      });


      this.addEventLog(
        "crit",
        "Conduit Surcharge",
        `Silt/Trash blockage injected in ${activeZ.zoneId}. Risk escalated.`
      );

    } else {

      this.showToast({

        severity: "NORMAL",

        title:
          "✅ Drain Blockage Cleared",

        message:
          `Conduit cleared. Restored nominal drainage capacity to ${activeZ.drainageCapacity} L/s.`

      });


      this.addEventLog(
        "info",
        "Maintenance Cleared",
        `Conduit blockage resolved in ${activeZ.zoneId}. Nominal capacity restored.`
      );
    }
  }


  /**
   * ============================================================
   * MANUAL INPUT
   * ============================================================
   */

  handleManualInputChange(
    field,
    value
  ) {

    const activeZ =
      this.getActiveZone();

    if (!activeZ) return;


    const val =
      parseFloat(value);

    if (isNaN(val)) return;


    switch (field) {

      case "rainfall":

        activeZ.rainfall =
          Math.max(
            0,
            Math.min(
              150,
              val
            )
          );

        break;


      case "waterLevel":

        activeZ.waterLevel =
          Math.max(
            0,
            Math.min(
              120,
              val
            )
          );

        break;


      case "pressure":

        activeZ.pressure =
          Math.max(
            0,
            Math.min(
              80,
              val
            )
          );

        break;


      case "drainageCapacity":

        activeZ.nominalCapacity =
          Math.max(
            10,
            Math.min(
              250,
              val
            )
          );

        break;
    }


    this.updateAllCalculations();

    this.renderDashboard();
  }


  /**
   * ============================================================
   * DEMO MODE
   * ============================================================
   */

  toggleDemoMode() {

    this.demoMode.active =
      !this.demoMode.active;


    const btn =
      document.getElementById(
        "demo-mode-btn"
      );

    const banner =
      document.getElementById(
        "demo-mode-banner"
      );


    if (this.demoMode.active) {

      if (btn) {

        btn.classList.add(
          "active-demo"
        );

        btn.innerHTML =
          `<i class="fa-solid fa-stop"></i> ` +
          `<span>Stop Demo Mode</span>`;
      }


      if (banner) {
        banner.style.display =
          "flex";
      }


      this.demoMode.stage =
        1;


      this.executeDemoStage(1);

      this.startDemoTimer();

    } else {

      if (btn) {

        btn.classList.remove(
          "active-demo"
        );

        btn.innerHTML =
          `<i class="fa-solid fa-play"></i> ` +
          `<span>Start 4-Stage Demo</span>`;
      }


      if (banner) {
        banner.style.display =
          "none";
      }


      clearInterval(
        this.demoMode.timer
      );

      clearInterval(
        this.demoMode.secondInterval
      );
    }
  }


  startDemoTimer() {

    clearInterval(
      this.demoMode.timer
    );

    clearInterval(
      this.demoMode.secondInterval
    );


    this.demoMode.currentSecond =
      0;


    this.updateDemoProgressBar();


    this.demoMode.secondInterval =
      setInterval(() => {

        this.demoMode.currentSecond++;

        this.updateDemoProgressBar();

      }, 1000);


    this.demoMode.timer =
      setInterval(() => {

        this.demoMode.currentSecond =
          0;


        let nextStage =
          this.demoMode.stage + 1;


        if (nextStage > 4) {
          nextStage = 1;
        }


        this.demoMode.stage =
          nextStage;


        this.executeDemoStage(
          nextStage
        );

      },
      this.demoMode.stageDurationSeconds *
      1000);
  }


  updateDemoProgressBar() {

    const fill =
      document.getElementById(
        "demo-timer-progress"
      );


    if (fill) {

      const pct =
        (
          this.demoMode.currentSecond /
          this.demoMode.stageDurationSeconds
        ) * 100;


      fill.style.width =
        `${Math.min(
          100,
          pct
        )}%`;
    }
  }


  executeDemoStage(stage) {

    const activeZ =
      this.getActiveZone();

    if (!activeZ) return;


    for (
      let i = 1;
      i <= 4;
      i++
    ) {

      const el =
        document.getElementById(
          `demo-stage-pill-${i}`
        );


      if (el) {

        if (i === stage) {
          el.classList.add(
            "active-stage"
          );
        } else {
          el.classList.remove(
            "active-stage"
          );
        }
      }
    }


    switch (stage) {

      case 1:

        this.setText(
          "demo-stage-label",
          "Stage 1: Normal Pre-Monsoon (Low Rainfall -> Low Risk)"
        );

        activeZ.rainfall = 14.5;
        activeZ.waterLevel = 22.0;
        activeZ.pressure = 18.0;
        activeZ.isBlocked = false;

        break;


      case 2:

        this.setText(
          "demo-stage-label",
          "Stage 2: Rainfall Intensifying (Surface Runoff -> Moderate Risk)"
        );

        activeZ.rainfall = 46.0;
        activeZ.waterLevel = 45.0;
        activeZ.pressure = 32.0;
        activeZ.isBlocked = false;

        break;


      case 3:

        this.setText(
          "demo-stage-label",
          "Stage 3: Heavy Cloudburst Cell (High Rain + High Water -> High Risk)"
        );

        activeZ.rainfall = 86.0;
        activeZ.waterLevel = 74.0;
        activeZ.pressure = 48.0;
        activeZ.isBlocked = false;

        break;


      case 4:

        this.setText(
          "demo-stage-label",
          "Stage 4: Conduit Blockage + Surcharge Overflow (Critical Flood Hazard)"
        );

        activeZ.rainfall = 108.0;
        activeZ.waterLevel = 92.0;
        activeZ.pressure = 62.0;
        activeZ.isBlocked = true;

        break;
    }


    this.updateAllCalculations();

    this.renderDashboard();


    this.showToast({

      severity:
        stage === 4
          ? "CRITICAL"
          : stage === 3
          ? "HIGH"
          : stage === 2
          ? "WARNING"
          : "NORMAL",

      title:
        `⚡ Demo Stage ${stage} Active`,

      message:
        `Simulating scenario: ${this.getText(
          "demo-stage-label"
        )}`

    });


    this.addEventLog(
      "warn",
      `Demo Stage ${stage}`,
      `Automated presentation state transition: ${this.getText(
        "demo-stage-label"
      )}`
    );
  }


  /**
   * ============================================================
   * SAFE ROUTE
   * ============================================================
   */

  calculateSafeRoute() {

    const startSelect =
      document.getElementById(
        "route-start-select"
      );

    const destSelect =
      document.getElementById(
        "route-dest-select"
      );


    const startId =
      startSelect
        ? startSelect.value
        : this.routingState.startZoneId;


    const destId =
      destSelect
        ? destSelect.value
        : this.routingState.destZoneId;


    if (startId === destId) {

      alert(
        "Please select different start and destination zones."
      );

      return;
    }


    const startZone =
      this.zones.find(
        z => z.zoneId === startId
      );


    const destZone =
      this.zones.find(
        z => z.zoneId === destId
      );


    if (!startZone || !destZone) {
      return;
    }


    const result =
      window.floodMapManager.plotSafeRoute(
        startZone,
        destZone,
        this.zones
      );


    this.routingState.routeInfo =
      result;


    const routeInfoCard =
      document.getElementById(
        "route-result-card"
      );


    if (
      routeInfoCard &&
      result
    ) {

      routeInfoCard.style.display =
        "block";


      this.setText(
        "route-start-name",
        startZone.name
      );


      this.setText(
        "route-dest-name",
        destZone.name
      );


      this.setText(
        "route-detour-status",
        result.detourActive
          ? "⚠️ HAZARD DETOUR ACTIVE"
          : "🟢 DIRECT ROUTE SAFE"
      );


      this.setText(
        "route-avoided-list",
        result.avoidedZones.length > 0
          ? result.avoidedZones.join(", ")
          : "None (All corridors safe)"
      );


      const statusEl =
        document.getElementById(
          "route-detour-status"
        );


      if (statusEl) {

        statusEl.style.color =
          result.detourActive
            ? "#f97316"
            : "#10b981";
      }
    }


    this.showToast({

      severity:
        result &&
        result.detourActive
          ? "WARNING"
          : "NORMAL",

      title:
        "🛣️ Safe Route Computed",

      message:
        result &&
        result.detourActive
          ? `Detour plotted around ${result.avoidedZones.length} high-risk flood zones!`
          : "Direct safe transit corridor established."
    });
  }


  clearSafeRoute() {

    window.floodMapManager.clearRoute();

    const routeInfoCard =
      document.getElementById(
        "route-result-card"
      );


    if (routeInfoCard) {
      routeInfoCard.style.display =
        "none";
    }
  }


  /**
   * ============================================================
   * VIEW SWITCHING
   * ============================================================
   */

  switchView(viewName) {

    this.activeView =
      viewName;


    document
      .querySelectorAll(
        ".sidebar-nav .nav-item"
      )
      .forEach(item => {

        if (
          item.getAttribute(
            "data-view"
          ) === viewName
        ) {

          item.classList.add(
            "active"
          );

        } else {

          item.classList.remove(
            "active"
          );
        }
      });


    document
      .querySelectorAll(
        ".view-container"
      )
      .forEach(view => {

        if (
          view.id ===
          `view-${viewName}`
        ) {

          view.classList.add(
            "active"
          );

        } else {

          view.classList.remove(
            "active"
          );
        }
      });


    setTimeout(() => {

      if (
        window.floodMapManager
      ) {

        window.floodMapManager.invalidateSize();

      }

    }, 200);
  }


  /**
   * ============================================================
   * CITY SWITCHING
   * ============================================================
   */

  switchCity(cityKey) {

    console.log(
      "Switching city to:",
      cityKey
    );


    if (
      !this.cityConfig.cities[
        cityKey
      ]
    ) {

      console.error(
        "City does not exist:",
        cityKey
      );

      return;
    }


    /*
     * Stop demo mode when switching city.
     * Otherwise the old city's active zone could
     * continue being modified.
     */

    if (this.demoMode.active) {

      this.demoMode.active =
        false;

      clearInterval(
        this.demoMode.timer
      );

      clearInterval(
        this.demoMode.secondInterval
      );
    }


    /*
     * Load the new city.
     */

    this.loadCityData(
      cityKey
    );


    const city =
      this.cityConfig.cities[
        cityKey
      ];


    /*
     * Recenter Leaflet map.
     */

    if (
      window.floodMapManager
    ) {

      window.floodMapManager.recenter(
        city.center,
        city.zoom
      );


      window.floodMapManager.renderZones(
        this.zones,
        this.activeZoneId
      );
    }


    /*
     * Reinitialize chart with the
     * first zone of the new city.
     */

    const activeZone =
      this.getActiveZone();


    if (
      activeZone &&
      window.trendCharts
    ) {

      window.trendCharts.switchZone(
        activeZone
      );
    }


    /*
     * Update dashboard.
     */

    this.renderDashboard();

    this.updateCityUI();


    /*
     * Clear old city alerts.
     */

    this.alerts = [];

    this.renderAlertsPanel();

    this.renderAlertsCount();


    /*
     * Add event log.
     */

    this.addEventLog(
      "info",
      "City Configuration Changed",
      `Active urban watershed relocated to ${city.name}, ${city.state}. ${this.zones.length} monitoring zones loaded.`
    );


    /*
     * Toast.
     */

    this.showToast({

      severity: "NORMAL",

      title:
        "📍 City Switched",

      message:
        `${city.name}, ${city.state} loaded with ${this.zones.length} monitoring zones.`

    });


    console.log(
      `City switched successfully: ${city.name}`
    );

    console.log(
      "Zones loaded:",
      this.zones
    );
  }


  /**
   * ============================================================
   * BACKEND HEALTH
   * ============================================================
   */

  async checkBackendHealth() {

    try {

      const res =
        await fetch(
          "/api/zones",
          {
            method: "GET",
            signal:
              AbortSignal.timeout(1000)
          }
        );


      if (res.ok) {

        this.setText(
          "backend-status-pill",
          "Connected (Python REST)"
        );


        const pill =
          document.getElementById(
            "backend-status-pill"
          );


        if (pill) {
          pill.className =
            "backend-pill connected";
        }

      }

    } catch {

      this.setText(
        "backend-status-pill",
        "Standalone (Browser ML)"
      );


      const pill =
        document.getElementById(
          "backend-status-pill"
        );


      if (pill) {
        pill.className =
          "backend-pill fallback";
      }
    }
  }


  /**
   * ============================================================
   * TOAST
   * ============================================================
   */

  showToast(alertData) {

    const container =
      document.getElementById(
        "toast-container"
      );

    if (!container) return;


    const toast =
      document.createElement(
        "div"
      );


    toast.className =
      `toast-card ${
        alertData.severity
          ? alertData.severity.toLowerCase()
          : "normal"
      }`;


    toast.innerHTML = `

      <div class="toast-indicator"></div>

      <div class="toast-body">

        <div class="toast-title">
          ${alertData.title}
        </div>

        <div class="toast-desc">
          ${alertData.message}
        </div>

      </div>

      <button
        type="button"
        class="toast-close"
        onclick="this.parentElement.remove()"
      >
        &times;
      </button>
    `;


    container.appendChild(
      toast
    );


    setTimeout(() => {

      toast.classList.add(
        "fade-out"
      );


      setTimeout(
        () => toast.remove(),
        400
      );

    }, 4500);
  }


  /**
   * ============================================================
   * EVENT LOG
   * ============================================================
   */

  addEventLog(
    type,
    title,
    detail
  ) {

    const log = {

      type: type,

      time:
        new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }
        ),

      title: title,

      detail: detail
    };


    this.eventLogs.unshift(
      log
    );


    if (
      this.eventLogs.length > 40
    ) {

      this.eventLogs.pop();

    }


    this.renderEventLogs();
  }


  renderEventLogs() {

    const feed =
      document.getElementById(
        "system-log-feed"
      );

    if (!feed) return;


    feed.innerHTML = "";


    this.eventLogs.forEach(l => {

      const badge =
        l.type === "crit"
          ? "🔴"
          : l.type === "warn"
          ? "🟡"
          : "🟢";


      const div =
        document.createElement(
          "div"
        );


      div.className =
        "log-line";


      div.innerHTML = `

        <span class="log-time mono-num">
          ${l.time}
        </span>

        <span class="log-badge">
          ${badge}
        </span>

        <strong class="log-title">
          ${l.title}:
        </strong>

        <span class="log-msg">
          ${l.detail}
        </span>

      `;


      feed.appendChild(
        div
      );
    });
  }


  /**
   * ============================================================
   * INITIAL LOGS
   * ============================================================
   */

  seedInitialEventLogs() {

    const city =
      this.cityConfig.cities[
        this.currentCityKey
      ];


    const cityName =
      city
        ? city.name
        : this.currentCityKey;


    this.addEventLog(
      "info",
      "System Booted",
      `Urban Flood Nowcasting System v2.4 initialized. ${cityName} catchment active.`
    );


    this.addEventLog(
      "info",
      "IoT Grid Connected",
      `${this.zones.length} hydro-meteorological prototype sensor zones online. Sampling interval: 4s.`
    );


    this.addEventLog(
      "info",
      "ML Model Loaded",
      "Ensemble Hydro-Logistic predictor active. ROC-AUC benchmark: 0.942."
    );
  }


  /**
   * ============================================================
   * SYSTEM CLOCK
   * ============================================================
   */

  startSystemClock() {

    const clockEl =
      document.getElementById(
        "system-clock"
      );


    const updateTime = () => {

      if (clockEl) {

        const d =
          new Date();


        clockEl.textContent =
          d.toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          ) +
          " " +
          d.toLocaleTimeString(
            [],
            {
              hour12: false
            }
          );
      }
    };


    updateTime();


    setInterval(
      updateTime,
      1000
    );
  }


  /**
   * ============================================================
   * DOM EVENT LISTENERS
   * ============================================================
   */

  initDOMListeners() {

    /*
     * 1. Navigation
     */

    document
      .querySelectorAll(
        ".sidebar-nav .nav-item"
      )
      .forEach(item => {

        item.addEventListener(
          "click",
          () => {

            const view =
              item.getAttribute(
                "data-view"
              );

            if (view) {
              this.switchView(
                view
              );
            }

          }
        );
      });


    /*
     * View buttons
     */

    document
      .querySelectorAll(
        ".view-switch-group .view-btn"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          () => {

            const view =
              btn.getAttribute(
                "data-view"
              );


            if (view) {

              document
                .querySelectorAll(
                  ".view-switch-group .view-btn"
                )
                .forEach(
                  b =>
                    b.classList.remove(
                      "active"
                    )
                );


              btn.classList.add(
                "active"
              );


              this.switchView(
                view
              );
            }

          }
        );
      });


    /*
     * 2. Zone selector
     */

    const zoneSelect =
      document.getElementById(
        "zone-select"
      );


    if (zoneSelect) {

      zoneSelect.addEventListener(
        "change",
        e =>
          this.selectZone(
            e.target.value
          )
      );
    }


    /*
     * 3. Simulate sensor update
     */

    const btnSimUpdate =
      document.getElementById(
        "btn-simulate-sensor-update"
      );


    if (btnSimUpdate) {

      btnSimUpdate.addEventListener(
        "click",
        () =>
          this.simulateSensorUpdate()
      );
    }


    const btnRefresh =
      document.getElementById(
        "btn-manual-refresh"
      );


    if (btnRefresh) {

      btnRefresh.addEventListener(
        "click",
        () =>
          this.simulateSensorUpdate()
      );
    }


    /*
     * 4. Drain blockage
     */

    const btnBlockage =
      document.getElementById(
        "btn-toggle-blockage"
      );


    if (btnBlockage) {

      btnBlockage.addEventListener(
        "click",
        () =>
          this.toggleDrainBlockage()
      );
    }


    /*
     * 5. Demo mode
     */

    const btnDemo =
      document.getElementById(
        "demo-mode-btn"
      );


    if (btnDemo) {

      btnDemo.addEventListener(
        "click",
        () =>
          this.toggleDemoMode()
      );
    }


    /*
     * 6. Manual inputs
     */

    this.bindRangeAndNumber(
      "input-rain-slider",
      "input-rain-number",
      val =>
        this.handleManualInputChange(
          "rainfall",
          val
        )
    );


    this.bindRangeAndNumber(
      "input-water-slider",
      "input-water-number",
      val =>
        this.handleManualInputChange(
          "waterLevel",
          val
        )
    );


    this.bindRangeAndNumber(
      "input-pressure-slider",
      "input-pressure-number",
      val =>
        this.handleManualInputChange(
          "pressure",
          val
        )
    );


    this.bindRangeAndNumber(
      "input-cap-slider",
      "input-cap-number",
      val =>
        this.handleManualInputChange(
          "drainageCapacity",
          val
        )
    );


    /*
     * 7. Safe routing
     */

    const btnCalculateRoute =
      document.getElementById(
        "btn-calculate-safe-route"
      );


    if (btnCalculateRoute) {

      btnCalculateRoute.addEventListener(
        "click",
        () =>
          this.calculateSafeRoute()
      );
    }


    const btnClearRoute =
      document.getElementById(
        "btn-clear-safe-route"
      );


    if (btnClearRoute) {

      btnClearRoute.addEventListener(
        "click",
        () =>
          this.clearSafeRoute()
      );
    }


    /*
     * 8. Basemap style
     */

    const btnMapStyle =
      document.getElementById(
        "map-style-toggle"
      );


    if (btnMapStyle) {

      btnMapStyle.addEventListener(
        "click",
        () => {

          const nextStyle =
            window.floodMapManager.currentTileKey ===
            "dark"
              ? "osm"
              : "dark";


          window.floodMapManager.setTileLayer(
            nextStyle
          );


          this.setText(
            "map-style-text",
            nextStyle === "dark"
              ? "Dark Matter"
              : "OpenStreetMap"
          );

        }
      );
    }


    /*
     * 9. Calculation modal
     */

    const btnOpenCalcModal =
      document.getElementById(
        "btn-open-calc-modal"
      );

    const modalCalc =
      document.getElementById(
        "calc-breakdown-modal"
      );

    const btnCloseCalcModal =
      document.getElementById(
        "btn-close-calc-modal"
      );


    if (
      btnOpenCalcModal &&
      modalCalc
    ) {

      btnOpenCalcModal.addEventListener(
        "click",
        () =>
          modalCalc.classList.add(
            "open"
          )
      );
    }


    if (
      btnCloseCalcModal &&
      modalCalc
    ) {

      btnCloseCalcModal.addEventListener(
        "click",
        () =>
          modalCalc.classList.remove(
            "open"
          )
      );
    }


    /*
     * 10. CITY SWITCHER
     *
     * This is the important part.
     */

    const citySelect =
      document.getElementById(
        "settings-city-select"
      );


    if (citySelect) {

      citySelect.addEventListener(
        "change",
        e => {

          console.log(
            "City selector changed:",
            e.target.value
          );


          this.switchCity(
            e.target.value
          );

        }
      );

    } else {

      console.error(
        "City selector #settings-city-select was not found."
      );
    }
  }


  /**
   * ============================================================
   * RANGE + NUMBER INPUT
   * ============================================================
   */

  bindRangeAndNumber(
    rangeId,
    numberId,
    callback
  ) {

    const range =
      document.getElementById(
        rangeId
      );

    const num =
      document.getElementById(
        numberId
      );


    if (
      range &&
      num
    ) {

      range.addEventListener(
        "input",
        e => {

          num.value =
            e.target.value;

          callback(
            e.target.value
          );

        }
      );


      num.addEventListener(
        "input",
        e => {

          range.value =
            e.target.value;

          callback(
            e.target.value
          );

        }
      );
    }
  }


  /**
   * ============================================================
   * UTILITY HELPERS
   * ============================================================
   */

  setText(
    id,
    val
  ) {

    const el =
      document.getElementById(
        id
      );


    if (el) {
      el.textContent =
        val;
    }
  }


  getText(id) {

    const el =
      document.getElementById(
        id
      );


    return el
      ? el.textContent
      : "";
  }


  setInputValue(
    id,
    val
  ) {

    const el =
      document.getElementById(
        id
      );


    if (el) {
      el.value =
        val;
    }
  }


  setBarWidth(
    id,
    pct
  ) {

    const el =
      document.getElementById(
        id
      );


    if (el) {

      el.style.width =
        `${Math.min(
          100,
          Math.max(
            0,
            pct
          )
        )}%`;
    }
  }
}


/**
 * ============================================================
 * GLOBAL BOOTSTRAP
 * ============================================================
 */

window.addEventListener(
  "DOMContentLoaded",
  () => {

    window.app =
      new UrbanFloodApp();

    window.app.init();

  }
);