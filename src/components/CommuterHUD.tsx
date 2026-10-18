import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  ShieldAlert,
  ArrowLeftRight,
  Radio,
  Compass,
  Car,
  Shield,
  Gauge,
  CornerUpLeft,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { CorridorAlertState, VehicleTelemetry } from '../types';

interface CommuterHUDProps {
  alertState: CorridorAlertState;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onTestVoice: () => void;
  isAudioDuckingActive: boolean;
  roadSpeedKmh: number;
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
}

export const CommuterHUD: React.FC<CommuterHUDProps> = ({
  alertState,
  voiceEnabled,
  onToggleVoice,
  onTestVoice,
  isAudioDuckingActive,
  roadSpeedKmh,
  selectedVehicleId,
  onSelectVehicle,
}) => {
  const { distanceMeters, zone, directive, colorCode, audioAlert, directionalMatch, elasticBufferMeters } = alertState;

  // Background and border styles based on zone color code
  const getCardStyle = () => {
    switch (colorCode) {
      case 'RED':
        return 'bg-gradient-to-b from-rose-950/95 via-rose-900/60 to-slate-950 border-rose-500 shadow-rose-900/60 shadow-2xl animate-pulse';
      case 'AMBER':
        return 'bg-gradient-to-b from-amber-950/90 via-amber-900/40 to-slate-950 border-amber-500 shadow-amber-900/50 shadow-xl';
      case 'YELLOW':
        return 'bg-gradient-to-b from-yellow-950/80 via-yellow-900/30 to-slate-950 border-yellow-500 shadow-yellow-900/40 shadow-lg';
      case 'GREEN':
      default:
        return 'bg-gradient-to-b from-emerald-950/40 to-slate-950 border-emerald-600/60 shadow-md';
    }
  };

  const getBadgeStyle = () => {
    switch (colorCode) {
      case 'RED':
        return 'bg-rose-500 text-white font-extrabold shadow-md shadow-rose-900';
      case 'AMBER':
        return 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-900';
      case 'YELLOW':
        return 'bg-yellow-400 text-slate-950 font-extrabold shadow-md shadow-yellow-900';
      case 'GREEN':
      default:
        return 'bg-emerald-500 text-white font-bold';
    }
  };

  const formatDirective = (dir: string) => {
    return dir.replace(/_/g, ' ');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl">
      {/* Top Protocol Status Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>Google Maps In-Drive HUD</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">Auto-Zipper</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors font-semibold ${
              voiceEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Web Speech Synthesis voice warnings"
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voiceEnabled ? 'Voice Active' : 'Muted'}</span>
          </button>
          <button
            onClick={onTestVoice}
            className="px-2 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors font-medium"
          >
            Play Directive
          </button>
        </div>
      </div>

      {/* Interactive Commuter Selector Bar */}
      <div className="mt-3 bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-1 text-[11px]">
        <span className="text-slate-400 font-medium shrink-0 ml-1">Simulate Car:</span>
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => onSelectVehicle('CAR-KA-03-9912')}
            className={`px-2 py-1 rounded font-semibold transition-all whitespace-nowrap ${
              selectedVehicleId === 'CAR-KA-03-9912'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🚗 Zone 1 (Contact)
          </button>
          <button
            onClick={() => onSelectVehicle('CAR-KA-04-7718')}
            className={`px-2 py-1 rounded font-semibold transition-all whitespace-nowrap ${
              selectedVehicleId === 'CAR-KA-04-7718'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🚙 Zone 2 (Cushion)
          </button>
          <button
            onClick={() => onSelectVehicle('CAR-KA-51-3301')}
            className={`px-2 py-1 rounded font-semibold transition-all whitespace-nowrap ${
              selectedVehicleId === 'CAR-KA-51-3301'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🛡️ Opposing (Filtered)
          </button>
        </div>
      </div>

      {/* High-Contrast Dynamic In-Drive HUD Alert Card */}
      <div className={`mt-3 rounded-xl border-2 p-5 transition-all duration-300 ${getCardStyle()}`}>
        {/* Top Info Strip */}
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${getBadgeStyle()}`}>
            {zone.replace(/_/g, ' ')}
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1 font-mono">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              102° ESE
            </span>
            <span>·</span>
            <span className="font-mono text-slate-200 font-bold">{roadSpeedKmh} km/h (Gridlock)</span>
          </div>
        </div>

        {/* Distance Countdown */}
        <div className="mt-4 flex items-baseline gap-3">
          <div className="text-5xl font-black font-mono tracking-tight text-white tabular-nums">
            {distanceMeters > 0 ? `${distanceMeters}` : '--'}
          </div>
          <div className="text-xl font-bold text-slate-300">
            {distanceMeters > 0 ? 'meters behind' : 'm'}
          </div>
        </div>

        {/* Action Directive */}
        <div className="mt-3">
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            {colorCode === 'RED' && <ShieldAlert className="w-7 h-7 text-rose-400 animate-bounce" />}
            {colorCode === 'AMBER' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
            {formatDirective(directive)}
          </h2>
          <p className="mt-2 text-sm text-slate-100 leading-relaxed font-medium">
            {audioAlert}
          </p>
        </div>

        {/* Dynamic Mechanical Advisory Callout */}
        {colorCode === 'RED' && (
          <div className="mt-4 p-2.5 rounded-lg bg-rose-900/60 border border-rose-500/60 flex items-center gap-3 text-xs text-rose-100">
            <CornerUpLeft className="w-6 h-6 text-rose-300 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-white block">Immediate Lateral Steering:</span>
              Shift 1.8 meters left into shoulder gap. Center zipper corridor opening for Unit 108.
            </div>
          </div>
        )}

        {colorCode === 'AMBER' && (
          <div className="mt-4 p-2.5 rounded-lg bg-amber-900/60 border border-amber-500/60 flex items-center gap-3 text-xs text-amber-100">
            <Gauge className="w-6 h-6 text-amber-300 shrink-0" />
            <div>
              <span className="font-bold text-white block">Elastic Cushion Spacing:</span>
              Maintain <strong>{elasticBufferMeters}m</strong> gap to car in front. Pre-angle front wheels <strong>30° left</strong> while rolling.
            </div>
          </div>
        )}

        {/* Directional Vector Filtering Tag */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            {directionalMatch ? (
              <span className="text-emerald-300 font-semibold">Direction Matched (±30° Trajectory)</span>
            ) : (
              <span className="text-slate-400">Opposing Lane (Zero False Alarm Trigger)</span>
            )}
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            {colorCode === 'RED' ? 'Contact Shockwave' : colorCode === 'AMBER' ? 'Elastic Buffer' : 'Unobstructed'}
          </span>
        </div>
      </div>

      {/* Android Audio Focus Ducking Indicator */}
      {(() => {
        const isDucked = isAudioDuckingActive || alertState.zone === 'ZONE_1_CONTACT' || alertState.zone === 'ZONE_2_ELASTIC_CUSHION';
        const effectiveVolPct = alertState.zone === 'ZONE_1_CONTACT' || isAudioDuckingActive ? 15 : alertState.zone === 'ZONE_2_ELASTIC_CUSHION' ? 60 : 100;
        const effectiveDb = alertState.zone === 'ZONE_1_CONTACT' || isAudioDuckingActive ? -18 : alertState.zone === 'ZONE_2_ELASTIC_CUSHION' ? -6 : 0;

        return (
          <div className="mt-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Android In-Cabin Audio Focus Ducking
              </span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  isDucked ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {isDucked
                  ? `AUDIO_DUCKED: Spotify @ ${effectiveVolPct}% (${effectiveDb}dB)`
                  : 'NORMAL_MEDIA_VOLUME (100% · 0dB)'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDucked
                    ? effectiveVolPct === 15
                      ? 'w-[15%] bg-rose-500'
                      : 'w-[60%] bg-amber-500'
                    : 'w-full bg-emerald-500'
                }`}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
              <span>AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK</span>
              <span>{isDucked ? 'Bluetooth Attenuated' : 'Latency: <180ms'}</span>
            </div>
          </div>
        );
      })()}

      {/* Rettungsgasse Zipper Geometry Formation Diagram */}
      <div className="mt-4 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-slate-200">
              Autonomous Zipper Corridor Geometry (Rettungsgasse)
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              500m Buffer
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Vehicles 500m ahead bias steering 30° left while still rolling, maintaining a 2m gap to part the center lane before mechanical bumper lock occurs.
          </p>
        </div>

        {/* 3-Lane Diagram */}
        <div className="mt-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-center font-mono text-[11px]">
          <div className="flex-1 bg-slate-800/90 py-2.5 rounded text-slate-200 border border-slate-700">
            <span className="block text-[10px] text-cyan-400 font-bold">LEFT LANE</span>
            <span>🚗 Shift Left</span>
          </div>
          <div className="w-14 flex flex-col items-center justify-center text-rose-400 font-bold">
            <span className="text-[9px] uppercase tracking-wider text-rose-500 font-sans font-black">ZIPPER</span>
            <span className="text-base animate-pulse">🚨 ⬇</span>
          </div>
          <div className="flex-1 bg-slate-800/90 py-2.5 rounded text-slate-200 border border-slate-700">
            <span className="block text-[10px] text-amber-400 font-bold">RIGHT LANE</span>
            <span>🚙 Hug Divider</span>
          </div>
        </div>
      </div>
    </div>
  );
};
