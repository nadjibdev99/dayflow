import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Icon from "../components/Icon";
import useHotkeys from "../hooks/useHotkeys";
import { useTimer, MODE_LABELS } from "../context/TimerContext";

const MODES = ["focus", "short", "long"];
const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Pomodoro() {
  const {
    mode, status, timeText, label, round, rounds, settings,
    remainingMs, totalMs,
    toggle, reset, switchMode, setLabel, updateSettings,
  } = useTimer();

  const [showSettings, setShowSettings] = useState(false);

  useHotkeys(" ", toggle);

  // Escape closes the settings panel
  useEffect(() => {
    if (!showSettings) return;
    const onKey = (e) => e.key === "Escape" && setShowSettings(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSettings]);

  const running = status === "running";

  const total = status !== "idle" && totalMs ? totalMs : settings[mode] * 60 * 1000;
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / total));
  const filledRounds = mode === "long" ? rounds : round % rounds;

  // blur after a click, so pressing Space doesn't also "click" the focused button
  const press = (fn) => (e) => {
    e.currentTarget.blur();
    fn();
  };

  const setMinutes = (key) => (e) => {
    const v = parseInt(e.target.value, 10);
    if (v >= 1 && v <= 180) updateSettings({ [key]: v });
  };

  return (
    <>
      <Navbar />
      <main className="page timer-page" data-mode={mode === "focus" ? "focus" : "break"}>
        <button
          className={`icon-btn settings-btn${showSettings ? " is-open" : ""}`}
          onClick={(e) => {
            e.currentTarget.blur();
            setShowSettings((v) => !v);
          }}
          aria-label="Timer settings"
          aria-expanded={showSettings}
          title="Settings"
        >
          <Icon name="sliders" />
        </button>

        {showSettings && (
          <>
            <div className="settings-backdrop" onClick={() => setShowSettings(false)} />
            <div className="settings-pop" role="dialog" aria-label="Timer settings">
              <h2>Settings</h2>
              <div className="settings-grid">
                <label>
                  Focus (minutes)
                  <input type="number" min="1" max="180" defaultValue={settings.focus} onChange={setMinutes("focus")} />
                </label>
                <label>
                  Short break (minutes)
                  <input type="number" min="1" max="180" defaultValue={settings.short} onChange={setMinutes("short")} />
                </label>
                <label>
                  Long break (minutes)
                  <input type="number" min="1" max="180" defaultValue={settings.long} onChange={setMinutes("long")} />
                </label>
                <label>
                  Sound when time is up
                  <input
                    type="checkbox"
                    checked={settings.sound}
                    onChange={(e) => updateSettings({ sound: e.target.checked })}
                  />
                </label>
                <small>Changes apply to the next session. A running timer is not affected.</small>
              </div>
            </div>
          </>
        )}

        <div className="page-header" style={{ justifyContent: "center", textAlign: "center" }}>
          <div>
            <h1>Timer</h1>
            <p>Press <kbd>Space</kbd> to start or pause.</p>
          </div>
        </div>

        <div className="tabs">
          {MODES.map((m) => (
            <button
              key={m}
              className={`tab${mode === m ? " is-active" : ""}`}
              disabled={running}
              onClick={press(() => switchMode(m))}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="ring-wrap">
          <svg className="ring" viewBox="0 0 280 280" aria-hidden="true">
            <circle className="ring-track" cx="140" cy="140" r={RADIUS} />
            <circle
              className="ring-bar"
              cx="140"
              cy="140"
              r={RADIUS}
              transform="rotate(-90 140 140)"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <div className="ring-center">
            <div className="ring-time" role="timer" aria-live="off">{timeText}</div>
            <div className="ring-mode">{MODE_LABELS[mode]}</div>
          </div>
        </div>

        <input
          className="timer-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What are you working on? (optional)"
          aria-label="Label"
        />

        <div className="timer-actions">
          <button className="btn btn-primary btn-lg" onClick={press(toggle)}>
            {!running && <Icon name="play" />}
            {running ? "Pause" : status === "paused" ? "Resume" : "Start"}
          </button>
          <button className="btn btn-lg" style={{ minWidth: 0 }} onClick={press(reset)}>
            Reset
          </button>
        </div>

        <div className="rounds" aria-label={`${filledRounds} of ${rounds} focus rounds done`}>
          {Array.from({ length: rounds }, (_, i) => (
            <span key={i} className={`round-dot${i < filledRounds ? " on" : ""}`} />
          ))}
        </div>
        <small>Long break after {rounds} focus rounds</small>
      </main>
    </>
  );
}