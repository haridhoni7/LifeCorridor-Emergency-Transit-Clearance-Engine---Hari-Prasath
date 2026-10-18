import React from 'react';
import { Hospital, HeartPulse, Clock, Activity, CheckCircle, ShieldAlert } from 'lucide-react';

interface TraumaBayHandshakeProps {
  inTransit: boolean;
  distanceMeters: number;
}

export const TraumaBayHandshake: React.FC<TraumaBayHandshakeProps> = ({
  inTransit,
  distanceMeters,
}) => {
  // Estimated ETA based on distance
  const etaMinutes = inTransit ? Math.max(1, Math.ceil((distanceMeters / 1000) * 2.2)) : 6;
  const timeSavedMinutes = 8.5;

  return (
    <div className="space-y-6">
      {/* Hospital Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hospital className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                Emergency Department · Receiving Facility
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Manipal Hospital Trauma Resuscitation Bay
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Old Airport Road, Bengaluru · Level-1 Trauma Emergency Care
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800 text-right">
              <span className="text-[11px] text-slate-400 block">Dynamic Corridor ETA</span>
              <span className="text-2xl font-black font-mono text-cyan-400">
                {inTransit ? `${etaMinutes} MINS` : 'ON STANDBY'}
              </span>
            </div>
            <div className="bg-emerald-950/40 px-4 py-2.5 rounded-lg border border-emerald-800/40 text-right">
              <span className="text-[11px] text-emerald-300 block">Golden Hour Recovered</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                +{timeSavedMinutes}m
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Real-Time Patient In-Transit Telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" />
              In-Transit Vitals
            </h3>
            <span className="text-[10px] text-slate-400">Unit 108 Telemetry</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">Heart Rate:</span>
              <span className="text-rose-400 font-bold text-sm">118 BPM</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">Blood Pressure:</span>
              <span className="text-slate-200 font-bold">145 / 95 mmHg</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">Oxygen (SpO2):</span>
              <span className="text-amber-400 font-bold">91% on High Flow O2</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans">ECG Rhythm:</span>
              <span className="text-rose-400 font-bold">STEMI / Anterolateral</span>
            </div>
          </div>
        </div>

        {/* Trauma Bay Allocation */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Trauma Bay Allocation
            </h3>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Assigned
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Primary Bay:</span>
              <span className="font-bold text-white text-sm">Resuscitation Bay 1 (Red Zone)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Attending Consultant:</span>
              <span className="text-slate-200 font-medium">Dr. Anand Sharma, MBBS, MD (Emergency)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Nurse In-Charge:</span>
              <span className="text-slate-200">Sister Prathiba K. & Rapid Response Team B</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Dynamic Transit Window:</span>
              <span className="text-cyan-300 font-mono text-[11px]">
                {inTransit ? 'Cleared Corridor Active (Sub-second sync)' : 'Awaiting transit start'}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Minute Pre-Arrival Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pre-Arrival Readiness
            </h3>
            <span className="text-[10px] text-slate-400">Automated</span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cardiac Catheterization Lab pre-notified</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Blood Bank: 2 Units O-Negative reserved</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Hospital Security: Emergency Ramp gate unlocked</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Defibrillator & Lucas CPR device calibrated</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
