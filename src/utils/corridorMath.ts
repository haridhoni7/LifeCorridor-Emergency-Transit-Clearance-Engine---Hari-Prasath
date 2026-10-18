/**
 * Pure mathematical functions for LifeCorridor:
 * Haversine spatial calculations, 3-Zone shockwave protocol,
 * directional heading vectors, and elastic buffer clearance.
 */

export interface CorridorEvaluation {
  distanceMeters: number;
  zone: 'ZONE_1_CONTACT' | 'ZONE_2_ELASTIC_CUSHION' | 'ZONE_3_CHOKEPOINT_FLUSH' | 'ZONE_CLEAR';
  directive: 'MERGE_LEFT_NOW' | 'MERGE_RIGHT_NOW' | 'MAINTAIN_2M_GAP' | 'FLUSH_FORWARD' | 'NORMAL_NAVIGATION';
  colorCode: 'RED' | 'AMBER' | 'YELLOW' | 'GREEN';
  audioAlert: string;
  isDirectionalMatch: boolean;
  elasticBufferMeters: number;
}

/**
 * Calculates Haversine spherical distance between two WGS84 GPS coordinates in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const phi1 = lat1 * (Math.PI / 180);
  const phi2 = lat2 * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates compass heading bearing from point 1 to point 2 in degrees (0 - 360).
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = lat1 * (Math.PI / 180);
  const phi2 = lat2 * (Math.PI / 180);
  const deltaLambda = (lon2 - lon1) * (Math.PI / 180);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);

  const bearing = ((theta * 180) / Math.PI + 360) % 360;
  return Math.round(bearing * 10) / 10;
}

/**
 * Validates directional heading alignment to prevent false alarms on flyovers,
 * underpasses, and opposing lanes.
 */
export function isDirectionalMatch(
  ambulanceHeading: number,
  commuterHeading: number,
  toleranceDegrees = 35
): boolean {
  let diff = Math.abs(ambulanceHeading - commuterHeading) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff <= toleranceDegrees;
}

/**
 * Evaluates the 3-Zone Phased Shockwave Protocol for emergency vehicle transit:
 * Zone 1 (0 – 500m): MERGE_LEFT_NOW (Pulsing Red)
 * Zone 2 (500m – 3000m): MAINTAIN_2M_GAP (Amber)
 * Zone 3 (3000m – 10000m): FLUSH_FORWARD (Yellow)
 * Zone Clear (> 10000m): NORMAL_NAVIGATION (Green)
 */
export function evaluate3ZoneShockwave(
  distanceMeters: number,
  ambulanceHeading = 90,
  commuterHeading = 90,
  roadSpeedKmh = 12,
  commuterLane: 'LANE_1_LEFT' | 'LANE_2_CENTER' | 'LANE_3_RIGHT' = 'LANE_1_LEFT'
): CorridorEvaluation {
  const match = isDirectionalMatch(ambulanceHeading, commuterHeading);

  if (!match) {
    return {
      distanceMeters,
      zone: 'ZONE_CLEAR',
      directive: 'NORMAL_NAVIGATION',
      colorCode: 'GREEN',
      audioAlert: 'Opposing lane emergency transit. Maintain current lane.',
      isDirectionalMatch: false,
      elasticBufferMeters: 0,
    };
  }

  const isRightLane = commuterLane === 'LANE_3_RIGHT';
  // Elastic buffer required to maintain turning clearance when stopped
  const elasticBufferMeters = roadSpeedKmh < 15 ? 2.0 : 5.0;

  if (distanceMeters <= 500) {
    return {
      distanceMeters,
      zone: 'ZONE_1_CONTACT',
      directive: isRightLane ? 'MERGE_RIGHT_NOW' : 'MERGE_LEFT_NOW',
      colorCode: 'RED',
      audioAlert: isRightLane
        ? `Emergency ambulance ${Math.round(distanceMeters)} meters behind. You are in the right lane: merge right against the road divider immediately to open center zipper corridor.`
        : `Emergency ambulance ${Math.round(distanceMeters)} meters behind in your lane. Merge left immediately to open center zipper corridor.`,
      isDirectionalMatch: true,
      elasticBufferMeters,
    };
  } else if (distanceMeters <= 3000) {
    return {
      distanceMeters,
      zone: 'ZONE_2_ELASTIC_CUSHION',
      directive: 'MAINTAIN_2M_GAP',
      colorCode: 'AMBER',
      audioAlert: isRightLane
        ? `Ambulance in corridor ${(distanceMeters / 1000).toFixed(1)} kilometers behind. Stop tailgating. Leave a 2-meter gap and bias steering 30 degrees right toward divider.`
        : `Ambulance in corridor ${(distanceMeters / 1000).toFixed(1)} kilometers behind. Stop bumper-to-bumper tailgating. Leave a 2-meter gap and bias steering 30 degrees left.`,
      isDirectionalMatch: true,
      elasticBufferMeters,
    };
  } else if (distanceMeters <= 10000) {
    return {
      distanceMeters,
      zone: 'ZONE_3_CHOKEPOINT_FLUSH',
      directive: 'FLUSH_FORWARD',
      colorCode: 'YELLOW',
      audioAlert: 'Corridor clearing advisory: Lead junction ahead, advance briskly through green signal without stopping.',
      isDirectionalMatch: true,
      elasticBufferMeters,
    };
  } else {
    return {
      distanceMeters,
      zone: 'ZONE_CLEAR',
      directive: 'NORMAL_NAVIGATION',
      colorCode: 'GREEN',
      audioAlert: 'Route clear. Normal navigation active.',
      isDirectionalMatch: true,
      elasticBufferMeters: 0,
    };
  }
}
