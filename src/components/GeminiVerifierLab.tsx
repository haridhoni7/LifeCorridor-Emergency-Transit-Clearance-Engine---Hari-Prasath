import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Sparkles, Send, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { GeminiVerificationResult } from '../types';

interface GeminiVerifierLabProps {
  onVerifyCustomDispatch: (text: string) => Promise<GeminiVerificationResult>;
  initialResult: GeminiVerificationResult | null;
}

export const GeminiVerifierLab: React.FC<GeminiVerifierLabProps> = ({
  onVerifyCustomDispatch,
  initialResult,
}) => {
  const [inputText, setInputText] = useState(
    'Unit 108: 45-year-old male, acute ST-elevation myocardial infarction (STEMI) with severe chest crushing pain. Vitals failing, en route Manipal Hospital. Urgent Code Red corridor clearance requested.'
  );
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<GeminiVerificationResult | null>(
    initialResult
  );

  // Siren acoustic testing state
  const [testDecibels, setTestDecibels] = useState(94);
  const [testFrequency, setTestFrequency] = useState(980);
  const [isMoving, setIsMoving] = useState(true);
  const [sirenResult, setSirenResult] = useState<{
    verified: boolean;
    reason: string;
    signature: string;
  }>({
    verified: true,
    reason: 'Wail/Yelp acoustic harmonics verified with matching vehicle Doppler shift.',
    signature: 'AUTHENTIC_EMERGENCY_ROOF_SIREN',
  });

  const handleRunVerification = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await onVerifyCustomDispatch(inputText);
      setVerificationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSiren = async () => {
    try {
      const res = await fetch('/api/verify-siren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decibels: testDecibels,
          dominantFrequencies: [testFrequency, testFrequency * 1.4],
          vehicleMoving: isMoving,
        }),
      });
      const data = await res.json();
      setSirenResult({
        verified: data.sirenVerified,
        reason: data.antiSpoofingStatus,
        signature: data.spectralSignature,
      });
    } catch (err) {
      // Local fallback
      const valid = testDecibels >= 85 && testFrequency >= 600 && testFrequency <= 1600 && isMoving;
      setSirenResult({
        verified: valid,
        reason: valid ? 'CLEARED_FOR_BROADCAST' : 'REJECTED_POSSIBLE_CIVILIAN_ABUSE',
        signature: valid ? 'AUTHENTIC_EMERGENCY_ROOF_SIREN' : 'UNRECOGNIZED_OR_NON_COMPLIANT',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Multimodal AI Engine · Gemini 2.0 / 3.8 Flash
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Anti-Spoofing & CAD Dispatch Verification Lab
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-3xl">
              Prevents civilian abuse and fraudulent corridor activation. Gemini inspects the hospital CAD token, semantic triage text, and cabin acoustic microphone harmonics to authorize moving emergency zipper corridors.
            </p>
          </div>
          <span className="hidden md:inline-flex px-3 py-1 bg-purple-950/80 border border-purple-800/60 rounded-md text-xs font-mono text-purple-300">
            @google/genai SDK Core
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dispatch Verification */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Live CAD Dispatch Analysis
              </h3>
              <span className="text-xs text-slate-400">Structured JSON</span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Enter or modify a dispatch transmission to evaluate Gemini's clinical triage validation:
            </p>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono resize-none"
              placeholder="Enter emergency CAD dispatch..."
            />

            {/* Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() =>
                  setInputText(
                    'Unit 108: 45-year-old male, acute STEMI cardiac arrest. CPR ongoing. Priority Manipal Emergency.'
                  )
                }
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 transition-colors"
              >
                Code Red: Cardiac
              </button>
              <button
                onClick={() =>
                  setInputText(
                    'AMB-09: Female 28, multiple traumatic compound fractures from vehicle collision. Shock index high.'
                  )
                }
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300 transition-colors"
              >
                Code Red: Trauma
              </button>
              <button
                onClick={() =>
                  setInputText(
                    'Private car carrying catering supplies for event in Indiranagar. Requesting traffic clearance corridor.'
                  )
                }
                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded text-[11px] text-rose-300 transition-colors"
              >
                Fraud Test: Private Cab
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={handleRunVerification}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating via Gemini...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Verify Dispatch via Gemini 2.0 Flash</span>
                </>
              )}
            </button>

            {/* Verification Result Display */}
            {verificationResult && (
              <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">Authorization Verdict</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      verificationResult.corridor_authorized
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {verificationResult.corridor_authorized ? 'AUTHORIZED' : 'ACCESS DENIED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Urgency Tier:</span>
                    <span className="font-bold text-white">{verificationResult.urgency_tier}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Priority Score:</span>
                    <span className="font-bold text-cyan-400">
                      {verificationResult.clinical_priority_score} / 10
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Patient Assessment:</span>
                  <span className="text-slate-200">{verificationResult.patient_condition}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Operational Triage:</span>
                  <span className="text-slate-200 italic">"{verificationResult.triage_summary}"</span>
                </div>

                {verificationResult.trauma_team_prep && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hospital Pre-Arrival Alert:</span>
                    <span className="text-amber-300 font-mono text-[10px]">
                      {verificationResult.trauma_team_prep}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Acoustic Siren & Anti-Spoofing */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Acoustic Siren Spectral Validator
              </h3>
              <span className="text-xs text-slate-400">Anti-Spoofing</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Cross-checks cabin microphone decibels and frequency harmonics against vehicle telemetry:
            </p>

            <div className="space-y-4 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs">
              {/* Decibels Slider */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Acoustic Loudness:</span>
                  <span className="font-mono text-cyan-400 font-bold">{testDecibels} dB (Req: &gt; 85 dB)</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="110"
                  value={testDecibels}
                  onChange={(e) => setTestDecibels(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Dominant Frequency */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Harmonic Frequency:</span>
                  <span className="font-mono text-cyan-400 font-bold">{testFrequency} Hz (Siren: 650–1500 Hz)</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="50"
                  value={testFrequency}
                  onChange={(e) => setTestFrequency(Number(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Vehicle Moving Check */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300">Vehicle Accelerometer & Motion Telemetry:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMoving}
                    onChange={(e) => setIsMoving(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className={isMoving ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {isMoving ? 'In Motion (Doppler Valid)' : 'Stationary'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleTestSiren}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Validate Acoustic Siren Signature</span>
            </button>

            {/* Siren Result */}
            {sirenResult && (
              <div
                className={`mt-4 p-4 rounded-lg border text-xs flex items-start gap-3 ${
                  sirenResult.verified
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                {sirenResult.verified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {sirenResult.verified ? 'Acoustic Siren Verified' : 'Acoustic Verification Failed'}
                  </div>
                  <div className="mt-1 text-[11px] opacity-90">{sirenResult.reason}</div>
                  <div className="mt-1 font-mono text-[10px] opacity-75">Signature: {sirenResult.signature}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
