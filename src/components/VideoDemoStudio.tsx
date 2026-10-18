import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Square,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  Sparkles,
  Siren,
  ShieldCheck,
  Layers,
  Hospital,
  ArrowRight,
  Maximize2,
  Camera,
  Film,
  Mic,
  FileText,
  RotateCcw,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { ViewMode } from '../types';

interface VideoDemoStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (mode: ViewMode, tab: string) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  inTransit: boolean;
}

export interface VideoScene {
  id: number;
  timeRange: string;
  durationSeconds: number;
  title: string;
  viewMode: ViewMode;
  tabKey: string;
  badge: string;
  badgeColor: string;
   narrationText: string;
  visualCues: string[];
  keyHighlight: string;
}

export const VIDEO_SCENES: VideoScene[] = [
  {
    id: 1,
    timeRange: '0:00 - 0:35',
    durationSeconds: 35,
    title: 'The JAPAC Golden Hour Crisis & Cabin Isolation Paradox',
    viewMode: 'SPLIT_COMMAND',
    tabKey: 'cockpit',
    badge: 'PROBLEM ALIGNMENT',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    narrationText:
      'Welcome to LifeCorridor, an autonomous emergency transit clearance engine built for Google Maps in high-density megacities across JAPAC. In cities like Bengaluru, Jakarta, and Manila, critical ambulances lose up to 60 percent of their medical Golden Hour stuck in bumper-to-bumper standstill gridlock. Modern car cabins are soundproofed vaults; drivers cannot hear external sirens until an ambulance is 15 meters directly behind them. Locked bumper-to-bumper, cars have zero physical turning angle to move. LifeCorridor solves this natively inside Google Maps without requiring expensive municipal hardware or citizen app downloads.',
    visualCues: [
      'Show Dual Command split screen with stationary traffic on map.',
      'Highlight speed readout at 12 km/h standstill gridlock.',
      'Show 500m distance gap between ambulance and commuter vehicle.',
    ],
    keyHighlight: 'Ambulances lose 60% of Golden Hour due to acoustic cabin isolation in standstill traffic.',
  },
  {
    id: 2,
    timeRange: '0:35 - 1:15',
    durationSeconds: 40,
    title: 'Gemini 2.0 Multimodal CAD Verification & Siren Anti-Spoofing',
    viewMode: 'SPLIT_COMMAND',
    tabKey: 'gemini',
    badge: 'GEMINI AI SDK',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    narrationText:
      'To prevent spoofing or unauthorized corridor requests, LifeCorridor deploys a zero-trust verification pipeline powered by Gemini 2.0 Flash using the official Google Gen AI SDK. Gemini analyzes Hospital Computer-Aided Dispatch text in real time, validating acute life-critical STEMI cardiac or polytrauma codes. Simultaneously, acoustic spectral analysis validates 3-second wail, yelp, and hi-lo siren harmonics against vehicle motion telemetry, authorizing an emergency clearance token in under 400 milliseconds.',
    visualCues: [
      'Switch to Gemini Dispatch Verification Lab tab.',
      'Click Run Gemini CAD Verification button to show live AI response.',
      'Show clinical priority score 9/10 and authorized status.',
    ],
    keyHighlight: 'Gemini 2.0 Flash verifies CAD dispatch text and acoustic siren harmonics in <400ms.',
  },
  {
    id: 3,
    timeRange: '1:15 - 2:00',
    durationSeconds: 45,
    title: 'The 3-Zone Phased Shockwave Protocol',
    viewMode: 'SPLIT_COMMAND',
    tabKey: 'shockwave',
    badge: 'CORE INNOVATION',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    narrationText:
      'In standstill traffic, clearing vehicles from the back fails due to hydraulic rigidity. LifeCorridor deploys a dynamic 3-Zone Phased Shockwave Protocol. Zone 1, within 500 meters, flashes pulsing red on the commuter HUD with voice directive MERGE LEFT NOW to open a center zipper lane. Zone 2, from 500 meters to 3 kilometers, amber warning MAINTAIN 2M GAP instructs drivers to stop tailgating and pre-angle wheels 30 degrees left. Zone 3, up to 10 kilometers, yellow FLUSH FORWARD decompresses lead junctions, pulling the cork out of the bottle.',
    visualCues: [
      'Switch to Shockwave Math Deep Dive view.',
      'Animate progression from Zone 1 Red to Zone 2 Amber and Zone 3 Yellow.',
      'Point out wheel steering angle offset (+30° / -30°).',
    ],
    keyHighlight: '3-Zone Shockwave protocol moves gridlock fluidly before the ambulance arrives.',
  },
  {
    id: 4,
    timeRange: '2:00 - 2:35',
    durationSeconds: 35,
    title: 'In-Drive Commuter HUD & Directional Spatial Filtering',
    viewMode: 'DRIVER_CABIN_POV',
    tabKey: 'driver_cabin',
    badge: 'UX & SPATIAL FILTERING',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    narrationText:
      'Here is the in-car experience from Driver Cabin POV. As the ambulance approaches 400 meters behind, Google Maps triggers ambient audio focus ducking, dimming Bluetooth music over car speakers. A voice alert instructs the driver to shift left. Crucially, directional vector filtering compares vehicle heading vectors within plus-minus 30 degrees. Vehicles on flyovers, underpasses, or opposing lanes receive a clear GREEN status, eliminating false alarms.',
    visualCues: [
      'Switch to Driver Cabin POV tab.',
      'Click Start Emergency Transit to initiate active movement.',
      'Demonstrate audio ducking meter dropping to -18dB during voice alert.',
      'Show steering wheel auto-biasing 30° to the left.',
    ],
    keyHighlight: 'Ambient Bluetooth audio ducking & ±30° directional vector filtering eliminate false alarms.',
  },
  {
    id: 5,
    timeRange: '2:35 - 3:10',
    durationSeconds: 35,
    title: 'Hospital Trauma Bay Handshake & Macro-Inflow Rerouting',
    viewMode: 'HOSPITAL_TRAUMA_BAY',
    tabKey: 'trauma',
    badge: 'HOSPITAL READINESS',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    narrationText:
      'While the corridor clears ahead, receiving emergency doctors at Manipal Hospital receive real-time telemetry via the Hospital Trauma Bay Handshake. Patient vitals, cardiac VTach status, and dynamic ETA countdowns mobilize Cardiac Cath Lab and Trauma Bay 1 prior to arrival. Simultaneously, Google Maps Macro-Inflow routing adds cost penalties to active emergency arterial roads, rerouting 380 incoming civilian vehicles onto parallel roads 3 kilometers away.',
    visualCues: [
      'Switch to Hospital Trauma Bay Handshake tab.',
      'Display real-time countdown timer (e.g., 4 mins ETA).',
      'Show Code Red Mobilized readiness checklist.',
      'Point out Macro-Inflow metrics widget showing 78% traffic pressure reduction.',
    ],
    keyHighlight: 'Receiving trauma team mobilized 5 mins before arrival; 380+ inflow vehicles diverted.',
  },
  {
    id: 6,
    timeRange: '3:10 - 3:30',
    durationSeconds: 20,
    title: 'Google Cloud Architecture & Submission Conclusion',
    viewMode: 'SPLIT_COMMAND',
    tabKey: 'cockpit',
    badge: 'CLOUD RUN + FIRESTORE',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    narrationText:
      'LifeCorridor is powered by Google Cloud Run microservices, Gemini 2.0 Flash, Google Cloud Firestore real-time listeners, and Google Maps Platform vector styling. By unlocking the Golden Hour without municipal hardware, LifeCorridor transforms emergency mobility across megacities. Thank you.',
    visualCues: [
      'Return to Dual Command Cockpit overview.',
      'Show 8.5 minutes saved callout badge.',
      'End video presentation smoothly at exactly 3 minutes 30 seconds.',
    ],
    keyHighlight: 'Full-stack Google Cloud solution saving up to 8.5 minutes per emergency transit.',
  },
];

export const VideoDemoStudio: React.FC<VideoDemoStudioProps> = ({
  isOpen,
  onClose,
  onNavigateView,
  onStartSimulation,
  onStopSimulation,
  inTransit,
}) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlayingScript, setIsPlayingScript] = useState(false);
  const [voiceNarration, setVoiceNarration] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [copiedScript, setCopiedScript] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'finished'>('idle');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const sceneTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const activeScene = VIDEO_SCENES[activeSceneIndex];
  const TOTAL_DEMO_SECONDS = 210; // 3 minutes 30 seconds (100% compliant with 3-4 min rule)

  // Speech synthesis voice narration
  const speakSceneNarration = (text: string) => {
    if (!voiceNarration || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech error
    }
  };

  // Switch to specific scene
  const handleSelectScene = (index: number) => {
    setActiveSceneIndex(index);
    const targetScene = VIDEO_SCENES[index];
    onNavigateView(targetScene.viewMode, targetScene.tabKey);

    // Auto trigger simulation for scene 4 or scene 1 if playing
    if (targetScene.id === 4 && !inTransit) {
      onStartSimulation();
    }

    if (isPlayingScript) {
      speakSceneNarration(targetScene.narrationText);
    }
  };

  // Start Automated Live AI Video Presentation
  const handleStartAutoPresentation = () => {
    setIsPlayingScript(true);
    setActiveSceneIndex(0);
    setElapsedSeconds(0);
    const firstScene = VIDEO_SCENES[0];
    onNavigateView(firstScene.viewMode, firstScene.tabKey);
    speakSceneNarration(firstScene.narrationText);
  };

  // Stop Presentation
  const handleStopAutoPresentation = () => {
    setIsPlayingScript(false);
    if (sceneTimerRef.current) clearInterval(sceneTimerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Auto presentation timer loop
  useEffect(() => {
    if (!isPlayingScript) return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;

        // Check scene transitions
        let accum = 0;
        for (let i = 0; i < VIDEO_SCENES.length; i++) {
          accum += VIDEO_SCENES[i].durationSeconds;
          if (next === accum - VIDEO_SCENES[i].durationSeconds && i !== activeSceneIndex) {
            handleSelectScene(i);
            break;
          }
        }

        if (next >= TOTAL_DEMO_SECONDS) {
          handleStopAutoPresentation();
          return TOTAL_DEMO_SECONDS;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayingScript, activeSceneIndex]);

  // Screen Video Recorder using MediaRecorder API
  const handleStartScreenRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true,
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordingState('finished');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingState('recording');

      // Automatically launch AI presentation
      handleStartAutoPresentation();
    } catch (err: any) {
      alert('Screen recording cancelled or not supported by browser: ' + err.message);
    }
  };

  const handleStopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const copyFullScript = () => {
    const fullText = VIDEO_SCENES.map(
      (s) => `--- SCENE ${s.id}: ${s.title} (${s.timeRange}) ---\n\n${s.narrationText}\n\n[VISUAL CUES]:\n${s.visualCues.map((c) => `- ${c}`).join('\n')}\n`
    ).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between p-5 border-b border-slate-800 bg-slate-950 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-rose-950">
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  3.5-Minute AI Video Demonstration Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  3:30 DURATION COMPLIANT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Google Cloud AI Builder Cup 2026 · Automated Scene Presentation, Voice Narration & Screen Recorder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceNarration(!voiceNarration)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                voiceNarration
                  ? 'bg-purple-950/80 border-purple-500/60 text-purple-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle browser AI voice speech synthesis narration"
            >
              {voiceNarration ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Voice AI: {voiceNarration ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {/* Top Banner: Video Requirement Rule Compliance */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3 max-w-2xl">
              <Clock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">
                  Mandatory Submission Requirement: 3 to 4 Minute Video Demonstration
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Per rule criteria: "Participants must submit a 3 to 4 minute video demonstration clearly showing working functionality. Videos exceeding 4 minutes attract penalties."
                  This Studio gives you an exact <strong>3 minute 30 second</strong> automated script and live UI walkthrough.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isPlayingScript ? (
                <button
                  onClick={handleStartAutoPresentation}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all scale-105"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch AI Auto Presentation (3:30)</span>
                </button>
              ) : (
                <button
                  onClick={handleStopAutoPresentation}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Pause AI Presentation ({formatTime(elapsedSeconds)} / 3:30)</span>
                </button>
              )}

              {recordingState === 'idle' ? (
                <button
                  onClick={handleStartScreenRecording}
                  className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/60 font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all"
                  title="Capture screen and audio directly to webm video file"
                >
                  <Camera className="w-4 h-4 text-rose-400" />
                  <span>1-Click Screen Recorder</span>
                </button>
              ) : recordingState === 'recording' ? (
                <button
                  onClick={handleStopScreenRecording}
                  className="px-3.5 py-2.5 bg-red-600 animate-pulse text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Recording Video</span>
                </button>
              ) : (
                <a
                  href={recordedVideoUrl || '#'}
                  download="LifeCorridor-Video-Demo-3min30s.webm"
                  className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Recorded MP4/WebM</span>
                </a>
              )}
            </div>
          </div>

          {/* Timeline Scene Navigation Cards (1 to 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {VIDEO_SCENES.map((scene, idx) => {
              const isActive = idx === activeSceneIndex;
              return (
                <button
                  key={scene.id}
                  onClick={() => handleSelectScene(idx)}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isActive
                      ? 'bg-gradient-to-b from-cyan-950 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                      : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        SCENE {scene.id}
                      </span>
                      <span className="font-mono text-[9px] text-cyan-400 font-semibold">
                        {scene.timeRange}
                      </span>
                    </div>
                    <div className="font-bold text-white line-clamp-2 text-[11px] leading-snug">
                      {scene.title}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${scene.badgeColor}`}>
                      {scene.badge}
                    </span>
                    {isActive && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Scene Detailed Presenter Teleprompter */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 relative overflow-hidden shadow-xl">
            {/* Top Indicator */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
                <h3 className="text-sm font-black text-white">
                  Scene {activeScene.id}: {activeScene.title}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${activeScene.badgeColor}`}>
                  {activeScene.badge}
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-slate-400">Timestamp: {activeScene.timeRange}</span>
                <span className="text-cyan-400 font-bold">Duration: {activeScene.durationSeconds}s</span>
              </div>
            </div>

            {/* Teleprompter Spoken Script Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-300 font-mono flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  Spoken AI Voiceover Script (Word-for-Word):
                </span>
                <button
                  onClick={() => speakSceneNarration(activeScene.narrationText)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read Scene Voiceover</span>
                </button>
              </div>

              <p className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 font-sans text-sm text-purple-100 leading-relaxed font-medium shadow-inner">
                "{activeScene.narrationText}"
              </p>
            </div>

            {/* Visual Cues for Video Editor / Recorder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
                  <Film className="w-3.5 h-3.5" /> Video Visual Cues (On-Screen Actions)
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {activeScene.visualCues.map((cue, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Key Judge Takeaway
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {activeScene.keyHighlight}
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => onNavigateView(activeScene.viewMode, activeScene.tabKey)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <span>Jump to Live UI View ({activeScene.viewMode})</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full Video Script Download / Copy Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Complete 3.5-Minute Video Narration Script (Copy / Export)
              </h4>

              <button
                onClick={copyFullScript}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copied Full Script!' : 'Copy Full Video Script'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              You can paste this script into Loom, OBS Studio, YouTube Studio, or AI video avatars (like HeyGen, Synthesia, or InVideo) to generate a video presentation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Duration: 3m 30s · Fully compliant with hackathon 3-4 minute rule</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition-colors"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
