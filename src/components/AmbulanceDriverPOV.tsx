import React, { useState, useEffect, useRef } from 'react';
import {
  Siren,
  Activity,
  Zap,
  Radio,
  Hospital,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Volume2,
  VolumeX,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Play,
  Square,
  MapPin,
  Layers,
  Search,
} from 'lucide-react';
import { CADDispatch, RouteWaypoint, CityPreset } from '../types';
import { GoogleNavigationMap } from './GoogleNavigationMap';
import { generatePointToPointCorridor } from '../utils/cityRoutes';
import { PlaceAutocompleteInput } from './PlaceAutocompleteInput';
import { stopCommuterRadio } from '../utils/audioCoordinator';

interface AmbulanceDriverPOVProps {
  apiKey?: string;
  inTransit: boolean;
  speedKmh: number;
  currentWaypointIndex: number;
  route: RouteWaypoint[];
  detourRoute?: { lat: number; lng: number }[];
  activeDispatch: CADDispatch;
  distanceToHospitalMeters: number;
  onToggleTransit: () => void;
  goldenHourMinutesSaved: number;
  ambulancePos?: { lat: number; lng: number };
  commuterPos?: { lat: number; lng: number };
  destinationHospital?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onApplyCustomCorridor?: (preset: CityPreset) => void;
}

export const AmbulanceDriverPOV: React.FC<AmbulanceDriverPOVProps> = ({
  apiKey = '',
  inTransit,
  speedKmh,
  currentWaypointIndex,
  route,
  detourRoute,
  activeDispatch,
  distanceToHospitalMeters,
  onToggleTransit,
  goldenHourMinutesSaved,
  ambulancePos,
  commuterPos,
  destinationHospital,
  onMapClick,
  onApplyCustomCorridor,
}) => {
  // Point-to-Point Route Inputs
  const [originArea, setOriginArea] = useState('Indiranagar 100ft Road');
  const [destinationArea, setDestinationArea] = useState(destinationHospital || 'Manipal Hospital Level-1 Trauma Bay');
  const [isGeocodingRoute, setIsGeocodingRoute] = useState(false);
  const [routeStatusNotice, setRouteStatusNotice] = useState<string | null>(null);
  // Dispatch Call Workflow: 'DISPATCH_INCOMING' | 'ACCEPTED_VERIFYING' | 'CORRIDOR_ACTIVE'
  const [callStatus, setCallStatus] = useState<'DISPATCH_INCOMING' | 'ACCEPTED_VERIFYING' | 'CORRIDOR_ACTIVE'>(
    inTransit ? 'CORRIDOR_ACTIVE' : 'DISPATCH_INCOMING'
  );

  // Siren Audio & Lightbar states
  const [sirenMode, setSirenMode] = useState<'WAIL' | 'YELP' | 'OFF'>('WAIL');
  const [strobeActive, setStrobeActive] = useState(true);

  // Web Audio Siren Generator
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenOscRef = useRef<OscillatorNode | null>(null);
  const sirenGainRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<number | null>(null);

  const currentWaypoint = route[Math.min(currentWaypointIndex, route.length - 1)];
  const nextWaypoint = route[Math.min(currentWaypointIndex + 1, route.length - 1)];
  const destination = route[route.length - 1];

  // Dynamic clearance statistics
  const vehiclesCleared = inTransit ? Math.min(14 + currentWaypointIndex * 12, 64) : 0;
  const clearancePct = inTransit ? Math.min(48 + currentWaypointIndex * 11, 96) : 0;
  const etaMinutes = Math.max(1, Math.ceil((distanceToHospitalMeters / 1000) / (speedKmh / 60)));

  // Web Audio Siren Sound Generator (Realistic Wail / Yelp)
  const toggleSirenSound = (mode: 'WAIL' | 'YELP' | 'OFF') => {
    setSirenMode(mode);

    if (mode === 'OFF') {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
      if (sirenOscRef.current) {
        try {
          sirenOscRef.current.stop();
          sirenOscRef.current.disconnect();
        } catch (_) {}
        sirenOscRef.current = null;
      }
      return;
    }

    // Isolate POV: stop any commuter radio from playing
    stopCommuterRadio();

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      if (!audioCtxRef.current) return;

      if (!sirenOscRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);

        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);

        osc.start();
        sirenOscRef.current = osc;
        sirenGainRef.current = gain;
      }

      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);

      let rising = true;
      const period = mode === 'WAIL' ? 1200 : 350; // Wail (slow), Yelp (fast)
      const minFreq = 650;
      const maxFreq = mode === 'WAIL' ? 1250 : 1450;

      const sweep = () => {
        if (!audioCtxRef.current || !sirenOscRef.current) return;
        const now = audioCtxRef.current.currentTime;
        sirenOscRef.current.frequency.cancelScheduledValues(now);
        sirenOscRef.current.frequency.setValueAtTime(sirenOscRef.current.frequency.value, now);
        const target = rising ? maxFreq : minFreq;
        sirenOscRef.current.frequency.linearRampToValueAtTime(target, now + period / 1000);
        rising = !rising;
      };

      sweep();
      sirenIntervalRef.current = window.setInterval(sweep, period);
    } catch (e) {
      console.warn('Audio siren error:', e);
    }
  };

  useEffect(() => {
    const handleStopSirens = () => toggleSirenSound('OFF');
    window.addEventListener('stop-all-sirens', handleStopSirens);
    window.addEventListener('stop-all-pov-audio', handleStopSirens);

    return () => {
      toggleSirenSound('OFF');
      window.removeEventListener('stop-all-sirens', handleStopSirens);
      window.removeEventListener('stop-all-pov-audio', handleStopSirens);
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
      if (sirenOscRef.current) {
        try {
          sirenOscRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Handle Accept Dispatch Call & Engage Google Maps LifeCorridor
  const handleAcceptAndEngageCorridor = () => {
    setCallStatus('ACCEPTED_VERIFYING');
    setTimeout(() => {
      setCallStatus('CORRIDOR_ACTIVE');
      if (!inTransit) {
        onToggleTransit();
      }
      toggleSirenSound('WAIL');
    }, 1200);
  };

  // Handle Point-to-Point Custom Corridor for Ambulance
  const handleGenerateAmbulanceRoute = async () => {
    if (!originArea.trim() || !destinationArea.trim()) return;
    setIsGeocodingRoute(true);
    setRouteStatusNotice('Calculating optimal emergency corridor between locations...');

    try {
      const resA = await fetch(`/api/geocode?q=${encodeURIComponent(originArea.trim())}`);
      const dataA = await resA.json();

      const resB = await fetch(`/api/geocode?q=${encodeURIComponent(destinationArea.trim())}`);
      const dataB = await resB.json();

      if (dataA.lat && dataB.lat) {
        const customCorridor = generatePointToPointCorridor(
          dataA.lat,
          dataA.lng,
          dataA.displayName || originArea,
          dataB.lat,
          dataB.lng,
          dataB.displayName || destinationArea
        );

        if (onApplyCustomCorridor) {
          onApplyCustomCorridor(customCorridor);
        }

        setRouteStatusNotice(
          `Emergency Corridor Calculated: ${dataA.displayName?.split(',')[0]} ➔ ${dataB.displayName?.split(',')[0]}`
        );
      } else {
        setRouteStatusNotice('Could not resolve one or both locations. Please verify addresses.');
      }
    } catch (err: any) {
      setRouteStatusNotice('Geocoding service error: ' + err.message);
    } finally {
      setIsGeocodingRoute(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 0. POINT-TO-POINT EMERGENCY ROUTE BAR FOR ANY LOCATION        */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <PlaceAutocompleteInput
            value={originArea}
            onChange={setOriginArea}
            placeholder="Emergency Pickup Location (e.g. Indiranagar)"
            icon="pin"
            className="min-w-[200px]"
            onSelectPlace={(place) => {
              setOriginArea(place.displayName);
            }}
          />

          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

          <PlaceAutocompleteInput
            value={destinationArea}
            onChange={setDestinationArea}
            placeholder="Receiving Hospital (e.g. Manipal Hospital)"
            icon="hospital"
            className="min-w-[200px]"
            onSelectPlace={(place) => {
              setDestinationArea(place.displayName);
            }}
          />

          <button
            onClick={handleGenerateAmbulanceRoute}
            disabled={isGeocodingRoute}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isGeocodingRoute ? 'Routing...' : 'Route Emergency Corridor'}</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setOriginArea('Domlur Flyover, Bengaluru');
              setDestinationArea('Manipal Hospital Old Airport Rd');
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            Bengaluru 108
          </button>
          <button
            onClick={() => {
              setOriginArea('Bundaran HI, Jakarta');
              setDestinationArea('RS Siloam Semanggi');
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            Jakarta 118
          </button>
          <button
            onClick={() => {
              setOriginArea('Marina Bay, Singapore');
              setDestinationArea('Singapore General Hospital');
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
          >
            Singapore 995
          </button>
        </div>
      </div>

      {routeStatusNotice && (
        <div className="bg-sky-950/80 border border-sky-500/50 p-2.5 rounded-xl text-xs text-sky-200 flex items-center justify-between">
          <span>{routeStatusNotice}</span>
          <button onClick={() => setRouteStatusNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 0.5 PROTOCOL WORKFLOW: HOW THE 108 CALL & GOOGLE MAPS WORK   */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Ambulance Driver Standard Operating Protocol (Google Maps LifeCorridor Integration)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-mono font-bold text-red-400 block text-[10px]">PHASE 1: 108 CALL INCOMING</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Hospital Computer-Aided Dispatch (CAD) sends dispatch packet directly to the in-vehicle Google Maps tablet with patient triage code.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-mono font-bold text-amber-400 block text-[10px]">PHASE 2: ONE-CLICK MAP NAVIGATION</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Driver presses <strong className="text-white">"Accept Call"</strong>. Google Maps auto-routes the vehicle with zero typing required while driving.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-mono font-bold text-cyan-400 block text-[10px]">PHASE 3: GEMINI AI ZERO-TRUST</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Gemini verifies hospital CAD token and acoustic siren harmonics (Wail 850Hz) to prevent spoofing before broadcasting corridor.
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-mono font-bold text-emerald-400 block text-[10px]">PHASE 4: 500m MOVING ZIPPER</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Civilian Google Maps navigators ahead receive shockwave commands to merge left/right, opening a clear center zipper lane.
            </p>
          </div>
        </div>
      </div>
      {/* ============================================================ */}
      {/* 1. SCENARIO DISPATCH WORKFLOW: INCOMING 108 CAD CALL CARD     */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border-2 border-red-500/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          {/* Dispatch Call Overview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 animate-bounce" />
                Live Hospital CAD Dispatch Terminal · Unit BLR-108-ALPHA
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/40">
                CRITICAL RESUSCITATION
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              {activeDispatch.hospital} ➔ Emergency Dispatch Call
            </h2>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              <strong className="text-white">CAD Case:</strong> {activeDispatch.text}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Pickup: {route[0].name}
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1">
                <Hospital className="w-3.5 h-3.5 text-rose-400" />
                Destination ED: {destinationHospital || destination.name}
              </span>
            </div>
          </div>

          {/* Action: One-Click Engage LifeCorridor on Google Maps */}
          <div className="flex items-center gap-3 shrink-0">
            {callStatus === 'DISPATCH_INCOMING' && !inTransit ? (
              <button
                onClick={handleAcceptAndEngageCorridor}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm flex items-center gap-2.5 shadow-xl shadow-red-950/60 animate-pulse active:scale-95 transition-all"
              >
                <Siren className="w-5 h-5 fill-current" />
                <span>ACCEPT CALL & ENGAGE LIFECORRIDOR</span>
              </button>
            ) : callStatus === 'ACCEPTED_VERIFYING' ? (
              <div className="px-5 py-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Gemini Verifying Dispatch & Generating Token...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleTransit}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                    inTransit
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Siren className="w-4 h-4 fill-current" />
                  <span>{inTransit ? 'Deactivate Corridor' : 'Resume Emergency Transit'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gemini Zero-Trust Security Verification Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              Gemini Zero-Trust Verification: <strong className="text-emerald-400">AUTHORIZED (Score 9.8/10)</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">
              Siren Acoustic Harmonics: <strong className="text-cyan-400">WAIL 850 Hz Match</strong>
            </span>
          </div>
          <div className="text-slate-400">
            Dispatch Token: <code className="text-sky-300 font-bold">TOKEN-GEMINI-CAD-2026-X99</code>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. AMBULANCE IN-DASH COCKPIT WITH LIVE GOOGLE MAPS NAVIGATION */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ambulance Cockpit Telemetry & Real-Time Moving Zipper HUD */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Card 1: Live Moving 500m Zipper Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Live Moving Zipper Corridor Ahead
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {clearancePct}% Cleared Ahead
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Moving Zipper Buffer:</span>
                <span className="font-mono font-bold text-cyan-300">500m Ahead of Ambulance</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Civilian Vehicles Parted:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {vehiclesCleared} cars displaced into zipper
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Target Lane Channel:</span>
                <span className="font-mono font-bold text-white">Center Highway Channel</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Next Junction Signal:</span>
                <span className="font-mono font-bold text-emerald-400">
                  GREEN (+35s phase extension)
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${clearancePct}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0m (Contact)</span>
                <span>500m (Zipper Buffer)</span>
                <span>1000m (Lead Flush)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Siren & Lightbar Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                Acoustic Siren & Emergency Strobes
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                Real Audio
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => toggleSirenSound('WAIL')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  sirenMode === 'WAIL'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950 scale-105'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Wail (650-1250Hz)</span>
              </button>

              <button
                onClick={() => toggleSirenSound('YELP')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  sirenMode === 'YELP'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950 scale-105'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Yelp (High-Speed)</span>
              </button>

              <button
                onClick={() => toggleSirenSound('OFF')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  sirenMode === 'OFF'
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <VolumeX className="w-4 h-4" />
                <span>Siren Mute</span>
              </button>
            </div>

            {/* Visual Strobe Bar */}
            <div className="mt-3 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">ROOFTOP DUAL STROBE:</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded-full bg-cyan-400 animate-ping"></div>
                <div className="w-6 h-3 rounded-full bg-red-500 animate-ping"></div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold ml-1">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Card 3: Dynamic Hospital Trauma Bay ETA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {destinationHospital || destination.name}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Trauma Bay 1 Mobilized · Golden Hour Saved: +{goldenHourMinutesSaved}m
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xl font-black font-mono text-rose-400 block leading-none">
                {etaMinutes} MIN
              </span>
              <span className="text-[9px] font-mono text-slate-400">DYNAMIC ETA</span>
            </div>
          </div>
        </div>

        {/* Right: Live Google Maps In-Dash Navigation Display */}
        <div className="lg:col-span-7 bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Google Maps Autonomous Navigation Display (Unit BLR-108-ALPHA)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Velocity:</span>
              <span className="text-cyan-400 font-bold text-sm">{speedKmh} km/h</span>
            </div>
          </div>

          {/* Live Google Maps Canvas */}
          <div className="h-[460px] w-full rounded-2xl overflow-hidden mt-3 relative border border-slate-800">
            {apiKey ? (
              <GoogleNavigationMap
                apiKey={apiKey}
                route={route}
                detourRoute={detourRoute}
                ambulancePos={ambulancePos || { lat: route[currentWaypointIndex].lat, lng: route[currentWaypointIndex].lng }}
                commuterPos={commuterPos || { lat: route[Math.min(currentWaypointIndex + 2, route.length - 1)].lat, lng: route[Math.min(currentWaypointIndex + 2, route.length - 1)].lng }}
                zoneColor="RED"
                distanceMeters={distanceToHospitalMeters}
                inTransit={inTransit}
                hospitalName={destinationHospital || destination.name}
                onMapClick={onMapClick}
                zoom={15}
                className="h-full w-full rounded-none border-none"
              />
            ) : (
              <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-mono">
                Google Maps API Loading...
              </div>
            )}

            {/* Floating In-Cab HUD Guidance Overlay */}
            <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-red-500/50 shadow-xl pointer-events-none z-20">
              <span className="text-[10px] uppercase font-mono font-bold text-red-400 block">
                CORRIDOR BROADCAST
              </span>
              <span className="text-xs font-black text-white font-mono">
                AUTONOMOUS ZIPPER CLEARANCE ENGAGED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
