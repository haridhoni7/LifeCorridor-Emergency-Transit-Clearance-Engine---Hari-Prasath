import React, { useState, useEffect, useRef } from 'react';
import {
  Siren,
  Play,
  Square,
  Activity,
  Layers,
  Sparkles,
  Hospital,
  Award,
  Github,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  MapPin,
  Radio,
  Zap,
  Car,
  Maximize2,
  Network,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { GoogleNavigationMap } from './components/GoogleNavigationMap';
import { NavigationMap } from './components/NavigationMap';
import { CommuterHUD } from './components/CommuterHUD';
import { CommuterGoogleMapsPOV } from './components/CommuterGoogleMapsPOV';
import { AmbulanceDriverPOV } from './components/AmbulanceDriverPOV';
import { AmbulanceCockpit } from './components/AmbulanceCockpit';
import { ShockwaveDeepDive } from './components/ShockwaveDeepDive';
import { GeminiVerifierLab } from './components/GeminiVerifierLab';
import { TraumaBayHandshake } from './components/TraumaBayHandshake';
import { SubmissionModal } from './components/SubmissionModal';
import { MacroInflowWidget } from './components/MacroInflowWidget';
import { InteractiveTourExplainer } from './components/InteractiveTourExplainer';
import { DriverCabinPOV } from './components/DriverCabinPOV';
import {
  RouteWaypoint,
  CorridorAlertState,
  CADDispatch,
  GeminiVerificationResult,
  CityPreset,
  ViewMode,
  MacroInflowMetrics,
} from './types';
import { CITY_PRESETS, generateCustomCorridor, generatePointToPointCorridor } from './utils/cityRoutes';
import { evaluate3ZoneShockwave, haversineDistance } from './utils/corridorMath';
import { inCabinAudio } from './utils/audioDuckingEngine';
import { silenceAllPOVAudio } from './utils/audioCoordinator';

export default function App() {
  // Navigation View Modes: Split Command, Driver Cabin POV, Commuter Maps POV, Ambulance Driver POV, Hospital Trauma Bay
  const [viewMode, setViewMode] = useState<ViewMode>('SPLIT_COMMAND');
  const [activeTab, setActiveTab] = useState<'cockpit' | 'driver_cabin' | 'commuter_pov' | 'ambulance_pov' | 'shockwave' | 'gemini' | 'trauma'>('cockpit');

  // Active City Preset & Custom Route
  const [activeCity, setActiveCity] = useState<CityPreset>(CITY_PRESETS[0]); // Bengaluru default
  const [citiesList, setCitiesList] = useState<CityPreset[]>(CITY_PRESETS);

  // Simulation State
  const [inTransit, setInTransit] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(14); // Gridlock speed initially
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAudioDuckingActive, setIsAudioDuckingActive] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showTour, setShowTour] = useState(true);
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  // Google Maps Platform API Key
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyABub3BATNUpYZHu2Z30JXTYCAp4rA1yvs'
  );

  // Active Vehicle Selection for Commuter HUD
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('CAR-KA-03-9912');

  // Macro-Inflow Starvation Metrics
  const [macroMetrics, setMacroMetrics] = useState<MacroInflowMetrics>({
    vehiclesDiverted: 384,
    corridorPressureReductionPct: 78,
    goldenHourMinutesSaved: 8.5,
    reroutePenaltySeconds: 42,
  });

  // Geolocation & Interactive Location Banner
  const [locationNotice, setLocationNotice] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // CAD Dispatches
  const [dispatches, setDispatches] = useState<CADDispatch[]>([
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
      text: 'Code Red Polytrauma: Female, 29, motorcycle collision near Domlur flyover. Bilateral femoral fractures, arterial bleeding controlled. ETA 6 mins.',
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
  ]);
  const [activeDispatch, setActiveDispatch] = useState<CADDispatch>(dispatches[0]);
  const [geminiResult, setGeminiResult] = useState<GeminiVerificationResult | null>({
    verified: true,
    urgency_tier: 'CODE_RED',
    patient_condition: 'Acute STEMI Cardiac Emergency - Active Resuscitation',
    corridor_authorized: true,
    triage_summary: 'High-priority ambulance transit authorized for immediate Golden-Hour corridor clearance.',
    clinical_priority_score: 9,
    trauma_team_prep: 'Alert Cath Lab & Resuscitation Bay 1',
  });

  // Listen for Google Maps Quota Exceeded events
  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);

    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        if (d.mapsApiKey && !mapsApiKey) {
          setMapsApiKey(d.mapsApiKey);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, [mapsApiKey]);

  // Derive Current Dynamic Positions based on Active City Route
  const route = activeCity.route;
  const ambulancePos = route[Math.min(currentStep, route.length - 1)];

  // Civilian Vehicles relative to active city route
  const commuterPos: RouteWaypoint =
    route[Math.min(currentStep + 2, route.length - 2)] ||
    route[Math.min(1, route.length - 1)];
  const commuter2Pos: RouteWaypoint =
    route[Math.min(currentStep + 4, route.length - 1)] ||
    route[route.length - 1];
  const opposingPos = {
    lat: ambulancePos.lat + 0.0004,
    lng: ambulancePos.lng + 0.003,
  };

  // Distance to hospital destination
  const destinationWaypoint = route[route.length - 1];
  const distanceToHospitalMeters = Math.round(
    haversineDistance(ambulancePos.lat, ambulancePos.lng, destinationWaypoint.lat, destinationWaypoint.lng)
  );

  // Alert State
  const [alertState, setAlertState] = useState<CorridorAlertState>({
    distanceMeters: 430,
    zone: 'ZONE_1_CONTACT',
    directive: 'MERGE_LEFT_NOW',
    colorCode: 'RED',
    audioAlert: 'Emergency ambulance approaching 430 meters behind in your lane. Merge left immediately to open center zipper corridor.',
    hudAction: 'MERGE_LEFT_NOW',
    directionalMatch: true,
    headingDiff: 0,
    elasticBufferMeters: 2.0,
  });

  const lastSpokenZoneRef = useRef<string | null>(null);
  const transitTimerRef = useRef<number | null>(null);

  // Web Speech Synthesis with In-Vehicle Audio Ducking
  const speakAlert = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Real In-Car Web Audio Ducking (-18 dB)
      inCabinAudio.duck(0.15, 0);
      setIsAudioDuckingActive(true);

      utterance.onend = () => {
        inCabinAudio.restore();
        setTimeout(() => setIsAudioDuckingActive(false), 900);
      };
      utterance.onerror = () => {
        inCabinAudio.restore();
        setIsAudioDuckingActive(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      inCabinAudio.restore();
      setIsAudioDuckingActive(false);
    }
  };

  // Calculate shockwave corridor based on active city and selected vehicle
  const recalculateAlert = async (ambStep: number, targetCarId = selectedVehicleId) => {
    const amb = route[Math.min(ambStep, route.length - 1)];

    let targetCoords: { lat: number; lng: number } = commuterPos;
    let targetHeading = 95;

    if (targetCarId === 'CAR-KA-04-7718') {
      targetCoords = commuter2Pos;
      targetHeading = 95;
    } else if (targetCarId === 'CAR-KA-51-3301') {
      targetCoords = opposingPos;
      targetHeading = 275; // Opposing heading
    }

    try {
      const res = await fetch('/api/calculate-corridor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambulance_lat: amb.lat,
          ambulance_lng: amb.lng,
          commuter_lat: targetCoords.lat,
          commuter_lng: targetCoords.lng,
          road_speed_kmh: speedKmh,
          ambulance_heading: 95,
          commuter_heading: targetHeading,
          commuter_lane: 'LANE_1_LEFT',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newState: CorridorAlertState = {
          distanceMeters: data.distance_meters,
          zone: data.zone,
          directive: data.directive,
          colorCode: data.color_code,
          audioAlert: data.audio_alert,
          hudAction: data.hud_action || 'STANDARD',
          directionalMatch: data.directional_match !== false,
          headingDiff: data.heading_diff || 0,
          elasticBufferMeters: speedKmh < 15 ? 2.0 : 5.0,
          commuterLane: data.commuter_lane || 'LANE_1_LEFT',
          wheelAngle: data.wheel_angle || (data.directive === 'MERGE_RIGHT_NOW' ? 30 : data.directive === 'MERGE_LEFT_NOW' ? -30 : 0),
          audioDuckingLevel: data.audio_ducking_level || (data.zone === 'ZONE_1_CONTACT' ? 15 : data.zone === 'ZONE_2_ELASTIC_CUSHION' ? 60 : 100),
          audioDuckingDb: data.audio_ducking_db || (data.zone === 'ZONE_1_CONTACT' ? -18 : data.zone === 'ZONE_2_ELASTIC_CUSHION' ? -6 : 0),
        };
        setAlertState(newState);
        setIsAudioDuckingActive(data.zone === 'ZONE_1_CONTACT' || data.zone === 'ZONE_2_ELASTIC_CUSHION');

        if (inTransit && lastSpokenZoneRef.current !== data.zone && data.zone !== 'ZONE_CLEAR') {
          speakAlert(data.audio_alert);
          lastSpokenZoneRef.current = data.zone;
        }
        return;
      }
    } catch (err) {
      // Fallback
    }

    // Local pure calculation
    const dist = haversineDistance(amb.lat, amb.lng, targetCoords.lat, targetCoords.lng);
    const evalResult = evaluate3ZoneShockwave(dist, 95, targetHeading, speedKmh, 'LANE_1_LEFT');
    const fallbackState: CorridorAlertState = {
      distanceMeters: Math.round(dist),
      zone: evalResult.zone,
      directive: evalResult.directive,
      colorCode: evalResult.colorCode,
      audioAlert: evalResult.audioAlert,
      hudAction: evalResult.directive,
      directionalMatch: evalResult.isDirectionalMatch,
      headingDiff: evalResult.isDirectionalMatch ? 0 : 180,
      elasticBufferMeters: evalResult.elasticBufferMeters,
      commuterLane: 'LANE_1_LEFT',
      wheelAngle: evalResult.directive === 'MERGE_RIGHT_NOW' ? 30 : evalResult.directive === 'MERGE_LEFT_NOW' || evalResult.directive === 'MAINTAIN_2M_GAP' ? -30 : 0,
      audioDuckingLevel: evalResult.zone === 'ZONE_1_CONTACT' ? 15 : evalResult.zone === 'ZONE_2_ELASTIC_CUSHION' ? 60 : 100,
      audioDuckingDb: evalResult.zone === 'ZONE_1_CONTACT' ? -18 : evalResult.zone === 'ZONE_2_ELASTIC_CUSHION' ? -6 : 0,
    };
    setAlertState(fallbackState);
    setIsAudioDuckingActive(evalResult.zone === 'ZONE_1_CONTACT' || evalResult.zone === 'ZONE_2_ELASTIC_CUSHION');

    if (inTransit && lastSpokenZoneRef.current !== evalResult.zone && evalResult.zone !== 'ZONE_CLEAR') {
      speakAlert(evalResult.audioAlert);
      lastSpokenZoneRef.current = evalResult.zone;
    }
  };

  // Simulation timer loop
  useEffect(() => {
    if (inTransit) {
      recalculateAlert(currentStep, selectedVehicleId);

      transitTimerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= route.length - 1) {
            setInTransit(false);
            setSpeedKmh(14);
            speakAlert(`Ambulance has reached ${activeCity.hospital}. Corridor successfully cleared.`);
            return prev;
          }
          const next = prev + 1;
          // Smooth acceleration as corridor zipper clears traffic
          setSpeedKmh((s) => Math.min(s + 6, 52));
          recalculateAlert(next, selectedVehicleId);
          return next;
        });
      }, 3000);
    } else {
      if (transitTimerRef.current) {
        clearInterval(transitTimerRef.current);
      }
    }

    return () => {
      if (transitTimerRef.current) clearInterval(transitTimerRef.current);
    };
  }, [inTransit, speedKmh, selectedVehicleId, route, activeCity]);

  // Handlers
  const handleToggleTransit = () => {
    if (!inTransit) {
      setCurrentStep(0);
      setInTransit(true);
      setSpeedKmh(24);
      lastSpokenZoneRef.current = null;
      speakAlert(`Emergency corridor broadcast activated on Google Maps for ${activeCity.name}. Priority route locked.`);
    } else {
      setInTransit(false);
      setSpeedKmh(14);
      if (transitTimerRef.current) clearInterval(transitTimerRef.current);
    }
  };

  const handleReset = () => {
    setInTransit(false);
    setCurrentStep(0);
    setSpeedKmh(14);
    lastSpokenZoneRef.current = null;
    recalculateAlert(0, selectedVehicleId);
  };

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    recalculateAlert(currentStep, id);
  };

  // City preset selection
  const handleSelectCity = (city: CityPreset) => {
    setActiveCity(city);
    setCurrentStep(0);
    setInTransit(false);
    lastSpokenZoneRef.current = null;
    recalculateAlert(0, selectedVehicleId);
  };

  // Geolocation detector for user location (Hardware GPS with automatic Network IP Fallback)
  const handleRequestUserGPS = () => {
    setLocationNotice({
      type: 'info',
      message: 'Detecting device location...',
    });

    const fallbackToIp = async () => {
      try {
        setLocationNotice({
          type: 'info',
          message: 'Device GPS restricted in iframe. Resolving location via Network IP...',
        });
        const res = await fetch('/api/my-location');
        const data = await res.json();
        if (data && data.lat && data.lng) {
          const locTitle = data.city ? `${data.city}, ${data.country}` : 'Your Network Location';
          const customCorridor = generateCustomCorridor(data.lat, data.lng, `${data.city || 'Local'} Emergency Corridor`);
          setCitiesList((prev) => [customCorridor, ...prev.filter((c) => c.id !== 'custom-location')]);
          setActiveCity(customCorridor);
          setCurrentStep(0);
          setInTransit(false);
          setLocationNotice({
            type: 'success',
            message: `📍 Detected location via Network IP: ${locTitle} (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}). Generated custom 10km emergency corridor!`,
          });
          speakAlert(`Emergency corridor generated at ${data.city || 'your location'}.`);
          return;
        }
      } catch (e) {
        // Fallback
      }

      const customCorridor = generateCustomCorridor(1.3521, 103.8198, 'Singapore Downtown Corridor');
      setCitiesList((prev) => [customCorridor, ...prev.filter((c) => c.id !== 'custom-location')]);
      setActiveCity(customCorridor);
      setLocationNotice({
        type: 'warning',
        message: 'Could not access device GPS or IP location. Loaded Singapore demonstration. You can click anywhere directly on the Google Map to simulate at that spot!',
      });
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      fallbackToIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const customCorridor = generateCustomCorridor(latitude, longitude, 'Your Device GPS Location');
        setCitiesList((prev) => [customCorridor, ...prev.filter((c) => c.id !== 'custom-location')]);
        setActiveCity(customCorridor);
        setCurrentStep(0);
        setInTransit(false);
        setLocationNotice({
          type: 'success',
          message: `🎯 Hardware GPS Locked (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Generated custom 10km emergency corridor!`,
        });
        speakAlert('Custom emergency corridor generated at your device GPS coordinates.');
      },
      () => {
        // In iframe previews, permissions policy blocks GPS: immediately fallback to Network IP
        fallbackToIp();
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 60000,
      }
    );
  };

  // Search any location worldwide via geocoding
  const handleSearchLocation = async (query: string) => {
    if (!query || !query.trim()) return;
    try {
      setLocationNotice({
        type: 'info',
        message: `Searching coordinates for "${query.trim()}"...`,
      });
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok && data.lat && data.lng) {
        const customCorridor = generateCustomCorridor(data.lat, data.lng, data.displayName || query);
        setCitiesList((prev) => [customCorridor, ...prev.filter((c) => c.id !== 'custom-location')]);
        setActiveCity(customCorridor);
        setCurrentStep(0);
        setInTransit(false);
        setLocationNotice({
          type: 'success',
          message: `📍 Located "${data.displayName || query}" (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}). Generated custom emergency corridor!`,
        });
        speakAlert(`Emergency corridor generated at ${data.displayName || query}.`);
      } else {
        setLocationNotice({
          type: 'warning',
          message: data.error || `Could not find "${query}". Please check spelling or try another city name.`,
        });
      }
    } catch (e: any) {
      setLocationNotice({
        type: 'warning',
        message: `Search request error: ${e.message}`,
      });
    }
  };

  // Point-to-point corridor generator between two locations
  const handlePointToPointRoute = async (origin: string, destination: string) => {
    if (!origin.trim() || !destination.trim()) return;
    try {
      setLocationNotice({
        type: 'info',
        message: `Routing corridor from "${origin}" to "${destination}"...`,
      });
      const resA = await fetch(`/api/geocode?q=${encodeURIComponent(origin.trim())}`);
      const dataA = await resA.json();

      const resB = await fetch(`/api/geocode?q=${encodeURIComponent(destination.trim())}`);
      const dataB = await resB.json();

      if (dataA.lat && dataB.lat) {
        const customCorridor = generatePointToPointCorridor(
          dataA.lat,
          dataA.lng,
          dataA.displayName || origin,
          dataB.lat,
          dataB.lng,
          dataB.displayName || destination
        );
        setCitiesList((prev) => [customCorridor, ...prev.filter((c) => c.id !== customCorridor.id)]);
        setActiveCity(customCorridor);
        setCurrentStep(0);
        setInTransit(false);
        setLocationNotice({
          type: 'success',
          message: `🎯 Emergency Corridor Locked: ${dataA.displayName?.split(',')[0]} ➔ ${dataB.displayName?.split(',')[0]}!`,
        });
        speakAlert(`Emergency corridor generated between ${origin} and ${destination}.`);
      } else {
        setLocationNotice({
          type: 'warning',
          message: 'Could not resolve one or both locations. Please verify spelling.',
        });
      }
    } catch (e: any) {
      setLocationNotice({
        type: 'warning',
        message: `Route error: ${e.message}`,
      });
    }
  };

  // Map click handler to create custom corridor
  const handleMapClick = (lat: number, lng: number) => {
    const customCorridor = generateCustomCorridor(lat, lng, `Custom Point (${lat.toFixed(2)}, ${lng.toFixed(2)})`);
    setCitiesList((prev) => [customCorridor, ...prev.filter((c) => c.id !== 'custom-location')]);
    setActiveCity(customCorridor);
    setCurrentStep(0);
    setLocationNotice({
      type: 'success',
      message: `Emergency origin moved to clicked coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}). Click Start Transit to simulate!`,
    });
    speakAlert('Emergency origin updated to your clicked location.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Google Maps API Alert */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Unable to load Google Maps data. Please check your network connection or API quota.</span>
        </div>
      )}

      {/* Universal Top Bar */}
      <header className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-slate-800/90 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-700 to-red-500 flex items-center justify-center text-white shadow-lg shadow-rose-950">
            <Siren className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white whitespace-nowrap block">
              LifeCorridor
            </span>
            <span className="text-[10px] text-sky-400 font-mono tracking-widest uppercase block -mt-1">
              Google Maps Autonomous Engine
            </span>
          </div>
        </div>

        {/* View Mode Switcher Pills (Commuter POV vs Ambulance POV vs Split Command vs Trauma Bay) */}
        <div className="hidden md:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              silenceAllPOVAudio();
              setViewMode('SPLIT_COMMAND');
              setActiveTab('cockpit');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'SPLIT_COMMAND' && activeTab === 'cockpit'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Dual Command</span>
          </button>

          <button
            onClick={() => {
              silenceAllPOVAudio();
              setViewMode('DRIVER_CABIN_POV');
              setActiveTab('driver_cabin');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'DRIVER_CABIN_POV' && activeTab === 'driver_cabin'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Driver Cabin POV</span>
          </button>

          <button
            onClick={() => {
              silenceAllPOVAudio();
              setViewMode('COMMUTER_MAPS_POV');
              setActiveTab('commuter_pov');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'COMMUTER_MAPS_POV'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Commuter Maps POV</span>
          </button>

          <button
            onClick={() => {
              silenceAllPOVAudio();
              setViewMode('AMBULANCE_POV');
              setActiveTab('ambulance_pov');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'AMBULANCE_POV'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Ambulance Driver POV</span>
          </button>

          <button
            onClick={() => {
              silenceAllPOVAudio();
              setViewMode('HOSPITAL_TRAUMA_BAY');
              setActiveTab('trauma');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'trauma'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hospital className="w-3.5 h-3.5" />
            <span>Trauma Bay</span>
          </button>
        </div>

        {/* Secondary Modules & GitHub / Submission */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              silenceAllPOVAudio();
              setActiveTab('gemini');
            }}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              activeTab === 'gemini'
                ? 'bg-purple-950/70 border-purple-500/80 text-purple-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Gemini Dispatch Lab</span>
          </button>

          <button
            onClick={() => {
              silenceAllPOVAudio();
              setActiveTab('shockwave');
            }}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              activeTab === 'shockwave'
                ? 'bg-amber-950/70 border-amber-500/80 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Shockwave Math</span>
          </button>

          <button
            onClick={() => {
              if (activeTab !== 'cockpit') {
                setActiveTab('cockpit');
                setViewMode('SPLIT_COMMAND');
              }
              setShowTour(!showTour);
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              showTour && activeTab === 'cockpit'
                ? 'bg-sky-950/70 border-sky-500/80 text-sky-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle guided explainer tour and macro-inflow banner"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tour & Sandbox</span>
          </button>

          {/* GitHub Sync & Submission Modal Trigger */}
          <button
            onClick={() => setShowSubmissionModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Sync</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Dynamic Location Notification Toast / Banner */}
        {locationNotice && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs md:text-sm shadow-lg ${
              locationNotice.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : locationNotice.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : 'bg-sky-950/90 border-sky-500/50 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {locationNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : locationNotice.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span className="leading-relaxed">{locationNotice.message}</span>
            </div>
            <button
              onClick={() => setLocationNotice(null)}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white shrink-0"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Interactive Location Selector & Guided Walkthrough (Shown on Dual Command Cockpit) */}
        {showTour && activeTab === 'cockpit' && (
          <>
            <InteractiveTourExplainer
              cities={citiesList}
              activeCity={activeCity}
              onSelectCity={handleSelectCity}
              onRequestUserGPS={handleRequestUserGPS}
              onSearchLocation={handleSearchLocation}
              onPointToPointRoute={handlePointToPointRoute}
              inTransit={inTransit}
              onToggleTransit={handleToggleTransit}
            />

            {/* Macro-Inflow Upstream Starvation Metrics Banner */}
            <MacroInflowWidget
              metrics={macroMetrics}
              inTransit={inTransit}
              activeCityName={activeCity.name}
            />
          </>
        )}

        {/* View Mode: Driver Cabin POV (CSS Windshield Frame Overlay with Google Maps in Center) */}
        {activeTab === 'driver_cabin' && (
          <DriverCabinPOV
            apiKey={mapsApiKey}
            route={route}
            detourRoute={activeCity.detourRoute}
            ambulancePos={ambulancePos}
            commuterPos={commuterPos}
            commuter2Pos={commuter2Pos}
            opposingPos={opposingPos}
            alertState={alertState}
            speedKmh={speedKmh}
            inTransit={inTransit}
            onToggleTransit={handleToggleTransit}
            onTriggerVoice={() => speakAlert(alertState.audioAlert)}
            destinationHospital={activeCity.hospital}
            onMapClick={handleMapClick}
            onApplyCustomCorridor={(customCorridor) => {
              setCitiesList((prev) => [customCorridor, ...prev.filter((c) => c.id !== customCorridor.id)]);
              setActiveCity(customCorridor);
              setCurrentStep(0);
              setInTransit(false);
            }}
          />
        )}

        {/* View Mode 1: Commuter Google Maps In-Car POV */}
        {activeTab === 'commuter_pov' && (
          <CommuterGoogleMapsPOV
            apiKey={mapsApiKey}
            route={route}
            detourRoute={activeCity.detourRoute}
            ambulancePos={ambulancePos}
            commuterPos={commuterPos}
            commuter2Pos={commuter2Pos}
            opposingPos={opposingPos}
            inTransit={inTransit}
            onMapClick={handleMapClick}
            alertState={alertState}
            ambulanceSpeedKmh={speedKmh}
            commuterSpeedKmh={speedKmh < 15 ? 12 : 24}
            selectedCarId={selectedVehicleId}
            onSelectCar={handleSelectVehicle}
            onTriggerVoiceDirective={() => speakAlert(alertState.audioAlert)}
            isVoiceActive={voiceEnabled}
            isAudioDuckingActive={isAudioDuckingActive}
            currentWaypoint={route[Math.min(currentStep, route.length - 1)]}
            destinationHospital={activeCity.hospital}
          />
        )}

        {/* View Mode 2: Ambulance Driver POV */}
        {activeTab === 'ambulance_pov' && (
          <AmbulanceDriverPOV
            apiKey={mapsApiKey}
            inTransit={inTransit}
            speedKmh={speedKmh}
            currentWaypointIndex={currentStep}
            route={route}
            detourRoute={activeCity.detourRoute}
            activeDispatch={activeDispatch}
            distanceToHospitalMeters={distanceToHospitalMeters}
            onToggleTransit={handleToggleTransit}
            goldenHourMinutesSaved={macroMetrics.goldenHourMinutesSaved}
            ambulancePos={ambulancePos}
            commuterPos={commuterPos}
            destinationHospital={activeCity.hospital}
            onMapClick={handleMapClick}
            onApplyCustomCorridor={(customCorridor) => {
              setCitiesList((prev) => [customCorridor, ...prev.filter((c) => c.id !== customCorridor.id)]);
              setActiveCity(customCorridor);
              setCurrentStep(0);
              setInTransit(false);
            }}
          />
        )}

        {/* View Mode 3: Dual Command Center (Split Screen Live Map + Controls) */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6">
            {/* Live Interactive Map Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Live Autonomous Navigation Corridor · {activeCity.corridorName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapEngine(mapEngine === 'google' ? 'leaflet' : 'google')}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700"
                  >
                    Engine: {mapEngine === 'google' ? 'Google Maps Live' : 'Canvas Fallback'}
                  </button>
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`p-1.5 rounded-lg border text-xs ${
                      voiceEnabled
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                    title="Toggle Web Speech Voice Synthesis"
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mapEngine === 'google' ? (
                <GoogleNavigationMap
                  apiKey={mapsApiKey}
                  route={route}
                  detourRoute={activeCity.detourRoute}
                  ambulancePos={ambulancePos}
                  commuterPos={commuterPos}
                  commuter2Pos={commuter2Pos}
                  opposingPos={opposingPos}
                  zoneColor={alertState.colorCode}
                  distanceMeters={alertState.distanceMeters}
                  inTransit={inTransit}
                  onSelectVehicle={handleSelectVehicle}
                  onMapClick={handleMapClick}
                  hospitalName={activeCity.hospital}
                  center={activeCity.center}
                  zoom={activeCity.zoom}
                />
              ) : (
                <NavigationMap
                  route={route}
                  ambulancePos={ambulancePos}
                  commuterPos={commuterPos}
                  commuter2Pos={commuter2Pos}
                  opposingPos={opposingPos}
                  zoneColor={alertState.colorCode}
                  distanceMeters={alertState.distanceMeters}
                  inTransit={inTransit}
                />
              )}
            </div>

            {/* Split Screen: Ambulance Cockpit + Commuter HUD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AmbulanceCockpit
                inTransit={inTransit}
                onToggleTransit={handleToggleTransit}
                speedKmh={speedKmh}
                onChangeSpeed={setSpeedKmh}
                activeDispatch={activeDispatch}
                geminiResult={geminiResult}
                onSelectDispatch={setActiveDispatch}
                allDispatches={dispatches}
              />

              <CommuterHUD
                alertState={alertState}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                onTestVoice={() => speakAlert(alertState.audioAlert)}
                isAudioDuckingActive={isAudioDuckingActive}
                roadSpeedKmh={speedKmh}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={handleSelectVehicle}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Shockwave Deep Dive */}
        {activeTab === 'shockwave' && <ShockwaveDeepDive />}

        {/* Tab 5: Gemini Verifier Lab */}
        {activeTab === 'gemini' && (
          <GeminiVerifierLab
            onVerifyCustomDispatch={async (text: string) => {
              const res = await fetch('/api/verify-emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  dispatchText: text,
                  hospitalId: activeDispatch.hospitalId,
                  ambulanceId: activeDispatch.ambulanceId,
                }),
              });
              const data = await res.json();
              return data.result;
            }}
            initialResult={geminiResult}
          />
        )}

        {/* Tab 6: Trauma Bay Handshake */}
        {activeTab === 'trauma' && (
          <TraumaBayHandshake
            inTransit={inTransit}
            distanceMeters={distanceToHospitalMeters}
          />
        )}
      </main>

      {/* Submission & GitHub Sync Modal */}
      {showSubmissionModal && (
        <SubmissionModal
          isOpen={showSubmissionModal}
          onClose={() => setShowSubmissionModal(false)}
        />
      )}
    </div>
  );
}
