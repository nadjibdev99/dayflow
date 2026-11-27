import api from "../api/axios";
import { toDateString } from "./date";

const KEY = "dayflow_pending_sessions";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};
const write = (list) => localStorage.setItem(KEY, JSON.stringify(list));

// The id comes from the end time, so the same finished session always gets
// the same id. Saving it twice can never create a duplicate.
export const makeSession = ({ label, minutes, endTime }) => ({
  clientId: `timer-${endTime}`,
  label: label || "",
  duration: Math.min(180, Math.max(1, Math.round(minutes))),
  date: toDateString(new Date(endTime)), // the user's LOCAL day
  completedAt: new Date(endTime).toISOString(),
});

// Step 1: store it locally BEFORE sending, so it can't be lost
export const enqueueSession = (session) => {
  const list = read();
  if (list.some((s) => s.clientId === session.clientId)) return;
  write([...list, session]);
};

let syncing = false;

// Step 2: send everything pending. Remove from the queue only after the server confirms.
export const syncSessions = async () => {
  if (syncing) return;
  syncing = true;
  try {
    for (const session of read()) {
      try {
        await api.post("/sessions", session); // 201, or 200 {duplicate:true}
        write(read().filter((s) => s.clientId !== session.clientId));
      } catch (err) {
        if (err.response?.status === 400) {
          // invalid session: retrying forever won't help
          write(read().filter((s) => s.clientId !== session.clientId));
          continue;
        }
        break; // offline, server down, or not logged in: try again later
      }
    }
  } finally {
    syncing = false;
  }
};