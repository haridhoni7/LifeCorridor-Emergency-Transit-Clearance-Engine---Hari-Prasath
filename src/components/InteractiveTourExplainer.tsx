import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  LocateFixed,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Radio,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  X,
  Play,
  RotateCcw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { CityPreset } from '../types';
import { PlaceAutocompleteInput } from './PlaceAutocompleteInput';

interface InteractiveTourExplainerProps {
  cities: CityPreset[];
  activeCity: CityPreset;
  onSelectCity: (city: CityPreset) => void;
  onRequestUserGPS: () => void;
  onSearchLocation?: (query: string) => void;
  onPointToPointRoute?: (origin: string, destination: string) => void;
  inTransit: boolean;
  onToggleTransit: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    badge: 'Zero-Trust Protocol',
    title: '1. Gemini 2.0 Multimodal Dispatch & Siren Verification',
    description:
      'Before opening an autonomous corridor on Google Maps, LifeCorridor verifies both the hospital CAD dispatch text and the 3-second acoustic siren harmonic spectrum (Wail/Yelp 400–1600 Hz) using Gemini 2.0 Flash to eliminate civilian spoofing.',
    visualHint: 'Check the "Gemini Dispatch Lab" tab to run multimodal audio & text audits.',
  },
  {
    step: 2,
    badge: 'Macro Inflow Starvation',
    title: '2. Upstream Traffic Rerouting (3–5 km Out)',
    description:
      'Clearing a jam from behind fails if hundreds of new cars keep pouring in. LifeCorridor injects dynamic route cost penalties into Google Maps to divert upstream civilian cars onto parallel arterials before they enter the corridor.',
    visualHint: 'See the dashed detour route and the "Vehicles Diverted" metric counter.',
  },
  {
    step: 3,
    badge: '3-Zone Shockwave',
    title: '3. Zone 3 Chokepoint Flushing (3,000m – 10,000m)',
    description:
      'Lead junctions 3 to 10 kilometers ahead are instructed to flush forward through green signals without stopping, pulling the "cork from the bottle" and creating space ahead.',
    visualHint: 'Watch lead intersection vehicles decompress ahead of the ambulance.',
  },
  {
    step: 4,
    badge: 'Mechanical Clearance',
    title: '4. Zone 2 Elastic Cushion (500m – 3,000m)',
    description:
      'Drivers are instructed: "Stop bumper-to-bumper tailgating. Leave a 2-meter gap and pre-angle wheels 30° left." This preserves steering mechanical radius so parting takes 5 seconds instead of minutes.',
    visualHint: 'Switch to the "Commuter Maps View" to see the 30° wheel steering guide.',
  },
  {
    step: 5,
    badge: 'Zipper Parting',
    title: '5. Zone 1 Moving Zipper (0 – 500m)',
    description:
      'High-contrast pulsing HUD + transient audio ducking over car Bluetooth directs drivers to hug dividers, parting a 3.5m center corridor directly ahead of the emergency vehicle.',
    visualHint: 'Observe the glowing red dynamic wedge clearing traffic on Google Maps.',
  },
  {
    step: 6,
    badge: 'Hospital Handshake',
    title: '6. Destination Trauma Bay Readiness',
    description:
      'The receiving hospital gets sub-second dynamic ETA, Gemini-summarized paramedic notes, and automated Cath Lab / blood bank reservation alerts 5 minutes before arrival.',
    visualHint: 'Switch to the "Trauma Bay Handshake" tab to view live resuscitation readiness.',
  },
];

export const InteractiveTourExplainer: React.FC<InteractiveTourExplainerProps> = ({
  cities,
  activeCity,
  onSelectCity,
  onRequestUserGPS,
  onSearchLocation,
  onPointToPointRoute,
  inTransit,
  onToggleTransit,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [routeMode, setRouteMode] = useState<'CITY' | 'P2P'>('CITY');
  const [fromLocation, setFromLocation] = useState('Indiranagar 100ft Rd');
  const [toLocation, setToLocation] = useState('Manipal Hospital');
  const [isRoutingP2P, setIsRoutingP2P] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || !onSearchLocation) return;
    setIsSearching(true);
    onSearchLocation(searchInput.trim());
    setTimeout(() => setIsSearching(false), 800);
  };

  const handleP2PSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation.trim() || !toLocation.trim() || !onPointToPointRoute) return;
    setIsRoutingP2P(true);
    onPointToPointRoute(fromLocation.trim(), toLocation.trim());
    setTimeout(() => setIsRoutingP2P(false), 900);
  };

  const step = TOUR_STEPS[currentStepIndex];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Top Header & Location Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Interactive Prototype Sandbox & Guided Explainer
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Experience LifeCorridor in Any Location
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Select a megacity, enter custom From ➔ To locations, or <strong className="text-cyan-400">click anywhere directly on the Google Map</strong> to generate an autonomous corridor.
          </p>
        </div>

        {/* Location Search Bar & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setRouteMode('CITY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                routeMode === 'CITY' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cities / Search
            </button>
            <button
              onClick={() => setRouteMode('P2P')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                routeMode === 'P2P' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              From ➔ To
            </button>
          </div>

          {routeMode === 'CITY' ? (
            /* Geocoding Search Bar with Auto-suggest */
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
              <PlaceAutocompleteInput
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search any city, place or landmark..."
                icon="search"
                className="w-52 sm:w-64"
                onSelectPlace={(place) => {
                  setSearchInput(place.displayName);
                  if (onSearchLocation) {
                    onSearchLocation(place.displayName);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!searchInput.trim() || isSearching}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white font-bold text-xs transition-all shrink-0"
              >
                {isSearching ? '...' : 'Simulate'}
              </button>
            </form>
          ) : (
            /* Point-to-Point From ➔ To Form with Auto-suggest */
            <form onSubmit={handleP2PSubmit} className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              <PlaceAutocompleteInput
                value={fromLocation}
                onChange={setFromLocation}
                placeholder="From: Area"
                icon="pin"
                className="w-36 sm:w-44"
                onSelectPlace={(place) => setFromLocation(place.displayName)}
              />
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
              <PlaceAutocompleteInput
                value={toLocation}
                onChange={setToLocation}
                placeholder="To: Hospital"
                icon="hospital"
                className="w-36 sm:w-44"
                onSelectPlace={(place) => setToLocation(place.displayName)}
              />
              <button
                type="submit"
                disabled={!fromLocation.trim() || !toLocation.trim() || isRoutingP2P}
                className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow transition-all shrink-0"
              >
                {isRoutingP2P ? '...' : 'Route Corridor'}
              </button>
            </form>
          )}

          {/* Quick City Presets */}
          {cities.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCity(c)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCity.id === c.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950 scale-105'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{c.name.split(' ')[0]}</span>
            </button>
          ))}

          {/* Use My Location (Hardware GPS + IP Fallback) */}
          <button
            onClick={onRequestUserGPS}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1.5"
            title="Detect location via device GPS or Network IP"
          >
            <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
            <span>Use My Location</span>
          </button>

          {/* Standalone Tab Link */}
          <a
            href={typeof window !== 'undefined' ? window.location.href : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all flex items-center gap-1.5"
            title="Open in a standalone tab for full hardware GPS permission access"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Direct Tab</span>
          </a>
        </div>
      </div>

      {/* Guided Step Walkthrough Card */}
      <div className="mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              STEP {step.step} OF 6
            </span>
            <span className="text-xs font-mono text-slate-400">{step.badge}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1">
              {currentStepIndex + 1}/6
            </span>
            <button
              onClick={() =>
                setCurrentStepIndex((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1))
              }
              disabled={currentStepIndex === TOUR_STEPS.length - 1}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">{step.title}</h3>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{step.description}</p>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{step.visualHint}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTransit}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                inTransit
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{inTransit ? 'Pause Live Simulation' : 'Run Live Transit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
