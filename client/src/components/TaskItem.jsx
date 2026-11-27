import Icon from "./Icon";

const shortDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function TaskItem({ task, showDate, inHistory, onToggle, onDelete, onRestore, onPurge }) {
  return (
    <li className={`task${task.isCompleted ? " is-done" : ""}`}>
      {!inHistory && (
        <input
          type="checkbox"
          checked={task.isCompleted}
          onChange={() => onToggle(task)}
          aria-label={`Mark "${task.title}" as done`}
        />
      )}

      <span className="task-title" style={inHistory ? { opacity: 0.6 } : undefined}>
        {task.title}
      </span>

      {showDate && task.dueDate && <span className="date-chip">{shortDate(task.dueDate)}</span>}
      <span className={`prio ${task.priority}`}>{task.priority}</span>

      {inHistory ? (
        <div className="task-actions">
          <button onClick={() => onRestore(task._id)}>Restore</button>
          <button onClick={() => onPurge(task._id)}>Delete forever</button>
        </div>
      ) : (
        <div className="row-actions">
          <button className="icon-btn danger" onClick={() => onDelete(task)} aria-label="Delete task" title="Delete">
            <Icon name="trash" />
          </button>
        </div>
      )}
    </li>
  );
}