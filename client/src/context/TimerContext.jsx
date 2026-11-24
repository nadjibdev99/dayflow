import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  prepareAudio,
  playBeep,
  askNotificationPermission,
  showNotification,
} from "../utils/notify";

const TimerContext = createContext();
export const useTimer = () => useContext(TimerContext);

const STATE_KEY = "dayflow_timer";
const SETTINGS_KEY = "dayflow_timer_settings";
const MODES = ["focus", "short", "long"];
const ROUNDS_BEFORE_LONG = 4;
const DEFAULT_SETTINGS = { focus: 25, short: 5, long: 15, sound: true };

export const MODE_LABELS = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

const durationMs = (mode, settings) => settings[mode] * 60 * 1000;

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const loadSettings = () => {
  const saved = readJSON(SETTINGS_KEY) || {};
  const settings = { ...DEFAULT_SETTINGS };
  for (const mode of MODES) {
    const v = Number(saved[mode]);
    if (v >= 1 && v <= 180) settings[mode] = v;
  }
  if (typeof saved.sound === "boolean") settings.sound = saved.sound;
  return settings;
};

// What comes after the current session?
// focus -> short break (or long break after every 4th focus), break -> focus
const nextOf = (mode, round) => {
  if (mode === "focus") {
    const newRound = round + 1;
    return {
      mode: newRound % ROUNDS_BEFORE_LONG === 0 ? "long" : "short",
      round: newRound,
    };
  }
  return { mode: "focus", round: mode === "long" ? 0 : round };
};

// Pure function: the timer state after a session ended
const finish = (s, settings) => {
  const next = nextOf(s.mode, s.round);
  return {
    ...s,
    mode: next.mode,
    round: next.round,
    status: "idle",
    endTime: null,
    remainingMs: durationMs(next.mode, settings),
  };
};

const loadTimer = (settings) => {
  const base = {
    mode: "focus",
    status: "idle",
    endTime: null,
    remainingMs: durationMs("focus", settings),
    label: "",
    round: 0,
  };

  const saved = readJSON(STATE_KEY);
  if (!saved || !MODES.includes(saved.mode)) return base;

  const s = { ...base, ...saved };

  if (s.status === "running") {
    if (typeof s.endTime !== "number") return base;
    // the session ended while the page was closed: finish it silently
    // PHASE 5: this is also a finished focus session, we will save it later
    if (s.endTime <= Date.now()) return finish(s, settings);
  }
  if (s.status === "idle") s.remainingMs = durationMs(s.mode, settings);

  return s;
};

export function TimerProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);
  const [timer, setTimer] = useState(() => loadTimer(loadSettings()));
  const [now, setNow] = useState(Date.now());

  // refs always hold the latest values, so timers and callbacks never read stale state
  const timerRef = useRef(timer);
  const settingsRef = useRef(settings);

  const update = useCallback((next) => {
    timerRef.current = next;
    setTimer(next);
  }, []);

  // save the timer on every change, so a refresh restores it
  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(timer));
  }, [timer]);

  // after a refresh the browser blocks audio until the first click or key press
  useEffect(() => {
    window.addEventListener("pointerdown", prepareAudio, { once: true });
    window.addEventListener("keydown", prepareAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", prepareAudio);
      window.removeEventListener("keydown", prepareAudio);
    };
  }, []);

  const complete = useCallback(() => {
    const s = timerRef.current;
    if (s.status !== "running") return; // guard against firing twice

    if (settingsRef.current.sound) playBeep();
    showNotification(
      s.mode === "focus" ? "Focus session done 🍅" : "Break is over",
      s.mode === "focus" ? "Time for a break." : "Ready to focus?"
    );

    // PHASE 5: if (s.mode === "focus") save a session here (label + duration)

    update(finish(s, settingsRef.current));
  }, [update]);

  // The interval only redraws the screen. The real time comes from endTime.
  useEffect(() => {
    if (timer.status !== "running") return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= timerRef.current.endTime) complete();
    }, 250);
    return () => clearInterval(id);
  }, [timer.status, complete]);

  const start = useCallback(() => {
    const s = timerRef.current;
    if (s.status === "running") return;
    prepareAudio();
    askNotificationPermission();
    const t = Date.now();
    setNow(t);
    update({ ...s, status: "running", endTime: t + s.remainingMs });
  }, [update]);

  const pause = useCallback(() => {
    const s = timerRef.current;
    if (s.status !== "running") return;
    update({
      ...s,
      status: "paused",
      remainingMs: Math.max(0, s.endTime - Date.now()),
      endTime: null,
    });
  }, [update]);

  const toggle = useCallback(() => {
    if (timerRef.current.status === "running") pause();
    else start();
  }, [start, pause]);

  const reset = useCallback(() => {
    const s = timerRef.current;
    update({
      ...s,
      status: "idle",
      endTime: null,
      remainingMs: durationMs(s.mode, settingsRef.current),
      label: "",
    });
  }, [update]);

  const switchMode = useCallback(
    (mode) => {
      const s = timerRef.current;
      if (s.status === "running" || !MODES.includes(mode)) return;
      update({
        ...s,
        mode,
        status: "idle",
        endTime: null,
        remainingMs: durationMs(mode, settingsRef.current),
      });
    },
    [update]
  );

  const setLabel = useCallback(
    (label) => update({ ...timerRef.current, label }),
    [update]
  );

  const updateSettings = useCallback(
    (partial) => {
      const next = { ...settingsRef.current, ...partial };
      settingsRef.current = next;
      setSettings(next);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));

      // an idle timer follows the new duration, a running or paused one doesn't
      const s = timerRef.current;
      if (s.status === "idle") {
        update({ ...s, remainingMs: durationMs(s.mode, next) });
      }
    },
    [update]
  );

  const remainingMs =
    timer.status === "running" ? Math.max(0, timer.endTime - now) : timer.remainingMs;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const timeText = `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(
    totalSeconds % 60
  ).padStart(2, "0")}`;

  // show the time in the browser tab title while running
  useEffect(() => {
    document.title =
      timer.status === "running" ? `${timeText} · ${MODE_LABELS[timer.mode]}` : "DayFlow";
  }, [timer.status, timer.mode, timeText]);

  return (
    <TimerContext.Provider
      value={{
        ...timer,
        remainingMs,
        timeText,
        settings,
        rounds: ROUNDS_BEFORE_LONG,
        start,
        pause,
        toggle,
        reset,
        switchMode,
        setLabel,
        updateSettings,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}