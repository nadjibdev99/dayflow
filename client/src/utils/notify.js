let audioCtx = null;

// Browsers only allow audio after a user gesture, so call this on a click or key press
export const prepareAudio = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch {
    // audio is optional, never crash the timer because of it
  }
};

// Three short beeps generated in code, so no mp3 file is needed
export const playBeep = () => {
  if (!audioCtx) return;
  try {
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const t = audioCtx.currentTime + offset;

      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  } catch {
    // ignore
  }
};

export const askNotificationPermission = () => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
};

export const showNotification = (title, body) => {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body });
    } catch {
      // some browsers block this, ignore
    }
  }
};