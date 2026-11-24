import { Link } from "react-router-dom";
import { useTimer, MODE_LABELS } from "../context/TimerContext";

export default function MiniTimer() {
  const { status, mode, timeText } = useTimer();

  if (status === "idle") return null;

  return (
    <Link to="/pomodoro" style={{ fontWeight: 600 }}>
      🍅 {timeText} ({MODE_LABELS[mode]}){status === "paused" && " ⏸"}
    </Link>
  );
}