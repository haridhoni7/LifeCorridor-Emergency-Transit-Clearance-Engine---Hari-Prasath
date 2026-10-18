import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Compass,
  Volume2,
  Volume1,
  AlertTriangle,
  ShieldAlert,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  Sliders,
  CheckCircle2,
  Radio,
  Disc3,
  MapPin,
  Play,
  Square,
  Sparkles,
  Search,
  ArrowRight,
  Maximize2,
  Minimize2,
  Car as CarIcon,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Siren,
  FastForward,
} from 'lucide-react';
import { RouteWaypoint, CorridorAlertState, CityPreset } from '../types';
import { GoogleNavigationMap } from './GoogleNavigationMap';
import { inCabinAudio } from '../utils/audioDuckingEngine';
import { generatePointToPointCorridor } from '../utils/cityRoutes';
import { PlaceAutocompleteInput, PlaceSelection } from './PlaceAutocompleteInput';

interface DriverCabinPOVProps {
  apiKey: string;
  route: RouteWaypoint[];
  detourRoute?: { lat: number; lng: number }[];
  ambulancePos: { lat: number; lng: number; heading?: number };
  commuterPos: { lat: number; lng: number; heading?: number };
  commuter2Pos?: { lat: number; lng: number; heading?: number };
  opposingPos?: { lat: number; lng: number; heading?: number };
  alertState: CorridorAlertState;
  speedKmh: number;
  inTransit: boolean;
  onToggleTransit: () => void;
  onTriggerVoice: () => void;
  destinationHospital: string;
  onMapClick?: (lat: number, lng: number) => void;
  onApplyCustomCorridor?: (preset: CityPreset) => void;
}

// 3D Traffic Car Model for Canvas Driving Engine
interface TrafficCar {
  id: number;
  x: number; // Lateral position (-1.0 to +1.0, 0 = center)
  z: number; // Longitudinal distance ahead (meters)
  targetX: number;
  speed: number;
  color: string;
  roofColor: string;
  type: 'SEDAN' | 'TAXI' | 'SUV' | 'COMPACT';
  blinker: 'LEFT' | 'RIGHT' | 'NONE';
  signalReceived: boolean;
  statusTag: string;
  modelName: string;
  partDirection: 'LEFT' | 'RIGHT';
}

export const DriverCabinPOV: React.FC<DriverCabinPOVProps> = ({
  apiKey,
  route,
  detourRoute,
  ambulancePos,
  commuterPos,
  commuter2Pos,
  opposingPos,
  alertState,
  speedKmh: initialSpeedKmh,
  inTransit,
  onToggleTransit,
  onTriggerVoice,
  destinationHospital,
  onMapClick,
  onApplyCustomCorridor,
}) => {
  // Cabin Layout Mode: Split (Both visible without scroll), Maps Focus, Windshield Focus
  const [layoutMode, setLayoutMode] = useState<'SPLIT' | 'MAPS_FOCUS' | 'ROAD_FOCUS'>('SPLIT');

  // Player car interactive driving state
  const [playerSpeed, setPlayerSpeed] = useState(initialSpeedKmh || 26);
  const [playerLane, setPlayerLane] = useState<'LANE_1_LEFT' | 'LANE_2_CENTER' | 'LANE_3_RIGHT'>('LANE_2_CENTER');
  const [playerX, setPlayerX] = useState(0); // -0.6 (Left), 0 (Center), 0.6 (Right)
  const [steeringAngle, setSteeringAngle] = useState(0);

  // Ambulance distance behind player (meters): 1200 -> 0 (overtake) -> -300 (past)
  const [ambulanceDistance, setAmbulanceDistance] = useState(alertState.distanceMeters || 450);
  const [isPursuitActive, setIsPursuitActive] = useState(inTransit);

  // In-Cabin Audio Ducking
  const [volumePct, setVolumePct] = useState(100);
  const [volumeDb, setVolumeDb] = useState(0);

  // Custom Point-to-Point Route Inputs
  const [originArea, setOriginArea] = useState('Indiranagar 100ft Road');
  const [destinationArea, setDestinationArea] = useState('Manipal Hospital Level-1 Trauma Bay');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocodingRoute, setIsGeocodingRoute] = useState(false);
  const [routeStatusNotice, setRouteStatusNotice] = useState<string | null>(null);

  // HTML5 Windshield Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 5 Traffic Cars ahead of the player, originally cruising in the center lane
  const trafficCarsRef = useRef<TrafficCar[]>([
    {
      id: 1,
      x: -0.02,
      z: 22,
      targetX: 0.0,
      speed: 21,
      color: '#f59e0b', // Amber Taxi
      roofColor: '#d97706',
      type: 'TAXI',
      blinker: 'NONE',
      signalReceived: false,
      statusTag: 'CRUISE',
      modelName: 'Taxi KA-01',
      partDirection: 'LEFT',
    },
    {
      id: 2,
      x: 0.03,
      z: 46,
      targetX: 0.0,
      speed: 22,
      color: '#0ea5e9', // Sky Blue Sedan
      roofColor: '#0284c7',
      type: 'SEDAN',
      blinker: 'NONE',
      signalReceived: false,
      statusTag: 'CRUISE',
      modelName: 'EV Sedan 02',
      partDirection: 'RIGHT',
    },
    {
      id: 3,
      x: -0.01,
      z: 70,
      targetX: 0.0,
      speed: 21,
      color: '#f8fafc', // Pearl White SUV
      roofColor: '#cbd5e1',
      type: 'SUV',
      blinker: 'NONE',
      signalReceived: false,
      statusTag: 'CRUISE',
      modelName: 'SUV KA-03',
      partDirection: 'LEFT',
    },
    {
      id: 4,
      x: 0.02,
      z: 94,
      targetX: 0.0,
      speed: 23,
      color: '#94a3b8', // Silver Metallic
      roofColor: '#64748b',
      type: 'SEDAN',
      blinker: 'NONE',
      signalReceived: false,
      statusTag: 'CRUISE',
      modelName: 'Sedan 04',
      partDirection: 'RIGHT',
    },
    {
      id: 5,
      x: -0.02,
      z: 118,
      targetX: 0.0,
      speed: 24,
      color: '#f43f5e', // Ruby Red Compact
      roofColor: '#e11d48',
      type: 'COMPACT',
      blinker: 'NONE',
      signalReceived: false,
      statusTag: 'CRUISE',
      modelName: 'Compact 05',
      partDirection: 'LEFT',
    },
  ]);

  // Derived Zone from ambulance distance
  const isZone1 = ambulanceDistance > 0 && ambulanceDistance <= 500;
  const isZone2 = ambulanceDistance > 500 && ambulanceDistance <= 3000;
  const isZone3 = ambulanceDistance > 3000 && ambulanceDistance <= 10000;
  const isOvertaken = ambulanceDistance <= 0;

  // Zipper Direction: Left vs Right for player
  const isRightLane = playerLane === 'LANE_3_RIGHT';
  const targetPlayerX = playerLane === 'LANE_1_LEFT' ? -0.58 : playerLane === 'LANE_3_RIGHT' ? 0.58 : 0.0;

  // Synchronize pursuit state with global inTransit prop
  useEffect(() => {
    if (inTransit) {
      setIsPursuitActive(true);
    }
  }, [inTransit]);

  // Sync ambulance distance with alertState when pursuit is not actively counting down
  useEffect(() => {
    if (!isPursuitActive && typeof alertState.distanceMeters === 'number' && alertState.distanceMeters > 0) {
      setAmbulanceDistance(alertState.distanceMeters);
    }
  }, [alertState.distanceMeters, isPursuitActive]);

  // Steering & Web Audio Ducking listener
  useEffect(() => {
    inCabinAudio.setVolumeCallback((vol, db) => {
      setVolumePct(Math.round(vol * 100));
      setVolumeDb(db);
    });
  }, []);

  useEffect(() => {
    if (isZone1) {
      inCabinAudio.duck(0.15, 0);
      setVolumePct(15);
      setVolumeDb(-18);
    } else if (isZone2) {
      inCabinAudio.duck(0.6, 0);
      setVolumePct(60);
      setVolumeDb(-6);
    } else {
      inCabinAudio.restore();
      setVolumePct(100);
      setVolumeDb(0);
    }
  }, [isZone1, isZone2]);

  // Keyboard Driving Controls listener (A/D or Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code)) {
        e.preventDefault();
        steerLeft();
      } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code)) {
        e.preventDefault();
        steerRight();
      } else if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code)) {
        e.preventDefault();
        setPlayerSpeed((s) => Math.min(65, s + 4));
      } else if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code)) {
        e.preventDefault();
        setPlayerSpeed((s) => Math.max(8, s - 4));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerLane]);

  const steerLeft = () => {
    if (playerLane === 'LANE_3_RIGHT') {
      setPlayerLane('LANE_2_CENTER');
      setSteeringAngle(-15);
    } else if (playerLane === 'LANE_2_CENTER') {
      setPlayerLane('LANE_1_LEFT');
      setSteeringAngle(-30);
    }
    setTimeout(() => setSteeringAngle(isZone1 || isZone2 ? -30 : 0), 400);
  };

  const steerRight = () => {
    if (playerLane === 'LANE_1_LEFT') {
      setPlayerLane('LANE_2_CENTER');
      setSteeringAngle(15);
    } else if (playerLane === 'LANE_2_CENTER') {
      setPlayerLane('LANE_3_RIGHT');
      setSteeringAngle(30);
    }
    setTimeout(() => setSteeringAngle(isZone1 || isZone2 ? 30 : 0), 400);
  };

  // Pursuit simulation timer loop: counts down ambulance distance smoothly
  useEffect(() => {
    let timer: number;
    if (isPursuitActive || inTransit) {
      timer = window.setInterval(() => {
        setAmbulanceDistance((prev) => {
          if (prev <= -280) {
            // Loop back for continuous interactive demonstration
            return 850;
          }
          // Step distance down faster when far, smooth when close
          const step = prev > 500 ? 35 : prev > 100 ? 20 : 15;
          return prev - step;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPursuitActive, inTransit]);

  // Restart Overtake Demonstration
  const handleRestartPursuit = () => {
    setAmbulanceDistance(700);
    setIsPursuitActive(true);
    setPlayerLane('LANE_1_LEFT');
    onTriggerVoice();
  };

  // ------------------------------------------------------------------
  // 60 FPS HTML5 CANVAS 3D DRIVING GAME RENDER LOOP
  // ------------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    let roadOffset = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear & Horizon Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.44);
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.65, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.44);

      // Distant City Skyline Silhouettes with subtle window lights
      ctx.fillStyle = '#0b1120';
      const buildings = [
        { x: 20, w: 45, h: 42 },
        { x: 80, w: 60, h: 65 },
        { x: 160, w: 35, h: 50 },
        { x: 220, w: 75, h: 75 },
        { x: 310, w: 55, h: 55 },
        { x: 390, w: 85, h: 80 },
        { x: 490, w: 40, h: 45 },
        { x: 550, w: 70, h: 70 },
        { x: 640, w: 50, h: 60 },
        { x: 710, w: 70, h: 45 },
      ];
      buildings.forEach((b) => {
        ctx.fillRect(b.x, height * 0.44 - b.h, b.w, b.h);
      });

      // 2. Road Geometry in 3D Perspective
      const horizonY = height * 0.44;
      const roadBottomY = height;
      const roadTopW = width * 0.28;
      const roadBottomW = width * 0.94;
      const centerX = width * 0.5 - playerX * 85;

      // Road asphalt with subtle depth gradient
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, roadBottomY);
      roadGrad.addColorStop(0, '#070b14');
      roadGrad.addColorStop(1, '#0c1322');
      ctx.beginPath();
      ctx.moveTo(centerX - roadTopW / 2, horizonY);
      ctx.lineTo(centerX + roadTopW / 2, horizonY);
      ctx.lineTo(centerX + roadBottomW / 2, roadBottomY);
      ctx.lineTo(centerX - roadBottomW / 2, roadBottomY);
      ctx.closePath();
      ctx.fillStyle = roadGrad;
      ctx.fill();

      // Road shoulder curbs
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Moving Road Stripes (Speed based animation)
      roadOffset = (roadOffset + playerSpeed * 0.35) % 40;

      // 3 Lanes -> 2 Dashed White Dividers
      const lanes = [-0.33, 0.33];
      lanes.forEach((laneFraction) => {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([18, 18]);
        ctx.lineDashOffset = -roadOffset;

        ctx.beginPath();
        const topX = centerX + (roadTopW / 2) * laneFraction;
        const bottomX = centerX + (roadBottomW / 2) * laneFraction;
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(bottomX, roadBottomY);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 3. Center Zipper Corridor Illumination & Moving Chevrons (Zone 1 or Zone 2)
      const isCorridorActive = inTransit || isPursuitActive || isZone1 || isZone2;
      if (isCorridorActive) {
        ctx.save();
        ctx.beginPath();
        const topZ1 = centerX - roadTopW * 0.16;
        const topZ2 = centerX + roadTopW * 0.16;
        const botZ1 = centerX - roadBottomW * 0.16;
        const botZ2 = centerX + roadBottomW * 0.16;
        ctx.moveTo(topZ1, horizonY);
        ctx.lineTo(topZ2, horizonY);
        ctx.lineTo(botZ2, roadBottomY);
        ctx.lineTo(botZ1, roadBottomY);
        ctx.closePath();

        // Elegant soft illumination overlay without blocking vision
        ctx.fillStyle = isZone1 ? 'rgba(239, 68, 68, 0.16)' : 'rgba(245, 158, 11, 0.10)';
        ctx.fill();
        ctx.strokeStyle = isZone1 ? 'rgba(239, 68, 68, 0.55)' : 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Dynamic forward moving chevron arrows along center zipper
        const chevronSpacing = 45;
        const chevronOffset = (Date.now() / 25) % chevronSpacing;
        ctx.strokeStyle = isZone1 ? 'rgba(254, 202, 202, 0.65)' : 'rgba(253, 230, 138, 0.45)';
        ctx.lineWidth = 2;
        for (let y = roadBottomY - chevronOffset; y > horizonY + 20; y -= chevronSpacing) {
          const progress = (y - horizonY) / (roadBottomY - horizonY);
          const currentW = (roadTopW + (roadBottomW - roadTopW) * progress) * 0.12;
          ctx.beginPath();
          ctx.moveTo(centerX - currentW, y);
          ctx.lineTo(centerX, y - 10 * progress);
          ctx.lineTo(centerX + currentW, y);
          ctx.stroke();
        }

        // Clean asphalt text notice
        if (isZone1) {
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = 'rgba(254, 202, 202, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText('▼ CENTER ZIPPER CORRIDOR OPEN ▼', centerX, height * 0.90);
        }
        ctx.restore();
      }

      // 4. Update & Render All 5 Traffic Cars Ahead (Dynamic, Graceful Zipper Transition)
      const cars = trafficCarsRef.current;
      cars.forEach((car) => {
        // Continuous, sequential transition: ALL 5 CARS receive shockwave and part smoothly
        const hasSignal = isCorridorActive || ambulanceDistance <= 900;

        if (hasSignal && (isZone1 || ambulanceDistance <= 650)) {
          // ZONE 1 ACTIVE ZIPPER CLEARING:
          car.signalReceived = true;
          if (car.partDirection === 'LEFT') {
            car.targetX = -0.68; // Smoothly hug left shoulder
            car.blinker = 'LEFT';
            car.statusTag = '⇦ Yielding Left';
          } else {
            car.targetX = 0.68; // Smoothly hug right divider
            car.blinker = 'RIGHT';
            car.statusTag = '⇨ Yielding Right';
          }
        } else if (hasSignal && isZone2) {
          // ZONE 2 ELASTIC CUSHION: Pre-angle wheels and leave 2m gap
          car.signalReceived = true;
          car.blinker = car.partDirection;
          car.targetX = car.partDirection === 'LEFT' ? -0.28 : 0.28;
          car.statusTag = '2m Turning Gap';
        } else {
          // NORMAL TRAFFIC: Calm cruising in center lane
          car.signalReceived = false;
          car.blinker = 'NONE';
          car.targetX = car.id % 2 === 0 ? 0.02 : -0.02;
          car.statusTag = 'Cruising';
        }

        // Smooth lateral steering easing
        car.x += (car.targetX - car.x) * 0.08;

        // 3D Perspective Projection
        const perspective = 30 / (30 + car.z);
        const carY = horizonY + (roadBottomY - horizonY) * (1 - car.z / 135);
        const carRoadWidth = roadTopW + (roadBottomW - roadTopW) * (1 - car.z / 135);
        const carX = centerX + (carRoadWidth / 2) * car.x;
        const carW = Math.max(18, 76 * perspective);
        const carH = Math.max(12, 44 * perspective);

        if (car.z > 5 && car.z < 135) {
          // A) Above-Car Floating Status Pill (Sleek, Non-Congested AR HUD)
          ctx.save();
          const badgeY = carY - carH - 12 * perspective;
          const badgeW = Math.max(48, 96 * perspective);
          const badgeH = Math.max(11, 18 * perspective);

          // Soft translucent pill
          ctx.beginPath();
          ctx.roundRect(carX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 6 * perspective);
          if (car.statusTag.includes('Yielding')) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.strokeStyle = car.partDirection === 'LEFT' ? '#38bdf8' : '#a855f7';
          } else if (car.statusTag.includes('Turning Gap')) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.strokeStyle = '#f59e0b';
          } else {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.strokeStyle = '#475569';
          }
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.stroke();

          // Small Status Dot
          ctx.beginPath();
          ctx.arc(carX - badgeW * 0.36, badgeY, 2.5 * perspective, 0, Math.PI * 2);
          ctx.fillStyle = car.signalReceived ? (Math.floor(Date.now() / 200) % 2 === 0 ? '#38bdf8' : '#ffffff') : '#64748b';
          ctx.fill();

          // Status Text
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.max(6.5, 9 * perspective)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(car.statusTag, carX + 4 * perspective, badgeY);
          ctx.restore();

          // B) 3D Vector Car Body Rendering
          ctx.save();
          // Drop shadow on asphalt
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.beginPath();
          ctx.ellipse(carX, carY + 1.5 * perspective, carW * 0.52, carH * 0.22, 0, 0, Math.PI * 2);
          ctx.fill();

          // Main Car Body (Curved chassis)
          ctx.fillStyle = car.color;
          ctx.beginPath();
          ctx.roundRect(carX - carW / 2, carY - carH, carW, carH, 6 * perspective);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Car Roof / Cabin Glass
          ctx.fillStyle = car.roofColor;
          ctx.fillRect(carX - carW * 0.36, carY - carH * 0.95, carW * 0.72, carH * 0.45);

          // Rear Windshield Glass
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(carX - carW * 0.33, carY - carH * 0.88, carW * 0.66, carH * 0.34);

          // Dual Red Taillights
          const isBraking = isZone1 || isZone2;
          ctx.fillStyle = isBraking ? '#ef4444' : '#b91c1c';
          ctx.fillRect(carX - carW * 0.44, carY - carH * 0.34, carW * 0.20, carH * 0.20);
          ctx.fillRect(carX + carW * 0.24, carY - carH * 0.34, carW * 0.20, carH * 0.20);

          // Dynamic Blinking Amber Turn Signals when parting
          const isBlinkOn = Math.floor(Date.now() / 160) % 2 === 0;
          if (car.blinker === 'LEFT' && isBlinkOn) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(carX - carW * 0.44, carY - carH * 0.24, 4 * perspective, 0, Math.PI * 2);
            ctx.fill();
          } else if (car.blinker === 'RIGHT' && isBlinkOn) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(carX + carW * 0.44, carY - carH * 0.24, 4 * perspective, 0, Math.PI * 2);
            ctx.fill();
          }

          // License plate
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(carX - carW * 0.18, carY - carH * 0.25, carW * 0.36, carH * 0.14);
          ctx.fillStyle = '#0f172a';
          ctx.font = `bold ${Math.max(4.5, 6.5 * perspective)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(car.modelName.substring(0, 7), carX, carY - carH * 0.18);
          ctx.restore();
        }
      });

      // 5. High-Fidelity 3D Emergency Ambulance Traveling through Center Zipper!
      // Visible approaching from behind (distance <= 80m) AND rushing past through the zipper corridor
      if (ambulanceDistance <= 80 && ambulanceDistance >= -320) {
        // Coordinate calculation:
        // When ambulanceDistance is 80 -> 0: Emerging from bottom edge into center lane
        // When ambulanceDistance is 0 -> -320: Traveling forward through parted cars toward horizon
        let ambZ = 0;
        let ambY = 0;

        if (ambulanceDistance > 0) {
          // Approaching alongside player bumper
          const progress = 1 - ambulanceDistance / 80;
          ambY = roadBottomY + (1 - progress) * 80;
          ambZ = 8 * (1 - progress);
        } else {
          // Speeds past and zooms ahead into distance
          ambZ = Math.abs(ambulanceDistance) / 2.0;
          ambY = roadBottomY - (roadBottomY - horizonY) * (ambZ / 135);
        }

        const perspective = 30 / (30 + ambZ);
        const ambX = centerX; // Exactly down the center zipper
        const ambW = Math.max(26, 92 * perspective);
        const ambH = Math.max(18, 64 * perspective);

        ctx.save();
        // Ambulance Asphalt Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.ellipse(ambX, ambY + 2, ambW * 0.58, ambH * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing Emergency Strobe Glow on the Road Surface
        const strobeBlue = Math.floor(Date.now() / 90) % 2 === 0;
        ctx.fillStyle = strobeBlue ? 'rgba(0, 229, 255, 0.38)' : 'rgba(239, 68, 68, 0.38)';
        ctx.beginPath();
        ctx.ellipse(ambX, ambY, ambW * 0.75, ambH * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ambulance Main Body (Emergency White Van)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(ambX - ambW / 2, ambY - ambH, ambW, ambH, 8 * perspective);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Red Reflective Paramedic Band
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(ambX - ambW / 2 + 1, ambY - ambH * 0.44, ambW - 2, ambH * 0.38);

        // Fluorescent Yellow/Green Emergency Chevrons on Doors
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.moveTo(ambX - ambW * 0.35, ambY - 2);
        ctx.lineTo(ambX - ambW * 0.25, ambY - ambH * 0.28);
        ctx.lineTo(ambX - ambW * 0.15, ambY - 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(ambX + ambW * 0.15, ambY - 2);
        ctx.lineTo(ambX + ambW * 0.25, ambY - ambH * 0.28);
        ctx.lineTo(ambX + ambW * 0.35, ambY - 2);
        ctx.fill();

        // Rear Tinted Emergency Windows
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ambX - ambW * 0.42, ambY - ambH * 0.90, ambW * 0.38, ambH * 0.38);
        ctx.fillRect(ambX + ambW * 0.04, ambY - ambH * 0.90, ambW * 0.38, ambH * 0.38);

        // 108 Emergency ID & LifeCorridor Branding
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(7.5, 13 * perspective)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('108 EMERGENCY', ambX, ambY - ambH * 0.25);

        // High-Intensity Roof LED Lightbar (Alternating Red and Sky Blue Xenon Strobes)
        const lightbarW = ambW * 0.72;
        const lightbarH = 6 * perspective;

        ctx.fillStyle = strobeBlue ? '#00e5ff' : '#1e293b';
        ctx.fillRect(ambX - lightbarW / 2, ambY - ambH * 1.08, lightbarW / 2, lightbarH);

        ctx.fillStyle = !strobeBlue ? '#ff1744' : '#1e293b';
        ctx.fillRect(ambX, ambY - ambH * 1.08, lightbarW / 2, lightbarH);

        // Lightbar Flare Glow
        ctx.fillStyle = strobeBlue ? 'rgba(0, 229, 255, 0.85)' : 'rgba(255, 23, 68, 0.85)';
        ctx.beginPath();
        ctx.arc(
          strobeBlue ? ambX - lightbarW * 0.25 : ambX + lightbarW * 0.25,
          ambY - ambH * 1.05,
          11 * perspective,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
      }

      // Smoothly steer player's X position
      setPlayerX((prev) => prev + (targetPlayerX - prev) * 0.1);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [playerSpeed, playerX, targetPlayerX, isZone1, isZone2, isOvertaken, ambulanceDistance, inTransit, isPursuitActive]);

  // Handle Point-to-Point Route Generation
  const handleGenerateCustomRoute = async () => {
    if (!originArea.trim() || !destinationArea.trim()) return;
    setIsGeocodingRoute(true);
    setRouteStatusNotice('Resolving addresses and calculating real-time corridor...');

    try {
      let latA = originCoords?.lat;
      let lngA = originCoords?.lng;
      let nameA = originArea;

      if (latA === undefined || lngA === undefined) {
        const resA = await fetch(`/api/geocode?q=${encodeURIComponent(originArea.trim())}`);
        const dataA = await resA.json();
        if (dataA.lat && dataA.lng) {
          latA = dataA.lat;
          lngA = dataA.lng;
          nameA = dataA.displayName || originArea;
        }
      }

      let latB = destCoords?.lat;
      let lngB = destCoords?.lng;
      let nameB = destinationArea;

      if (latB === undefined || lngB === undefined) {
        const resB = await fetch(`/api/geocode?q=${encodeURIComponent(destinationArea.trim())}`);
        const dataB = await resB.json();
        if (dataB.lat && dataB.lng) {
          latB = dataB.lat;
          lngB = dataB.lng;
          nameB = dataB.displayName || destinationArea;
        }
      }

      if (latA !== undefined && lngA !== undefined && latB !== undefined && lngB !== undefined) {
        const customCorridor = generatePointToPointCorridor(
          latA,
          lngA,
          nameA,
          latB,
          lngB,
          nameB
        );

        if (onApplyCustomCorridor) {
          onApplyCustomCorridor(customCorridor);
        }

        setRouteStatusNotice(
          `Corridor Route Locked: ${nameA.split(',')[0]} → ${nameB.split(',')[0]}! Ready for transit simulation.`
        );
        onTriggerVoice();
      } else {
        setRouteStatusNotice('Could not resolve both locations. Check spelling and try again.');
      }
    } catch (err: any) {
      setRouteStatusNotice('Geocoding service error: ' + err.message);
    } finally {
      setIsGeocodingRoute(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------ */}
      {/* 1. TOP HEADER & QUICK VIEW LAYOUT SELECTOR                   */}
      {/* ------------------------------------------------------------ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Toggle Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setLayoutMode('SPLIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              layoutMode === 'SPLIT' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CarIcon className="w-3.5 h-3.5" />
            <span>Split View (Road + Maps)</span>
          </button>
          <button
            onClick={() => setLayoutMode('MAPS_FOCUS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              layoutMode === 'MAPS_FOCUS' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Google Maps View</span>
          </button>
          <button
            onClick={() => setLayoutMode('ROAD_FOCUS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              layoutMode === 'ROAD_FOCUS' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Windshield Road Focus</span>
          </button>
        </div>

        {/* Right: Quick Transit Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTransit}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all ${
              inTransit
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {inTransit ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Stop Transit</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Emergency Transit</span>
              </>
            )}
          </button>

          <button
            onClick={handleRestartPursuit}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 shadow"
            title="Replay Zipper Overtake from 700m behind"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Replay Overtake</span>
          </button>

          <button
            onClick={onTriggerVoice}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 flex items-center gap-1.5 shadow"
            title="Hear in-car voice directive"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice Alert</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* 2. THE COCKPIT INTERACTION DISPLAY                           */}
      {/* ------------------------------------------------------------ */}
      <div className="space-y-4 select-none">
        {/* Side-by-Side Responsive View for Split Mode or Single Mode Focus */}
        <div className={layoutMode === 'SPLIT' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch' : 'space-y-4'}>
          {/* ========================================================== */}
          {/* A. 3D WINDSHIELD ROAD CANVAS (Shown in SPLIT or ROAD_FOCUS) */}
          {/* ========================================================== */}
          {(layoutMode === 'SPLIT' || layoutMode === 'ROAD_FOCUS') && (
            <div className="bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden relative flex flex-col justify-between">
              <div className={`relative ${layoutMode === 'ROAD_FOCUS' ? 'h-[480px]' : layoutMode === 'SPLIT' ? 'h-[430px]' : 'h-72 sm:h-80'} w-full overflow-hidden`}>
              {/* HTML5 Canvas Driving Engine */}
              <canvas
                ref={canvasRef}
                width={800}
                height={layoutMode === 'ROAD_FOCUS' ? 460 : 320}
                className="w-full h-full object-cover"
              />

              {/* Left A-Pillar */}
              <div
                className="absolute top-0 bottom-0 left-0 w-12 md:w-20 bg-gradient-to-r from-slate-950 via-slate-900 to-transparent pointer-events-none z-20"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 40% 100%, 0% 100%)' }}
              ></div>

              {/* Right A-Pillar */}
              <div
                className="absolute top-0 bottom-0 right-0 w-12 md:w-20 bg-gradient-to-l from-slate-950 via-slate-900 to-transparent pointer-events-none z-20"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 60% 100%)' }}
              ></div>

              {/* Top Sun-Visor Tint */}
              <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-10"></div>

              {/* High-Fidelity Rearview Mirror */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                <div className="w-3 h-1.5 bg-slate-800 mx-auto rounded-t-sm shadow"></div>
                <div
                  className={`w-64 sm:w-72 h-14 bg-slate-950/95 backdrop-blur-md rounded-xl border-2 px-3 py-1 flex items-center justify-between shadow-2xl transition-all ${
                    isZone1
                      ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse'
                      : isZone2
                      ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-400">REARVIEW</span>
                    {isZone1 && (
                      <span className="px-1.5 py-0.5 bg-red-600 text-white rounded font-mono text-[8px] font-black animate-ping">
                        SIREN
                      </span>
                    )}
                  </div>

                  {/* Reflection of approaching 108 Ambulance */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-11 h-7 rounded bg-red-600 border border-white flex items-center justify-center relative overflow-hidden transition-transform ${
                        ambulanceDistance <= 150 ? 'scale-125 shadow-[0_0_15px_rgba(239,68,68,0.9)]' : 'scale-90'
                      }`}
                    >
                      <span className="text-[8px] font-black text-white font-mono">108</span>
                      <div className="absolute top-0 left-0 w-3 h-2 bg-cyan-400 animate-ping"></div>
                      <div className="absolute top-0 right-0 w-3 h-2 bg-red-400 animate-ping"></div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-black block leading-none ${
                          isZone1 ? 'text-red-400 animate-pulse' : isZone2 ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {ambulanceDistance > 0 ? `${Math.round(ambulanceDistance)}m BEHIND` : 'OVERTAKEN'}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono">
                        {isZone1 ? 'CRITICAL CLEARANCE' : isZone2 ? 'ELASTIC CUSHION' : 'CORRIDOR CLEAR'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Windshield AR HUD Directives */}
              <div className="absolute top-18 inset-x-4 flex items-center justify-between pointer-events-none z-20">
                {/* Speed & Lane HUD */}
                <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-cyan-400 font-mono text-[11px] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 animate-spin" />
                  <span>HUD: {playerSpeed} KM/H · {playerLane.replace('LANE_', 'LANE ')}</span>
                </div>

                {/* Directive Banner */}
                {isZone1 && (
                  <div className="px-3.5 py-1 rounded-xl bg-red-600/95 text-white font-black text-xs tracking-wider flex items-center gap-1.5 border border-white/40 shadow-[0_0_25px_rgba(239,68,68,0.8)] animate-bounce">
                    {isRightLane ? (
                      <>
                        <span>MERGE RIGHT (HUG DIVIDER)</span>
                        <CornerUpRight className="w-4 h-4 stroke-[3]" />
                      </>
                    ) : (
                      <>
                        <CornerUpLeft className="w-4 h-4 stroke-[3]" />
                        <span>MERGE LEFT (HUG SHOULDER)</span>
                      </>
                    )}
                  </div>
                )}

                {isZone2 && (
                  <div className="px-3 py-1 rounded-xl bg-amber-600/90 text-white font-bold text-xs tracking-wider flex items-center gap-1.5 border border-white/30 shadow-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>LEAVE 2M GAP · PRE-ANGLE WHEELS 30°</span>
                  </div>
                )}

                {/* Destination Hospital HUD */}
                <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span className="truncate max-w-[180px]">{destinationHospital}</span>
                </div>
              </div>

              {/* Bottom Quick Steering Controls directly on Windshield */}
              <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-auto z-20">
                <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
                  <span className="text-slate-400 font-mono text-[10px]">LANE:</span>
                  <button
                    onClick={steerLeft}
                    className={`px-2 py-0.5 rounded font-bold text-[10px] transition-all ${
                      playerLane === 'LANE_1_LEFT' ? 'bg-sky-500 text-white shadow' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Left (A)
                  </button>
                  <button
                    onClick={() => {
                      setPlayerLane('LANE_2_CENTER');
                      setSteeringAngle(0);
                    }}
                    className={`px-2 py-0.5 rounded font-bold text-[10px] transition-all ${
                      playerLane === 'LANE_2_CENTER' ? 'bg-amber-500 text-white shadow' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    onClick={steerRight}
                    className={`px-2 py-0.5 rounded font-bold text-[10px] transition-all ${
                      playerLane === 'LANE_3_RIGHT' ? 'bg-purple-500 text-white shadow' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Right (D)
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700 text-xs font-mono">
                  <span className="text-slate-400">Audio Ducking:</span>
                  <span className={`font-bold ${volumePct < 50 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                    {volumePct}% ({volumeDb} dB)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* B. IN-DASH GOOGLE MAPS NAVIGATION CONSOLE                  */}
        {/* ========================================================== */}
        {(layoutMode === 'SPLIT' || layoutMode === 'MAPS_FOCUS') && (
          <div className="bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            {/* Turn-By-Turn Navigation Header with Prominent EYE Route Overview Button */}
            <div
              className={`p-3 text-white transition-colors duration-500 ${
                isZone1
                  ? 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800'
                  : isZone2
                  ? 'bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800'
                  : isZone3
                  ? 'bg-gradient-to-r from-yellow-700 via-amber-600 to-yellow-800'
                  : 'bg-emerald-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    {isZone1 ? (
                      isRightLane ? (
                        <CornerUpRight className="w-4 h-4 text-white stroke-[2.5]" />
                      ) : (
                        <CornerUpLeft className="w-4 h-4 text-white stroke-[2.5]" />
                      )
                    ) : isZone2 ? (
                      <AlertTriangle className="w-4 h-4 text-white" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-black tracking-tight leading-none block">
                      {isZone1
                        ? isRightLane
                          ? 'MERGE RIGHT NOW (HUG DIVIDER)'
                          : 'MERGE LEFT NOW (HUG SHOULDER)'
                        : isZone2
                        ? 'PRE-ANGLE WHEELS 30° · LEAVE 2M GAP'
                        : isZone3
                        ? 'CHOKEPOINT FLUSH AHEAD'
                        : 'KEEP STRAIGHT · ROUTE CLEAR'}
                    </span>
                    <span className="text-[11px] font-semibold text-white/90 block mt-0.5">
                      {isZone1
                        ? 'Clear center zipper corridor for approaching Unit 108'
                        : isZone2
                        ? 'Preserve mechanical turning radius'
                        : `Destination: ${destinationHospital}`}
                    </span>
                  </div>
                </div>

                {/* Prominent Eye Route Overview Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('fit-route-overview'));
                      const eyeBtn = document.querySelector('button[title*="Eye Icon"]') as HTMLButtonElement;
                      if (eyeBtn) eyeBtn.click();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 shadow backdrop-blur-md border border-white/30 transition-all active:scale-95"
                    title="Click to zoom and view complete route path from start to hospital"
                  >
                    <Eye className="w-4 h-4 text-cyan-200" />
                    <span className="hidden sm:inline">Fit Route (Eye)</span>
                  </button>

                  <div className="text-right">
                    <span className="text-[9px] font-mono font-black text-white/80 block">SPEED</span>
                    <span className="text-sm font-black font-mono leading-none">
                      {playerSpeed} <span className="text-[8px] font-normal font-sans">km/h</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Lane Allocation Bar */}
              <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      playerLane === 'LANE_1_LEFT'
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
                      playerLane === 'LANE_3_RIGHT'
                        ? isZone1
                          ? 'bg-white text-purple-700 animate-bounce'
                          : 'bg-white text-emerald-800'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    LANE 3 (RIGHT)
                  </span>
                </div>
                <span className="text-[10px] text-white/80 font-mono">GOOGLE MAPS IN-DASH NAVIGATION</span>
              </div>
            </div>

            {/* Embedded Live Google Maps View */}
            <div className={`w-full transition-all duration-300 ${layoutMode === 'MAPS_FOCUS' ? 'h-[580px]' : layoutMode === 'SPLIT' ? 'h-[355px]' : 'h-[380px]'}`}>
              <GoogleNavigationMap
                apiKey={apiKey}
                route={route}
                detourRoute={detourRoute}
                ambulancePos={ambulancePos}
                commuterPos={commuterPos}
                commuter2Pos={commuter2Pos}
                opposingPos={opposingPos}
                zoneColor={alertState.colorCode}
                distanceMeters={ambulanceDistance}
                inTransit={inTransit}
                hospitalName={destinationHospital}
                onMapClick={onMapClick}
                zoom={14}
                className="h-full w-full rounded-none border-none"
              />
            </div>
          </div>
        )}
        </div>

        {/* ========================================================== */}
        {/* C. BOTTOM CONTROLS & ROUTE PLANNER (COMPACT & CLEAN)       */}
        {/* ========================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Quick Route Planner */}
          <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
              <span className="font-bold text-slate-300 font-mono">CUSTOM CORRIDOR ROUTE</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setOriginArea('Indiranagar, Bengaluru');
                    setDestinationArea('Manipal Hospital Old Airport Rd');
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  BLR
                </button>
                <button
                  onClick={() => {
                    setOriginArea('Bandra Kurla Complex, Mumbai');
                    setDestinationArea('Lilavati Hospital, Mumbai');
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  BOM
                </button>
                <button
                  onClick={() => {
                    setOriginArea('Marina Bay, Singapore');
                    setDestinationArea('Singapore General Hospital');
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                >
                  SIN
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
              <PlaceAutocompleteInput
                value={originArea}
                onChange={(val) => {
                  setOriginArea(val);
                  setOriginCoords(null);
                }}
                placeholder="Origin Area or Landmark (e.g. Indiranagar)"
                icon="pin"
                onSelectPlace={(place) => {
                  setOriginArea(place.displayName);
                  setOriginCoords({ lat: place.lat, lng: place.lng });
                }}
              />
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
              <PlaceAutocompleteInput
                value={destinationArea}
                onChange={(val) => {
                  setDestinationArea(val);
                  setDestCoords(null);
                }}
                placeholder="Hospital (e.g. Manipal Hospital)"
                icon="hospital"
                onSelectPlace={(place) => {
                  setDestinationArea(place.displayName);
                  setDestCoords({ lat: place.lat, lng: place.lng });
                }}
              />
              <button
                onClick={handleGenerateCustomRoute}
                disabled={isGeocodingRoute}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow shrink-0 w-full sm:w-auto"
              >
                {isGeocodingRoute ? (
                  <span>Routing...</span>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Set Corridor</span>
                  </>
                )}
              </button>
            </div>

            {routeStatusNotice && (
              <div className="mt-2 text-[11px] text-sky-300 font-mono bg-sky-950/60 p-1.5 rounded-lg border border-sky-500/30">
                {routeStatusNotice}
              </div>
            )}
          </div>

          {/* Media & Audio Ducking Panel */}
          <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white">Car Bluetooth / Media Focus</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${volumePct < 50 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {volumePct}% ({volumeDb} dB)
              </span>
            </div>

            {/* Equalizer animation */}
            <div className="my-1.5 bg-slate-950 rounded-lg p-1.5 border border-slate-800 flex items-end justify-between gap-1 h-6">
              {[40, 75, 60, 90, 70, 50, 85, 65, 80, 55, 35].map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t transition-all duration-200 ${
                    volumePct < 50 ? 'bg-red-500/80' : 'bg-emerald-400/80'
                  }`}
                  style={{ height: `${Math.max(4, (h * volumePct) / 100)}%` }}
                ></div>
              ))}
            </div>

            <span className="text-[10px] text-slate-400 font-mono">
              {volumePct < 50
                ? 'AUDIO DUCKED (-18 dB) FOR EMERGENCY VOICE DIRECTIVE'
                : 'Radio & navigation speech volume normal'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
