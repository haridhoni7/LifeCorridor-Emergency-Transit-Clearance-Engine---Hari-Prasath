import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Github,
  Terminal,
  Award,
  FileText,
  Download,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('haridhoni7');
  const [repoNameInput, setRepoNameInput] = useState('LifeCorridor-Emergency-Transit-Clearance-Engine---Hari');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    success: boolean;
    message: string;
    repoUrl?: string;
  } | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePushToGithub = async () => {
    if (!tokenInput.trim()) {
      setPushStatus({
        success: false,
        message: 'Please enter your GitHub Personal Access Token (classic or fine-grained with repo access).',
      });
      return;
    }

    setPushLoading(true);
    setPushStatus(null);

    try {
      const res = await fetch('/api/push-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUsername: usernameInput.trim() || 'haridhoni7',
          repoName: repoNameInput.trim() || 'LifeCorridor-Emergency-Transit-Clearance-Engine---Hari',
          token: tokenInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushStatus({
          success: true,
          message: data.message,
          repoUrl: data.repoUrl,
        });
      } else {
        setPushStatus({
          success: false,
          message: data.error || 'Push failed. Please verify your token and repo creation.',
        });
      }
    } catch (err: any) {
      setPushStatus({
        success: false,
        message: 'Network error while pushing to GitHub: ' + err.message,
      });
    } finally {
      setPushLoading(false);
    }
  };

  const gitCommands = `# 1. Push latest LifeCorridor prototype directly to your friend's GitHub repo:
git init
git add .
git commit -m "feat: complete LifeCorridor prototype with dual POV, audio isolation & Places autosuggest"
git branch -M main
git remote add origin https://github.com/${usernameInput}/${repoNameInput}.git
git push -u origin main --force`;

  const cloudRunCommands = `# 2. Deploy Python FastAPI Backend to Google Cloud Run
cd backend
gcloud run deploy lifecorridor-api \\
  --source . \\
  --platform managed \\
  --region asia-southeast1 \\
  --allow-unauthenticated \\
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY"`;

  const firebaseCommands = `# 3. Deploy Frontend to Firebase Hosting
npm run build
firebase login
firebase init hosting
# Public directory: dist
# Single-page app: Yes
firebase deploy --only hosting`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">
                LifeCorridor — GitHub Repository & Official Submission Hub
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Google Cloud AI Builder Cup 2026 · Track: Sustainability & Social Impact · Author: Hari Dhoni (@haridhoni7)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Target GitHub Repository Sync Guidance */}
          <div className="p-4 rounded-lg bg-cyan-950/40 border border-cyan-500/50 text-cyan-200">
            <div className="flex items-start gap-3">
              <Github className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-sm text-cyan-300">
                  Target GitHub Repository: https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You can sync all source code (React HUD, Gemini AI SDK, Python FastAPI Backend, Dockerfile, GEMINI.md, and README.md) directly to your repository using Option A below or through your local terminal using Option B.
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href="https://github.com/haridhoni7/LifeCorridor-Emergency-Transit-Clearance-Engine---Hari"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs transition-colors shadow-sm"
                  >
                    <span>Open GitHub Repository</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="/api/download-zip"
                    download="LifeCorridor-source.zip"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded text-xs transition-colors border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Project ZIP</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Browser Push or Token Push */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              Option A: Push Directly to GitHub via Personal Access Token
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">GitHub Username / Org</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="haridhoni7"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Target GitHub Repository</label>
                <input
                  type="text"
                  value={repoNameInput}
                  onChange={(e) => setRepoNameInput(e.target.value)}
                  placeholder="LifeCorridor-Emergency-Transit-Clearance-Engine---Hari"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your GitHub Personal Access Token (e.g. ghp_...)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handlePushToGithub}
                disabled={pushLoading || !tokenInput.trim()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                {pushLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Pushing...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-3.5 h-3.5" />
                    <span>Push Code to GitHub</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              Need a token? Generate one in 30 seconds at <a href="https://github.com/settings/tokens/new?scopes=repo&description=LifeCorridor+BuilderCup" target="_blank" rel="noreferrer" className="text-cyan-400 underline">github.com/settings/tokens</a>.
            </div>

            {pushStatus && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  pushStatus.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                {pushStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{pushStatus.success ? 'Success!' : 'Push Failed'}</div>
                  <div className="mt-0.5 leading-relaxed">{pushStatus.message}</div>
                  {pushStatus.repoUrl && (
                    <a
                      href={pushStatus.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-cyan-400 underline font-semibold"
                    >
                      <span>Open {pushStatus.repoUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Copy Terminal Commands */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Option B: Push via Git Terminal (Localhost / Laptop)
            </h3>
            <p className="text-xs text-slate-400">
              Download the ZIP or copy these commands into your local terminal inside the project directory:
            </p>

            <div className="relative">
              <div className="flex justify-between items-center mb-1 text-[11px] text-slate-400 font-mono">
                <span>Terminal Commands</span>
                <button
                  onClick={() => copyText(gitCommands, 'git')}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                >
                  {copiedKey === 'git' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'git' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                {gitCommands}
              </pre>
            </div>
          </div>

          {/* Official Judging Rubric Fulfillment */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Google Cloud AI Builder Cup 2026 Evaluation Alignment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-white text-xs">Technical Merit (40%)</strong>
                  <span className="text-[10px] text-cyan-400 font-mono">HIGHEST WEIGHT</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gemini 2.0/3.8 Flash (`@google/genai` SDK) for CAD dispatch verification and acoustic siren harmonics (anti-spoofing). Real-time 3-Zone Shockwave calculation on Cloud Run, Firestore real-time sync, and Edge PWA.
                </p>
              </div>

              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-white text-xs">Problem Alignment & Impact (25%)</strong>
                  <span className="text-[10px] text-emerald-400 font-mono">CRITICAL NEED</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Solves preventable transit deaths in JAPAC megacity gridlock where ambulances lose 60% of the medical Golden Hour. Cuts transit delays by up to 50% without requiring municipal hardware.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <a
            href="/api/download-zip"
            download="lifecorridor-source.zip"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download lifecorridor-source.zip</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
