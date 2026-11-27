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
    <form onSubmit={handleSubmit} className="task-form">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        aria-label="Task title"
      />
      <div className="row">
        <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
        <button className="btn btn-primary" style={{ marginLeft: "auto" }}>Add task</button>
      </div>
    </form>
  );
}