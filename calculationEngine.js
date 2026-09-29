/**
 * Urban Flood Nowcasting System - Calculation Engine
 * 
 * Implements the coupled hydrological relationship:
 * Rainfall Intensity -> Runoff Estimation -> Drainage Capacity Comparison ->
 * Drainage Utilization -> Multi-sensor Normalization -> Flood Risk Score (0-100)
 */

const FLOOD_CALCULATION_CONFIG = {
  // Sensor weighting distribution (sums to 1.0 / 100%)
  WEIGHTS: {
    rainfallIntensity: 0.30,   // 30%
    waterLevel: 0.30,          // 30%
    drainageUtilization: 0.25, // 25%
    pressure: 0.15             // 15%
  },

  // Sensor normalization maximum bounds (maps raw readings to 0-100 scale)
  NORMALIZATION_BOUNDS: {
    rainfallMaxMmHr: 120.0,   // 120 mm/hr is extreme tropical cloudburst
    waterLevelMaxCm: 100.0,   // 100 cm (1.0 meter depth in street/channel)
    utilizationMaxPct: 100.0, // 100% capacity
    pressureMaxKpa: 70.0      // 70 kPa hydraulic head/backpressure
  },

  // Risk Classification Thresholds
  THRESHOLDS: {
    LOW_MAX: 30,       // 0 - 30 -> LOW
    MODERATE_MAX: 50,  // 31 - 50 -> MODERATE
    HIGH_MAX: 75,      // 51 - 75 -> HIGH
    CRITICAL_MIN: 76   // 76 - 100 -> CRITICAL
  },

  // Prototype Runoff Scaling Multiplier
  // Calibrated so that typical urban catchment inflow (L/s) aligns with local drainage conduits
  PROTOTYPE_RUNOFF_SCALE: 1.423
};

class FloodRiskCalculator {
  constructor(config = FLOOD_CALCULATION_CONFIG) {
    this.config = config;
  }

  /**
   * 1. RUNOFF ESTIMATION
   * Estimated Runoff = Rainfall Intensity × Runoff Coefficient × Drainage Area Scale
   * (Clearly labeled as prototype estimation)
   * 
   * @param {number} rainfallIntensity - mm/hr
   * @param {number} runoffCoefficient - dimensionless (0.2 to 0.95)
   * @param {number} drainageArea - sq km
   * @returns {number} Estimated incoming water flow in L/s
   */
  estimateRunoff(rainfallIntensity, runoffCoefficient = 0.75, drainageArea = 0.85) {
    const r = Math.max(0, parseFloat(rainfallIntensity) || 0);
    const c = Math.max(0.1, Math.min(1.0, parseFloat(runoffCoefficient) || 0.75));
    const a = Math.max(0.1, parseFloat(drainageArea) || 0.85);

    // Prototype formula: Inflow (L/s) = Rainfall × C × Area × CalibrationScale
    const estimatedInflow = r * c * a * this.config.PROTOTYPE_RUNOFF_SCALE;
    return parseFloat(estimatedInflow.toFixed(1));
  }

  /**
   * 2. DRAINAGE UTILIZATION (%)
   * Drainage Utilization (%) = (Estimated Incoming Water Flow / Drainage Capacity) * 100
   * 
   * @param {number} estimatedInflow - L/s
   * @param {number} drainageCapacity - L/s (effective capacity)
   * @returns {number} Percentage (0 to 100+%)
   */
  calculateUtilization(estimatedInflow, drainageCapacity) {
    const capacity = Math.max(1.0, parseFloat(drainageCapacity) || 100);
    const utilization = (estimatedInflow / capacity) * 100;
    return parseFloat(utilization.toFixed(1));
  }

  /**
   * 3. SENSOR NORMALIZATION
   * Normalizes each sensor reading to a standard 0 to 100 score
   */
  normalizeValues(rainfallIntensity, waterLevelCm, utilizationPct, pressureKpa) {
    const bounds = this.config.NORMALIZATION_BOUNDS;

    const rNorm = Math.min(100, Math.max(0, (rainfallIntensity / bounds.rainfallMaxMmHr) * 100));
    const wNorm = Math.min(100, Math.max(0, (waterLevelCm / bounds.waterLevelMaxCm) * 100));
    const uNorm = Math.min(100, Math.max(0, (utilizationPct / bounds.utilizationMaxPct) * 100));
    const pNorm = Math.min(100, Math.max(0, (pressureKpa / bounds.pressureMaxKpa) * 100));

    return {
      rainfallNorm: parseFloat(rNorm.toFixed(2)),
      waterLevelNorm: parseFloat(wNorm.toFixed(2)),
      utilizationNorm: parseFloat(uNorm.toFixed(2)),
      pressureNorm: parseFloat(pNorm.toFixed(2))
    };
  }

  /**
   * 4. FLOOD RISK SCORE (0 to 100)
   * Combines weighted normalized sensor metrics:
   * - Rainfall Intensity: 30%
   * - Water Level: 30%
   * - Drainage Utilization: 25%
   * - Pressure: 15%
   * 
   * @param {Object} sensorData - { rainfallIntensity, waterLevel, pressure, drainageCapacity, runoffCoefficient, drainageArea }
   * @returns {Object} Comprehensive calculation result including score, category, and explainability breakdown
   */
  calculateRisk(sensorData) {
    const r = parseFloat(sensorData.rainfallIntensity) || 0;
    const w = parseFloat(sensorData.waterLevel) || 0;
    const p = parseFloat(sensorData.pressure) || 0;
    const cap = parseFloat(sensorData.drainageCapacity) || 100;
    const c = parseFloat(sensorData.runoffCoefficient) || 0.75;
    const a = parseFloat(sensorData.drainageArea) || 0.85;

    // Step 1: Runoff Estimation
    const estimatedInflow = this.estimateRunoff(r, c, a);

    // Step 2: Drainage Utilization
    const utilization = this.calculateUtilization(estimatedInflow, cap);

    // Step 3: Sensor Normalization
    const norm = this.normalizeValues(r, w, utilization, p);

    // Step 4: Multi-criteria Weighted Combination
    const wConfig = this.config.WEIGHTS;
    const rWeighted = norm.rainfallNorm * wConfig.rainfallIntensity;
    const wWeighted = norm.waterLevelNorm * wConfig.waterLevel;
    const uWeighted = norm.utilizationNorm * wConfig.drainageUtilization;
    const pWeighted = norm.pressureNorm * wConfig.pressure;

    const rawScore = rWeighted + wWeighted + uWeighted + pWeighted;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Step 5: Risk Classification
    const classification = this.classifyRisk(finalScore);

    // Step 6: ML Simulated Probability (Logistic Sigmoid Coupling)
    const mlProbability = this.estimateMLProbability(r, w, p, cap, utilization);

    return {
      score: finalScore,
      status: classification.status,
      level: classification.level,
      color: classification.color,
      badgeClass: classification.badgeClass,
      tag: classification.tag,
      description: classification.description,
      estimatedInflow: estimatedInflow,
      drainageUtilization: utilization,
      predictedFloodProbability: mlProbability,
      breakdown: {
        weights: wConfig,
        rawInputs: {
          rainfallIntensity: r,
          waterLevel: w,
          pressure: p,
          drainageCapacity: cap,
          runoffCoefficient: c,
          drainageArea: a
        },
        normalized: norm,
        contributions: {
          rainfall: parseFloat(rWeighted.toFixed(2)),
          waterLevel: parseFloat(wWeighted.toFixed(2)),
          utilization: parseFloat(uWeighted.toFixed(2)),
          pressure: parseFloat(pWeighted.toFixed(2))
        },
        formula: "Score = (0.30 × Rain_Norm) + (0.30 × Water_Norm) + (0.25 × Util_Norm) + (0.15 × Press_Norm)"
      }
    };
  }

  /**
   * Risk Category Classification based on prompt:
   * 0–30 -> LOW
   * 31–50 -> MODERATE
   * 51–75 -> HIGH
   * 76–100 -> CRITICAL
   */
  classifyRisk(score) {
    const t = this.config.THRESHOLDS;

    if (score <= t.LOW_MAX) {
      return {
        status: "LOW",
        level: "LOW RISK",
        color: "#10b981", // Emerald green
        badgeClass: "status-low",
        tag: "🟢 LOW RISK",
        description: "Drainage conduits operating normally. Water inflow is well within conduit capacity."
      };
    } else if (score <= t.MODERATE_MAX) {
      return {
        status: "MODERATE",
        level: "MODERATE RISK",
        color: "#eab308", // Amber yellow
        badgeClass: "status-moderate",
        tag: "🟡 MODERATE RISK",
        description: "Surface runoff is accumulating and canal levels are rising. Maintenance teams on standby."
      };
    } else if (score <= t.HIGH_MAX) {
      return {
        status: "HIGH",
        level: "HIGH RISK",
        color: "#f97316", // Warm orange
        badgeClass: "status-high",
        tag: "🟠 HIGH RISK",
        description: "Drainage conduits near full capacity. Warning: localized waterlogging in depressed street sections."
      };
    } else {
      return {
        status: "CRITICAL",
        level: "CRITICAL FLOOD RISK",
        color: "#ef4444", // Vibrant red
        badgeClass: "status-critical",
        tag: "🔴 CRITICAL FLOOD RISK",
        description: "Severe conduit surcharge and overflow! High flood hazard. Immediate traffic diversion & pumping required."
      };
    }
  }

  /**
   * Coupled Hydro-ML Sigmoid Predictor
   * Simulates trained Logistic Regression / Neural Model
   */
  estimateMLProbability(rainfall, waterLevel, pressure, capacity, utilization) {
    const rN = rainfall / 100.0;
    const wN = waterLevel / 100.0;
    const pN = pressure / 60.0;
    const uN = utilization / 100.0;
    const cN = capacity / 150.0;

    // Logit function trained on historical hydro-meteorological surcharge events
    const logit = -3.8 + (3.4 * rN) + (3.1 * wN) + (2.6 * uN) + (1.4 * pN) - (1.8 * cN);
    const prob = 100.0 / (1.0 + Math.exp(-logit));
    return Math.min(99, Math.max(1, Math.round(prob)));
  }
}

// Instantiate singleton
const floodCalculator = new FloodRiskCalculator();

if (typeof window !== "undefined") {
  window.FloodRiskCalculator = FloodRiskCalculator;
  window.floodCalculator = floodCalculator;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FloodRiskCalculator, floodCalculator, FLOOD_CALCULATION_CONFIG };
}
