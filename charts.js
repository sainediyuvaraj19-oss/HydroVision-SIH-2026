/**
 * Urban Flood Nowcasting System - Time-Series Sensor Trend Graphs
 * 
 * 4 Dedicated Graphs:
 * 1. Rainfall Graph: Time vs Rainfall Intensity (mm/hr)
 * 2. Water Level Graph: Time vs Water Level (cm)
 * 3. Pressure Graph: Time vs Pressure (kPa)
 * 4. Drainage Capacity Graph: Actual Estimated Inflow vs Drainage Capacity (L/s)
 *    (Visually highlights when incoming water approaches or exceeds drainage capacity)
 */

class FloodTrendChartsManager {
  constructor() {
    this.maxDataPoints = 12;
    this.charts = {
      rainfall: null,
      waterLevel: null,
      pressure: null,
      drainage: null
    };
    this.history = {
      labels: [],
      rainfall: [],
      waterLevel: [],
      pressure: [],
      inflow: [],
      capacity: []
    };
    this.initialized = false;
  }

  /**
   * Seed initial realistic chronological readings
   */
  init(initialZone) {
    if (typeof Chart === "undefined") {
      console.warn("Chart.js not loaded. Retrying in 500ms...");
      setTimeout(() => this.init(initialZone), 500);
      return;
    }

    const now = new Date();
    this.history.labels = [];
    this.history.rainfall = [];
    this.history.waterLevel = [];
    this.history.pressure = [];
    this.history.inflow = [];
    this.history.capacity = [];

    const baseR = initialZone.rainfall || 35;
    const baseW = initialZone.waterLevel || 38;
    const baseP = initialZone.pressure || 26;
    const baseCap = initialZone.drainageCapacity || 100;
    const baseInflow = initialZone.estimatedInflow || 45;

    // Generate historical baseline
    for (let i = this.maxDataPoints - 1; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 3 * 60000);
      const timeLabel = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const variance = (Math.sin(i * 0.8) * 4);

      this.history.labels.push(timeLabel);
      this.history.rainfall.push(Math.max(5, parseFloat((baseR - (i * 1.5) + variance).toFixed(1))));
      this.history.waterLevel.push(Math.max(10, Math.round(baseW - (i * 2) + variance)));
      this.history.pressure.push(Math.max(12, parseFloat((baseP - (i * 1.2) + (variance * 0.5)).toFixed(1))));
      this.history.inflow.push(Math.max(8, parseFloat((baseInflow - (i * 2.2) + variance).toFixed(1))));
      this.history.capacity.push(baseCap);
    }

    this.createCharts();
    this.initialized = true;
  }

  /**
   * Create Chart.js instances with dark modern theme
   */
  createCharts() {
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            boxWidth: 12,
            font: { family: "'Inter', sans-serif", size: 11 },
            color: "#94a9c6"
          }
        },
        tooltip: {
          backgroundColor: "rgba(11, 22, 43, 0.92)",
          titleColor: "#edf5ff",
          bodyColor: "#94a9c6",
          borderColor: "rgba(56, 189, 248, 0.3)",
          borderWidth: 1,
          padding: 8,
          titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
          bodyFont: { family: "'Inter', sans-serif", size: 11 }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#627b9c", font: { family: "'JetBrains Mono', monospace", size: 10 } }
        },
        y: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#627b9c", font: { family: "'JetBrains Mono', monospace", size: 10 } }
        }
      }
    };

    // 1. Rainfall Intensity Chart
    const ctxRain = document.getElementById("chart-rainfall")?.getContext("2d");
    if (ctxRain) {
      if (this.charts.rainfall) this.charts.rainfall.destroy();
      this.charts.rainfall = new Chart(ctxRain, {
        type: "line",
        data: {
          labels: this.history.labels,
          datasets: [{
            label: "Rainfall Intensity (mm/hr)",
            data: this.history.rainfall,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#38bdf8"
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: { ...commonOptions.scales.y, suggestedMin: 0, suggestedMax: 100 }
          }
        }
      });
    }

    // 2. Water Level Chart
    const ctxWater = document.getElementById("chart-water-level")?.getContext("2d");
    if (ctxWater) {
      if (this.charts.waterLevel) this.charts.waterLevel.destroy();
      this.charts.waterLevel = new Chart(ctxWater, {
        type: "line",
        data: {
          labels: this.history.labels,
          datasets: [{
            label: "Canal Water Level (cm)",
            data: this.history.waterLevel,
            borderColor: "#2dd4bf",
            backgroundColor: "rgba(45, 212, 191, 0.15)",
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#2dd4bf"
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: { ...commonOptions.scales.y, suggestedMin: 0, suggestedMax: 100 }
          }
        }
      });
    }

    // 3. Pressure Sensor Chart
    const ctxPressure = document.getElementById("chart-pressure")?.getContext("2d");
    if (ctxPressure) {
      if (this.charts.pressure) this.charts.pressure.destroy();
      this.charts.pressure = new Chart(ctxPressure, {
        type: "line",
        data: {
          labels: this.history.labels,
          datasets: [{
            label: "Drainage Backpressure (kPa)",
            data: this.history.pressure,
            borderColor: "#a855f7",
            backgroundColor: "rgba(168, 85, 247, 0.15)",
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#a855f7"
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: { ...commonOptions.scales.y, suggestedMin: 0, suggestedMax: 60 }
          }
        }
      });
    }

    // 4. Drainage Capacity vs Inflow Chart (Critical Inflow Threshold comparison)
    const ctxDrain = document.getElementById("chart-drainage-capacity")?.getContext("2d");
    if (ctxDrain) {
      if (this.charts.drainage) this.charts.drainage.destroy();
      this.charts.drainage = new Chart(ctxDrain, {
        type: "line",
        data: {
          labels: this.history.labels,
          datasets: [
            {
              label: "Estimated Inflow (L/s)",
              data: this.history.inflow,
              borderColor: "#f97316",
              backgroundColor: "rgba(249, 115, 22, 0.18)",
              borderWidth: 2.5,
              tension: 0.35,
              fill: true,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: "#f97316"
            },
            {
              label: "Drainage Capacity (L/s)",
              data: this.history.capacity,
              borderColor: "#ef4444",
              borderDash: [6, 4],
              borderWidth: 2,
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: { ...commonOptions.scales.y, suggestedMin: 0, suggestedMax: 150 }
          }
        }
      });
    }
  }

  /**
   * Push new real-time sensor data point and update all 4 charts
   */
  pushData(zone) {
    if (!this.initialized) {
      this.init(zone);
      return;
    }

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Rotate buffers
    if (this.history.labels.length >= this.maxDataPoints) {
      this.history.labels.shift();
      this.history.rainfall.shift();
      this.history.waterLevel.shift();
      this.history.pressure.shift();
      this.history.inflow.shift();
      this.history.capacity.shift();
    }

    this.history.labels.push(timeLabel);
    this.history.rainfall.push(zone.rainfall);
    this.history.waterLevel.push(zone.waterLevel);
    this.history.pressure.push(zone.pressure);
    this.history.inflow.push(zone.estimatedInflow || (zone.rainfall * 1.14));
    this.history.capacity.push(zone.drainageCapacity);

    // Update charts
    if (this.charts.rainfall) this.charts.rainfall.update("none");
    if (this.charts.waterLevel) this.charts.waterLevel.update("none");
    if (this.charts.pressure) this.charts.pressure.update("none");
    if (this.charts.drainage) this.charts.drainage.update("none");
  }

  /**
   * Switch charts to focus on a different active zone
   */
  switchZone(zone) {
    this.init(zone);
  }
}

const trendCharts = new FloodTrendChartsManager();

if (typeof window !== "undefined") {
  window.FloodTrendChartsManager = FloodTrendChartsManager;
  window.trendCharts = trendCharts;
}
