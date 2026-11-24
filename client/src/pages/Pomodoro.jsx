import Navbar from "../components/Navbar";
import useHotkeys from "../hooks/useHotkeys";
import { useTimer, MODE_LABELS } from "../context/TimerContext";

const MODES = ["focus", "short", "long"];

export default function Pomodoro() {
  const {
    mode, status, timeText, label, round, rounds, settings,
    toggle, reset, switchMode, setLabel, updateSettings,
  } = useTimer();

  // Space starts or pauses (ignored while typing, thanks to useHotkeys)
  useHotkeys(" ", toggle);

  const running = status === "running";

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
      <div style={{ maxWidth: 500, margin: "30px auto", padding: "0 16px", textAlign: "center" }}>
        <h1>Pomodoro</h1>

        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {MODES.map((m) => (
            <button
              key={m}
              disabled={running}
              onClick={press(() => switchMode(m))}
              style={{ fontWeight: mode === m ? "bold" : "normal" }}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 96, fontWeight: 700, margin: "20px 0" }}>{timeText}</div>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What are you working on? (optional)"
          style={{ width: "100%", marginBottom: 16 }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={press(toggle)}>
            {running ? "Pause" : status === "paused" ? "Resume" : "Start"} (Space)
          </button>
          <button onClick={press(reset)}>Reset</button>
        </div>

        <p style={{ color: "#666" }}>
          Focus sessions finished in this cycle: {round % rounds} / {rounds}
        </p>

        <details style={{ textAlign: "left", marginTop: 24 }}>
          <summary>⚙ Settings</summary>
          <div style={{ display: "grid", gap: 8, paddingTop: 12 }}>
            <label>
              Focus (minutes){" "}
              <input type="number" min="1" max="180" defaultValue={settings.focus} onChange={setMinutes("focus")} />
            </label>
            <label>
              Short break (minutes){" "}
              <input type="number" min="1" max="180" defaultValue={settings.short} onChange={setMinutes("short")} />
            </label>
            <label>
              Long break (minutes){" "}
              <input type="number" min="1" max="180" defaultValue={settings.long} onChange={setMinutes("long")} />
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => updateSettings({ sound: e.target.checked })}
              />{" "}
              Play a sound when time is up
            </label>
            <small style={{ color: "#666" }}>
              Changes apply to the next session. A running timer is not affected.
            </small>
          </div>
        </details>
      </div>
    </>
  );
}