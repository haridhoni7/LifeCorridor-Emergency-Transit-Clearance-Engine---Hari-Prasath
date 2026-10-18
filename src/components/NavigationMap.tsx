import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteWaypoint, VehicleTelemetry } from '../types';

interface NavigationMapProps {
  route: RouteWaypoint[];
  ambulancePos: { lat: number; lng: number };
  commuterPos: { lat: number; lng: number };
  commuter2Pos?: { lat: number; lng: number };
  opposingPos?: { lat: number; lng: number };
  zoneColor: 'RED' | 'AMBER' | 'YELLOW' | 'GREEN';
  distanceMeters: number;
  inTransit: boolean;
}

export const NavigationMap: React.FC<NavigationMapProps> = ({
  route,
  ambulancePos,
  commuterPos,
  commuter2Pos,
  opposingPos,
  zoneColor,
  distanceMeters,
  inTransit,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const ambMarkerRef = useRef<L.Marker | null>(null);
  const commuterMarkerRef = useRef<L.Marker | null>(null);
  const commuter2MarkerRef = useRef<L.Marker | null>(null);
  const opposingMarkerRef = useRef<L.Marker | null>(null);
  const corridorPolygonRef = useRef<L.Polygon | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([12.9578, 77.6580], 14);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap clean tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Route line
    const latLngs = route.map((p) => [p.lat, p.lng] as [number, number]);
    L.polyline(latLngs, {
      color: '#38bdf8',
      weight: 6,
      opacity: 0.85,
      dashArray: inTransit ? '8, 8' : undefined,
    }).addTo(map);

    // Custom Icons
    const createEmojiIcon = (emoji: string, bgClass: string) =>
      L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="${bgClass} flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white text-base leading-none transition-transform hover:scale-110">${emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

    // Ambulance Marker
    ambMarkerRef.current = L.marker([ambulancePos.lat, ambulancePos.lng], {
      icon: createEmojiIcon('🚨', 'bg-rose-600 text-white animate-pulse'),
    })
      .addTo(map)
      .bindPopup('<b>Unit 108 Emergency Ambulance</b><br>Priority: Code Red Cardiac<br>En route: Manipal Hospital');

    // Commuter 1 (In path, 500m ahead)
    commuterMarkerRef.current = L.marker([commuterPos.lat, commuterPos.lng], {
      icon: createEmojiIcon('🚗', 'bg-sky-600 text-white'),
    })
      .addTo(map)
      .bindPopup('<b>Commuter Vehicle (Car 1)</b><br>Lane: Center (Old Airport Rd)<br>In Active Corridor Wedge');

    // Commuter 2 (Zone 2, 1.4km ahead)
    if (commuter2Pos) {
      commuter2MarkerRef.current = L.marker([commuter2Pos.lat, commuter2Pos.lng], {
        icon: createEmojiIcon('🚙', 'bg-amber-600 text-white'),
      })
        .addTo(map)
        .bindPopup('<b>Commuter Vehicle (Car 2)</b><br>Zone 2: Elastic Cushion<br>Spacing: 2m Turning Buffer');
    }

    // Opposing Lane Commuter (Opposite direction, demonstration of no false alarms)
    if (opposingPos) {
      opposingMarkerRef.current = L.marker([opposingPos.lat, opposingPos.lng], {
        icon: createEmojiIcon('🚕', 'bg-emerald-600 text-white'),
      })
        .addTo(map)
        .bindPopup('<b>Opposing Traffic (Car 3)</b><br>Heading: 275° (Westbound)<br>Filtered by Heading Vector (No Alert)');
    }

    // Waypoint Markers
    route.forEach((wpt, index) => {
      const isDestination = index === route.length - 1;
      const isStart = index === 0;
      L.circleMarker([wpt.lat, wpt.lng], {
        radius: isDestination ? 8 : 5,
        color: isDestination ? '#ef4444' : isStart ? '#10b981' : '#64748b',
        fillColor: isDestination ? '#ef4444' : isStart ? '#10b981' : '#1e293b',
        fillOpacity: 0.9,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`<b>${wpt.name}</b><br>${wpt.landmark}`);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update positions & Corridor Polygon on change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (ambMarkerRef.current) {
      ambMarkerRef.current.setLatLng([ambulancePos.lat, ambulancePos.lng]);
    }

    if (commuterMarkerRef.current) {
      commuterMarkerRef.current.setLatLng([commuterPos.lat, commuterPos.lng]);
    }

    // Dynamic 500m forward clearance wedge calculation
    // Creates a directional trapezoid ahead of the ambulance
    if (corridorPolygonRef.current) {
      corridorPolygonRef.current.remove();
    }

    if (inTransit) {
      const latOffset = 0.0035; // ~400-500 meters forward
      const lngOffset = 0.0065;
      const widthOffset = 0.0012; // ~120m corridor width

      const p1: [number, number] = [ambulancePos.lat - widthOffset, ambulancePos.lng];
      const p2: [number, number] = [ambulancePos.lat + widthOffset, ambulancePos.lng];
      const p3: [number, number] = [ambulancePos.lat + latOffset + widthOffset * 0.7, ambulancePos.lng + lngOffset];
      const p4: [number, number] = [ambulancePos.lat + latOffset - widthOffset * 0.7, ambulancePos.lng + lngOffset];

      const colorHex =
        zoneColor === 'RED'
          ? '#ef4444'
          : zoneColor === 'AMBER'
          ? '#f59e0b'
          : zoneColor === 'YELLOW'
          ? '#eab308'
          : '#10b981';

      corridorPolygonRef.current = L.polygon([p1, p2, p3, p4], {
        color: colorHex,
        fillColor: colorHex,
        fillOpacity: 0.22,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(mapInstanceRef.current);
    }
  }, [ambulancePos, commuterPos, inTransit, zoneColor]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Live Map Overlay Tag */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700/60 shadow-md text-xs text-slate-200 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${inTransit ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
        <span className="font-semibold text-slate-100">Old Airport Road, Bengaluru</span>
        <span className="text-slate-400">·</span>
        <span className="font-mono text-cyan-400">{distanceMeters}m to Lead Vehicle</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-md border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3">
        <span className="flex items-center gap-1">🚨 Ambulance</span>
        <span className="flex items-center gap-1">🚗 Car 1 (Path)</span>
        <span className="flex items-center gap-1">🚙 Car 2 (2km)</span>
        <span className="flex items-center gap-1">🚕 Car 3 (Opposing)</span>
      </div>
    </div>
  );
};
