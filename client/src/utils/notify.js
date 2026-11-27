let audioCtx = null;
let customAudioBuffer = null;

const CUSTOM_SOUND_KEY = "dayflow_custom_sound";

// Get (or lazily create) the shared AudioContext and resume it
const getCtx = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch {}
  return audioCtx;
};

// Browsers block audio until a user gesture — call this on click / keydown
export const prepareAudio = () => { getCtx(); };

// ─── Built-in sounds ───────────────────────────────────────────────────────

const soundBeep = (ctx) => {
  [0, 0.35, 0.7].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + offset;
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  });
};

const soundBell = (ctx) => {
  const t = ctx.currentTime;
  [[440, 1.0], [880, 0.4], [1320, 0.15]].forEach(([freq, amp]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(amp * 0.4, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 3.0);
  });
};

const soundChime = (ctx) => {
  [[523, 0], [659, 0.28], [784, 0.56], [1047, 0.84]].forEach(([freq, offset]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + offset;
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.28, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.2);
  });
};

const soundDigital = (ctx) => {
  [[1047, 0], [1319, 0.1], [1047, 0.2], [1319, 0.3]].forEach(([freq, offset]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + offset;
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.setValueAtTime(0.0001, t + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  });
};

const soundGentle = (ctx) => {
  [0, 0.7].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + offset;
    osc.type = "sine";
    osc.frequency.value = 528;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.0);
  });
};

const SOUND_FNS = { beep: soundBeep, bell: soundBell, chime: soundChime, digital: soundDigital, gentle: soundGentle };

// ─── Public API ────────────────────────────────────────────────────────────

export const playBeep = () => playSound("beep"); // backward-compat

export const playSound = (soundId = "beep") => {
  if (!soundId || soundId === "off") return;
  const ctx = getCtx();
  if (!ctx) return;

  if (soundId === "custom") {
    if (customAudioBuffer) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = customAudioBuffer;
        const gain = ctx.createGain();
        gain.gain.value = 0.8;
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
      } catch {}
    } else {
      soundBeep(ctx); // fallback if buffer not loaded yet
    }
    return;
  }

  try { (SOUND_FNS[soundId] || SOUND_FNS.beep)(ctx); } catch {}
};

// Load a File object chosen by the user; persists to localStorage as base64
export const loadCustomSound = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const ab = e.target.result;
        // store as base64 so it survives a page reload
        const bytes = new Uint8Array(ab);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        localStorage.setItem(CUSTOM_SOUND_KEY, JSON.stringify({ base64, name: file.name }));
        // decode for immediate playback
        const ctx = getCtx();
        if (ctx) customAudioBuffer = await ctx.decodeAudioData(ab);
        resolve(file.name);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

// Restore the saved custom sound buffer from localStorage (call on app load)
export const restoreCustomSound = async () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_SOUND_KEY));
    if (!stored?.base64) return null;
    const binary = atob(stored.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ctx = getCtx();
    if (ctx) customAudioBuffer = await ctx.decodeAudioData(bytes.buffer);
    return stored.name;
  } catch { return null; }
};

// Return the name of the saved custom sound file (synchronous, for initial render)
export const getCustomSoundName = () => {
  try { return JSON.parse(localStorage.getItem(CUSTOM_SOUND_KEY))?.name ?? null; }
  catch { return null; }
};

export const askNotificationPermission = () => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
};

export const showNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body }); } catch {}
  }
};
