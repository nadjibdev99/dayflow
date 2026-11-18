import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import TaskForm from "../components/TaskForm";
import TaskItem from "../components/TaskItem";
import useHotkeys from "../hooks/useHotkeys";
import { todayString } from "../utils/date";

const FILTERS = ["today", "upcoming", "completed", "history"];

export default function Tasks() {
  const [filter, setFilter] = useState("today");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError("");
      const { data } = await api.get("/tasks", {
        params: { filter, today: todayString() },
      });
      setTasks(data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [filter]);

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
    run(
      () => api.put(`/tasks/${task._id}`, { isCompleted: !task.isCompleted }),
      "Could not update task"
    );

  const deleteTask = (id) =>
    run(() => api.delete(`/tasks/${id}`), "Could not delete task");

  const restoreTask = (id) =>
    run(() => api.put(`/tasks/${id}/restore`), "Could not restore task");

  const purgeTask = (id) => {
    if (!window.confirm("Delete this task forever? This can't be undone.")) return;
    run(
      () => api.delete(`/tasks/${id}`, { params: { permanent: true } }),
      "Could not delete task"
    );
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 700, margin: "30px auto", padding: "0 16px" }}>
        <h1>Tasks</h1>

        <TaskForm onAdd={addTask} inputRef={inputRef} />

        <div style={{ display: "flex", gap: 8, margin: "20px 0", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ fontWeight: filter === f ? "bold" : "normal" }}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filter === "history" && (
          <p style={{ color: "#666" }}>
            Deleted tasks stay here for 30 days. Restore them or delete them forever.
          </p>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading && <p>Loading...</p>}
        {!loading && tasks.length === 0 && <p>No tasks here.</p>}

        <ul style={{ listStyle: "none", padding: 0 }}>
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
      </div>
    </>
  );
}