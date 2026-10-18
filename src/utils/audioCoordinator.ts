import { inCabinAudio } from './audioDuckingEngine';

/**
 * Universal LifeCorridor Audio Coordinator
 * Guarantees strict Point-of-View (POV) audio isolation across:
 * 1. Commuter Maps In-Car Radio (Lo-fi Chords)
 * 2. Ambulance Cockpit Siren (Dual-Tone Wail / Yelp)
 * 3. Driver Cabin Voice Directives (Speech Synthesis)
 * 4. Dual Command Simulation Sound FX
 *
 * When switching POVs or triggering an emergency in another view,
 * all background sounds from other POVs are cleanly silenced.
 */

export const silenceAllPOVAudio = () => {
  try {
    // 1. Stop in-car simulated radio / Spotify track
    inCabinAudio.stopRadio();

    // 2. Cancel any pending or playing text-to-speech voice directive
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 3. Signal all emergency sirens across all POVs to stop
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stop-all-sirens'));
      window.dispatchEvent(new CustomEvent('stop-all-pov-audio'));
    }
  } catch (err) {
    console.warn('Audio coordinator silence notice:', err);
  }
};

export const stopAllSirens = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stop-all-sirens'));
    }
  } catch (err) {
    console.warn('Stop sirens notice:', err);
  }
};

export const stopCommuterRadio = () => {
  try {
    inCabinAudio.stopRadio();
  } catch (err) {
    console.warn('Stop commuter radio notice:', err);
  }
};
