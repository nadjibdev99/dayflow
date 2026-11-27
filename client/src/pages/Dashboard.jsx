import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Icon from "../components/Icon";
import LabelRow from "../components/LabelRow";
import { useAuth } from "../context/AuthContext";
import { syncSessions } from "../utils/sessionQueue";
import { todayString, weekStartString, weekEndString, formatMinutes } from "../utils/date";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const [tasks, setTasks] = useState(null);
  const [tasksError, setTasksError] = useState("");
  const [notes, setNotes] = useState(null);
  const [notesError, setNotesError] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const loadStats = useCallback(async () => {
    try {
      await syncSessions();
      const { data } = await api.get("/sessions/stats", {
        params: { today: todayString(), weekStart: weekStartString(), weekEnd: weekEndString() },
      });
      setStats(data);
      setStatsError("");
    } catch {
      setStatsError("Could not load stats");
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const { data } = await api.get("/tasks", { params: { filter: "today", today: todayString() } });
      setTasks(data.tasks);
      setTasksError("");
    } catch {
      setTasksError("Could not load tasks");
    }
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const { data } = await api.get("/notes", { params: { pinned: true } });
      setNotes(data.notes.slice(0, 5));
      setNotesError("");
    } catch {
      setNotesError("Could not load notes");
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadTasks();
    loadNotes();
  }, [loadStats, loadTasks, loadNotes]);

  const toggleTask = async (task) => {
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, isCompleted: !t.isCompleted } : t)));
    try {
      await api.put(`/tasks/${task._id}`, { isCompleted: !task.isCompleted });
    } catch {
      setTasksError("Could not update task");
      loadTasks();
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    try {
      await api.post("/tasks", { title, priority: "medium", dueDate: todayString() });
      loadTasks();
    } catch {
      setTasksError("Could not add task");
      setNewTitle(title);
    }
  };

  const renameLabel = async (from, to) => {
    try {
      await api.put("/sessions/relabel", {
        from,
        to,
        weekStart: weekStartString(),
        weekEnd: weekEndString(),
      });

      // update the screen right away (rows with the same new name are merged)
      setStats((prev) => {
        if (!prev) return prev;
        const totals = new Map();
        for (const l of prev.byLabel) {
          const key = l.label === from ? to : l.label;
          totals.set(key, (totals.get(key) || 0) + l.minutes);
        }
        const byLabel = [...totals]
          .map(([label, minutes]) => ({ label, minutes }))
          .sort((a, b) => b.minutes - a.minutes);
        return { ...prev, byLabel };
      });

      loadStats(); // confirm with the server
    } catch (err) {
      setStatsError("Could not rename the label");
      throw err;
    }
  };

  const done = tasks ? tasks.filter((t) => t.isCompleted).length : 0;
  const total = tasks ? tasks.length : 0;
  const percent = total ? Math.round((done / total) * 100) : 0;

  const streak = stats?.streak || 0;

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="page-header">
          <div>
            <h1>
              {greeting()}, {user.name}
            </h1>
            <p>{todayLabel()}</p>
          </div>
          <Link to="/pomodoro" className="btn btn-primary">
            <Icon name="play" /> Start focus
          </Link>
        </div>

        {statsError && <div className="error-box">{statsError}</div>}

        <div className="stats">
          <div className="stat">
            <div className="stat-top">
              <span className="stat-label">Streak</span>
              <span className="stat-icon"><Icon name="flame" /></span>
            </div>
            <div className="stat-value">
              {!stats ? "…" : streak > 0 ? `${streak} day${streak > 1 ? "s" : ""}` : "0 days"}
            </div>
            <div className="stat-sub">
              {!stats ? "" : streak > 0 ? "Keep it going" : "Finish a focus session to start"}
            </div>
          </div>

          <div className="stat">
            <div className="stat-top">
              <span className="stat-label">Focus today</span>
              <span className="stat-icon"><Icon name="clock" /></span>
            </div>
            <div className="stat-value">{stats ? formatMinutes(stats.today) : "…"}</div>
            <div className="stat-sub">{stats ? `${formatMinutes(stats.week)} this week` : ""}</div>
          </div>

          <div className="stat">
            <div className="stat-top">
              <span className="stat-label">Tasks done</span>
              <span className="stat-icon"><Icon name="check" /></span>
            </div>
            <div className="stat-value">{tasks ? `${done} / ${total}` : "…"}</div>
            <div className="progress"><span style={{ width: `${percent}%` }} /></div>
          </div>
        </div>

        <div className="dash-grid">
          <section className="card">
            <div className="card-header">
              <h2><Link to="/tasks">Today's tasks</Link></h2>
              {tasks && total > 0 && <small>{percent}% complete</small>}
            </div>

            <form onSubmit={addTask} className="quick-add">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add a task and press Enter"
                aria-label="Add a task"
              />
            </form>

            {tasksError && <div className="error-box">{tasksError}</div>}
            {!tasks && !tasksError && (
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <div className="skeleton" style={{ height: 24 }} />
                <div className="skeleton" style={{ height: 24 }} />
                <div className="skeleton" style={{ height: 24 }} />
              </div>
            )}
            {tasks && total === 0 && (
              <div className="empty">Nothing planned for today. Add your first task above.</div>
            )}
            {tasks && total > 0 && done === total && (
              <p className="muted" style={{ margin: "10px 0 0" }}>All done for today 🎉</p>
            )}

            <ul className="task-list">
              {tasks?.map((task) => (
                <li key={task._id} className={`task${task.isCompleted ? " is-done" : ""}`}>
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => toggleTask(task)}
                    aria-label={`Mark "${task.title}" as done`}
                  />
                  <span className="task-title">{task.title}</span>
                  <span className={`prio ${task.priority}`}>{task.priority}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="stack">
            <section className="card">
              <div className="card-header">
                <h2><Link to="/notes">Pinned notes</Link></h2>
              </div>
              {notesError && <div className="error-box">{notesError}</div>}
              {notes && notes.length === 0 && (
                <p className="muted" style={{ margin: 0 }}>Pin a note to keep it here.</p>
              )}
              <div className="chips">
                {notes?.map((note) => (
                  <Link key={note._id} to={`/notes?open=${note._id}`} className="chip">
                    <Icon name="pin" /> {note.title || "Untitled"}
                  </Link>
                ))}
              </div>
            </section>

            {stats && stats.byLabel.length > 0 && (
              <section className="card">
                <div className="card-header">
                  <h2>This week</h2>
                  <small>{formatMinutes(stats.week)} total</small>
                </div>
                {stats.byLabel.map((l) => (
                  <LabelRow
                    key={l.label || "none"}
                    label={l.label}
                    minutes={l.minutes}
                    onRename={renameLabel}
                  />
                ))}
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}