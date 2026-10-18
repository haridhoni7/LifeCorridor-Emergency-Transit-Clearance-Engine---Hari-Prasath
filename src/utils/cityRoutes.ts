import type { CityPreset, RouteWaypoint } from '../types/index.ts';

/**
 * Curated high-density traffic corridor presets for Asian Megacities
 * with realistic road curvature, junctions, and parallel detour arterials.
 */

export const CITY_PRESETS: CityPreset[] = [
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    country: 'India',
    hospital: 'Manipal Hospital Level-1 Trauma Bay',
    corridorName: 'Old Airport Road Transit Corridor',
    center: { lat: 12.9580, lng: 77.6585 },
    zoom: 14,
    description: 'High-density IT corridor connecting Domlur Flyover to HAL & Manipal Hospital.',
    trafficContext: 'Bumper-to-bumper standstill during peak hours (10-14 km/h avg speed).',
    route: [
      { lat: 12.9598, lng: 77.6430, name: 'Domlur Flyover Ramp', landmark: 'Inner Ring Rd Entry', kmMark: 0.0, speedLimitKmh: 50, trafficStatus: 'STANDSTILL' },
      { lat: 12.9592, lng: 77.6465, name: 'Domlur Signal Underpass', landmark: 'Koramangala Link Rd', kmMark: 0.4, speedLimitKmh: 40, trafficStatus: 'STANDSTILL' },
      { lat: 12.9587, lng: 77.6505, name: 'Command Hospital Gate 1', landmark: 'Air Force Base Hospital', kmMark: 0.8, speedLimitKmh: 45, trafficStatus: 'HEAVY' },
      { lat: 12.9583, lng: 77.6545, name: 'Leela Palace Curve', landmark: 'HAL 2nd Stage Curve', kmMark: 1.3, speedLimitKmh: 40, trafficStatus: 'STANDSTILL' },
      { lat: 12.9578, lng: 77.6590, name: 'Murugeshpalya Junction', landmark: 'Wind Tunnel Road T-Junction', kmMark: 1.8, speedLimitKmh: 40, trafficStatus: 'STANDSTILL' },
      { lat: 12.9573, lng: 77.6635, name: 'Rajarajeshwari Temple Curve', landmark: 'HAL Post Office', kmMark: 2.3, speedLimitKmh: 45, trafficStatus: 'HEAVY' },
      { lat: 12.9568, lng: 77.6675, name: 'HAL Main Gate & Museum', landmark: 'Suranjandas Rd Cross', kmMark: 2.8, speedLimitKmh: 50, trafficStatus: 'FLOWING' },
      { lat: 12.9562, lng: 77.6725, name: 'Manipal Hospital Emergency Bay', landmark: 'Cardiac Catheterization Resuscitation Bay 1', kmMark: 3.4, speedLimitKmh: 30, trafficStatus: 'CLEARED' },
    ],
    // Parallel arterial road used for Macro-Inflow Starvation rerouting (Indiranagar 100ft Rd -> HAL 3rd Stage)
    detourRoute: [
      { lat: 12.9598, lng: 77.6430 },
      { lat: 12.9645, lng: 77.6435 },
      { lat: 12.9650, lng: 77.6540 },
      { lat: 12.9635, lng: 77.6650 },
      { lat: 12.9568, lng: 77.6675 },
    ],
  },
  {
    id: 'jakarta',
    name: 'Jakarta',
    country: 'Indonesia',
    hospital: 'RS Siloam Semanggi Trauma Unit',
    corridorName: 'Jalan Jenderal Sudirman Expressway Corridor',
    center: { lat: -6.2185, lng: 106.8185 },
    zoom: 14,
    description: 'Central business district arterial connecting Bundaran HI to Semanggi Cloverleaf.',
    trafficContext: 'Severe gridlock with TransJakarta busway conflicts (8-12 km/h avg speed).',
    route: [
      { lat: -6.1950, lng: 106.8230, name: 'Bundaran HI Roundabout', landmark: 'Grand Indonesia Intersection', kmMark: 0.0, speedLimitKmh: 50, trafficStatus: 'STANDSTILL' },
      { lat: -6.2025, lng: 106.8222, name: 'Dukuh Atas Flyover', landmark: 'MRT / LRT Transit Hub', kmMark: 0.9, speedLimitKmh: 40, trafficStatus: 'STANDSTILL' },
      { lat: -6.2100, lng: 106.8210, name: 'Setiabudi Junction', landmark: 'Chase Plaza CBD Corridor', kmMark: 1.8, speedLimitKmh: 45, trafficStatus: 'HEAVY' },
      { lat: -6.2175, lng: 106.8190, name: 'Bendungan Hilir Curve', landmark: 'Benhil Flyover Merge', kmMark: 2.7, speedLimitKmh: 40, trafficStatus: 'STANDSTILL' },
      { lat: -6.2230, lng: 106.8165, name: 'Semanggi Cloverleaf Interchange', landmark: 'Gatot Subroto Overpass', kmMark: 3.5, speedLimitKmh: 35, trafficStatus: 'HEAVY' },
      { lat: -6.2260, lng: 106.8145, name: 'RS Siloam Semanggi Emergency ED', landmark: 'Critical Resuscitation Unit & Helipad', kmMark: 4.1, speedLimitKmh: 30, trafficStatus: 'CLEARED' },
    ],
    detourRoute: [
      { lat: -6.1950, lng: 106.8230 },
      { lat: -6.2010, lng: 106.8320 },
      { lat: -6.2140, lng: 106.8310 },
      { lat: -6.2250, lng: 106.8260 },
      { lat: -6.2260, lng: 106.8145 },
    ],
  },
  {
    id: 'manila',
    name: 'Manila',
    country: 'Philippines',
    hospital: "St. Luke's Medical Center BGC Emergency",
    corridorName: 'EDSA Highway to BGC Lifeline Corridor',
    center: { lat: 14.5540, lng: 121.0380 },
    zoom: 14,
    description: 'Connecting EDSA Guadalupe Bridge chokepoint through Kalayaan Flyover to BGC.',
    trafficContext: 'Hyper-congested multi-modal arterial with jeepneys and express buses.',
    route: [
      { lat: 14.5680, lng: 121.0425, name: 'EDSA Guadalupe Bridge', landmark: 'Pasig River Overpass', kmMark: 0.0, speedLimitKmh: 40, trafficStatus: 'STANDSTILL' },
      { lat: 14.5610, lng: 121.0445, name: 'EDSA Buendia Chokepoint', landmark: 'MRT Buendia Station Ramp', kmMark: 0.9, speedLimitKmh: 35, trafficStatus: 'STANDSTILL' },
      { lat: 14.5565, lng: 121.0480, name: 'Kalayaan Flyover Approach', landmark: 'BGC North Gate Ramp', kmMark: 1.7, speedLimitKmh: 40, trafficStatus: 'HEAVY' },
      { lat: 14.5540, lng: 121.0515, name: '32nd Street Business Avenue', landmark: 'University Parkway Junction', kmMark: 2.3, speedLimitKmh: 45, trafficStatus: 'HEAVY' },
      { lat: 14.5525, lng: 121.0550, name: 'St. Luke\'s Medical Center Emergency Bay', landmark: 'Bonifacio Global City Level-1 Trauma', kmMark: 3.0, speedLimitKmh: 30, trafficStatus: 'CLEARED' },
    ],
    detourRoute: [
      { lat: 14.5680, lng: 121.0425 },
      { lat: 14.5650, lng: 121.0550 },
      { lat: 14.5580, lng: 121.0610 },
      { lat: 14.5525, lng: 121.0550 },
    ],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    hospital: 'Lilavati Hospital & Research Centre',
    corridorName: 'Western Express Highway to Bandra Reclamation',
    center: { lat: 19.0550, lng: 72.8360 },
    zoom: 14,
    description: 'Western Express Highway feeding into Kalanagar Junction and Bandra West.',
    trafficContext: 'Severe bottleneck near BKC / Kalanagar bridge (9-15 km/h avg speed).',
    route: [
      { lat: 19.0685, lng: 72.8510, name: 'Kherwadi Flyover Exit', landmark: 'Western Express Highway Chokepoint', kmMark: 0.0, speedLimitKmh: 50, trafficStatus: 'STANDSTILL' },
      { lat: 19.0610, lng: 72.8465, name: 'Kalanagar Junction Underpass', landmark: 'Bandra-Kurla Complex (BKC) Feeder', kmMark: 0.9, speedLimitKmh: 35, trafficStatus: 'STANDSTILL' },
      { lat: 19.0560, lng: 72.8405, name: 'Mahim Causeway Merge', landmark: 'S.V. Road Divergence', kmMark: 1.8, speedLimitKmh: 40, trafficStatus: 'HEAVY' },
      { lat: 19.0520, lng: 72.8340, name: 'Bandra Reclamation Curve', landmark: 'Bandra-Worli Sea Link Toll Approach', kmMark: 2.6, speedLimitKmh: 45, trafficStatus: 'FLOWING' },
      { lat: 19.0505, lng: 72.8285, name: 'Lilavati Hospital Emergency Trauma Resuscitation', landmark: 'Bandra West Trauma Care Center', kmMark: 3.3, speedLimitKmh: 30, trafficStatus: 'CLEARED' },
    ],
    detourRoute: [
      { lat: 19.0685, lng: 72.8510 },
      { lat: 19.0640, lng: 72.8620 },
      { lat: 19.0530, lng: 72.8550 },
      { lat: 19.0490, lng: 72.8390 },
      { lat: 19.0505, lng: 72.8285 },
    ],
  },
];

/**
 * Dynamically generates a high-fidelity curving emergency corridor starting from
 * ANY user-provided GPS coordinates (e.g. current device location or map click).
 */
export function generateCustomCorridor(
  startLat: number,
  startLng: number,
  locationLabel = 'Your Custom Location'
): CityPreset {
  // Generate a realistic 3.5 km corridor with realistic urban road curvature
  // Delta roughly 0.006 lat and 0.024 lng (approx 3.2 km bearing east-southeast)
  const dLat = -0.0055 / 6;
  const dLng = 0.022 / 6;

  const waypoints: RouteWaypoint[] = [
    {
      lat: startLat,
      lng: startLng,
      name: `${locationLabel} (Emergency Origin)`,
      landmark: 'Emergency Dispatch Pickup Location',
      kmMark: 0.0,
      speedLimitKmh: 50,
      trafficStatus: 'STANDSTILL',
    },
    {
      lat: startLat + dLat * 1 + 0.0004,
      lng: startLng + dLng * 1,
      name: 'Sector Crossing & Primary Traffic Signal',
      landmark: 'High-Density Chokepoint Junction',
      kmMark: 0.6,
      speedLimitKmh: 40,
      trafficStatus: 'STANDSTILL',
    },
    {
      lat: startLat + dLat * 2 - 0.0003,
      lng: startLng + dLng * 2,
      name: 'Main Arterial Avenue Corridor',
      landmark: 'Zone 2 Cushion Initiation Zone',
      kmMark: 1.2,
      speedLimitKmh: 45,
      trafficStatus: 'HEAVY',
    },
    {
      lat: startLat + dLat * 3 + 0.0006,
      lng: startLng + dLng * 3,
      name: 'Expressway Flyover Underpass Curve',
      landmark: 'Mid-Corridor Transit S-Curve',
      kmMark: 1.8,
      speedLimitKmh: 40,
      trafficStatus: 'STANDSTILL',
    },
    {
      lat: startLat + dLat * 4 - 0.0002,
      lng: startLng + dLng * 4,
      name: 'Hospital Approach Boulevard',
      landmark: 'Rolling Green Signal Preemption',
      kmMark: 2.5,
      speedLimitKmh: 45,
      trafficStatus: 'HEAVY',
    },
    {
      lat: startLat + dLat * 5 + 0.0003,
      lng: startLng + dLng * 5,
      name: 'Metropolitan General Hospital Emergency Gate',
      landmark: 'Emergency Resuscitation Bay & Cath Lab',
      kmMark: 3.2,
      speedLimitKmh: 30,
      trafficStatus: 'CLEARED',
    },
  ];

  // Upstream detour arterial (offset by ~600m to the north)
  const detourRoute = [
    { lat: startLat, lng: startLng },
    { lat: startLat + 0.005, lng: startLng + dLng * 1 },
    { lat: startLat + 0.006, lng: startLng + dLng * 3 },
    { lat: startLat + 0.004, lng: startLng + dLng * 4.5 },
    { lat: waypoints[waypoints.length - 1].lat, lng: waypoints[waypoints.length - 1].lng },
  ];

  return {
    id: 'custom-location',
    name: locationLabel,
    country: 'Custom Coordinates',
    hospital: 'Metropolitan General Emergency Center',
    corridorName: `Autonomous Corridor @ ${startLat.toFixed(3)}, ${startLng.toFixed(3)}`,
    center: { lat: startLat + (dLat * 3), lng: startLng + (dLng * 2.5) },
    zoom: 14,
    description: `Real-time LifeCorridor active for GPS coordinates [${startLat.toFixed(4)}, ${startLng.toFixed(4)}].`,
    trafficContext: 'Simulated urban traffic shockwave corridor with dynamic civilian displacement.',
    route: waypoints,
    detourRoute,
  };
}

/**
 * Generates an autonomous transit corridor between two distinct user-chosen areas
 * (Origin A to Destination B) with realistic road waypoints and parallel detour.
 */
export function generatePointToPointCorridor(
  originLat: number,
  originLng: number,
  originName: string,
  destLat: number,
  destLng: number,
  destName: string
): CityPreset {
  const steps = 7;
  const dLat = (destLat - originLat) / (steps - 1);
  const dLng = (destLng - originLng) / (steps - 1);

  // Perpendicular offset for realistic road curvature
  const perpLat = -dLng * 0.15;
  const perpLng = dLat * 0.15;

  const waypoints: RouteWaypoint[] = [];

  for (let i = 0; i < steps; i++) {
    const fraction = i / (steps - 1);
    // Add realistic arc curve to road
    const arc = Math.sin(fraction * Math.PI) * 0.8;
    const lat = originLat + dLat * i + perpLat * arc;
    const lng = originLng + dLng * i + perpLng * arc;

    let wpName = `${originName} Arterial (Km ${(fraction * 4).toFixed(1)})`;
    let landmark = 'Urban Transit Link';
    let status: 'STANDSTILL' | 'HEAVY' | 'FLOWING' | 'CLEARED' = 'HEAVY';

    if (i === 0) {
      wpName = `${originName} Origin Point`;
      landmark = 'Corridor Inception Node';
      status = 'STANDSTILL';
    } else if (i === Math.floor(steps / 2)) {
      wpName = `Midway Transit Junction (${originName} - ${destName})`;
      landmark = 'Major Signalized Intersection';
      status = 'STANDSTILL';
    } else if (i === steps - 1) {
      wpName = `${destName} Emergency Entrance`;
      landmark = 'Level-1 Emergency Trauma Center';
      status = 'CLEARED';
    }

    waypoints.push({
      lat,
      lng,
      name: wpName,
      landmark,
      kmMark: Math.round(fraction * 42) / 10,
      speedLimitKmh: i === 0 ? 40 : i === steps - 1 ? 30 : 50,
      trafficStatus: status,
    });
  }

  // Parallel detour route offset ~500m
  const detourRoute = waypoints.map((w, idx) => ({
    lat: w.lat + (idx === 0 || idx === steps - 1 ? 0 : perpLat * 2.5),
    lng: w.lng + (idx === 0 || idx === steps - 1 ? 0 : perpLng * 2.5),
  }));

  const safeOrigin = originName || 'Origin Point';
  const safeDest = destName || 'Destination Facility';

  return {
    id: `p2p-${Date.now()}`,
    name: `${safeOrigin.split(',')[0]} → ${safeDest.split(',')[0]}`,
    country: 'Point-to-Point Route',
    hospital: safeDest,
    corridorName: `${safeOrigin.split(',')[0]} to ${safeDest.split(',')[0]} Emergency Highway`,
    center: {
      lat: (originLat + destLat) / 2,
      lng: (originLng + destLng) / 2,
    },
    zoom: 14,
    description: `Autonomous emergency corridor between ${safeOrigin} and ${safeDest}.`,
    trafficContext: 'Custom point-to-point driving corridor with dynamic ambulance pursuit simulation.',
    route: waypoints,
    detourRoute,
  };
}
