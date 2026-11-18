import { useState } from "react";
import { todayString } from "../utils/date";

export default function TaskForm({ onAdd, inputRef }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(todayString());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAdd({ title, priority, dueDate: dueDate || null });

    setTitle("");
    setPriority("medium");
    setDueDate(todayString());
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task... (press T)"
        style={{ flex: 1, minWidth: 200 }}
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      <button>Add</button>
    </form>
  );
}