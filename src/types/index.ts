export type ZoneType = 'ZONE_1_CONTACT' | 'ZONE_2_ELASTIC_CUSHION' | 'ZONE_3_CHOKEPOINT_FLUSH' | 'ZONE_CLEAR' | 'ZONE_OPPOSING_LANE';

export type DirectiveType =
  | 'MERGE_LEFT_NOW'
  | 'MERGE_RIGHT_NOW'
  | 'MAINTAIN_2M_GAP'
  | 'FLUSH_FORWARD'
  | 'NORMAL_NAVIGATION'
  | 'OPPOSING_LANE_MAINTAIN_COURSE';

export interface RouteWaypoint {
  lat: number;
  lng: number;
  name: string;
  landmark: string;
  kmMark: number;
  speedLimitKmh?: number;
  trafficStatus?: 'HEAVY' | 'STANDSTILL' | 'CLEARED' | 'FLOWING';
}

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  hospital: string;
  corridorName: string;
  center: { lat: number; lng: number };
  zoom: number;
  route: RouteWaypoint[];
  detourRoute: { lat: number; lng: number }[];
  description: string;
  trafficContext: string;
}

export type ViewMode =
  | 'SPLIT_COMMAND'
  | 'DRIVER_CABIN_POV'
  | 'COMMUTER_MAPS_POV'
  | 'AMBULANCE_POV'
  | 'HOSPITAL_TRAUMA_BAY';

export interface VehicleTelemetry {
  id: string;
  type: 'AMBULANCE' | 'COMMUTER_IN_PATH' | 'COMMUTER_CUSHION' | 'COMMUTER_OPPOSING';
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  label: string;
  lane: 'LEFT' | 'CENTER' | 'RIGHT' | 'OPPOSING';
}

export interface CorridorAlertState {
  distanceMeters: number;
  zone: ZoneType;
  directive: DirectiveType;
  colorCode: 'RED' | 'AMBER' | 'YELLOW' | 'GREEN';
  audioAlert: string;
  hudAction: string;
  directionalMatch: boolean;
  headingDiff: number;
  elasticBufferMeters: number;
  commuterLane?: 'LANE_1_LEFT' | 'LANE_2_CENTER' | 'LANE_3_RIGHT';
  wheelAngle?: number;
  audioDuckingLevel?: number;
  audioDuckingDb?: number;
}

export interface CADDispatch {
  id: string;
  hospital: string;
  hospitalId: string;
  ambulanceId: string;
  text: string;
  urgency: 'CODE_RED' | 'CODE_AMBER' | 'INVALID';
}

export interface GeminiVerificationResult {
  verified: boolean;
  urgency_tier: 'CODE_RED' | 'CODE_AMBER' | 'INVALID';
  patient_condition: string;
  corridor_authorized: boolean;
  triage_summary: string;
  clinical_priority_score: number;
  trauma_team_prep?: string;
}

export interface MacroInflowMetrics {
  vehiclesDiverted: number;
  corridorPressureReductionPct: number;
  goldenHourMinutesSaved: number;
  reroutePenaltySeconds: number;
}
