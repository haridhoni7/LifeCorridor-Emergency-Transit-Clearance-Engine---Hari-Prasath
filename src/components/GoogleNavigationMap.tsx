import React, { useState, useEffect, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Siren,
  Car,
  Shield,
  Compass,
  Navigation,
  Layers,
  CheckCircle2,
  MapPin,
  Shuffle,
  Eye,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { RouteWaypoint } from '../types';

interface GoogleNavigationMapProps {
  apiKey: string;
  route: RouteWaypoint[];
  detourRoute?: { lat: number; lng: number }[];
  ambulancePos: { lat: number; lng: number; heading?: number };
  commuterPos: { lat: number; lng: number; heading?: number };
  commuter2Pos?: { lat: number; lng: number; heading?: number };
  opposingPos?: { lat: number; lng: number; heading?: number };
  zoneColor: 'RED' | 'AMBER' | 'YELLOW' | 'GREEN';
  distanceMeters: number;
  inTransit: boolean;
  onSelectVehicle?: (vehicleId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  hospitalName?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

// Inner component to handle imperative Google Maps features like Polyline, Corridor buffer, Detour, and Traffic Layer
const MapOverlays: React.FC<{
  route: RouteWaypoint[];
  detourRoute?: { lat: number; lng: number }[];
  ambulancePos: { lat: number; lng: number; heading?: number };
  inTransit: boolean;
  zoneColor: 'RED' | 'AMBER' | 'YELLOW' | 'GREEN';
  showTraffic: boolean;
  showDetour: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}> = ({ route, detourRoute, ambulancePos, inTransit, zoneColor, showTraffic, showDetour, onMapClick }) => {
  const map = useMap();

  // Handle user clicks on the map to set custom emergency origin
  useEffect(() => {
    if (!map || !onMapClick) return;
    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, onMapClick]);

  // Draw Main Corridor Route Polylines
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const path = route.map((w) => ({ lat: w.lat, lng: w.lng }));

    // Main corridor route line
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#0284c7', // Sky-600
      strokeOpacity: 0.8,
      strokeWeight: 6,
      map,
    });

    // Glowing inner stroke
    const innerLine = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#38bdf8', // Sky-400
      strokeOpacity: 0.9,
      strokeWeight: 2,
      map,
    });

    return () => {
      polyline.setMap(null);
      innerLine.setMap(null);
    };
  }, [map, route]);

  // Draw Macro-Inflow Upstream Detour Polyline (Dashed Amber)
  useEffect(() => {
    if (!map || !window.google || !window.google.maps || !detourRoute || !showDetour) return;

    const lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 3,
    };

    const detourPolyline = new google.maps.Polyline({
      path: detourRoute,
      geodesic: true,
      strokeColor: '#f59e0b', // Amber-500
      strokeOpacity: 0,
      icons: [
        {
          icon: lineSymbol,
          offset: '0',
          repeat: '16px',
        },
      ],
      map,
    });

    return () => {
      detourPolyline.setMap(null);
    };
  }, [map, detourRoute, showDetour]);

  // Dynamic Shockwave Zipper Buffer Polygon ahead of ambulance
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const colorHex =
      zoneColor === 'RED'
        ? '#ef4444'
        : zoneColor === 'AMBER'
        ? '#f59e0b'
        : zoneColor === 'YELLOW'
        ? '#eab308'
        : '#10b981';

    // Calculate dynamic wedge based on heading if available
    const headingRad = ((ambulancePos.heading || 90) * Math.PI) / 180;
    const forwardLat = Math.cos(headingRad) * 0.004;
    const forwardLng = Math.sin(headingRad) * 0.005;

    const perpLat = -Math.sin(headingRad) * 0.0006;
    const perpLng = Math.cos(headingRad) * 0.0006;

    const wedgeCoords = [
      { lat: ambulancePos.lat - perpLat, lng: ambulancePos.lng - perpLng },
      { lat: ambulancePos.lat + perpLat, lng: ambulancePos.lng + perpLng },
      { lat: ambulancePos.lat + forwardLat + (perpLat * 2.2), lng: ambulancePos.lng + forwardLng + (perpLng * 2.2) },
      { lat: ambulancePos.lat + forwardLat - (perpLat * 2.2), lng: ambulancePos.lng + forwardLng - (perpLng * 2.2) },
    ];

    const corridorPolygon = new google.maps.Polygon({
      paths: wedgeCoords,
      strokeColor: colorHex,
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: colorHex,
      fillOpacity: inTransit ? 0.28 : 0.12,
      map,
    });

    return () => {
      corridorPolygon.setMap(null);
    };
  }, [map, ambulancePos, inTransit, zoneColor]);

  // Live Traffic Layer
  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const trafficLayer = new google.maps.TrafficLayer();
    if (showTraffic) {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    }

    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, showTraffic]);

  return null;
};

// Inner component providing high-efficiency Google Maps navigation controls (Eye route overview, zoom in/out, re-center)
const MapNavigationHUD: React.FC<{
  route: RouteWaypoint[];
  detourRoute?: { lat: number; lng: number }[];
  ambulancePos: { lat: number; lng: number };
  commuterPos: { lat: number; lng: number };
  showTraffic: boolean;
  setShowTraffic: (val: boolean) => void;
  showDetour: boolean;
  setShowDetour: (val: boolean) => void;
  followAmbulance: boolean;
  setFollowAmbulance: (val: boolean) => void;
}> = ({
  route,
  detourRoute,
  ambulancePos,
  commuterPos,
  showTraffic,
  setShowTraffic,
  showDetour,
  setShowDetour,
  followAmbulance,
  setFollowAmbulance,
}) => {
  const map = useMap();
  const [isOverviewActive, setIsOverviewActive] = useState(false);

  // The "Eye" Route Overview Handler: fits complete corridor path on screen
  const handleFitRouteOverview = () => {
    if (!map || !window.google || !window.google.maps || !route || route.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    route.forEach((w) => bounds.extend({ lat: w.lat, lng: w.lng }));
    if (detourRoute) {
      detourRoute.forEach((pt) => bounds.extend(pt));
    }
    bounds.extend({ lat: ambulancePos.lat, lng: ambulancePos.lng });
    bounds.extend({ lat: commuterPos.lat, lng: commuterPos.lng });
    try {
      map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
    } catch {
      map.fitBounds(bounds, 50);
    }
    setIsOverviewActive(true);
    setFollowAmbulance(false);
  };

  // Auto-fit corridor route on mount and whenever route changes
  useEffect(() => {
    if (!map || !window.google || !window.google.maps || !route || route.length === 0) return;
    const timer = setTimeout(() => {
      handleFitRouteOverview();
    }, 200);
    return () => clearTimeout(timer);
  }, [map, route]);

  useEffect(() => {
    const listener = () => handleFitRouteOverview();
    window.addEventListener('fit-route-overview', listener);
    return () => window.removeEventListener('fit-route-overview', listener);
  }, [map, route, detourRoute, ambulancePos, commuterPos]);

  // Re-center directly on vehicle (navigation close-up mode)
  const handleRecenterCar = () => {
    if (!map) return;
    map.panTo({ lat: commuterPos.lat, lng: commuterPos.lng });
    map.setZoom(16);
    setIsOverviewActive(false);
  };

  // Zoom In
  const handleZoomIn = () => {
    if (!map) return;
    map.setZoom((map.getZoom() || 14) + 1);
  };

  // Zoom Out
  const handleZoomOut = () => {
    if (!map) return;
    map.setZoom((map.getZoom() || 14) - 1);
  };

  return (
    <>
      {/* Top Left Navigation Controls (Traffic, Detour, Camera Mode) */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 pointer-events-auto">
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg ${
            showTraffic
              ? 'bg-slate-900/90 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-900/70 text-slate-400 border border-slate-700'
          }`}
          title="Toggle Google Maps Live Traffic Layer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Traffic</span> {showTraffic ? 'ON' : 'OFF'}
        </button>

        {detourRoute && (
          <button
            onClick={() => setShowDetour(!showDetour)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg ${
              showDetour
                ? 'bg-slate-900/90 text-amber-400 border border-amber-500/40'
                : 'bg-slate-900/70 text-slate-400 border border-slate-700'
            }`}
            title="Toggle Upstream Macro-Inflow Detour Lines"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Detours</span> {showDetour ? 'ON' : 'OFF'}
          </button>
        )}

        <button
          onClick={() => {
            setFollowAmbulance(!followAmbulance);
            setIsOverviewActive(false);
          }}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-lg ${
            followAmbulance
              ? 'bg-cyan-900/90 text-cyan-300 border border-cyan-400/50'
              : 'bg-slate-900/70 text-slate-400 border border-slate-700'
          }`}
          title="Toggle camera tracking"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{followAmbulance ? 'Tracking 108' : 'Free Camera'}</span>
        </button>
      </div>

      {/* Top Right Navigation Controls (The "Eye" Full Route Overview, Recenter, Zoom +/-) */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10 pointer-events-auto">
        {/* Eye Button: Fit Complete Route Path Overview */}
        <button
          onClick={handleFitRouteOverview}
          className={`px-3 py-1.5 rounded-xl text-xs font-black backdrop-blur-md transition-all flex items-center gap-1.5 shadow-xl border ${
            isOverviewActive
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-300 shadow-cyan-950/60 scale-105'
              : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/50 hover:border-cyan-400'
          }`}
          title="Eye Icon: Fit complete route path from pickup to hospital on screen"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>Route Overview</span>
        </button>

        {/* Recenter / Follow Car Button */}
        <button
          onClick={handleRecenterCar}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all"
          title="Re-center camera on your vehicle (close-up view)"
        >
          <LocateFixed className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">My Car</span>
        </button>

        {/* Floating Zoom In & Zoom Out Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700 shadow-lg backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm shadow transition-all active:scale-95"
            title="Zoom In (+)"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm shadow transition-all active:scale-95"
            title="Zoom Out (−)"
          >
            −
          </button>
        </div>
      </div>
    </>
  );
};

export const GoogleNavigationMap: React.FC<GoogleNavigationMapProps> = ({
  apiKey,
  route,
  detourRoute,
  ambulancePos,
  commuterPos,
  commuter2Pos,
  opposingPos,
  zoneColor,
  distanceMeters,
  inTransit,
  onSelectVehicle,
  onMapClick,
  hospitalName = 'Apex Medical Center Emergency Bay',
  center: initialCenter,
  zoom: initialZoom,
  className,
}) => {
  const [showTraffic, setShowTraffic] = useState(true);
  const [showDetour, setShowDetour] = useState(true);
  const [activeInfo, setActiveInfo] = useState<'ambulance' | 'car1' | 'car2' | 'opposing' | 'hospital' | null>(null);
  const [followAmbulance, setFollowAmbulance] = useState(false);

  // Default center based on route or prop
  const center = useMemo(() => {
    if (initialCenter) return initialCenter;
    if (route.length > 0) {
      const mid = Math.floor(route.length / 2);
      return { lat: route[mid].lat, lng: route[mid].lng };
    }
    return { lat: 12.9580, lng: 77.6585 };
  }, [initialCenter, route]);

  const mapCenter = followAmbulance ? { lat: ambulancePos.lat, lng: ambulancePos.lng } : center;
  const destinationWaypoint = route[route.length - 1];

  return (
    <div className={`relative w-full ${className || 'h-[460px]'} rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl`}>
      <APIProvider apiKey={apiKey} libraries={['marker', 'geometry', 'places']}>
        <Map
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          mapId="DEMO_MAP_ID"
          center={mapCenter}
          zoom={initialZoom || 14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          className="w-full h-full"
        >
          {/* Overlays (Polylines, Detours, Traffic Layer, Shockwave Polygon, Map Clicks) */}
          <MapOverlays
            route={route}
            detourRoute={detourRoute}
            ambulancePos={ambulancePos}
            inTransit={inTransit}
            zoneColor={zoneColor}
            showTraffic={showTraffic}
            showDetour={showDetour}
            onMapClick={onMapClick}
          />

          {/* Interactive Navigation HUD Controls (Eye Overview, Zoom In/Out, Recenter) */}
          <MapNavigationHUD
            route={route}
            detourRoute={detourRoute}
            ambulancePos={ambulancePos}
            commuterPos={commuterPos}
            showTraffic={showTraffic}
            setShowTraffic={setShowTraffic}
            showDetour={showDetour}
            setShowDetour={setShowDetour}
            followAmbulance={followAmbulance}
            setFollowAmbulance={setFollowAmbulance}
          />

          {/* 1. Emergency Ambulance Marker */}
          <AdvancedMarker
            position={{ lat: ambulancePos.lat, lng: ambulancePos.lng }}
            title="Emergency Ambulance BLR-108"
            onClick={() => {
              setActiveInfo('ambulance');
              if (onSelectVehicle) onSelectVehicle('AMBULANCE');
            }}
          >
            <div className="relative flex items-center justify-center cursor-pointer group">
              {/* Pulsing Radar Ring */}
              <div
                className={`absolute w-12 h-12 rounded-full ${
                  inTransit ? 'bg-red-500/40 animate-ping' : 'bg-red-500/20'
                }`}
              ></div>

              {/* Vehicle Badge */}
              <div className="relative z-10 w-9 h-9 rounded-full bg-gradient-to-tr from-red-700 to-rose-500 border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-110">
                <Siren className="w-4 h-4 fill-white animate-pulse" />
              </div>

              {/* Velocity Floating Tag */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-[10px] font-mono font-bold text-red-300 px-1.5 py-0.5 rounded border border-red-500/40 whitespace-nowrap shadow">
                46 km/h
              </div>
            </div>
          </AdvancedMarker>

          {/* 2. Commuter Car 1 (Zone 1 Direct Path) */}
          <AdvancedMarker
            position={{ lat: commuterPos.lat, lng: commuterPos.lng }}
            title="Civilian Car KA-03-9912 (Zone 1 Contact)"
            onClick={() => {
              setActiveInfo('car1');
              if (onSelectVehicle) onSelectVehicle('CAR-KA-03-9912');
            }}
          >
            <div className="relative flex items-center justify-center cursor-pointer group">
              <div
                className={`absolute w-10 h-10 rounded-full ${
                  zoneColor === 'RED' ? 'bg-red-500/30 animate-pulse' : 'bg-sky-500/20'
                }`}
              ></div>
              <div
                className={`relative z-10 w-8 h-8 rounded-full border-2 border-white shadow flex items-center justify-center text-white ${
                  zoneColor === 'RED' ? 'bg-red-600 animate-bounce' : 'bg-sky-600'
                }`}
              >
                <Car className="w-4 h-4" />
              </div>
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-[9px] font-mono font-bold text-sky-300 px-1.5 py-0.5 rounded border border-sky-400/40 whitespace-nowrap shadow">
                Zone 1 ({distanceMeters}m)
              </div>
            </div>
          </AdvancedMarker>

          {/* 3. Commuter Car 2 (Zone 2 Elastic Cushion) */}
          {commuter2Pos && (
            <AdvancedMarker
              position={{ lat: commuter2Pos.lat, lng: commuter2Pos.lng }}
              title="Civilian Car KA-04-7718 (Zone 2 Cushion)"
              onClick={() => {
                setActiveInfo('car2');
                if (onSelectVehicle) onSelectVehicle('CAR-KA-04-7718');
              }}
            >
              <div className="relative flex items-center justify-center cursor-pointer group">
                <div className="relative z-10 w-7 h-7 rounded-full bg-amber-600 border border-white shadow flex items-center justify-center text-white">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-[9px] font-mono font-bold text-amber-300 px-1 py-0.5 rounded border border-amber-500/40 whitespace-nowrap shadow">
                  Zone 2 Cushion
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* 4. Opposing Commuter Car (Zone Clear - Filtered) */}
          {opposingPos && (
            <AdvancedMarker
              position={{ lat: opposingPos.lat, lng: opposingPos.lng }}
              title="Opposing Vehicle KA-51-3301 (Filtered)"
              onClick={() => {
                setActiveInfo('opposing');
                if (onSelectVehicle) onSelectVehicle('CAR-KA-51-3301');
              }}
            >
              <div className="relative flex items-center justify-center cursor-pointer group">
                <div className="relative z-10 w-6 h-6 rounded-full bg-slate-700 border border-slate-400 shadow flex items-center justify-center text-slate-300">
                  <Car className="w-3 h-3" />
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/95 text-[8px] font-mono text-emerald-400 px-1 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap shadow">
                  Opposing (Filtered)
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* 5. Destination Hospital Emergency Bay */}
          {destinationWaypoint && (
            <AdvancedMarker
              position={{ lat: destinationWaypoint.lat, lng: destinationWaypoint.lng }}
              title={hospitalName}
              onClick={() => setActiveInfo('hospital')}
            >
              <div className="relative flex items-center justify-center cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-800 to-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
                  <span className="text-sm font-black font-mono">H</span>
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-950 text-[9px] font-mono font-bold text-rose-200 px-2 py-0.5 rounded border border-rose-500/50 whitespace-nowrap shadow">
                  Receiving Bay
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Info Windows */}
          {activeInfo === 'ambulance' && (
            <InfoWindow
              position={{ lat: ambulancePos.lat, lng: ambulancePos.lng }}
              onCloseClick={() => setActiveInfo(null)}
            >
              <div className="p-2 text-slate-900 max-w-xs">
                <h4 className="font-bold text-sm text-red-600 flex items-center gap-1">
                  <Siren className="w-4 h-4" /> Ambulance BLR-108
                </h4>
                <p className="text-xs text-slate-700 mt-1">
                  Active Emergency Transit: Level-1 Cardiac STEMI dispatch authorized via Gemini 2.0.
                </p>
                <div className="mt-2 text-[11px] font-mono text-slate-600">
                  Speed: 46 km/h · Heading: 95° E
                </div>
              </div>
            </InfoWindow>
          )}

          {activeInfo === 'car1' && (
            <InfoWindow
              position={{ lat: commuterPos.lat, lng: commuterPos.lng }}
              onCloseClick={() => setActiveInfo(null)}
            >
              <div className="p-2 text-slate-900 max-w-xs">
                <h4 className="font-bold text-sm text-sky-700 flex items-center gap-1">
                  <Car className="w-4 h-4" /> Commuter Vehicle KA-03-9912
                </h4>
                <p className="text-xs text-slate-700 mt-1">
                  Located in Zone 1 (Contact Window: {distanceMeters}m behind).
                </p>
                <div className="mt-1 text-xs font-bold text-red-600">
                  Directive: MERGE_LEFT_NOW (Open Center Zipper)
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Legend & Click Helper Banner */}
      <div className="absolute bottom-4 inset-x-4 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>Zone 1 (&lt;500m)</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Zone 2 (500m-3km)</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Opposing (Filtered)</span>
          </div>
          {detourRoute && (
            <div className="hidden sm:flex items-center gap-1 text-amber-300">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-400"></span>
              <span>Diverted Inflow</span>
            </div>
          )}
        </div>

        <div className="text-slate-400 text-[10px] hidden md:block">
          💡 Click anywhere on map to set custom emergency corridor origin
        </div>
      </div>
    </div>
  );
};
