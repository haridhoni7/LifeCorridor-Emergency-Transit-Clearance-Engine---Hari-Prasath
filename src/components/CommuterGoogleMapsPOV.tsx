import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Compass,
  Volume2,
  VolumeX,
  Volume1,
  AlertTriangle,
  ShieldAlert,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Radio,
  Car,
  Disc3,
  Sparkles,
  Maximize2,
  Layers,
  ArrowLeftRight,
  RotateCcw,
  Play,
  Square,
  FastForward,
  CheckCircle2,
  Gauge,
  Sliders,
  MapPin,
} from 'lucide-react';
import { CorridorAlertState, RouteWaypoint } from '../types';
import { inCabinAudio } from '../utils/audioDuckingEngine';
import { stopAllSirens } from '../utils/audioCoordinator';
import { GoogleNavigationMap } from './GoogleNavigationMap';

interface CommuterGoogleMapsPOVProps {
  apiKey?: string;
  route?: RouteWaypoint[];
  detourRoute?: { lat: number; lng: number }[];
  ambulancePos?: { lat: number; lng: number; heading?: number };
  commuterPos?: { lat: number; lng: number; heading?: number };
  commuter2Pos?: { lat: number; lng: number };
  opposingPos?: { lat: number; lng: number };
  inTransit?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  alertState: CorridorAlertState;
  ambulanceSpeedKmh: number;
  commuterSpeedKmh: number;
  selectedCarId: string;
  onSelectCar: (carId: string) => void;
  onTriggerVoiceDirective: () => void;
  isVoiceActive: boolean;
  isAudioDuckingActive: boolean;
  currentWaypoint?: RouteWaypoint;
  destinationHospital: string;
}

export const CommuterGoogleMapsPOV: React.FC<CommuterGoogleMapsPOVProps> = ({
  apiKey = '',
  route = [],
  detourRoute,
  ambulancePos = { lat: 12.9580, lng: 77.6585 },
  commuterPos = { lat: 12.9620, lng: 77.6520 },
  commuter2Pos,
  opposingPos,
  inTransit = false,
  onMapClick,
  alertState,
  ambulanceSpeedKmh,
  commuterSpeedKmh,
  selectedCarId,
  onSelectCar,
  onTriggerVoiceDirective,
  isVoiceActive,
  isAudioDuckingActive,
  currentWaypoint,
  destinationHospital,
}) => {
  // Lane Selection: Lane 1 (Left/Shoulder), Lane 2 (Center), Lane 3 (Right/Divider)
  const [commuterLane, setCommuterLane] = useState<'LANE_1_LEFT' | 'LANE_2_CENTER' | 'LANE_3_RIGHT'>('LANE_1_LEFT');

  // Steering wheel angle (-30 to +30)
  const [manualWheelAngle, setManualWheelAngle] = useState<number | null>(null);

  // Radio audio playback state & volume ducking
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [currentVolumePct, setCurrentVolumePct] = useState(100);
  const [currentDbAttenuation, setCurrentDbAttenuation] = useState(0);

  // Custom Point-to-Point Pursuit Scrubber
  // Simulates ambulance distance behind: from 4500m down to -500m (overtaken)
  const [simDistanceMeters, setSimDistanceMeters] = useState<number>(alertState.distanceMeters || 420);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const simTimerRef = useRef<number | null>(null);

  // Sync with prop when not manually overriding
  useEffect(() => {
    if (!isAutoSimulating) {
      setSimDistanceMeters(alertState.distanceMeters);
    }
  }, [alertState.distanceMeters, isAutoSimulating]);

  // Derived zone & directives from simulation distance and lane
  const effectiveDistance = simDistanceMeters;
  const isOvertaken = effectiveDistance <= 0;
  const isZone1 = !isOvertaken && effectiveDistance <= 500;
  const isZone2 = !isOvertaken && effectiveDistance > 500 && effectiveDistance <= 3000;
  const isZone3 = !isOvertaken && effectiveDistance > 3000 && effectiveDistance <= 10000;
  const isZoneClear = isOvertaken || effectiveDistance > 10000;

  // Zipper Direction: Left vs Right
  const isRightLane = commuterLane === 'LANE_3_RIGHT';
  const zipperDirective = isZone1
    ? isRightLane
      ? 'MERGE_RIGHT_NOW'
      : 'MERGE_LEFT_NOW'
    : isZone2
    ? 'MAINTAIN_2M_GAP'
    : isZone3
    ? 'FLUSH_FORWARD'
    : 'NORMAL_NAVIGATION';

  // Target Wheel Angle: -30 for left merge, +30 for right merge, 0 for clear
  const autoWheelAngle = isZone1 || isZone2 ? (isRightLane ? 30 : -30) : 0;
  const effectiveWheelAngle = manualWheelAngle !== null ? manualWheelAngle : autoWheelAngle;

  // Audio Ducking Levels:
  // Normal: 100% (0 dB)
  // Zone 2: 60% (-6 dB)
  // Zone 1: 15% (-18 dB)
  const targetVolumePct = isZone1 ? 15 : isZone2 ? 60 : 100;
  const targetDb = isZone1 ? -18 : isZone2 ? -6 : 0;

  // Listen to audio ducking changes
  useEffect(() => {
    inCabinAudio.setVolumeCallback((vol, db, ducked) => {
      setCurrentVolumePct(Math.round(vol * 100));
      setCurrentDbAttenuation(db);
    });
  }, []);

  // Update audio ducking when zone changes
  useEffect(() => {
    if (isZone1) {
      inCabinAudio.duck(0.15, 0);
      setCurrentVolumePct(15);
      setCurrentDbAttenuation(-18);
    } else if (isZone2) {
      inCabinAudio.duck(0.6, 0);
      setCurrentVolumePct(60);
      setCurrentDbAttenuation(-6);
    } else {
      inCabinAudio.restore();
      setCurrentVolumePct(100);
      setCurrentDbAttenuation(0);
    }
  }, [isZone1, isZone2]);

  // Point-to-Point Pursuit Simulation Loop
  useEffect(() => {
    if (isAutoSimulating) {
      simTimerRef.current = window.setInterval(() => {
        setSimDistanceMeters((prev) => {
          if (prev <= -600) {
            setIsAutoSimulating(false);
            return 4500; // Reset
          }
          // Decrement distance as ambulance catches up
          const step = prev > 1500 ? 300 : prev > 600 ? 150 : 60;
          return prev - step;
        });
      }, 500);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isAutoSimulating]);

  // Stop radio on unmount or when leaving tab / POV
  useEffect(() => {
    const handleSilence = () => {
      inCabinAudio.stopRadio();
      setIsRadioPlaying(false);
    };
    window.addEventListener('stop-all-pov-audio', handleSilence);
    return () => {
      inCabinAudio.stopRadio();
      setIsRadioPlaying(false);
      window.removeEventListener('stop-all-pov-audio', handleSilence);
    };
  }, []);

  // Toggle Radio
  const handleToggleRadio = () => {
    if (isRadioPlaying) {
      inCabinAudio.stopRadio();
      setIsRadioPlaying(false);
    } else {
      // Cleanly isolate POV: stop any sirens from ambulance views
      stopAllSirens();
      inCabinAudio.startRadio();
      setIsRadioPlaying(true);
    }
  };

  // Trigger test audio ducking
  const handleTestDucking = () => {
    inCabinAudio.duck(0.15, 3000);
    onTriggerVoiceDirective();
  };

  return (
    <div className="space-y-6">
      {/* Simulation Controls & Lane Selector Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Lane Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Your Car Lane:
          </span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setCommuterLane('LANE_1_LEFT');
                setManualWheelAngle(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                commuterLane === 'LANE_1_LEFT'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lane 1 (Left / Shoulder)
            </button>
            <button
              onClick={() => {
                setCommuterLane('LANE_2_CENTER');
                setManualWheelAngle(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                commuterLane === 'LANE_2_CENTER'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lane 2 (Center)
            </button>
            <button
              onClick={() => {
                setCommuterLane('LANE_3_RIGHT');
                setManualWheelAngle(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                commuterLane === 'LANE_3_RIGHT'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Lane 3 (Right / Divider)
            </button>
          </div>
        </div>

        {/* Center: Point-to-Point Distance Scrubber */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
            Ambulance: <strong className="text-white">{effectiveDistance > 0 ? `${effectiveDistance}m Behind` : 'Overtaken Ahead'}</strong>
          </span>
          <input
            type="range"
            min="-500"
            max="4500"
            step="50"
            value={effectiveDistance}
            onChange={(e) => {
              setSimDistanceMeters(Number(e.target.value));
              setManualWheelAngle(null);
            }}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Right: Auto Pursuit Simulator Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoSimulating(!isAutoSimulating)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isAutoSimulating
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isAutoSimulating ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Stop Pursuit</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Ambulance Approach</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setSimDistanceMeters(450);
              setManualWheelAngle(null);
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            title="Jump to Zone 1 Critical Contact"
          >
            Jump 400m
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN VEHICLE COCKPIT: WINDSHIELD (TOP) + DASHBOARD (BOTTOM) */}
      {/* ============================================================ */}
      <div className="relative bg-slate-950 rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden">
        {/* ========================================================== */}
        {/* 1. CAR WINDSHIELD (LOOKING THROUGH FRONT GLASS)           */}
        {/* ========================================================== */}
        <div className="relative h-72 md:h-80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden border-b-8 border-slate-900 select-none">
          {/* Distant City Skyline & Night Horizon */}
          <div className="absolute top-0 inset-x-0 h-28 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/40 via-slate-950 to-transparent"></div>
          <div className="absolute top-12 inset-x-0 h-10 flex items-end justify-between px-12 opacity-30 text-slate-600">
            <div className="h-6 w-12 bg-slate-800 rounded-t"></div>
            <div className="h-10 w-16 bg-slate-800 rounded-t"></div>
            <div className="h-8 w-14 bg-slate-800 rounded-t"></div>
            <div className="h-12 w-20 bg-slate-800 rounded-t"></div>
            <div className="h-7 w-12 bg-slate-800 rounded-t"></div>
          </div>

          {/* Windshield Curved Frame & Glass Glare Highlights */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-cyan-500/[0.03] via-transparent to-white/[0.05]"></div>
          <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none"></div>

          {/* -------------------------------------------------------- */}
          {/* REARVIEW MIRROR (MOUNTED AT TOP CENTER OF WINDSHIELD)    */}
          {/* -------------------------------------------------------- */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
            {/* Mirror Mount Arm */}
            <div className="w-3 h-3 bg-slate-800 mx-auto rounded-t-sm shadow-md"></div>
            {/* Mirror Frame & Reflected Road View Behind */}
            <div
              className={`w-64 md:w-72 h-16 bg-slate-950 rounded-2xl border-2 px-3 py-1 flex items-center justify-between shadow-2xl overflow-hidden transition-all duration-300 ${
                isZone1
                  ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse'
                  : isZone2
                  ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  : 'border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                  REARVIEW
                </span>
                {isZone1 && (
                  <span className="px-1.5 py-0.2 bg-red-600 text-white rounded font-mono text-[9px] font-black animate-ping">
                    SIREN
                  </span>
                )}
              </div>

              {/* Reflected Approaching Ambulance in the Mirror */}
              <div className="relative flex items-center justify-center">
                {effectiveDistance > 3000 ? (
                  <span className="text-[10px] text-slate-500 font-mono">Distant traffic behind</span>
                ) : effectiveDistance > 0 ? (
                  <div className="flex items-center gap-2">
                    <div
                      className={`relative flex items-center justify-center transition-transform duration-500 ${
                        isZone1 ? 'scale-125' : isZone2 ? 'scale-90' : 'scale-75'
                      }`}
                    >
                      {/* Ambulance Front in Mirror */}
                      <div className="w-10 h-7 rounded bg-red-600 border border-white flex items-center justify-center shadow-lg relative overflow-hidden">
                        <span className="text-[7px] font-black text-white font-mono">108</span>
                        {/* Flashing Strobe Lights in Mirror */}
                        <div className="absolute top-0 left-0 w-3 h-1.5 bg-cyan-400 animate-ping"></div>
                        <div className="absolute top-0 right-0 w-3 h-1.5 bg-red-400 animate-ping"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-black block leading-none ${
                          isZone1 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                        }`}
                      >
                        {effectiveDistance}m
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono">CLOSING IN</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASSED AHEAD</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* 3D PERSPECTIVE ROAD WITH TRAFFIC & DYNAMIC ZIPPER        */}
          {/* -------------------------------------------------------- */}
          <div className="absolute inset-x-8 bottom-0 top-14 flex justify-center">
            {/* The Highway Trapezoid (Narrow at horizon, wide at bottom) */}
            <div className="relative w-full max-w-2xl h-full overflow-hidden flex justify-center items-end">
              {/* Asphalt Road Surface */}
              <div
                className="w-full h-full bg-slate-900 border-x-4 border-slate-700 relative"
                style={{
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                }}
              >
                {/* Lane Divider 1 (Left / Center) */}
                <div className="absolute top-0 bottom-0 left-[38%] w-1 border-r-2 border-dashed border-amber-400/50"></div>
                {/* Lane Divider 2 (Center / Right) */}
                <div className="absolute top-0 bottom-0 right-[38%] w-1 border-r-2 border-dashed border-amber-400/50"></div>

                {/* Road Horizon Line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-slate-700"></div>

                {/* Open Center Zipper Corridor Illumination */}
                {(isZone1 || isZone2) && (
                  <div className="absolute top-0 bottom-0 left-[38%] right-[38%] bg-gradient-to-b from-red-600/10 via-red-500/20 to-red-600/30 border-x border-red-500/40 flex flex-col items-center justify-center animate-pulse">
                    <span className="text-[10px] font-black text-red-300 font-mono tracking-widest uppercase">
                      CENTER ZIPPER ACTIVE
                    </span>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* TRAFFIC VEHICLES AHEAD THROUGH THE GLASS              */}
                {/* ---------------------------------------------------- */}

                {/* CAR 1: Left Lane Civilian Car (Shifts Left in Zone 1) */}
                <div
                  className={`absolute transition-all duration-700 flex flex-col items-center ${
                    isZone1
                      ? 'bottom-8 left-[12%] -translate-x-4'
                      : 'bottom-8 left-[18%]'
                  }`}
                >
                  <div className="relative">
                    <div className="w-14 h-11 bg-slate-300 border-2 border-slate-400 rounded-t-lg rounded-b-md shadow-xl flex items-center justify-center relative">
                      <span className="text-[9px] font-bold text-slate-800 font-mono">KA-03</span>
                      {/* Left Amber Blinker when parting */}
                      {isZone1 && (
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
                      )}
                    </div>
                    {/* Rear Red Taillights */}
                    <div className="flex justify-between px-1 -mt-1">
                      <div className="w-2.5 h-1.5 bg-red-600 rounded-sm"></div>
                      <div className="w-2.5 h-1.5 bg-red-600 rounded-sm"></div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-slate-300 mt-0.5 bg-slate-950/80 px-1 rounded">
                    {isZone1 ? '⬅ HUGGING CURB' : 'CIVILIAN'}
                  </span>
                </div>

                {/* CAR 2: Right Lane Civilian SUV (Shifts Right in Zone 1) */}
                <div
                  className={`absolute transition-all duration-700 flex flex-col items-center ${
                    isZone1
                      ? 'bottom-9 right-[12%] translate-x-4'
                      : 'bottom-9 right-[18%]'
                  }`}
                >
                  <div className="relative">
                    <div className="w-16 h-12 bg-sky-900 border-2 border-sky-400 rounded-t-lg rounded-b-md shadow-xl flex items-center justify-center relative">
                      <span className="text-[9px] font-bold text-white font-mono">KA-04</span>
                      {/* Right Amber Blinker when parting */}
                      {isZone1 && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></div>
                      )}
                    </div>
                    {/* Rear Red Taillights */}
                    <div className="flex justify-between px-1 -mt-1">
                      <div className="w-3 h-1.5 bg-red-600 rounded-sm"></div>
                      <div className="w-3 h-1.5 bg-red-600 rounded-sm"></div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-slate-300 mt-0.5 bg-slate-950/80 px-1 rounded">
                    {isZone1 ? 'DIVIDER YIELD ➡' : 'CIVILIAN'}
                  </span>
                </div>

                {/* AMBULANCE ZOOMING THROUGH CENTER (When overtaking <= 0m or close) */}
                {effectiveDistance <= 150 && (
                  <div
                    className={`absolute transition-all duration-1000 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 ${
                      effectiveDistance <= 0
                        ? 'top-4 scale-75 opacity-90' // Zooming ahead into the distance
                        : 'bottom-16 scale-125' // Just overtaking right next to commuter
                    }`}
                  >
                    <div className="relative">
                      <div className="w-20 h-16 bg-red-600 border-2 border-white rounded-t-xl rounded-b-md shadow-[0_0_40px_rgba(239,68,68,0.9)] flex items-center justify-center relative">
                        <span className="text-xs font-black text-white font-mono">108 ALPHA</span>
                        {/* Blazing Red & Blue Emergency Strobe Bar */}
                        <div className="absolute -top-3 inset-x-2 h-3 rounded-full bg-gradient-to-r from-cyan-400 via-white to-red-500 shadow-[0_0_20px_#38bdf8] animate-ping"></div>
                      </div>
                      <div className="flex justify-between px-2 -mt-1">
                        <div className="w-3.5 h-2 bg-yellow-300 rounded-sm animate-pulse"></div>
                        <div className="w-3.5 h-2 bg-yellow-300 rounded-sm animate-pulse"></div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-red-300 mt-1 bg-red-950 px-2 py-0.5 rounded border border-red-500 font-mono animate-bounce">
                      ⚡ AMBULANCE CLEARED THROUGH CENTER ⚡
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* WINDSHIELD AR HEADS-UP DISPLAY (AR HUD PROJECTION)       */}
          {/* -------------------------------------------------------- */}
          <div className="absolute bottom-3 inset-x-8 flex items-center justify-between pointer-events-none z-20">
            {/* Left HUD: Speed & Corridor Guidance */}
            <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-cyan-400 font-mono text-xs flex items-center gap-2">
              <Compass className="w-3.5 h-3.5" />
              <span>HEAD-UP DISPLAY: {commuterSpeedKmh} KM/H</span>
            </div>

            {/* Center Dynamic HUD AR Warning Arrow */}
            {isZone1 && (
              <div className="px-4 py-1.5 rounded-xl bg-red-600/90 text-white font-black text-xs md:text-sm tracking-wider flex items-center gap-2 border border-white/40 shadow-[0_0_30px_rgba(239,68,68,0.9)] animate-bounce">
                {isRightLane ? (
                  <>
                    <span>MERGE RIGHT AGAINST DIVIDER</span>
                    <CornerUpRight className="w-5 h-5 stroke-[3]" />
                  </>
                ) : (
                  <>
                    <CornerUpLeft className="w-5 h-5 stroke-[3]" />
                    <span>MERGE LEFT TO HUG SHOULDER</span>
                  </>
                )}
              </div>
            )}

            {isZone2 && (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-600/90 text-white font-bold text-xs tracking-wider flex items-center gap-2 border border-white/30 shadow-lg">
                <AlertTriangle className="w-4 h-4" />
                <span>LEAVE 2M GAP · BIAS STEERING {isRightLane ? '30° RIGHT' : '30° LEFT'}</span>
              </div>
            )}

            {/* Right HUD: Navigation Target */}
            <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 font-mono text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{destinationHospital}</span>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* 2. THE CAR DASHBOARD (LOWER COCKPIT CONSOLE)              */}
        {/* ========================================================== */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* -------------------------------------------------------- */}
          {/* LEFT WING: THE STEERING WHEEL                           */}
          {/* -------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col items-center text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
              Cockpit Steering Angle
            </span>

            {/* Interactive Steering Wheel Graphic */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full border-8 border-slate-700 bg-slate-900 shadow-2xl relative flex items-center justify-center transition-transform duration-500 ease-out cursor-pointer hover:border-slate-600"
                style={{ transform: `rotate(${effectiveWheelAngle}deg)` }}
                onClick={() => setManualWheelAngle(effectiveWheelAngle === 0 ? (isRightLane ? 30 : -30) : 0)}
                title="Click steering wheel to toggle angle"
              >
                {/* Horizontal Spoke */}
                <div className="absolute inset-x-2 h-4 bg-slate-800 rounded"></div>
                {/* Center Hub */}
                <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-600 flex items-center justify-center text-white z-10 shadow-inner">
                  <span className="text-[9px] font-black font-mono">SRS</span>
                </div>
                {/* Top Grip Indicator Tape */}
                <div
                  className={`absolute -top-1 w-4 h-2.5 rounded ${
                    effectiveWheelAngle !== 0 ? 'bg-amber-400' : 'bg-slate-500'
                  }`}
                ></div>
              </div>

              {/* Wheel Angle Badge */}
              <div className="absolute -bottom-2 bg-slate-950 border border-slate-700 px-2 py-0.5 rounded-full font-mono text-[10px] text-amber-300 font-bold">
                {effectiveWheelAngle > 0
                  ? `+${effectiveWheelAngle}° RIGHT`
                  : effectiveWheelAngle < 0
                  ? `${effectiveWheelAngle}° LEFT`
                  : '0° CENTER'}
              </div>
            </div>

            {/* Wheel Angle Manual Quick Buttons */}
            <div className="flex items-center gap-1.5 mt-4">
              <button
                onClick={() => setManualWheelAngle(-30)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  effectiveWheelAngle === -30
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                -30° Left
              </button>
              <button
                onClick={() => setManualWheelAngle(0)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  effectiveWheelAngle === 0
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                0° Ctr
              </button>
              <button
                onClick={() => setManualWheelAngle(30)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  effectiveWheelAngle === 30
                    ? 'bg-purple-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                +30° Right
              </button>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* CENTER: GOOGLE MAPS IN-CAR DASHBOARD DISPLAY (ANDROID AUTO) */}
          {/* -------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col select-none">
            {/* Google Maps Turn-By-Turn Navigation Header */}
            <div
              className={`p-3.5 text-white transition-colors duration-500 ${
                isZone1
                  ? 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800 animate-pulse'
                  : isZone2
                  ? 'bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800'
                  : isZone3
                  ? 'bg-gradient-to-r from-yellow-700 via-amber-600 to-yellow-800'
                  : 'bg-emerald-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    {isZone1 ? (
                      isRightLane ? (
                        <CornerUpRight className="w-5 h-5 text-white stroke-[2.5]" />
                      ) : (
                        <CornerUpLeft className="w-5 h-5 text-white stroke-[2.5]" />
                      )
                    ) : isZone2 ? (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    ) : (
                      <ArrowUp className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-xl font-black tracking-tight leading-none block">
                      {isZone1
                        ? isRightLane
                          ? 'MERGE RIGHT NOW'
                          : 'MERGE LEFT NOW'
                        : isZone2
                        ? 'IN 300m: PRE-ANGLE WHEELS'
                        : isZone3
                        ? 'CHOKEPOINT FLUSH AHEAD'
                        : 'IN 450m: KEEP STRAIGHT'}
                    </span>
                    <span className="text-xs font-semibold text-white/90 block mt-0.5">
                      {isZone1
                        ? isRightLane
                          ? 'Hug divider to clear center zipper for ambulance'
                          : 'Hug shoulder to clear center zipper for ambulance'
                        : isZone2
                        ? 'Stop tailgating · Leave 2-meter turning gap'
                        : currentWaypoint?.name || 'Old Airport Road Emergency Transit Corridor'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-black text-white/80 block">LIMIT 50</span>
                  <span className="text-lg font-black font-mono leading-none">
                    {commuterSpeedKmh}{' '}
                    <span className="text-[10px] font-normal font-sans">km/h</span>
                  </span>
                </div>
              </div>

              {/* Lane Guidance Bar */}
              <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      commuterLane === 'LANE_1_LEFT'
                        ? isZone1
                          ? 'bg-white text-red-700 animate-bounce'
                          : 'bg-white text-emerald-800'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    LANE 1 (LEFT)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      isZone1
                        ? 'bg-red-950 text-red-300 line-through border border-red-400/40'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    CENTER (ZIPPER)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      commuterLane === 'LANE_3_RIGHT'
                        ? isZone1
                          ? 'bg-white text-purple-700 animate-bounce'
                          : 'bg-white text-emerald-800'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    LANE 3 (RIGHT)
                  </span>
                </div>
                <span className="text-[10px] text-white/80">GOOGLE MAPS</span>
              </div>
            </div>

            {/* Embedded Live Google Maps View (In-Car Navigation Screen) */}
            <div className="w-full h-[380px] relative border-b border-slate-800 bg-slate-950">
              <GoogleNavigationMap
                apiKey={apiKey}
                route={route}
                detourRoute={detourRoute}
                ambulancePos={ambulancePos}
                commuterPos={commuterPos}
                commuter2Pos={commuter2Pos}
                opposingPos={opposingPos}
                zoneColor={alertState.colorCode}
                distanceMeters={effectiveDistance}
                inTransit={inTransit}
                hospitalName={destinationHospital}
                onMapClick={onMapClick}
                zoom={15}
                className="h-full w-full rounded-none border-none"
              />
            </div>

            {/* Dashboard Navigation Mini-Display */}
            <div className="p-3.5 bg-slate-950 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-emerald-400">8 min</span>
                  <span className="text-slate-400">(2.8 km)</span>
                  <span className="text-[10px] font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
                    Dense Gridlock
                  </span>
                </div>
                <button
                  onClick={onTriggerVoiceDirective}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak Alert</span>
                </button>
              </div>

              {/* Dynamic Emergency Status Callout */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isZone1
                    ? 'bg-red-950/70 border-red-500/60 text-red-200'
                    : isZone2
                    ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert
                    className={`w-4 h-4 shrink-0 ${
                      isZone1 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                    }`}
                  />
                  <div>
                    <span className="font-bold block text-[11px] uppercase tracking-wider">
                      {isZone1
                        ? 'Zone 1: Critical Clearance'
                        : isZone2
                        ? 'Zone 2: Elastic Buffer Active'
                        : 'Google Maps LifeCorridor'}
                    </span>
                    <span className="text-[10px] text-slate-300 block">
                      {isZone1
                        ? `Ambulance ${effectiveDistance}m behind in corridor`
                        : isZone2
                        ? 'Leave 2-meter gap · Wheel bias active'
                        : 'Normal civilian transit active'}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-white">
                  {effectiveDistance > 0 ? `${effectiveDistance}m` : 'OVERTAKEN'}
                </span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* RIGHT WING: IN-CABIN RADIO & REAL AUDIO FOCUS DUCKING    */}
          {/* -------------------------------------------------------- */}
          <div className="lg:col-span-4 bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between">
            <div>
              {/* Entertainment Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">In-Vehicle Radio / Spotify</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Bluetooth Car Audio
                </span>
              </div>

              {/* Live Audio Equalizer Bars (Ducks down to 15% when alert triggers!) */}
              <div className="mt-3 bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-400">MEDIA AUDIO SPECTRUM</span>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                    <span
                      className={`${
                        currentVolumePct < 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                      }`}
                    >
                      {currentVolumePct}% VOL ({currentDbAttenuation} dB)
                    </span>
                  </div>
                </div>

                {/* Animated Equalizer Frequency Bars */}
                <div className="h-10 flex items-end justify-between gap-1.5 px-2">
                  {[45, 80, 65, 95, 75, 55, 90, 70, 85, 60, 40, 75].map((height, i) => {
                    const scaledHeight = (height * currentVolumePct) / 100;
                    return (
                      <div
                        key={i}
                        className={`w-full rounded-t transition-all duration-200 ${
                          currentVolumePct < 30
                            ? 'bg-red-500/80'
                            : currentVolumePct < 70
                            ? 'bg-amber-400/80'
                            : 'bg-emerald-400/80'
                        }`}
                        style={{ height: `${Math.max(4, scaledHeight)}%` }}
                      ></div>
                    );
                  })}
                </div>
              </div>

              {/* Android Audio Focus Status Card */}
              <div
                className={`mt-2.5 p-2 rounded-xl border text-[11px] font-mono transition-all ${
                  currentVolumePct < 50
                    ? 'bg-red-950/80 border-red-500/70 text-red-200 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Android Audio Focus:</span>
                  <span className="font-bold">
                    {currentVolumePct < 50
                      ? 'AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK'
                      : 'AUDIOFOCUS_GAIN'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {currentVolumePct < 50
                    ? 'Cabin music attenuated by -18 dB for emergency voice directive'
                    : 'Full media volume unattenuated'}
                </div>
              </div>
            </div>

            {/* In-Car Audio Action Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={handleToggleRadio}
                className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow ${
                  isRadioPlaying
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Disc3 className={`w-3.5 h-3.5 ${isRadioPlaying ? 'animate-spin' : ''}`} />
                <span>{isRadioPlaying ? 'Stop Radio' : 'Play Radio Beat'}</span>
              </button>

              <button
                onClick={handleTestDucking}
                className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center justify-center gap-1.5 shadow active:scale-95"
                title="Simulates speech alert and ducks music by -18 dB"
              >
                <Volume1 className="w-3.5 h-3.5" />
                <span>Test Ducking (-18dB)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
