import { Link } from "react-router-dom";
import { useTimer, MODE_LABELS } from "../context/TimerContext";

export default function MiniTimer() {
  const { status, mode, timeText } = useTimer();

  if (status === "idle") return null;

  const cls = [
    "timer-chip",
    mode !== "focus" && "is-break",
    status === "paused" && "is-paused",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link to="/pomodoro" className={cls} title="Open timer">
      <span className="dot" />
      {timeText}
      <span className="timer-chip-label">
        {MODE_LABELS[mode]}
        {status === "paused" && " · paused"}
      </span>
    </Link>
  );
}