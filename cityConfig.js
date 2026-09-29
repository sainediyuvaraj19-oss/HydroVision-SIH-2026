/**
 * Urban Flood Nowcasting System - Geographic & Catchment Configuration
 *
 * Default Location: Vijayawada, Andhra Pradesh, India
 *
 * Contains prototype catchment configurations for:
 * - Guntur
 * - Vijayawada
 * - Hyderabad
 *
 * NOTE:
 * Vijayawada and Hyderabad prototype zones are demonstration catchments.
 * They are not claims of actual installed sensor locations.
 */

const CITY_CONFIG = {
  activeCityKey: "Vijayawada",

  cities: {

    // =========================================================
    // GUNTUR
    // =========================================================

    "Guntur": {
      name: "Guntur, Andhra Pradesh, India",
      center: [16.3067, 80.4365],
      zoom: 13,
      state: "Andhra Pradesh",
      country: "India",
      elevationRange: "28m - 42m MSL",
      primaryMonsoon: "Southwest & Northeast Monsoons (June-Nov)",

      zones: [
        {
          zoneId: "ZONE-01",
          name: "Arundelpet Commercial Basin",
          areaName: "Arundelpet Main Catchment",
          center: [16.3085, 80.4410],
          polygon: [
            [16.3130, 80.4370],
            [16.3135, 80.4455],
            [16.3050, 80.4465],
            [16.3040, 80.4375]
          ],
          drainageCapacity: 120,
          drainageArea: 0.85,
          runoffCoefficient: 0.80,
          baselineRainfall: 32.0,
          baselineWaterLevel: 35,
          baselinePressure: 26.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Normal drainage flow. Maintain standard routine silt inspections.",
            MODERATE: "Conduit utilization approaching capacity. Standby mobile de-watering pump unit.",
            HIGH: "Inspect drainage section, clear gully traps, and prepare traffic detour advisory.",
            CRITICAL: "IMMEDIATE ACTION: Surcharge overflow underway. Deploy emergency suction crews & close low underpasses."
          }
        },

        {
          zoneId: "ZONE-02",
          name: "Brodipet Residential Catchment",
          areaName: "Brodipet Storm Network",
          center: [16.3145, 80.4315],
          polygon: [
            [16.3200, 80.4270],
            [16.3210, 80.4365],
            [16.3105, 80.4370],
            [16.3090, 80.4275]
          ],
          drainageCapacity: 95,
          drainageArea: 0.72,
          runoffCoefficient: 0.65,
          baselineRainfall: 22.5,
          baselineWaterLevel: 28,
          baselinePressure: 21.0,

          criticalThresholds: {
            waterLevelCm: 65,
            rainfallMmHr: 55,
            utilizationPct: 80,
            pressureKpa: 42
          },

          recommendedActions: {
            LOW: "Residential runoff well within conduit capacity. Standard monitoring.",
            MODERATE: "Stormwater inflow accelerating. Clear lateral stormwater grating.",
            HIGH: "Elevated residential water levels. Alert ward sanitary inspectors.",
            CRITICAL: "Canal backflow into residential basements. Activate secondary retention basin."
          }
        },

        {
          zoneId: "ZONE-03",
          name: "Kothapet Lowland Market",
          areaName: "Kothapet Wholesale Market Basin",
          center: [16.2995, 80.4485],
          polygon: [
            [16.3040, 80.4440],
            [16.3045, 80.4535],
            [16.2950, 80.4540],
            [16.2940, 80.4445]
          ],
          drainageCapacity: 75,
          drainageArea: 0.90,
          runoffCoefficient: 0.85,
          baselineRainfall: 45.0,
          baselineWaterLevel: 52,
          baselinePressure: 38.0,

          criticalThresholds: {
            waterLevelCm: 60,
            rainfallMmHr: 50,
            utilizationPct: 80,
            pressureKpa: 40
          },

          recommendedActions: {
            LOW: "Market drains flowing freely. Continue bi-weekly desiltation.",
            MODERATE: "Low-lying commercial area. Silt and organic debris accumulation risk.",
            HIGH: "High risk of market street flooding. Dispatch automated trash rake teams.",
            CRITICAL: "CRITICAL: Market inundation hazard! Issue merchant flood evacuation warning."
          }
        },

        {
          zoneId: "ZONE-04",
          name: "Old Guntur Canal Outfall",
          areaName: "Old Guntur Bottleneck Junction",
          center: [16.2915, 80.4385],
          polygon: [
            [16.2965, 80.4330],
            [16.2970, 80.4440],
            [16.2865, 80.4435],
            [16.2860, 80.4335]
          ],
          drainageCapacity: 150,
          drainageArea: 1.45,
          runoffCoefficient: 0.70,
          baselineRainfall: 52.0,
          baselineWaterLevel: 62,
          baselinePressure: 44.0,

          criticalThresholds: {
            waterLevelCm: 75,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 48
          },

          recommendedActions: {
            LOW: "Main canal discharge operating normally.",
            MODERATE: "Discharge velocity dropping due to downstream canal water elevation.",
            HIGH: "Outfall experiencing backpressure surcharge. Prepare secondary bypass channel.",
            CRITICAL: "TRUNK OVERFLOW IMMINENT: Sluice gate surcharge."
          }
        },

        {
          zoneId: "ZONE-05",
          name: "Nagarampalem Collectorate Hub",
          areaName: "Nagarampalem Administrative Hub",
          center: [16.3195, 80.4445],
          polygon: [
            [16.3250, 80.4400],
            [16.3260, 80.4500],
            [16.3160, 80.4510],
            [16.3150, 80.4410]
          ],
          drainageCapacity: 110,
          drainageArea: 0.80,
          runoffCoefficient: 0.72,
          baselineRainfall: 28.0,
          baselineWaterLevel: 30,
          baselinePressure: 23.0,

          criticalThresholds: {
            waterLevelCm: 68,
            rainfallMmHr: 58,
            utilizationPct: 80,
            pressureKpa: 44
          },

          recommendedActions: {
            LOW: "Collectorate sector drainage clear.",
            MODERATE: "Storm drain inlet velocity reducing. Keep surveillance active.",
            HIGH: "Drainage surcharging near Collectorate underpass.",
            CRITICAL: "CRITICAL: Key administrative corridor inundated."
          }
        },

        {
          zoneId: "ZONE-06",
          name: "Autonagar Industrial Corridor",
          areaName: "Autonagar Industrial Conduit",
          center: [16.3265, 80.4625],
          polygon: [
            [16.3330, 80.4560],
            [16.3340, 80.4690],
            [16.3210, 80.4700],
            [16.3200, 80.4570]
          ],
          drainageCapacity: 180,
          drainageArea: 1.80,
          runoffCoefficient: 0.82,
          baselineRainfall: 68.0,
          baselineWaterLevel: 74,
          baselinePressure: 50.0,

          criticalThresholds: {
            waterLevelCm: 85,
            rainfallMmHr: 70,
            utilizationPct: 80,
            pressureKpa: 52
          },

          recommendedActions: {
            LOW: "Industrial channels carrying standard storm runoff.",
            MODERATE: "High volume runoff detected.",
            HIGH: "Industrial channel bank reaching capacity.",
            CRITICAL: "INDUSTRIAL FLOOD WARNING: Flood mitigation initiated."
          }
        },

        {
          zoneId: "ZONE-07",
          name: "Pattabhipuram Sluice Gateway",
          areaName: "Pattabhipuram Sluice Catchment",
          center: [16.3015, 80.4225],
          polygon: [
            [16.3070, 80.4170],
            [16.3075, 80.4270],
            [16.2970, 80.4280],
            [16.2960, 80.4180]
          ],
          drainageCapacity: 130,
          drainageArea: 1.10,
          runoffCoefficient: 0.68,
          baselineRainfall: 19.0,
          baselineWaterLevel: 25,
          baselinePressure: 19.5,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Sluice gates operating at nominal retention level.",
            MODERATE: "Basin inflow rising.",
            HIGH: "Buffer basin filling. Pre-release discharge.",
            CRITICAL: "CRITICAL: Retention reservoir overflow risk."
          }
        }
      ]
    },


    // =========================================================
    // VIJAYAWADA
    // =========================================================

    "Vijayawada": {
      name: "Vijayawada, Andhra Pradesh, India",
      center: [16.5062, 80.6480],
      zoom: 13,
      state: "Andhra Pradesh",
      country: "India",
      elevationRange: "18m - 35m MSL",
      primaryMonsoon: "Krishna River Basin Inundation",

      zones: [

        // Existing Zone 1
        {
          zoneId: "VJA-01",
          name: "One Town Commercial Area",
          areaName: "Old Town Market Zone",
          center: [16.5180, 80.6120],
          polygon: [
            [16.5220, 80.6080],
            [16.5230, 80.6170],
            [16.5140, 80.6180],
            [16.5130, 80.6090]
          ],
          drainageCapacity: 110,
          drainageArea: 0.90,
          runoffCoefficient: 0.85,
          baselineRainfall: 35.0,
          baselineWaterLevel: 40,
          baselinePressure: 28.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Normal drainage flow.",
            MODERATE: "Monitor storm inlets.",
            HIGH: "Clear market debris.",
            CRITICAL: "Evacuate low-lying shops."
          }
        },

        // Existing Zone 2
        {
          zoneId: "VJA-02",
          name: "Benz Circle Arterial Drain",
          areaName: "MG Road & Benz Circle",
          center: [16.5020, 80.6540],
          polygon: [
            [16.5080, 80.6490],
            [16.5090, 80.6590],
            [16.4960, 80.6600],
            [16.4950, 80.6500]
          ],
          drainageCapacity: 140,
          drainageArea: 1.20,
          runoffCoefficient: 0.80,
          baselineRainfall: 42.0,
          baselineWaterLevel: 48,
          baselinePressure: 32.0,

          criticalThresholds: {
            waterLevelCm: 75,
            rainfallMmHr: 65,
            utilizationPct: 80,
            pressureKpa: 48
          },

          recommendedActions: {
            LOW: "Traffic conduits clear.",
            MODERATE: "Monitor underpasses.",
            HIGH: "Issue arterial road warnings.",
            CRITICAL: "Close Benz Circle underpass."
          }
        },

        // New Zone 3
        {
          zoneId: "VJA-03",
          name: "Governorpet Catchment",
          areaName: "Governorpet Stormwater Basin",
          center: [16.5190, 80.6350],
          polygon: [
            [16.5240, 80.6300],
            [16.5240, 80.6400],
            [16.5140, 80.6400],
            [16.5140, 80.6300]
          ],
          drainageCapacity: 105,
          drainageArea: 0.82,
          runoffCoefficient: 0.78,
          baselineRainfall: 30.0,
          baselineWaterLevel: 34,
          baselinePressure: 25.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Normal stormwater flow.",
            MODERATE: "Monitor drainage inlets.",
            HIGH: "Clear blocked storm grates.",
            CRITICAL: "Activate local flood response."
          }
        },

        // New Zone 4
        {
          zoneId: "VJA-04",
          name: "Patamata Residential Basin",
          areaName: "Patamata Residential Catchment",
          center: [16.4930, 80.6710],
          polygon: [
            [16.4990, 80.6650],
            [16.4990, 80.6770],
            [16.4870, 80.6770],
            [16.4870, 80.6650]
          ],
          drainageCapacity: 125,
          drainageArea: 1.00,
          runoffCoefficient: 0.72,
          baselineRainfall: 27.0,
          baselineWaterLevel: 31,
          baselinePressure: 23.0,

          criticalThresholds: {
            waterLevelCm: 68,
            rainfallMmHr: 58,
            utilizationPct: 80,
            pressureKpa: 44
          },

          recommendedActions: {
            LOW: "Residential drainage operating normally.",
            MODERATE: "Monitor rising runoff.",
            HIGH: "Inspect residential drainage outlets.",
            CRITICAL: "Issue residential flood warning."
          }
        },

        // New Zone 5
        {
          zoneId: "VJA-05",
          name: "Ramavarappadu Junction",
          areaName: "Ramavarappadu Transport Catchment",
          center: [16.5270, 80.6840],
          polygon: [
            [16.5330, 80.6780],
            [16.5330, 80.6900],
            [16.5210, 80.6900],
            [16.5210, 80.6780]
          ],
          drainageCapacity: 155,
          drainageArea: 1.30,
          runoffCoefficient: 0.84,
          baselineRainfall: 38.0,
          baselineWaterLevel: 43,
          baselinePressure: 30.0,

          criticalThresholds: {
            waterLevelCm: 75,
            rainfallMmHr: 65,
            utilizationPct: 80,
            pressureKpa: 48
          },

          recommendedActions: {
            LOW: "Transport drainage corridors clear.",
            MODERATE: "Monitor junction runoff.",
            HIGH: "Prepare traffic diversion.",
            CRITICAL: "Close flooded transport corridor."
          }
        },

        // New Zone 6
        {
          zoneId: "VJA-06",
          name: "Moghalrajpuram Lowland",
          areaName: "Moghalrajpuram Lowland Catchment",
          center: [16.5080, 80.6310],
          polygon: [
            [16.5140, 80.6250],
            [16.5140, 80.6370],
            [16.5020, 80.6370],
            [16.5020, 80.6250]
          ],
          drainageCapacity: 90,
          drainageArea: 0.78,
          runoffCoefficient: 0.86,
          baselineRainfall: 45.0,
          baselineWaterLevel: 52,
          baselinePressure: 37.0,

          criticalThresholds: {
            waterLevelCm: 65,
            rainfallMmHr: 55,
            utilizationPct: 80,
            pressureKpa: 42
          },

          recommendedActions: {
            LOW: "Lowland drainage functioning normally.",
            MODERATE: "Water accumulation increasing.",
            HIGH: "Deploy inspection team.",
            CRITICAL: "Immediate lowland flood response."
          }
        },

        // New Zone 7
        {
          zoneId: "VJA-07",
          name: "Kanuru Urban Catchment",
          areaName: "Kanuru Stormwater Network",
          center: [16.4830, 80.6980],
          polygon: [
            [16.4890, 80.6920],
            [16.4890, 80.7040],
            [16.4770, 80.7040],
            [16.4770, 80.6920]
          ],
          drainageCapacity: 135,
          drainageArea: 1.15,
          runoffCoefficient: 0.74,
          baselineRainfall: 29.0,
          baselineWaterLevel: 33,
          baselinePressure: 24.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Urban stormwater system stable.",
            MODERATE: "Monitor lateral drains.",
            HIGH: "Clear drainage obstruction.",
            CRITICAL: "Activate flood response."
          }
        },

        // New Zone 8
        {
          zoneId: "VJA-08",
          name: "Bhavanipuram Drainage Hub",
          areaName: "Bhavanipuram Main Catchment",
          center: [16.5330, 80.6190],
          polygon: [
            [16.5390, 80.6130],
            [16.5390, 80.6250],
            [16.5270, 80.6250],
            [16.5270, 80.6130]
          ],
          drainageCapacity: 115,
          drainageArea: 0.95,
          runoffCoefficient: 0.81,
          baselineRainfall: 36.0,
          baselineWaterLevel: 41,
          baselinePressure: 29.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Main drainage hub operating normally.",
            MODERATE: "Monitor collector drain.",
            HIGH: "Prepare pump deployment.",
            CRITICAL: "Activate emergency drainage pumping."
          }
        }
      ]
    },


    // =========================================================
    // HYDERABAD
    // =========================================================

    "Hyderabad": {
      name: "Hyderabad, Telangana, India",
      center: [17.3850, 78.4867],
      zoom: 12,
      state: "Telangana",
      country: "India",
      elevationRange: "450m - 650m MSL",
      primaryMonsoon: "Southwest Monsoon",

      zones: [

        {
          zoneId: "HYD-01",
          name: "Central Hyderabad Catchment",
          areaName: "Central Urban Stormwater Basin",
          center: [17.3850, 78.4867],
          polygon: [
            [17.3910, 78.4800],
            [17.3910, 78.4930],
            [17.3790, 78.4930],
            [17.3790, 78.4800]
          ],
          drainageCapacity: 145,
          drainageArea: 1.10,
          runoffCoefficient: 0.82,
          baselineRainfall: 34.0,
          baselineWaterLevel: 38,
          baselinePressure: 27.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Central drainage network operating normally.",
            MODERATE: "Monitor major stormwater inlets.",
            HIGH: "Inspect central drainage corridors.",
            CRITICAL: "Activate central flood response."
          }
        },

        {
          zoneId: "HYD-02",
          name: "Banjara Hills Catchment",
          areaName: "Banjara Hills Urban Basin",
          center: [17.4150, 78.4480],
          polygon: [
            [17.4210, 78.4420],
            [17.4210, 78.4540],
            [17.4090, 78.4540],
            [17.4090, 78.4420]
          ],
          drainageCapacity: 125,
          drainageArea: 0.95,
          runoffCoefficient: 0.78,
          baselineRainfall: 29.0,
          baselineWaterLevel: 32,
          baselinePressure: 24.0,

          criticalThresholds: {
            waterLevelCm: 68,
            rainfallMmHr: 58,
            utilizationPct: 80,
            pressureKpa: 44
          },

          recommendedActions: {
            LOW: "Drainage network stable.",
            MODERATE: "Monitor slope runoff.",
            HIGH: "Inspect low points and storm inlets.",
            CRITICAL: "Activate local flood mitigation."
          }
        },

        {
          zoneId: "HYD-03",
          name: "Hitech City Catchment",
          areaName: "Hitech City Commercial Basin",
          center: [17.4485, 78.3830],
          polygon: [
            [17.4550, 78.3760],
            [17.4550, 78.3900],
            [17.4420, 78.3900],
            [17.4420, 78.3760]
          ],
          drainageCapacity: 175,
          drainageArea: 1.45,
          runoffCoefficient: 0.88,
          baselineRainfall: 40.0,
          baselineWaterLevel: 45,
          baselinePressure: 32.0,

          criticalThresholds: {
            waterLevelCm: 75,
            rainfallMmHr: 65,
            utilizationPct: 80,
            pressureKpa: 48
          },

          recommendedActions: {
            LOW: "Commercial drainage functioning normally.",
            MODERATE: "Monitor high-density runoff.",
            HIGH: "Prepare traffic and access warnings.",
            CRITICAL: "Activate commercial-area flood response."
          }
        },

        {
          zoneId: "HYD-04",
          name: "Secunderabad Urban Basin",
          areaName: "Secunderabad Stormwater Catchment",
          center: [17.4399, 78.4983],
          polygon: [
            [17.4460, 78.4910],
            [17.4460, 78.5050],
            [17.4340, 78.5050],
            [17.4340, 78.4910]
          ],
          drainageCapacity: 135,
          drainageArea: 1.05,
          runoffCoefficient: 0.79,
          baselineRainfall: 33.0,
          baselineWaterLevel: 37,
          baselinePressure: 26.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Urban drainage stable.",
            MODERATE: "Monitor collector drains.",
            HIGH: "Inspect major drainage junctions.",
            CRITICAL: "Activate emergency drainage response."
          }
        },

        {
          zoneId: "HYD-05",
          name: "Kukatpally Catchment",
          areaName: "Kukatpally Residential Basin",
          center: [17.4849, 78.4138],
          polygon: [
            [17.4910, 78.4070],
            [17.4910, 78.4210],
            [17.4790, 78.4210],
            [17.4790, 78.4070]
          ],
          drainageCapacity: 115,
          drainageArea: 0.92,
          runoffCoefficient: 0.76,
          baselineRainfall: 31.0,
          baselineWaterLevel: 36,
          baselinePressure: 25.0,

          criticalThresholds: {
            waterLevelCm: 68,
            rainfallMmHr: 58,
            utilizationPct: 80,
            pressureKpa: 44
          },

          recommendedActions: {
            LOW: "Residential drainage stable.",
            MODERATE: "Monitor neighborhood runoff.",
            HIGH: "Clear stormwater inlets.",
            CRITICAL: "Issue local residential flood warning."
          }
        },

        {
          zoneId: "HYD-06",
          name: "Miyapur Lowland Catchment",
          areaName: "Miyapur Stormwater Basin",
          center: [17.4969, 78.3570],
          polygon: [
            [17.5030, 78.3500],
            [17.5030, 78.3640],
            [17.4910, 78.3640],
            [17.4910, 78.3500]
          ],
          drainageCapacity: 100,
          drainageArea: 0.88,
          runoffCoefficient: 0.83,
          baselineRainfall: 38.0,
          baselineWaterLevel: 46,
          baselinePressure: 34.0,

          criticalThresholds: {
            waterLevelCm: 65,
            rainfallMmHr: 55,
            utilizationPct: 80,
            pressureKpa: 42
          },

          recommendedActions: {
            LOW: "Lowland drainage operating normally.",
            MODERATE: "Monitor water accumulation.",
            HIGH: "Prepare pumping equipment.",
            CRITICAL: "Activate lowland flood response."
          }
        },

        {
          zoneId: "HYD-07",
          name: "Uppal Catchment",
          areaName: "Uppal Urban Drainage Basin",
          center: [17.4050, 78.5590],
          polygon: [
            [17.4110, 78.5520],
            [17.4110, 78.5660],
            [17.3990, 78.5660],
            [17.3990, 78.5520]
          ],
          drainageCapacity: 130,
          drainageArea: 1.15,
          runoffCoefficient: 0.77,
          baselineRainfall: 35.0,
          baselineWaterLevel: 40,
          baselinePressure: 28.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Uppal drainage network stable.",
            MODERATE: "Monitor collector channels.",
            HIGH: "Inspect stormwater junctions.",
            CRITICAL: "Activate emergency flood response."
          }
        },

        {
          zoneId: "HYD-08",
          name: "LB Nagar Catchment",
          areaName: "LB Nagar Urban Stormwater Basin",
          center: [17.3457, 78.5522],
          polygon: [
            [17.3520, 78.5450],
            [17.3520, 78.5590],
            [17.3390, 78.5590],
            [17.3390, 78.5450]
          ],
          drainageCapacity: 120,
          drainageArea: 1.00,
          runoffCoefficient: 0.80,
          baselineRainfall: 36.0,
          baselineWaterLevel: 42,
          baselinePressure: 30.0,

          criticalThresholds: {
            waterLevelCm: 70,
            rainfallMmHr: 60,
            utilizationPct: 80,
            pressureKpa: 45
          },

          recommendedActions: {
            LOW: "Urban drainage operating normally.",
            MODERATE: "Monitor rising stormwater inflow.",
            HIGH: "Inspect drainage outlets.",
            CRITICAL: "Activate emergency pumping and traffic control."
          }
        }
      ]
    }
  }
};


// =============================================================
// GLOBAL EXPORT
// =============================================================

if (typeof window !== "undefined") {
  window.CITY_CONFIG = CITY_CONFIG;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CITY_CONFIG;
}