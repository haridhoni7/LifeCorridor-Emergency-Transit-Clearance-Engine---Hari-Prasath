import React from 'react';
import { Layers, Zap, AlertTriangle, ArrowRight, CornerDownRight, Car, Shield } from 'lucide-react';

export const ShockwaveDeepDive: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">
              Core Engineering Solve · Traffic Fluid Dynamics
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              The 3-Zone Phased Shockwave Protocol (Solving 10 km Standstills)
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-4xl">
              In severe urban gridlock, traffic behaves like a rigid hydraulic column: cars 500 meters ahead cannot move if cars 1 kilometer ahead are bumper-locked, and those cannot move unless the cars at the head of the bottleneck (kilometer 10) begin moving first. LifeCorridor solves this from the front, injects elasticity in the middle, and starves the back of new volume.
            </p>
          </div>
          <span className="hidden md:inline-flex px-3 py-1 bg-cyan-950/80 border border-cyan-800/60 rounded-md text-xs font-mono text-cyan-300">
            Speed &lt; 15 km/h Adaptive Trigger
          </span>
        </div>
      </div>

      {/* 4-Pillar Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1 */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                ZONE 1: 0 – 500M
              </span>
              <span className="text-xs text-slate-400">Contact</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">MERGE_LEFT_NOW</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pulsing Red HUD and urgent synthesized voice prompt. Right-lane drivers hug the divider; center and left vehicles merge left to open an immediate center zipper lane.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Time-to-Impact:</strong> 60–90 seconds advance warning while rolling.
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ZONE 2: 500M – 3KM
              </span>
              <span className="text-xs text-slate-400">Elastic Cushion</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">MAINTAIN_2M_GAP</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Amber warning prompt: <em>"Stop bumper-to-bumper tailgating. Leave a 2-meter gap and bias steering 30° left."</em> Preserves mechanical steering clearance before dead-lock occurs.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Solves:</strong> Bumper-hug steering lock; enables diagonal escape geometry.
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-slate-900/90 border border-yellow-500/30 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                ZONE 3: 3KM – 10KM
              </span>
              <span className="text-xs text-slate-400">Chokepoint Exit</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">FLUSH_FORWARD</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pulls the cork from the bottle. Targets the 20–30 lead vehicles at the traffic signal or merge choke: <em>"Corridor clearing advisory: on green signal, advance briskly past junction."</em>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Physics:</strong> Propagates space backward down the line like an accordion.
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                MACRO-NETWORK
              </span>
              <span className="text-xs text-slate-400">Inflow Control</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">INFLOW_STARVATION</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Google Maps adds a heavy virtual routing penalty to the congested corridor for all civilian traffic, dynamically diverting inbound drivers 3–5 km away onto parallel arterial roads.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Outcome:</strong> Freezes incoming congestion volume so queue drains.
          </div>
        </div>
      </div>

      {/* Interactive Visual Corridor Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Corridor Spatial Wave Dynamics
        </h3>

        <div className="relative bg-slate-950 p-6 rounded-lg border border-slate-800 overflow-x-auto">
          <div className="min-w-[700px] flex items-center justify-between relative py-6">
            {/* Horizontal road strip */}
            <div className="absolute top-1/2 left-0 right-0 h-12 bg-slate-800/80 -translate-y-1/2 border-y border-dashed border-slate-700 rounded flex items-center justify-center">
              <span className="text-[11px] font-mono text-slate-500 tracking-widest uppercase">
                Bengaluru Old Airport Road Corridor (West ➔ East)
              </span>
            </div>

            {/* Marker 1: Ambulance */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-xl shadow-lg shadow-rose-950 animate-pulse">
                🚨
              </div>
              <span className="mt-2 text-xs font-bold text-rose-400">Ambulance</span>
              <span className="text-[10px] text-slate-400">Km 0.0</span>
            </div>

            {/* Zone 1 Bracket */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-4">
              <div className="w-full h-1 bg-rose-500 rounded relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-400 bg-slate-950 px-1">
                  0 to 500m
                </span>
              </div>
              <span className="mt-4 text-xs font-semibold text-rose-300">Zone 1: Physical Split</span>
              <span className="text-[10px] text-slate-400">Merge Left Alert</span>
            </div>

            {/* Marker 2: Commuter 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-sky-600 border-2 border-white flex items-center justify-center text-lg shadow-md">
                🚗
              </div>
              <span className="mt-2 text-xs font-semibold text-sky-400">Car 1</span>
              <span className="text-[10px] text-slate-400">+500m</span>
            </div>

            {/* Zone 2 Bracket */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-4">
              <div className="w-full h-1 bg-amber-500 rounded relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-400 bg-slate-950 px-1">
                  500m to 3km
                </span>
              </div>
              <span className="mt-4 text-xs font-semibold text-amber-300">Zone 2: Elastic Cushion</span>
              <span className="text-[10px] text-slate-400">2m Gap + 30° Left Bias</span>
            </div>

            {/* Marker 3: Commuter 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center text-lg shadow-md">
                🚙
              </div>
              <span className="mt-2 text-xs font-semibold text-amber-400">Car 2</span>
              <span className="text-[10px] text-slate-400">+2.1km</span>
            </div>

            {/* Zone 3 Bracket */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-4">
              <div className="w-full h-1 bg-yellow-500 rounded relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-yellow-400 bg-slate-950 px-1">
                  3km to 10km
                </span>
              </div>
              <span className="mt-4 text-xs font-semibold text-yellow-300">Zone 3: Bottleneck Flush</span>
              <span className="text-[10px] text-slate-400">Junction Drain</span>
            </div>

            {/* Marker 4: Chokepoint Junction */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-yellow-600 border-2 border-white flex items-center justify-center text-lg shadow-md">
                🚦
              </div>
              <span className="mt-2 text-xs font-semibold text-yellow-400">Signal Exit</span>
              <span className="text-[10px] text-slate-400">Km 10.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
