import React from 'react';
import { Network, ArrowRight, ShieldCheck, TrendingDown, Clock, AlertOctagon } from 'lucide-react';
import { MacroInflowMetrics } from '../types';

interface MacroInflowWidgetProps {
  metrics: MacroInflowMetrics;
  inTransit: boolean;
  activeCityName: string;
}

export const MacroInflowWidget: React.FC<MacroInflowWidgetProps> = ({
  metrics,
  inTransit,
  activeCityName,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Macro-Inflow Starvation Protocol · Google Maps Routing Engine
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">
            Autonomous Upstream Traffic Diverter ({activeCityName})
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Dynamic cost penalties injected 3–5 km upstream to redirect traffic onto parallel arterials before they enter the emergency corridor.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
              inTransit
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                inTransit ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'
              }`}
            ></span>
            {inTransit ? 'REROUTE PENALTIES ACTIVE' : 'STANDBY MODE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Metric 1: Upstream Diverted Vehicles */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium">
            Upstream Vehicles Diverted
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-cyan-400">
              {inTransit ? metrics.vehiclesDiverted : 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">cars</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">
            Rerouted to parallel arterials
          </span>
        </div>

        {/* Metric 2: Bottleneck Pressure Relief */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium">
            Corridor Pressure Reduction
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-emerald-400">
              {inTransit ? `-${metrics.corridorPressureReductionPct}%` : '0%'}
            </span>
            <TrendingDown className="w-4 h-4 text-emerald-400 self-center" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Hydraulic gridlock broken
          </span>
        </div>

        {/* Metric 3: Golden Hour Transit Saved */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium">
            Golden Hour Time Saved
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-rose-400">
              +{metrics.goldenHourMinutesSaved}m
            </span>
            <Clock className="w-4 h-4 text-rose-400 self-center" />
          </div>
          <span className="text-[10px] text-rose-300/80 mt-1 block">
            Critical cardiac window preserved
          </span>
        </div>

        {/* Metric 4: Commuter Cost Penalty */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[11px] text-slate-400 block font-medium">
            Avg Detour Overhead
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-amber-400">
              +{metrics.reroutePenaltySeconds}s
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Marginal delay for civilian vehicles
          </span>
        </div>
      </div>
    </div>
  );
};
