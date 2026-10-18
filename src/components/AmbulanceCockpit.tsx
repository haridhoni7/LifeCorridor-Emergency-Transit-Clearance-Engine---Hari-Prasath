import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Siren, Play, Square, Activity, Volume2, VolumeX, ShieldCheck, Hospital, AlertCircle } from 'lucide-react';
import { CADDispatch, GeminiVerificationResult } from '../types';

import { stopCommuterRadio } from '../utils/audioCoordinator';

interface AmbulanceCockpitProps {
  inTransit: boolean;
  onToggleTransit: () => void;
  speedKmh: number;
  onChangeSpeed: (speed: number) => void;
  activeDispatch: CADDispatch;
  geminiResult: GeminiVerificationResult | null;
  onSelectDispatch: (dispatch: CADDispatch) => void;
  allDispatches: CADDispatch[];
}

export const AmbulanceCockpit: React.FC<AmbulanceCockpitProps> = ({
  inTransit,
  onToggleTransit,
  speedKmh,
  onChangeSpeed,
  activeDispatch,
  geminiResult,
  onSelectDispatch,
  allDispatches,
}) => {
  const [sirenAudioPlaying, setSirenAudioPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  const stopSiren = useCallback(() => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch (_) {}
      oscRef.current = null;
    }
    if (lfoRef.current) {
      try {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
      } catch (_) {}
      lfoRef.current = null;
    }
    setSirenAudioPlaying(false);
  }, []);

  // Listen for global audio silence events and unmount cleanup
  useEffect(() => {
    const handleStop = () => stopSiren();
    window.addEventListener('stop-all-sirens', handleStop);
    window.addEventListener('stop-all-pov-audio', handleStop);
    return () => {
      stopSiren();
      window.removeEventListener('stop-all-sirens', handleStop);
      window.removeEventListener('stop-all-pov-audio', handleStop);
    };
  }, [stopSiren]);

  // Web Audio API Synthesizer for Authentic Emergency Siren
  const toggleSirenAudio = () => {
    if (sirenAudioPlaying) {
      stopSiren();
      return;
    }

    // Isolate POV: stop any commuter radio from playing
    stopCommuterRadio();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Dual-tone wail siren: Carrier around 900 Hz modulated between 650Hz and 1350Hz at ~0.3 Hz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, ctx.currentTime);

      lfo.frequency.setValueAtTime(0.4, ctx.currentTime); // wail speed
      lfoGain.gain.setValueAtTime(350, ctx.currentTime); // frequency swing

      lfo.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.08, ctx.currentTime); // comfortable volume

      lfo.start();
      osc.start();

      oscRef.current = osc;
      lfoRef.current = lfo;
      gainRef.current = gain;
      setSirenAudioPlaying(true);
    } catch (err) {
      console.warn('Audio synthesis not supported or blocked:', err);
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-4 gap-4">
      {/* Primary Action Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            stopCommuterRadio();
            onToggleTransit();
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
            inTransit
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {inTransit ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>⏹ Stop Emergency Transit</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>🚨 Start Emergency Transit</span>
            </>
          )}
        </button>

        {/* Siren Sound Generator */}
        <button
          onClick={toggleSirenAudio}
          className={`py-3 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
            sirenAudioPlaying
              ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Play authentic cabin acoustic siren"
        >
          {sirenAudioPlaying ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{sirenAudioPlaying ? 'Siren On' : 'Siren Sound'}</span>
        </button>
      </div>

      {/* Speed & Traffic Mode Slider */}
      <div className="bg-slate-950 p-3 rounded-md border border-slate-800/80">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-400">Road Speed Simulation:</span>
          <span className={`font-mono font-bold ${speedKmh <= 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {speedKmh} km/h {speedKmh <= 15 ? '(Standstill Gridlock)' : '(Moderate Flow)'}
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="60"
          step="5"
          value={speedKmh}
          onChange={(e) => onChangeSpeed(Number(e.target.value))}
          className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>5 km/h (Gridlock)</span>
          <span>15 km/h (Threshold)</span>
          <span>60 km/h (Clear)</span>
        </div>
      </div>

      {/* CAD Dispatch Selection & Verification */}
      <div className="bg-slate-950 p-3 rounded-md border border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Active CAD Incident Dispatch
          </span>
          {geminiResult?.verified ? (
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Gemini Verified ({geminiResult.urgency_tier})
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Unverified / Standby
            </span>
          )}
        </div>

        {/* Dispatch Presets */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          {allDispatches.map((disp) => (
            <button
              key={disp.id}
              onClick={() => onSelectDispatch(disp)}
              className={`text-left p-2 rounded text-xs transition-colors border ${
                activeDispatch.id === disp.id
                  ? 'bg-slate-800 text-white border-cyan-500/80 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate">{disp.id}</div>
              <div className="text-[10px] text-slate-400 truncate">{disp.hospital}</div>
            </button>
          ))}
        </div>

        {/* Current Dispatch Readout */}
        <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <p className="italic text-slate-300">"{activeDispatch.text}"</p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
            <span>Unit: <strong className="text-slate-200">{activeDispatch.ambulanceId}</strong></span>
            <span>Hospital: <strong className="text-slate-200">{activeDispatch.hospitalId}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
