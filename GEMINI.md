# Master Project Specification: LifeCorridor

> **Event:** Google Cloud AI Builder Cup 2026 (JAPAC)  
> **Track:** Sustainability & Social Impact (Emergency Preparedness & Resilient Mobility)  
> **Author:** Hari Dhoni ([@haridhoni7](https://github.com/haridhoni7))  
> **Repository:** [https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari](https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari)  
> **Evaluation Focus:** Technical Merit (40%), Problem Alignment (25%), Innovation (25%), UX (10%)  

---

## 1. Executive Summary & Problem Statement

In high-density Asian megacities (e.g., Bengaluru, Jakarta, Manila), critical emergency ambulances lose up to **60% of their "Golden Hour" transit time** stuck in traffic gridlock. Commuters inside modern, air-conditioned, soundproofed cabins cannot hear external sirens until the emergency vehicle is 15 meters directly behind them. In bumper-to-bumper standstill traffic, cars are mechanically locked with zero turning angle to maneuver aside.

**LifeCorridor** is an architectural protocol enhancement for Google Maps that creates an autonomous, moving 500-meter "zipper corridor" ahead of approaching emergency vehicles without requiring municipal smart-city roadside hardware or third-party citizen app downloads.

---

## 2. Mandatory Tech Stack (Google Cloud Evaluation Criteria)

1. **Gemini 2.0 Flash / Gemini 3.8 Flash (`@google/genai` SDK):**
   - Multimodal dispatch verification and anti-spoofing engine.
   - Validates hospital CAD (Computer-Aided Dispatch) text and acoustic siren harmonic spectra (Wail, Yelp, Hi-Lo) to authorize corridor broadcasts.
   - Generates contextual, natural-language voice instructions synthesized for commuter HUDs.

2. **Google Cloud Run:**
   - Serverless Python FastAPI / Node microservice backend.
   - Calculates real-time 3-Zone Shockwave corridors and sub-second spatial containment along the route polyline.

3. **Google Cloud Firestore:**
   - Real-time distributed document database synchronizing active emergency transit states, vehicle geohashes, and commuter notification events.

4. **Firebase Hosting & Realtime Listeners:**
   - Edge CDN deployment for the Progressive Web App dual-view navigation HUD.
   - Delivers sub-second alert updates directly to civilian navigation interfaces.

---

## 3. Core Engineering Logic: The 3-Zone Phased Shockwave Protocol

When traffic drops to standstill speeds (< 15 km/h), clearing from the back fails due to hydraulic gridlock rigidity. LifeCorridor deploys a dynamic 3-Zone Shockwave Protocol:

### Zone 1: Contact (0 to 500m) — `MERGE_LEFT_NOW`
- **HUD Visual:** High-contrast pulsing Red (`#ef4444` / `#450a0a`).
- **Audio Voice Directive:** *"Emergency ambulance approaching 400 meters behind in your lane. Merge left immediately to open center zipper corridor."*
- **Action:** Drivers in the right lane hug the divider; center/left drivers shift left.

### Zone 2: Elastic Cushion (500m to 3,000m) — `MAINTAIN_2M_GAP`
- **HUD Visual:** High-contrast Amber (`#f59e0b` / `#451a03`).
- **Audio Voice Directive:** *"Ambulance in corridor behind. Stop bumper-to-bumper tailgating. Leave a 2-meter gap and pre-angle wheels 30° left."*
- **Action:** Preserves mechanical turning radius so vehicles can easily part when Zone 1 arrives.

### Zone 3: Bottleneck Flushing (3,000m to 10,000m) — `FLUSH_FORWARD`
- **HUD Visual:** Advisory Yellow (`#eab308` / `#422006`).
- **Audio Voice Directive:** *"Corridor clearing advisory: Lead junction ahead, advance briskly through green signal without stopping."*
- **Action:** Decompresses the head of the queue, pulling the "cork from the bottle".

### Zone Clear (> 10,000m) — `NORMAL_NAVIGATION`
- **HUD Visual:** Calm Green (`#10b981` / `#064e3b`).
- **Action:** Standard navigation without interruption.

### Macro-Inflow Starvation:
- Google Maps routing adds dynamic cost penalties to the active emergency corridor, rerouting civilian vehicles 3–5 km away onto parallel arterial roads before they feed the jam.

---

## 4. Key Engineering Solves & Defenses

1. **Anti-Spoofing & Zero-Trust Verification:**
   - Tier 1: Registered hospital/108 fleet ID profile verification.
   - Tier 2: Cryptographically signed single-use CAD dispatch token.
   - Tier 3: Gemini Audio verification of 3-second acoustic siren harmonics against vehicle motion telemetry.

2. **Directional Spatial Filtering ($\pm 30^\circ$ Alignment):**
   - Compares vehicle bearing angles with ambulance trajectory via Google Maps Roads API (Snap to Roads).
   - Eliminates false alarms on flyovers, underpasses, service roads, and opposing traffic lanes.

3. **Passive In-Vehicle Commuter Wake-up:**
   - Android Activity Recognition (`IN_VEHICLE == TRUE`) wakes background listeners.
   - Android Audio Focus (`AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK`) temporarily ducks Spotify/radio music over car Bluetooth to speak the emergency alert.
   - High-Priority Firebase Cloud Messaging (FCM) activates Full-Screen Intent HUD on locked device mounts.

4. **Hospital Trauma Bay Handshake:**
   - Receiving emergency department at destination hospital receives real-time dynamic ETA, paramedic case notes parsed by Gemini, and 5-minute pre-arrival readiness checklists.

---

## 5. Repository File Map

```text
lifecorridor/
├── GEMINI.md                    # Antigravity master project specification
├── README.md                    # Public GitHub documentation with architecture & setup
├── server.ts                    # Full-stack Node/Express server with Gemini AI SDK
├── backend/
│   ├── main.py                  # Python FastAPI Cloud Run server with Gemini & 3-Zone logic
│   ├── requirements.txt         # fastapi, uvicorn, google-genai, pydantic, firestore
│   └── Dockerfile               # Cloud Run container specification
└── frontend/
    └── public/
        └── index.html           # Standalone Leaflet split-screen simulation
```
