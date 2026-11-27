import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import TaskForm from "../components/TaskForm";
import TaskItem from "../components/TaskItem";
import useHotkeys from "../hooks/useHotkeys";
import { useToast } from "../context/ToastContext";
import { todayString } from "../utils/date";

const FILTERS = ["today", "upcoming", "completed", "history"];

export default function Tasks() {
  const [filter, setFilter] = useState("today");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const { show } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      setError("");
      const { data } = await api.get("/tasks", { params: { filter, today: todayString() } });
      setTasks(data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // the Undo button may be clicked after the tab changed, so it uses the latest fetch
  const fetchRef = useRef(fetchTasks);
  fetchRef.current = fetchTasks;

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  useHotkeys("t", () => inputRef.current?.focus());

  const run = async (request, errorMessage) => {
    try {
      await request();
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || errorMessage);
    }
  };

  const addTask = (task) => run(() => api.post("/tasks", task), "Could not add task");
  const toggleTask = (task) =>
    run(() => api.put(`/tasks/${task._id}`, { isCompleted: !task.isCompleted }), "Could not update task");
  const restoreTask = (id) => run(() => api.put(`/tasks/${id}/restore`), "Could not restore task");

  const deleteTask = async (task) => {
    try {
      await api.delete(`/tasks/${task._id}`);
      fetchTasks();
      show(`"${task.title}" deleted`, {
        label: "Undo",
        onClick: async () => {
          try {
            await api.put(`/tasks/${task._id}/restore`);
            fetchRef.current();
          } catch {
            setError("Could not restore task");
          }
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task");
    }
  };

  const purgeTask = (id) => {
    if (!window.confirm("Delete this task forever? This can't be undone.")) return;
    run(() => api.delete(`/tasks/${id}`, { params: { permanent: true } }), "Could not delete task");
  };

  return (
    <>
      <Navbar />
      <main className="page" style={{ maxWidth: 760 }}>
        <div className="page-header">
          <div>
            <h1>Tasks</h1>
            <p>Press <kbd>T</kbd> to add a task quickly.</p>
          </div>
        </div>

        <section className="card">
          <TaskForm onAdd={addTask} inputRef={inputRef} />

          <div className="tabs">
            {FILTERS.map((f) => (
              <button key={f} className={`tab${filter === f ? " is-active" : ""}`} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filter === "history" && (
            <p className="muted">Deleted tasks stay here for 30 days. Restore them or delete them forever.</p>
          )}

          {error && <div className="error-box">{error}</div>}
          {loading && <div className="skeleton" style={{ height: 24, marginTop: 12 }} />}
          {!loading && tasks.length === 0 && <div className="empty">No tasks here.</div>}

          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                showDate={filter === "upcoming" || filter === "completed"}
                inHistory={filter === "history"}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onRestore={restoreTask}
                onPurge={purgeTask}
              />
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}