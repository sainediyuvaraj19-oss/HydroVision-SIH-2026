# Urban Flood Nowcasting System (Guntur, AP, India)
## Real-Time Drainage & Rainfall Coupling Model with ML Predictive Analytics

A modern, production-grade web application for monitoring urban drainage conduits and predicting flood risk across geographical drainage zones using real-time sensor coupling.

---

## 🌟 Key Features

1. **Actual Interactive GIS Map (Leaflet.js + OpenStreetMap)**
   - Centered on **Guntur, Andhra Pradesh, India** (`[16.3067, 80.4365]`).
   - 7 Realistic urban catchments (Arundelpet, Brodipet, Kothapet, Old Guntur, Nagarampalem, Autonagar, Pattabhipuram).
   - Dynamic polygon and pulsing marker coloring:
     - 🟢 **Green** = Low Risk (0–30)
     - 🟡 **Yellow** = Moderate Risk (31–50)
     - 🟠 **Orange** = High Risk (51–75)
     - 🔴 **Red** = Critical Flood Risk (76–100)
   - Rich interactive diagnostic popups.

2. **Coupled Hydrological Calculation Engine**
   - **Runoff Estimation**: $\text{Runoff } (L/s) = \text{Rainfall } (mm/hr) \times C \times \text{Area } (km^2) \times \text{Scale}$
   - **Drainage Utilization**: $\text{Drainage Utilization } (\%) = \frac{\text{Estimated Incoming Water Flow}}{\text{Drainage Capacity}} \times 100$
   - **Multi-sensor Risk Weighting**:
     - Rainfall Intensity: 30%
     - Canal Water Level: 30%
     - Drainage Utilization: 25%
     - Conduit Backpressure: 15%
   - Transparent step-by-step calculation breakdown modal.

3. **Machine Learning Component (`POST /api/predict`)**
   - Python backend service (`server.py`) providing ML inference.
   - Supervised ensemble architecture (Logistic Regression + Random Forest classifier).
   - Client-side browser fallback when running standalone without Python.

4. **Time-Series Sensor Trend Graphs (Chart.js)**
   - Rainfall Intensity Graph ($mm/hr$ over time)
   - Canal Water Level Graph ($cm$ over time)
   - Conduit Backpressure Graph ($kPa$ over time)
   - **Inflow vs Drainage Capacity Graph**: Visually demonstrates when incoming water approaches or exceeds conduit capacity.

5. **Dynamic Safe Route Planner**
   - Identifies flooded or critical-hazard corridors.
   - Dynamically re-routes vehicles/citizens through safe zones around hazard areas.

6. **Simulate Drain Blockage Control**
   - Halves effective conduit capacity (simulating silt/trash clogging).
   - Surges utilization, escalates risk, and triggers critical alerts.

7. **4-Stage Hackathon Demo Mode**
   - **Stage 1**: Low rainfall $\rightarrow$ Low risk
   - **Stage 2**: Increasing rainfall $\rightarrow$ Moderate risk
   - **Stage 3**: Heavy cloudburst $\rightarrow$ High risk
   - **Stage 4**: High rainfall + high water + drain blockage $\rightarrow$ Critical risk

---

## 1. How to Run It

### Option A: Complete Python Backend + REST API (Recommended)
1. Open PowerShell or Command Prompt.
2. Navigate to the project directory:
   ```bash
   cd C:\Users\megha\.gemini\antigravity\scratch\urban-flood-nowcasting
   ```
3. Start the Python server:
   ```bash
   python server.py
   ```
4. Open your browser and visit:
   ```
   http://localhost:8000
   ```
   *The server hosts the frontend and the REST API (`POST /api/predict`, `GET /api/zones`, `POST /api/blockage`, etc.).*

### Option B: Standalone Browser (Zero Installation)
Simply double-click `index.html` or open it in any modern browser (Chrome, Edge, Firefox). The embedded client-side Hydro-ML inference engine ensures all features, calculations, and simulations work out-of-the-box!

---

## 2. How to Change Sensor Values

The application offers two seamless methods:

### Method 1: Interactive Manual Overrides & Sliders (Dashboard)
Under **"Manual Sensor Controls & Dynamic Override"**, adjust any slider or number box:
- **Rainfall Intensity Slider**: `0` to `150 mm/hr`
- **Water Level Slider**: `0` to `120 cm`
- **Drainage Pressure Slider**: `0` to `80 kPa`
- **Drainage Capacity Slider**: `20` to `250 L/s`

*As soon as you slide or type a number, the Runoff, Drainage Utilization, Flood Risk Score, Risk Category, Map Polygon Color, and Graphs update automatically.*

### Method 2: One-Click Simulated Fluctuation
Click the **"Simulate Sensor Update"** button in the top bar to inject realistic atmospheric and hydraulic oscillations across all 7 zones.

### Method 3: Via Python REST API
Send a `POST` request to `/api/update-sensor`:
```json
POST http://localhost:8000/api/update-sensor
Content-Type: application/json

{
  "zoneId": "ZONE-01",
  "rainfallIntensity": 72,
  "waterLevel": 68,
  "pressure": 42,
  "drainageCapacity": 100
}
```

---

## 3. How the Flood-Risk Calculation Works

The system implements a transparent mathematical model inside [`calculationEngine.js`](file:///C:/Users/megha/.gemini/antigravity/scratch/urban-flood-nowcasting/calculationEngine.js):

### Step 1: Runoff Estimation
$$\text{Estimated Runoff } (L/s) = \text{Rainfall } (mm/hr) \times C \times \text{Drainage Area } (km^2) \times 1.423$$
- $C$ = Runoff coefficient (e.g. `0.80` for impervious urban asphalt).
- $\text{Area}$ = Catchment area (e.g. `0.85` $km^2$ for Arundelpet).

### Step 2: Drainage Utilization
$$\text{Drainage Utilization } (\%) = \left(\frac{\text{Estimated Incoming Inflow } (L/s)}{\text{Effective Drainage Capacity } (L/s)}\right) \times 100$$

### Step 3: Normalization (0 to 100 scale)
- $\text{RainNorm} = \min\left(100, \frac{\text{Rainfall}}{120} \times 100\right)$
- $\text{WaterNorm} = \min\left(100, \frac{\text{Water Level}}{100} \times 100\right)$
- $\text{UtilNorm} = \min\left(100, \text{Drainage Utilization}\right)$
- $\text{PressureNorm} = \min\left(100, \frac{\text{Pressure}}{70} \times 100\right)$

### Step 4: Multi-Criteria Weighted Score (0 to 100)
$$\text{Risk Score} = 0.30 \times \text{RainNorm} + 0.30 \times \text{WaterNorm} + 0.25 \times \text{UtilNorm} + 0.15 \times \text{PressureNorm}$$

### Step 5: Risk Classification
- `0 – 30`: **LOW RISK** (🟢 Green)
- `31 – 50`: **MODERATE RISK** (🟡 Yellow)
- `51 – 75`: **HIGH RISK** (🟠 Orange)
- `76 – 100`: **CRITICAL FLOOD RISK** (🔴 Red)

*Click the **"View Calculation Breakdown"** button in the dashboard to inspect the live formula table.*

---

## 4. Where the ML Model Will Be Connected

The system has a decoupled prediction architecture:

1. **Python Backend Service**: [`server.py`](file:///C:/Users/megha/.gemini/antigravity/scratch/urban-flood-nowcasting/server.py#L30-L75)
   - To plug in a trained scikit-learn or XGBoost model:
     ```python
     import joblib
     class MLFloodPredictor:
         def __init__(self):
             self.model = joblib.load("models/guntur_flood_model.pkl")

         def predict(self, rainfall, water_level, pressure, capacity):
             features = [[rainfall, water_level, pressure, capacity]]
             risk_score = self.model.predict(features)[0]
             probability = self.model.predict_proba(features)[0][1] * 100
             return { "riskScore": risk_score, "predictedFloodProbability": probability }
     ```

2. **Frontend ML Client**: [`mlPrediction.js`](file:///C:/Users/megha/.gemini/antigravity/scratch/urban-flood-nowcasting/mlPrediction.js#L20-L50)
   - Calls `POST /api/predict` via asynchronous `fetch()`. If the backend is offline, it automatically runs the calibrated in-browser inference model.

---

## 5. Where Real Sensor / API / MQTT Data Can Later Be Connected

To connect physical IoT sensors (e.g. ESP32, LoRaWAN, ultrasonic HC-SR04 water depth sensor, MPX5700DP pressure sensor, tipping bucket rain gauge):

1. **Via MQTT Ingestion**:
   In `server.py`, install `paho-mqtt` and subscribe to your broker:
   ```python
   import paho.mqtt.client as mqtt

   def on_message(client, userdata, msg):
       telemetry = json.loads(msg.payload.decode())
       # telemetry: { "zoneId": "ZONE-01", "rainfallIntensity": 45, "waterLevel": 38, "pressure": 28 }
       update_zone_sensor(telemetry)

   client = mqtt.Client()
   client.connect("mqtt.smartcity.gov.in", 1883)
   client.subscribe("guntur/sensors/+/telemetry")
   client.loop_start()
   ```

2. **Via Frontend Polling / WebSockets**:
   In [`app.js`](file:///C:/Users/megha/.gemini/antigravity/scratch/urban-flood-nowcasting/app.js), configure the auto-telemetry polling hook to call your municipal REST API endpoint:
   ```javascript
   setInterval(async () => {
     const response = await fetch("https://api.guntur.gov.in/smart-drainage/live");
     const livePackets = await response.json();
     livePackets.forEach(pkt => app.updateZoneData(pkt.zoneId, pkt));
   }, 5000);
   ```

---

## 6. How to Add More Geographical Zones

To add a new monitoring zone:
1. Open [`cityConfig.js`](file:///C:/Users/megha/.gemini/antigravity/scratch/urban-flood-nowcasting/cityConfig.js).
2. Inside `cities.Guntur.zones`, add a new zone object:
   ```javascript
   {
     zoneId: "ZONE-08",
     name: "Gujaanagundla Lake Inundation Basin",
     areaName: "Gujaanagundla Sump Catchment",
     center: [16.2950, 80.4280],
     polygon: [
       [16.2980, 80.4240],
       [16.2990, 80.4320],
       [16.2910, 80.4330],
       [16.2900, 80.4250]
     ],
     drainageCapacity: 115, // L/s
     drainageArea: 0.95,    // sq km
     runoffCoefficient: 0.72,
     baselineRainfall: 25.0,
     baselineWaterLevel: 30,
     baselinePressure: 22.0
   }
   ```
3. Save the file. The map polygon, selector dropdown, statistics cards, and charts will immediately include `ZONE-08`.

---

## 7. How to Replace the Sample Guntur Map Data with Another City

The application features a modular multi-city configuration system:

### Method 1: Switch via the UI
Navigate to the **Settings** tab in the sidebar, and select another city from the **"Select Active Urban Area"** dropdown (e.g. Vijayawada, Hyderabad). The map, coordinates, and catchments relocate instantly.

### Method 2: Configure a New City in Code
1. Open [`cityConfig.js`](file:///C:/Users/megha/.gemini/antigravity/scratch/urban-flood-nowcasting/cityConfig.js).
2. Set `activeCityKey: "Mumbai"` (or your preferred city).
3. Add a new city entry:
   ```javascript
   "Mumbai": {
     name: "Mumbai, Maharashtra, India",
     center: [19.0760, 72.8777],
     zoom: 13,
     zones: [
       {
         zoneId: "MUM-01",
         name: "Mithi River Catchment - Kurla",
         center: [19.0680, 72.8820],
         polygon: [[19.075, 72.875], [19.076, 72.889], [19.062, 72.890], [19.061, 72.876]],
         drainageCapacity: 250,
         drainageArea: 2.4,
         runoffCoefficient: 0.90
       }
     ]
   }
   ```
4. Reload the page. The map automatically centers on your new city with its corresponding drainage zones!
