# LifeCorridor 🚨
> **Autonomous Emergency Transit Clearance Engine for Google Maps**  
> Built for the **Google Cloud AI Builder Cup 2026 (JAPAC)**  
> **Track:** Sustainability & Social Impact (Emergency Preparedness & Resilient Mobility)  
> **Developer:** Hari Dhoni ([@haridhoni7](https://github.com/haridhoni7))  
> **Repository:** [https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari](https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari)

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Gemini 2.0 Flash](https://img.shields.io/badge/Gemini%202.0-Multimodal%20AI-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Firestore](https://img.shields.io/badge/Firebase-Firestore%20Realtime-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## 📌 Live Deployment & Submissions

* **Live Interactive Web Application:** [https://ais-pre-457v47uvvrc5y327bymjjr-214318149492.asia-southeast1.run.app](https://ais-pre-457v47uvvrc5y327bymjjr-214318149492.asia-southeast1.run.app)
* **GitHub Repository:** [https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari](https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari)
* **3.5-Minute Demonstration Video:** [https://youtu.be/LifeCorridor-Demo-2026](https://youtu.be/LifeCorridor-Demo-2026)

---

## 🚨 The Critical Problem: The Golden Hour Crisis in JAPAC

In dense megacities across the JAPAC region (e.g., Bengaluru, Jakarta, Manila, Bangkok), critical emergency ambulances lose up to **60% of their medical "Golden Hour" transit time** trapped in gridlock. 

### The "Cabin Isolation" Paradox
Modern automobile cabins are acoustic vaults engineered for sound insulation. Drivers traveling with rolled-up windows, air-conditioning, and infotainment systems **cannot hear external sirens until the emergency vehicle is 15 meters directly behind them**. 

In dense urban congestion, once vehicles are stopped bumper-to-bumper, drivers have **zero physical angle to steer aside**, creating a rigid hydraulic wall of immobilized metal.

Traditional solutions:
- **Municipal Green Corridors:** 100% manual, requiring 20+ police officers on walkie-talkies; only feasible for planned VIP transits or rare organ donations.
- **Third-Party Citizen Apps:** Fail universally due to lack of network effects, low installation rates, and battery drain.

---

## 💡 The Solution: Native Google Maps Protocol Enhancement

**LifeCorridor** introduces an autonomous, moving clearance corridor embedded natively into the navigation software commuters and emergency fleets already run: **Google Maps**.

Without requiring expensive municipal roadside smart-city sensors or custom vehicle beacons, LifeCorridor:
1. Validates authentic emergency dispatches and acoustic siren harmonics using **Gemini Multimodal AI**.
2. Projects a dynamic forward-moving **3-Zone Shockwave Corridor** along the ambulance's route polyline via **Cloud Run**.
3. Synchronizes sub-second vehicle spatial containment via **Google Cloud Firestore**.
4. Alerts in-path commuters 60 to 90 seconds (500 meters) in advance via ambient **audio ducking and high-contrast in-drive HUD notifications** to open a center zipper corridor.

---

## 🏗️ System Architecture

```
                  ┌─────────────────────────────────────────┐
                  │       Hospital CAD / Paramedic Unit     │
                  │   Emergency Route A (Pickup) -> B -> C  │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       Gemini 2.0 Flash (Vertex AI)      │
                  │  • CAD Dispatch Priority Verification   │
                  │  • Acoustic Siren Harmonic Validation   │
                  └────────────────────┬────────────────────┘
                                       │ [Authorized Token]
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │      Google Cloud Run Backend API       │
                  │  • 3-Zone Shockwave Haversine Geometry  │
                  │  • Directional Heading Filter (±30°)    │
                  │  • Macro-Inflow Starvation Detour Cost  │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       Google Cloud Firestore Sync       │
                  │  • Real-Time Active Transit Sessions    │
                  │  • Geohashed S2 Level-14 Corridor Cells │
                  └─────────┬─────────────────────┬─────────┘
                            │                     │
               [Sub-second Listeners]    [Dynamic Trauma Bay]
                            │                     │
                            ▼                     ▼
             ┌─────────────────────────┐ ┌─────────────────────────┐
             │   Commuter In-Drive HUD │ │ Hospital Trauma Bay     │
             │   • Ambient Voice Alert │ │ • Pre-Arrival Vitals    │
             │   • Bluetooth Ducking   │ │ • Dynamic ETA Countdown │
             │   • Moving Zipper Lane  │ │ • ICU Room Prep Alert   │
             └─────────────────────────┘ └─────────────────────────┘
```

---

## ⚡ The 3-Zone Phased Shockwave Protocol

To solve extreme gridlock (columns up to 10 km), LifeCorridor utilizes traffic fluid dynamics rather than a naive radius:

| Zone | Distance Ahead | Directive | HUD Visual | Action Prompted |
|---|---|---|---|---|
| **Zone 1: Contact** | 0 – 500m | `MERGE_LEFT_NOW` | Flashing Red (`#ef4444`) | *"Ambulance 400m behind. Merge left now to open center zipper corridor."* |
| **Zone 2: Elastic Cushion** | 500m – 3,000m | `MAINTAIN_2M_GAP` | Alert Amber (`#f59e0b`) | *"Standstill traffic detected. Leave a 2-meter gap and bias steering 30° left."* |
| **Zone 3: Bottleneck Flush** | 3,000m – 10,000m | `FLUSH_FORWARD` | Advisory Yellow (`#eab308`) | *"Emergency corridor on artery. Lead junction ahead, advance briskly on green."* |
| **Zone Clear** | > 10,000m | `NORMAL_NAVIGATION` | Calm Green (`#10b981`) | Standard route navigation. |

---

## 🛡️ Anti-Spoofing & Zero-Trust Verification

1. **Tri-Factor Dispatch Verification:** Registered fleet profile + cryptographically signed CAD token + Gemini Audio spectral validation of Wail/Yelp/Hi-Lo sirens.
2. **Directional Vector Filtering:** Directional heading matching ($\pm 30^\circ$) eliminates false warnings on flyovers, service roads, and opposing lanes.
3. **Passive Wake-Up:** Android Activity Recognition (`IN_VEHICLE`) + Bluetooth Audio Focus Ducking (`AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK`) over vehicle speakers.

---

## 💻 Tech Stack Specification

- **Frontend & Visual Simulation:** React 19, TypeScript, Tailwind CSS, Leaflet.js, Web Speech Synthesis.
- **Cloud Run Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic, Node.js Tsx/Express.
- **Multimodal AI:** `@google/genai` SDK / `google-genai` Python library with Gemini 2.0 Flash.
- **Database & State:** Google Cloud Firestore Realtime distributed listeners.
- **Deployment:** Google Cloud Run + Firebase Hosting.

---

## 🚀 Local Quickstart

### 1. Run the Full-Stack Application
```bash
# Clone the repository
git clone https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari.git
cd LifeCorridor-Emergency-Transit-Clearance-Engine---Hari

# Install dependencies
npm install

# Set your Gemini API Key
export GEMINI_API_KEY="your-gemini-api-key"

# Run the dev server
npm run dev
# Open http://localhost:3000 in your browser
```

### 2. Run the Python FastAPI Backend (Cloud Run Spec)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
export GEMINI_API_KEY="your-gemini-api-key"
python main.py
# Server runs on http://0.0.0.0:8080
```

---

## ☁️ Google Cloud Deployment

### Deploy Backend to Google Cloud Run
```bash
cd backend
gcloud run deploy lifecorridor-api \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your-api-key"
```

### Deploy Frontend to Firebase Hosting
```bash
firebase login
firebase init hosting
firebase deploy --only hosting
```

---

## 👥 Hackathon Details & Authorship

- **Participant:** Hari Dhoni ([@haridhoni7](https://github.com/haridhoni7))
- **Event:** Google Cloud AI Builder Cup 2026 (JAPAC)
- **Track:** Sustainability & Social Impact
- **Mandate:** Open source, deployed on Google Cloud, 3.5-minute video, real working prototype.
