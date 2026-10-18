import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, execSync } from 'child_process';
import util from 'util';
import { GoogleGenAI, Type } from '@google/genai';

const execPromise = util.promisify(exec);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Haversine distance calculator in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const phi1 = lat1 * (Math.PI / 180);
  const phi2 = lat2 * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'LifeCorridor Cloud Run Core & AI Studio Hub',
    geminiActive: !!ai,
    track: 'Sustainability & Social Impact',
    hackathon: 'Google Cloud AI Builder Cup 2026 (JAPAC)',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    mapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyABub3BATNUpYZHu2Z30JXTYCAp4rA1yvs',
  });
});

// IP Geolocation fallback for iframe sandboxes
app.get('/api/my-location', async (req, res) => {
  try {
    const rawForwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof rawForwarded === 'string'
      ? rawForwarded.split(',')[0].trim()
      : Array.isArray(rawForwarded)
      ? rawForwarded[0].trim()
      : '';

    const queryUrl = clientIp && !clientIp.startsWith('10.') && !clientIp.startsWith('192.168.') && !clientIp.startsWith('127.')
      ? `https://ipwho.is/${clientIp}`
      : 'https://ipwho.is/';

    const response = await fetch(queryUrl, { signal: AbortSignal.timeout(4000) });
    const data: any = await response.json();

    if (data && data.success !== false && data.latitude && data.longitude) {
      return res.json({
        success: true,
        source: 'ip_geolocation',
        city: data.city || 'Your City',
        region: data.region || '',
        country: data.country || 'Global',
        lat: Number(data.latitude),
        lng: Number(data.longitude),
      });
    }

    return res.json({
      success: true,
      source: 'fallback',
      city: 'Bengaluru (MG Road Corridor)',
      region: 'Karnataka',
      country: 'India',
      lat: 12.9716,
      lng: 77.5946,
    });
  } catch (err: any) {
    return res.json({
      success: true,
      source: 'fallback',
      city: 'Singapore Downtown',
      region: 'Singapore',
      country: 'Singapore',
      lat: 1.3521,
      lng: 103.8198,
    });
  }
});

// Free Geocoding API via Photon / OSM for any address/city in the world
app.get('/api/geocode', async (req, res) => {
  const query = req.query.q as string;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required.' });
  }

  const cleanQ = query.trim().toLowerCase();

  // Instant preset lookup for common emergency destinations
  if (cleanQ.includes('manipal')) {
    return res.json({
      success: true,
      lat: 12.9580,
      lng: 77.6585,
      displayName: 'Manipal Hospital, Old Airport Road, Bengaluru',
    });
  }
  if (cleanQ.includes('indiranagar')) {
    return res.json({
      success: true,
      lat: 12.9719,
      lng: 77.6412,
      displayName: 'Indiranagar 100ft Road, Bengaluru',
    });
  }
  if (cleanQ.includes('domlur')) {
    return res.json({
      success: true,
      lat: 12.9598,
      lng: 77.6430,
      displayName: 'Domlur Flyover Ramp, Bengaluru',
    });
  }
  if (cleanQ.includes('mg road')) {
    return res.json({
      success: true,
      lat: 12.9756,
      lng: 77.6066,
      displayName: 'MG Road Metro, Bengaluru',
    });
  }
  if (cleanQ.includes('command hospital')) {
    return res.json({
      success: true,
      lat: 12.9634,
      lng: 77.6358,
      displayName: 'Command Hospital Air Force, Bengaluru',
    });
  }
  if (cleanQ.includes('lilavati')) {
    return res.json({
      success: true,
      lat: 19.0514,
      lng: 72.8295,
      displayName: 'Lilavati Hospital & Research Centre, Mumbai',
    });
  }
  if (cleanQ.includes('singapore general') || cleanQ.includes('sgh')) {
    return res.json({
      success: true,
      lat: 1.2795,
      lng: 103.8344,
      displayName: 'Singapore General Hospital, Outram Road, Singapore',
    });
  }

  try {
    // 1. Try Photon with raw query
    let response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=5`, {
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent': 'LifeCorridor-Simulation-App/1.0',
      },
    });

    let data: any = await response.json();

    // 2. If no features, try simplified query (strip specialized clinic/room jargon)
    if (!data || !data.features || data.features.length === 0) {
      const simplified = query.replace(/level-?\d+|trauma\s+bay|emergency\s+bay|gate\s+\d+|unit\s+\d+/gi, '').trim();
      if (simplified && simplified !== query.trim()) {
        response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(simplified)}&limit=5`, {
          signal: AbortSignal.timeout(4500),
          headers: {
            'User-Agent': 'LifeCorridor-Simulation-App/1.0',
          },
        });
        data = await response.json();
      }
    }

    if (data && data.features && data.features.length > 0) {
      const best = data.features[0];
      const [lng, lat] = best.geometry.coordinates;
      const props = best.properties;
      const label = [props.name, props.city, props.state, props.country].filter(Boolean).join(', ');

      return res.json({
        success: true,
        lat,
        lng,
        displayName: label || props.name || query,
      });
    }

    // 3. Fallback to Google Places API (New) Text Search if API key is present
    const gmpKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyABub3BATNUpYZHu2Z30JXTYCAp4rA1yvs';
    if (gmpKey) {
      const gmpRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': gmpKey,
          'X-Goog-FieldMask': 'places.location,places.displayName,places.formattedAddress',
        },
        body: JSON.stringify({ textQuery: query.trim() }),
        signal: AbortSignal.timeout(4500),
      });

      if (gmpRes.ok) {
        const gmpData: any = await gmpRes.json();
        if (gmpData && gmpData.places && gmpData.places.length > 0) {
          const place = gmpData.places[0];
          if (place.location) {
            return res.json({
              success: true,
              lat: place.location.latitude,
              lng: place.location.longitude,
              displayName: place.displayName?.text || place.formattedAddress || query,
            });
          }
        }
      }
    }

    return res.status(404).json({ error: 'Location not found. Try entering a city name or landmark.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Geocoding service unavailable: ' + err.message });
  }
});

// Google Maps Places Autocomplete endpoint (with Places API (New) & Geocoding fallbacks)
app.get('/api/places-autocomplete', async (req, res) => {
  const input = ((req.query.input as string) || '').trim();
  if (!input) {
    return res.json({ suggestions: [] });
  }

  const gmpKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    'AIzaSyABub3BATNUpYZHu2Z30JXTYCAp4rA1yvs';

  // 1. Try Google Places API (New) Autocomplete
  if (gmpKey) {
    try {
      const gmpRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': gmpKey,
          'X-Goog-FieldMask':
            'suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.placeId',
        },
        body: JSON.stringify({
          input,
        }),
        signal: AbortSignal.timeout(4500),
      });

      if (gmpRes.ok) {
        const data: any = await gmpRes.json();
        if (data.suggestions && data.suggestions.length > 0) {
          const suggestions = data.suggestions
            .filter((s: any) => s.placePrediction)
            .map((s: any) => {
              const p = s.placePrediction;
              return {
                id: p.placeId || Math.random().toString(),
                text: p.text?.text || p.structuredFormat?.mainText?.text || input,
                mainText: p.structuredFormat?.mainText?.text || p.text?.text || input,
                secondaryText: p.structuredFormat?.secondaryText?.text || '',
                placeId: p.placeId,
              };
            });
          return res.json({ suggestions, source: 'google_places_new' });
        }
      }
    } catch (e: any) {
      console.warn('Google Places API autocomplete error, falling back:', e.message);
    }
  }

  // 2. Fallback to Photon / OpenStreetMap Search for suggestions
  try {
    const fallbackRes = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=6`,
      {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'LifeCorridor-Simulation/1.0' },
      }
    );
    if (fallbackRes.ok) {
      const data: any = await fallbackRes.json();
      if (data.features && data.features.length > 0) {
        const suggestions = data.features.map((f: any, idx: number) => {
          const p = f.properties;
          const main = p.name || input;
          const secondary = [p.city, p.state, p.country].filter(Boolean).join(', ');
          const full = [p.name, p.city, p.state, p.country].filter(Boolean).join(', ');
          return {
            id: `photon-${idx}-${p.osm_id || Math.random()}`,
            text: full || main,
            mainText: main,
            secondaryText: secondary,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          };
        });
        return res.json({ suggestions, source: 'photon_osm' });
      }
    }
  } catch (err: any) {
    console.warn('Photon fallback error:', err.message);
  }

  return res.json({ suggestions: [] });
});

// Resolve Place details (lat/lng) from Google Maps Place ID or address query
app.get('/api/place-details', async (req, res) => {
  const placeId = req.query.placeId as string;
  const address = req.query.address as string;
  const gmpKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    'AIzaSyABub3BATNUpYZHu2Z30JXTYCAp4rA1yvs';

  if (placeId && gmpKey) {
    try {
      const resp = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          headers: {
            'X-Goog-Api-Key': gmpKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
          },
          signal: AbortSignal.timeout(4000),
        }
      );
      if (resp.ok) {
        const d: any = await resp.json();
        if (d.location) {
          return res.json({
            success: true,
            lat: d.location.latitude,
            lng: d.location.longitude,
            displayName: d.displayName?.text || d.formattedAddress || address,
            address: d.formattedAddress || '',
          });
        }
      }
    } catch (e: any) {
      console.warn('Place details fetch failed:', e.message);
    }
  }

  // Fallback to geocode endpoint
  if (address) {
    try {
      const geoRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(address.trim())}&limit=1`
      );
      const data: any = await geoRes.json();
      if (data && data.features && data.features.length > 0) {
        const best = data.features[0];
        const [lng, lat] = best.geometry.coordinates;
        const props = best.properties;
        const label = [props.name, props.city, props.state, props.country]
          .filter(Boolean)
          .join(', ');
        return res.json({
          success: true,
          lat,
          lng,
          displayName: label || props.name || address,
        });
      }
    } catch (e: any) {
      console.warn('Photon details fallback failed:', e.message);
    }
  }

  return res.status(404).json({ error: 'Could not resolve place coordinates' });
});

// Download full repository zip archive
app.get('/api/download-zip', (req, res) => {
  try {
    const pythonScript = `import zipfile, os
exclude_dirs = {'node_modules', '.git', '.playwright-cli', 'dist', '.aistudio'}
with zipfile.ZipFile('lifecorridor-source.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for f in files:
            if f.endswith('.zip') or f.endswith('.log') or f.endswith('.png'):
                continue
            path = os.path.join(root, f)
            arcname = os.path.relpath(path, '.')
            zipf.write(path, arcname)
`;
    execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`);
    const zipPath = path.join(__dirname, 'lifecorridor-source.zip');
    res.download(zipPath, 'lifecorridor-source.zip');
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create zip: ' + err.message });
  }
});

// Push directly to GitHub if user provides a Personal Access Token
app.post('/api/push-github', async (req, res) => {
  const { githubUsername = 'haridhoni7', repoName = 'LifeCorridor-Emergency-Transit-Clearance-Engine---Hari', token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'GitHub Personal Access Token is required to push.' });
  }

  try {
    const safeUser = String(githubUsername).trim();
    const safeRepo = String(repoName).trim();
    const safeToken = String(token).trim();

    // Check if repo exists on GitHub
    const checkRes = await fetch(`https://api.github.com/repos/${safeUser}/${safeRepo}`, {
      headers: {
        Authorization: `Bearer ${safeToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'lifecorridor-push-agent',
      },
    });

    if (checkRes.status === 404) {
      return res.status(400).json({
        error: `Repository '${safeRepo}' was not found under GitHub account '${safeUser}'. Please create it first at https://github.com/new?name=${safeRepo} and make it Public.`,
      });
    }

    // Git setup and commit
    await execPromise('git config user.name "' + safeUser + '"');
    await execPromise('git config user.email "' + safeUser + '@users.noreply.github.com"');
    await execPromise('git init');
    await execPromise('git add .');
    await execPromise('git commit -m "feat: complete LifeCorridor prototype for Google Cloud AI Builder Cup 2026" || true');
    await execPromise('git branch -M main');

    // Remote push
    const remoteUrl = `https://${safeToken}@github.com/${safeUser}/${safeRepo}.git`;
    await execPromise('git remote remove origin || true');
    await execPromise(`git remote add origin "${remoteUrl}"`);
    await execPromise('git push -u origin main --force');

    return res.json({
      success: true,
      repoUrl: `https://github.com/${safeUser}/${safeRepo}`,
      message: `Successfully pushed all files to https://github.com/${safeUser}/${safeRepo}!`,
    });
  } catch (err: any) {
    console.error('Git push failed:', err);
    return res.status(500).json({
      error: 'Git push failed: ' + (err.stderr || err.message),
    });
  }
});

// Sample CAD dispatches for instant simulation
app.get('/api/sample-dispatches', (req, res) => {
  res.json({
    dispatches: [
      {
        id: 'CAD-BLR-8921',
        hospital: 'Manipal Hospital, Old Airport Rd',
        hospitalId: 'HOSP-BLR-04',
        ambulanceId: 'BLR-108-ALPHA',
        text: 'Priority Code Red: Male, 47, sudden cardiac collapse at Indiranagar 100ft Rd. In-transit CPR administered. Immediate Cath Lab team prep requested.',
        urgency: 'CODE_RED',
      },
      {
        id: 'CAD-BLR-8922',
        hospital: 'Command Hospital Air Force',
        hospitalId: 'HOSP-BLR-02',
        ambulanceId: 'AMB-CH-09',
        text: 'Code Red Polytrauma: Female, 29, high-speed motorcycle collision near Domlur flyover. Bilateral femoral fractures, arterial bleeding controlled. ETA 6 mins.',
        urgency: 'CODE_RED',
      },
      {
        id: 'CAD-BLR-8923',
        hospital: 'HAL Hospital, Vimanapura',
        hospitalId: 'HOSP-BLR-08',
        ambulanceId: 'AMB-HAL-03',
        text: 'Code Amber: Male, 62, diabetic hypoglycemic confusion, stable vitals, conscious, non-traumatic transport.',
        urgency: 'CODE_AMBER',
      },
      {
        id: 'CAD-BLR-8924',
        hospital: 'Unknown Private Clinic',
        hospitalId: 'CLINIC-UNREG',
        ambulanceId: 'CIV-PRIVATE-TAXI',
        text: 'Private courier delivery of non-emergency medical supplies to pharmacy in Murugeshpalya. Requesting priority lane pass.',
        urgency: 'INVALID',
      },
    ],
  });
});

// Gemini CAD Emergency Verification
app.post('/api/verify-emergency', async (req, res) => {
  const { dispatchText, hospitalId, ambulanceId } = req.body;

  if (!dispatchText) {
    return res.status(400).json({ error: 'dispatchText is required' });
  }

  if (ai) {
    try {
      const prompt = `You are the Google Maps Emergency Verification Agent for LifeCorridor (Google Cloud AI Builder Cup 2026).
Analyze this emergency CAD dispatch message:
Dispatch Text: "${dispatchText}"
Hospital ID: "${hospitalId || 'HOSP-BLR-MANIPAL'}"
Ambulance Unit: "${ambulanceId || 'UNIT-108-BLR'}"

Determine if this is an authentic life-critical emergency that warrants opening a 500-meter autonomous road clearance zipper corridor.
Analyze whether the patient is in acute life-threatening distress, requires immediate trauma/ICU mobilization, or if this is non-urgent/fraudulent.

Return strictly valid JSON with:
- verified: boolean (true if authentic emergency)
- urgency_tier: "CODE_RED" | "CODE_AMBER" | "INVALID"
- patient_condition: short string
- corridor_authorized: boolean
- triage_summary: 1-2 sentence executive operational directive for Google Maps navigation routing
- clinical_priority_score: integer from 1 to 10
- trauma_team_prep: string checklist for receiving hospital
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verified: { type: Type.BOOLEAN },
              urgency_tier: { type: Type.STRING },
              patient_condition: { type: Type.STRING },
              corridor_authorized: { type: Type.BOOLEAN },
              triage_summary: { type: Type.STRING },
              clinical_priority_score: { type: Type.INTEGER },
              trauma_team_prep: { type: Type.STRING },
            },
            required: [
              'verified',
              'urgency_tier',
              'patient_condition',
              'corridor_authorized',
              'triage_summary',
              'clinical_priority_score',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ status: 'success', source: 'gemini-3.8-flash', result: parsed });
    } catch (err: any) {
      console.warn('Gemini dispatch verification fallback triggered:', err.message);
    }
  }

  // Deterministic rule-based fallback if API is unreachable or offline
  const lower = (dispatchText || '').toLowerCase();
  const isInvalid = lower.includes('courier') || lower.includes('private taxi') || lower.includes('non-emergency') || lower.includes('supplies');
  const isCodeRed = lower.includes('cardiac') || lower.includes('polytrauma') || lower.includes('arrest') || lower.includes('stroke') || lower.includes('bleeding');

  const fallbackResult = {
    verified: !isInvalid,
    urgency_tier: isInvalid ? 'INVALID' : (isCodeRed ? 'CODE_RED' : 'CODE_AMBER'),
    patient_condition: isInvalid
      ? 'Non-critical supply transport (Unauthorized for corridor)'
      : isCodeRed
      ? 'Critical acute trauma/cardiac event requiring immediate emergency corridor'
      : 'Stable patient transit - sub-acute priority',
    corridor_authorized: !isInvalid,
    triage_summary: isInvalid
      ? 'Corridor request denied: Non-emergency transit must follow standard civilian traffic rules.'
      : 'Corridor broadcast authorized: Commuters ahead on Old Airport Road instructed to yield center zipper lane.',
    clinical_priority_score: isInvalid ? 1 : (isCodeRed ? 10 : 6),
    trauma_team_prep: isCodeRed
      ? 'Alert Code Blue / Cath Lab team, prepare resuscitation bay 1, type-O negative crossmatch'
      : 'Standard triage intake station prep',
  };

  return res.json({ status: 'success', source: 'deterministic-fallback', result: fallbackResult });
});

// Siren Acoustics & Anti-Spoofing Verification
app.post('/api/verify-siren', async (req, res) => {
  const { decibels, dominantFrequencies, vehicleMoving } = req.body;
  const db = Number(decibels) || 92;
  const freqs = Array.isArray(dominantFrequencies) ? dominantFrequencies : [750, 1200, 950];
  const moving = vehicleMoving !== false;

  const validDb = db >= 82;
  const validFrequencies = freqs.some((f) => f >= 600 && f <= 1650);
  const isValid = validDb && validFrequencies && moving;

  return res.json({
    sirenVerified: isValid,
    spectralSignature: isValid ? 'AUTHENTIC_EMERGENCY_SIREN_WAIL_YELP' : 'UNRECOGNIZED_AUDIO_OR_CIVILIAN_HORN',
    decibelLevel: db,
    dominantFrequenciesHz: freqs,
    antiSpoofingStatus: isValid ? 'CLEARED_FOR_BROADCAST' : 'REJECTED_POSSIBLE_CIVILIAN_ABUSE',
    confidenceScore: isValid ? 0.98 : 0.22,
  });
});

// 3-Zone Corridor & Spatial Distance Calculation
app.post('/api/calculate-corridor', (req, res) => {
  const {
    ambulance_lat,
    ambulance_lng,
    commuter_lat,
    commuter_lng,
    road_speed_kmh = 12.0,
    ambulance_heading = 95.0,
    commuter_heading = 95.0,
    commuter_lane = 'LANE_1_LEFT',
  } = req.body;

  if (
    ambulance_lat === undefined ||
    ambulance_lng === undefined ||
    commuter_lat === undefined ||
    commuter_lng === undefined
  ) {
    return res.status(400).json({ error: 'Coordinates missing' });
  }

  const distanceMeters = haversineDistance(
    Number(ambulance_lat),
    Number(ambulance_lng),
    Number(commuter_lat),
    Number(commuter_lng)
  );

  // Directional heading filtering
  let headingDiff = Math.abs((ambulance_heading || 90) - (commuter_heading || 90));
  if (headingDiff > 180) headingDiff = 360 - headingDiff;
  const directionalMatch = headingDiff <= 35.0;

  if (!directionalMatch) {
    return res.json({
      distance_meters: distanceMeters,
      zone: 'ZONE_OPPOSING_LANE',
      directive: 'OPPOSING_LANE_MAINTAIN_COURSE',
      color_code: 'GREEN',
      audio_alert: 'Opposing lane emergency transit detected. Maintain current lane.',
      hud_action: 'NO_ACTION_REQUIRED',
      directional_match: false,
      heading_diff: headingDiff,
      wheel_angle: 0,
      audio_ducking_level: 100,
      audio_ducking_db: 0,
    });
  }

  const isRightLane = commuter_lane === 'LANE_3_RIGHT';
  let zone = 'ZONE_CLEAR';
  let directive = 'NORMAL_NAVIGATION';
  let color_code = 'GREEN';
  let audio_alert = 'Route clear. Normal navigation active.';
  let hud_action = 'STANDARD_GREEN';
  let wheel_angle = 0;
  let audio_ducking_level = 100;
  let audio_ducking_db = 0;

  if (distanceMeters <= 500) {
    zone = 'ZONE_1_CONTACT';
    directive = isRightLane ? 'MERGE_RIGHT_NOW' : 'MERGE_LEFT_NOW';
    audio_alert = isRightLane
      ? `Emergency ambulance ${distanceMeters} meters behind. You are in the right lane: merge right against the road divider immediately to open center zipper corridor.`
      : `Emergency ambulance ${distanceMeters} meters behind in your lane. Merge left immediately to open center zipper corridor.`;
    color_code = 'RED';
    hud_action = isRightLane ? 'PULSING_RED_MERGE_RIGHT' : 'PULSING_RED_MERGE_LEFT';
    wheel_angle = isRightLane ? 30 : -30;
    audio_ducking_level = 15;
    audio_ducking_db = -18;
  } else if (distanceMeters <= 3000) {
    zone = 'ZONE_2_ELASTIC_CUSHION';
    directive = 'MAINTAIN_2M_GAP';
    audio_alert = isRightLane
      ? `Ambulance in corridor ${(distanceMeters / 1000).toFixed(1)} km behind. Stop tailgating. Leave 2-meter gap and bias wheels 30 degrees right toward divider.`
      : `Ambulance in corridor ${(distanceMeters / 1000).toFixed(1)} km behind. Stop bumper-to-bumper tailgating. Leave 2-meter gap and bias steering 30 degrees left.`;
    color_code = 'AMBER';
    hud_action = 'AMBER_WARNING';
    wheel_angle = isRightLane ? 30 : -30;
    audio_ducking_level = 60;
    audio_ducking_db = -6;
  } else if (distanceMeters <= 10000) {
    zone = 'ZONE_3_CHOKEPOINT_FLUSH';
    directive = 'FLUSH_FORWARD';
    audio_alert = 'Corridor clearing advisory: Lead junction ahead, advance briskly through green signal without stopping.';
    color_code = 'YELLOW';
    hud_action = 'YELLOW_ADVISORY';
    wheel_angle = 0;
    audio_ducking_level = 100;
    audio_ducking_db = 0;
  }

  return res.json({
    distance_meters: distanceMeters,
    zone,
    directive,
    color_code,
    audio_alert,
    hud_action,
    road_speed_kmh,
    directional_match: true,
    heading_diff: headingDiff,
    commuter_lane,
    wheel_angle,
    audio_ducking_level,
    audio_ducking_db,
  });
});

// Hospital Trauma Bay Handshake
app.post('/api/hospital-handshake', (req, res) => {
  const { hospitalName, ambulanceId, etaSeconds, patientVitals } = req.body;
  const etaMinutes = Math.ceil((Number(etaSeconds) || 360) / 60);

  res.json({
    status: 'ACTIVE_TELEMETRY',
    hospital: hospitalName || 'Manipal Hospital, Old Airport Road',
    ambulanceUnit: ambulanceId || 'BLR-108-ALPHA',
    realTimeEtaMinutes: etaMinutes,
    timeSavedByCorridorMinutes: 8.5,
    patientVitals: patientVitals || {
      heartRate: 118,
      bp: '145/95',
      spo2: '91%',
      rhythm: 'Ventricular Tachycardia (Stabilized)',
    },
    traumaBayStatus: {
      bayAssigned: 'Trauma Bay 1 (Emergency Resuscitation)',
      teamLead: 'Dr. A. Sharma (Senior Emergency Consultant)',
      readinessState: etaMinutes <= 5 ? 'CODE_RED_MOBILIZED' : 'PRE_ALERT_STANDBY',
      bloodBankNotified: true,
      cardiacCathLabOnStandby: true,
    },
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeCorridor Server listening on port ${PORT}`);
  });
}

startServer();
