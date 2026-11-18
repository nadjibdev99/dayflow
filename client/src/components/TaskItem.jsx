const COLORS = { high: "#e5533d", medium: "#f0a020", low: "#3aa76d" };

export default function TaskItem({
  task,
  showDate,
  inHistory,
  onToggle,
  onDelete,
  onRestore,
  onPurge,
}) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      {!inHistory && (
        <input
          type="checkbox"
          checked={task.isCompleted}
          onChange={() => onToggle(task)}
        />
      )}

      <span
        style={{
          flex: 1,
          opacity: task.isCompleted || inHistory ? 0.6 : 1,
          textDecoration: task.isCompleted ? "line-through" : "none",
        }}
      >
        {task.title}
      </span>

      {showDate && task.dueDate && <small>{task.dueDate}</small>}

      <span style={{ color: COLORS[task.priority], fontWeight: 600 }}>
        {task.priority}
      </span>

      {inHistory ? (
        <>
          <button onClick={() => onRestore(task._id)}>Restore</button>
          <button onClick={() => onPurge(task._id)}>Delete forever</button>
        </>
      ) : (
        <button onClick={() => onDelete(task._id)}>✕</button>
      )}
    </li>
  );
}