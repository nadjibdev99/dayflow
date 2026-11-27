const pad = (n) => String(n).padStart(2, "0");

const format = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 0 = Sunday, 1 = Monday, 6 = Saturday
const WEEK_STARTS_ON = 1;

const daysSinceWeekStart = (d) => (d.getDay() - WEEK_STARTS_ON + 7) % 7;

export const toDateString = (d = new Date()) => format(d);
export const todayString = () => format(new Date());

export const weekStartString = () => {
  const d = new Date();
  d.setDate(d.getDate() - daysSinceWeekStart(d));
  return format(d);
};

export const weekEndString = () => {
  const d = new Date();
  d.setDate(d.getDate() + (6 - daysSinceWeekStart(d)));
  return format(d);
};

// 125 -> "2h 5m", 60 -> "1h", 45 -> "45m"
export const formatMinutes = (m) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
};