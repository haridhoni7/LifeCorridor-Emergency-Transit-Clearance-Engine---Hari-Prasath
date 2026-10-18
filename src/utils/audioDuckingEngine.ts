/**
 * In-Car Android Audio Focus Ducking Engine (Web Audio API)
 * Simulates Android OS AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK.
 * Ducks background music / radio from 100% (0 dB) to 15% (-18 dB)
 * when emergency voice directives or sirens sound, and restores cleanly.
 */

class InCabinAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private isRadioPlaying = false;
  private currentVolumeLevel = 1.0; // 0.0 to 1.0
  private radioOscillators: OscillatorNode[] = [];
  private radioInterval: number | null = null;
  private onVolumeChangeCallback: ((volume: number, db: number, isDucked: boolean) => void) | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.musicGainNode = this.ctx.createGain();
        this.musicGainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.musicGainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumeCallback(cb: (volume: number, db: number, isDucked: boolean) => void) {
    this.onVolumeChangeCallback = cb;
  }

  /**
   * Start in-car simulated radio / Spotify track
   */
  public startRadio() {
    this.initContext();
    if (!this.ctx || !this.musicGainNode) return;
    if (this.isRadioPlaying) return;

    this.isRadioPlaying = true;
    this.currentVolumeLevel = 1.0;
    this.notifyVolume(1.0, 0, false);

    // Play a gentle, soothing lo-fi chord groove
    const chords = [
      [261.63, 329.63, 392.0], // C major
      [220.0, 261.63, 329.63], // A minor
      [174.61, 220.0, 261.63], // F major
      [196.0, 246.94, 293.66], // G major
    ];

    let chordIndex = 0;

    const playNextChord = () => {
      if (!this.isRadioPlaying || !this.ctx || !this.musicGainNode) return;

      // Stop previous
      this.radioOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (_) {}
      });
      this.radioOscillators = [];

      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      currentChord.forEach((freq) => {
        if (!this.ctx || !this.musicGainNode) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        noteGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 1.8);

        osc.connect(noteGain);
        noteGain.connect(this.musicGainNode);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.9);
        this.radioOscillators.push(osc);
      });
    };

    playNextChord();
    this.radioInterval = window.setInterval(playNextChord, 2000);
  }

  /**
   * Stop in-car radio
   */
  public stopRadio() {
    this.isRadioPlaying = false;
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
    this.radioOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (_) {}
    });
    this.radioOscillators = [];
    this.notifyVolume(0, -99, false);
  }

  public isPlaying(): boolean {
    return this.isRadioPlaying;
  }

  /**
   * Ducks audio to target level (default -18 dB / 15%)
   */
  public duck(targetGain = 0.15, durationMs = 3500) {
    this.initContext();
    if (!this.musicGainNode || !this.ctx) {
      this.notifyVolume(targetGain, -18, true);
      return;
    }

    const now = this.ctx.currentTime;
    // Rapid duck down over 120ms
    this.musicGainNode.gain.cancelScheduledValues(now);
    this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);
    this.musicGainNode.gain.linearRampToValueAtTime(targetGain, now + 0.12);
    this.currentVolumeLevel = targetGain;
    this.notifyVolume(targetGain, -18, true);

    // Auto restore after duration
    if (durationMs > 0) {
      setTimeout(() => {
        this.restore();
      }, durationMs);
    }
  }

  /**
   * Restores audio smoothly back to 100% (0 dB)
   */
  public restore() {
    if (!this.musicGainNode || !this.ctx) {
      this.notifyVolume(1.0, 0, false);
      return;
    }

    const now = this.ctx.currentTime;
    this.musicGainNode.gain.cancelScheduledValues(now);
    this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);
    this.musicGainNode.gain.linearRampToValueAtTime(1.0, now + 0.4);
    this.currentVolumeLevel = 1.0;
    this.notifyVolume(1.0, 0, false);
  }

  private notifyVolume(volume: number, db: number, isDucked: boolean) {
    if (this.onVolumeChangeCallback) {
      this.onVolumeChangeCallback(volume, db, isDucked);
    }
  }
}

export const inCabinAudio = new InCabinAudioEngine();
