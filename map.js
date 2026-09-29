/**
 * Urban Flood Nowcasting System - Interactive GIS Map Engine (Leaflet.js)
 *
 * Manages:
 * - Real geographical mapping with OpenStreetMap & Esri satellite tiles
 * - Urban Drainage Catchment Polygons colored by risk
 * - IoT Sensor Node Pulsing Markers with diagnostic popups
 * - Zone selection bidirectional synchronization
 * - Dynamic Safe Route planning avoiding HIGH & CRITICAL risk zones
 */

class FloodMapManager {
  constructor(containerId = "dashboard-map") {
    this.containerId = containerId;
    this.map = null;
    this.tileLayers = {};
    this.currentTileKey = "satellite";
    this.zoneLayers = {};
    this.sensorMarkers = {};
    this.routeLayers = [];
    this.onZoneSelectCallback = null;
    this.activeZoneId = null;
    this.routingPoints = {
      start: null,
      destination: null
    };
  }

  /**
   * Initialize Leaflet Map
   */
  init(center = [16.3067, 80.4365], zoom = 13) {
    const container = document.getElementById(
      this.containerId
    );

    if (!container) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.containerId, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: true
    });

    // Custom Zoom Control
    L.control.zoom({
      position: "bottomright"
    }).addTo(this.map);

    // =========================================================
    // TILE LAYERS
    // =========================================================

    /*
     * CARTO DARK
     *
     * Kept here only as an optional layer.
     * It is NOT loaded by default because it was returning:
     *
     * "API key required"
     */
    this.tileLayers.dark = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> | ' +
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: "abcd",
        maxZoom: 19
      }
    );

    // =========================================================
    // OPENSTREETMAP
    // =========================================================

    this.tileLayers.osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }
    );

    // =========================================================
    // ESRI SATELLITE
    // =========================================================

    this.tileLayers.satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, " +
          "i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, " +
          "Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        maxZoom: 18
      }
    );

    // =========================================================
    // DEFAULT BASEMAP
    // =========================================================

    // Esri Satellite is the default.
    this.tileLayers.satellite.addTo(this.map);
    this.currentTileKey = "satellite";

    // =========================================================
    // MAP CLICK
    // =========================================================

    this.map.on("click", (e) => {
      this.handleMapClick(e);
    });

    // Force tile recalculation after layout
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  /**
   * Switch basemap style
   */
  setTileLayer(styleKey) {
    if (
      !this.tileLayers[styleKey] ||
      styleKey === this.currentTileKey
    ) {
      return;
    }

    if (this.map.hasLayer(
      this.tileLayers[this.currentTileKey]
    )) {
      this.map.removeLayer(
        this.tileLayers[this.currentTileKey]
      );
    }

    this.tileLayers[styleKey].addTo(this.map);

    this.currentTileKey = styleKey;
  }

  /**
   * Render zones on the map
   */
  renderZones(zones, activeZoneId) {
    this.activeZoneId = activeZoneId;

    // Clear existing zone layers
    Object.values(this.zoneLayers).forEach(
      (layer) => {
        this.map.removeLayer(layer);
      }
    );

    // Clear existing sensor markers
    Object.values(this.sensorMarkers).forEach(
      (marker) => {
        this.map.removeLayer(marker);
      }
    );

    this.zoneLayers = {};
    this.sensorMarkers = {};

    zones.forEach((zone) => {
      const color = this.getRiskColor(
        zone.riskStatus || zone.status
      );

      const isSelected =
        zone.zoneId === activeZoneId;

      // =======================================================
      // POLYGON
      // =======================================================

      const polygonLayer = L.polygon(
        zone.polygon,
        {
          color: color,
          weight: isSelected ? 3.5 : 2,
          dashArray: isSelected
            ? null
            : "4, 4",
          fillColor: color,
          fillOpacity: isSelected
            ? 0.45
            : 0.25,
          className:
            `zone-polygon ${
              isSelected
                ? "selected-zone"
                : ""
            }`
        }
      ).addTo(this.map);

      // Popup
      const popupContent =
        this.createZonePopupContent(zone);

      polygonLayer.bindPopup(
        popupContent,
        {
          maxWidth: 320,
          className:
            "custom-map-popup"
        }
      );

      // Zone click
      polygonLayer.on(
        "click",
        () => {
          if (
            this.onZoneSelectCallback
          ) {
            this.onZoneSelectCallback(
              zone.zoneId
            );
          }
        }
      );

      this.zoneLayers[
        zone.zoneId
      ] = polygonLayer;

      // =======================================================
      // SENSOR MARKER
      // =======================================================

      const markerHtml = `
        <div
          class="sensor-pulse-marker ${
            zone.riskStatus
              ? zone.riskStatus.toLowerCase()
              : "low"
          }"
          style="--marker-color: ${color}"
        >
          <div class="marker-core">
            <i class="fa-solid fa-satellite-dish"></i>
          </div>

          <div class="marker-pulse"></div>

          <span class="marker-label">
            ${zone.zoneId}
          </span>
        </div>
      `;

      const markerIcon = L.divIcon({
        className:
          "custom-div-icon",
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const sensorMarker =
        L.marker(
          zone.center,
          {
            icon: markerIcon
          }
        ).addTo(this.map);

      sensorMarker.bindPopup(
        popupContent,
        {
          maxWidth: 320,
          className:
            "custom-map-popup"
        }
      );

      sensorMarker.on(
        "click",
        () => {
          if (
            this.onZoneSelectCallback
          ) {
            this.onZoneSelectCallback(
              zone.zoneId
            );
          }
        }
      );

      this.sensorMarkers[
        zone.zoneId
      ] = sensorMarker;
    });
  }

  /**
   * Update visual styling of an existing zone
   */
  updateZoneRisk(zone) {
    const layer =
      this.zoneLayers[
        zone.zoneId
      ];

    const marker =
      this.sensorMarkers[
        zone.zoneId
      ];

    if (!layer || !marker) {
      return;
    }

    const color =
      this.getRiskColor(
        zone.riskStatus ||
        zone.status
      );

    const isSelected =
      zone.zoneId ===
      this.activeZoneId;

    layer.setStyle({
      color: color,
      fillColor: color,
      fillOpacity:
        isSelected
          ? 0.48
          : 0.28,
      weight:
        isSelected
          ? 3.5
          : 2
    });

    const popupContent =
      this.createZonePopupContent(
        zone
      );

    layer.setPopupContent(
      popupContent
    );

    marker.setPopupContent(
      popupContent
    );

    // Update marker pulse color
    const markerEl =
      marker.getElement();

    if (markerEl) {
      const pulseDiv =
        markerEl.querySelector(
          ".sensor-pulse-marker"
        );

      if (pulseDiv) {
        pulseDiv.style.setProperty(
          "--marker-color",
          color
        );

        pulseDiv.className =
          `sensor-pulse-marker ${
            (
              zone.riskStatus ||
              zone.status
            ).toLowerCase()
          }`;
      }
    }
  }

  /**
   * Focus map view on a zone
   */
  focusZone(zoneId) {
    this.activeZoneId =
      zoneId;

    const layer =
      this.zoneLayers[
        zoneId
      ];

    if (layer) {
      this.map.flyToBounds(
        layer.getBounds(),
        {
          padding: [40, 40],
          maxZoom: 15,
          duration: 1.0
        }
      );

      layer.openPopup();
    }
  }

  /**
   * Build Zone Information Popup
   */
  createZonePopupContent(zone) {
    const riskStatus =
      zone.riskStatus ||
      zone.status ||
      "LOW";

    const score =
      zone.floodRiskScore !==
      undefined
        ? zone.floodRiskScore
        : zone.score || 0;

    const color =
      this.getRiskColor(
        riskStatus
      );

    return `
      <div class="map-popup-card">

        <div
          class="mp-header"
          style="border-left: 4px solid ${color};"
        >
          <div>

            <span class="mp-id mono-num">
              ${zone.zoneId}
            </span>

            <h4 class="mp-title">
              ${zone.name}
            </h4>

          </div>

          <span
            class="mp-risk-badge"
            style="
              background: ${color}22;
              color: ${color};
              border: 1px solid ${color}66;
            "
          >
            ${riskStatus}
          </span>
        </div>

        <div class="mp-coords mono-num">

          <i class="fa-solid fa-location-dot"></i>

          [
            ${zone.center[0].toFixed(4)},
            ${zone.center[1].toFixed(4)}
          ]

          &bull;

          ${
            zone.areaName ||
            "Drainage Catchment"
          }

        </div>

        <div class="mp-grid">

          <div class="mp-item">

            <span class="mp-lbl">
              Rainfall:
            </span>

            <span class="mp-val mono-num">
              ${zone.rainfall} mm/hr
            </span>

          </div>

          <div class="mp-item">

            <span class="mp-lbl">
              Water Level:
            </span>

            <span class="mp-val mono-num">
              ${zone.waterLevel} cm
            </span>

          </div>

          <div class="mp-item">

            <span class="mp-lbl">
              Pressure:
            </span>

            <span class="mp-val mono-num">
              ${zone.pressure} kPa
            </span>

          </div>

          <div class="mp-item">

            <span class="mp-lbl">
              Drainage Capacity:
            </span>

            <span class="mp-val mono-num">
              ${zone.drainageCapacity} L/s
            </span>

          </div>

          <div class="mp-item">

            <span class="mp-lbl">
              Estimated Inflow:
            </span>

            <span class="mp-val mono-num highlight-inflow">
              ${
                zone.estimatedInflow ||
                Math.round(
                  zone.rainfall * 1.14
                )
              } L/s
            </span>

          </div>

          <div class="mp-item">

            <span class="mp-lbl">
              Drainage Utilization:
            </span>

            <span
              class="
                mp-val
                mono-num
                ${
                  zone.drainageUtilization >
                  80
                    ? "warn-val"
                    : ""
                }
              "
            >
              ${
                zone.drainageUtilization
              }%
            </span>

          </div>

        </div>

        <div class="mp-score-bar">

          <div class="mp-score-text">

            <span>
              Flood Risk Score:
            </span>

            <strong
              class="mono-num"
              style="color: ${color};"
            >
              ${score} / 100
            </strong>

          </div>

          <div class="mp-track">

            <div
              class="mp-fill"
              style="
                width: ${score}%;
                background: ${color};
              "
            ></div>

          </div>

        </div>

        <div class="mp-action-box">

          <i class="fa-solid fa-triangle-exclamation"></i>

          <span>
            ${
              zone.recommendedAction ||
              "Monitor drainage section."
            }
          </span>

        </div>

      </div>
    `;
  }

  /**
   * Risk Color Mapping
   */
  getRiskColor(status) {
    switch (status) {
      case "CRITICAL":
        return "#ef4444";

      case "HIGH":
        return "#f97316";

      case "MODERATE":
        return "#eab308";

      case "LOW":
      default:
        return "#10b981";
    }
  }

  /**
   * Dynamic Safe Route
   */
  plotSafeRoute(
    startZone,
    destZone,
    allZones
  ) {
    // Clear previous route
    this.routeLayers.forEach(
      (layer) => {
        this.map.removeLayer(
          layer
        );
      }
    );

    this.routeLayers = [];

    if (
      !startZone ||
      !destZone
    ) {
      return;
    }

    // Identify hazard zones
    const hazardZones =
      allZones.filter(
        (z) =>
          z.riskStatus ===
            "HIGH" ||
          z.riskStatus ===
            "CRITICAL"
      );

    // Check direct path
    const isDirectPathBlocked =
      hazardZones.some(
        (hz) => {
          if (
            hz.zoneId ===
              startZone.zoneId ||
            hz.zoneId ===
              destZone.zoneId
          ) {
            return false;
          }

          const minLat =
            Math.min(
              startZone.center[0],
              destZone.center[0]
            ) - 0.003;

          const maxLat =
            Math.max(
              startZone.center[0],
              destZone.center[0]
            ) + 0.003;

          const minLng =
            Math.min(
              startZone.center[1],
              destZone.center[1]
            ) - 0.003;

          const maxLng =
            Math.max(
              startZone.center[1],
              destZone.center[1]
            ) + 0.003;

          return (
            hz.center[0] >=
              minLat &&
            hz.center[0] <=
              maxLat &&
            hz.center[1] >=
              minLng &&
            hz.center[1] <=
              maxLng
          );
        }
      );

    const routeWaypoints =
      [];

    routeWaypoints.push(
      startZone.center
    );

    if (
      isDirectPathBlocked &&
      hazardZones.length > 0
    ) {
      // Find safe bypass
      const safeBypasses =
        allZones.filter(
          (z) =>
            (
              z.riskStatus ===
                "LOW" ||
              z.riskStatus ===
                "MODERATE"
            ) &&
            z.zoneId !==
              startZone.zoneId &&
            z.zoneId !==
              destZone.zoneId
        );

      if (
        safeBypasses.length >
        0
      ) {
        const bypass =
          safeBypasses[0];

        routeWaypoints.push(
          bypass.center
        );
      } else {
        // Lateral detour
        const midLat =
          (
            startZone.center[0] +
            destZone.center[0]
          ) / 2 + 0.008;

        const midLng =
          (
            startZone.center[1] +
            destZone.center[1]
          ) / 2 - 0.008;

        routeWaypoints.push([
          midLat,
          midLng
        ]);
      }
    }

    routeWaypoints.push(
      destZone.center
    );

    // =======================================================
    // SAFE ROUTE
    // =======================================================

    const safeRouteLine =
      L.polyline(
        routeWaypoints,
        {
          color: "#10b981",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          dashArray: "1, 10",
          className:
            "animated-safe-route"
        }
      ).addTo(this.map);

    // Route glow
    const routeGlow =
      L.polyline(
        routeWaypoints,
        {
          color: "#10b981",
          weight: 10,
          opacity: 0.35,
          lineCap: "round"
        }
      ).addTo(this.map);

    this.routeLayers.push(
      safeRouteLine,
      routeGlow
    );

    // =======================================================
    // START MARKER
    // =======================================================

    const startMarker =
      L.circleMarker(
        startZone.center,
        {
          radius: 8,
          fillColor: "#38bdf8",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 2
        }
      )
        .addTo(this.map)
        .bindTooltip(
          "Origin: " +
            startZone.name,
          {
            permanent: true,
            direction: "top"
          }
        );

    // =======================================================
    // DESTINATION MARKER
    // =======================================================

    const destMarker =
      L.circleMarker(
        destZone.center,
        {
          radius: 8,
          fillColor: "#10b981",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 2
        }
      )
        .addTo(this.map)
        .bindTooltip(
          "Destination: " +
            destZone.name,
          {
            permanent: true,
            direction: "bottom"
          }
        );

    this.routeLayers.push(
      startMarker,
      destMarker
    );

    // =======================================================
    // HAZARD MARKERS
    // =======================================================

    hazardZones.forEach(
      (hz) => {
        const hazardMarker =
          L.marker(
            hz.center,
            {
              icon: L.divIcon(
                {
                  className:
                    "hazard-warning-icon",

                  html: `
                    <div
                      class="hazard-badge"
                      title="Flood Inundation Warning: Route Diverted"
                    >
                      <i class="fa-solid fa-triangle-exclamation"></i>
                      Detour Avoided
                    </div>
                  `,

                  iconSize: [
                    120,
                    24
                  ]
                }
              )
            }
          ).addTo(this.map);

        this.routeLayers.push(
          hazardMarker
        );
      }
    );

    // Fit map to route
    this.map.fitBounds(
      safeRouteLine.getBounds(),
      {
        padding: [50, 50]
      }
    );

    return {
      waypoints:
        routeWaypoints,

      detourActive:
        isDirectPathBlocked,

      avoidedZones:
        hazardZones.map(
          (h) => h.name
        )
    };
  }

  /**
   * Clear Route
   */
  clearRoute() {
    this.routeLayers.forEach(
      (layer) => {
        this.map.removeLayer(
          layer
        );
      }
    );

    this.routeLayers = [];
  }

  /**
   * Handle Map Click
   */
  handleMapClick(e) {
    if (
      window.appState &&
      window.appState
        .routingModeActive
    ) {
      window.appState
        .handleCustomRoutePoint(
          e.latlng
        );
    }
  }

  /**
   * Recenter Map
   */
  recenter(
    center,
    zoom = 13
  ) {
    if (this.map) {
      this.map.setView(
        center,
        zoom
      );
    }
  }

  /**
   * Invalidate Map Size
   */
  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}

// =============================================================
// GLOBAL FLOOD MAP MANAGER
// =============================================================

const floodMapManager =
  new FloodMapManager();

if (
  typeof window !==
  "undefined"
) {
  window.FloodMapManager =
    FloodMapManager;

  window.floodMapManager =
    floodMapManager;
}