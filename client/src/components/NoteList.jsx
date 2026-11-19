export default function NoteList({
  notes,
  selectedId,
  search,
  onSearch,
  subject,
  onSubject,
  subjects,
  onSelect,
  onNew,
}) {
  return (
    <div style={{ width: 280, borderRight: "1px solid #ddd", paddingRight: 12 }}>
      <button onClick={onNew} style={{ width: "100%", marginBottom: 8 }}>
        + New note (N)
      </button>

      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search by title..."
        style={{ width: "100%", marginBottom: 8 }}
      />

      <select
        value={subject}
        onChange={(e) => onSubject(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      >
        <option value="">All subjects</option>
        {subjects.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {notes.length === 0 && <p style={{ color: "#666" }}>No notes yet.</p>}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {notes.map((note) => (
          <li
            key={note._id}
            onClick={() => onSelect(note._id)}
            style={{
              padding: "8px 10px",
              cursor: "pointer",
              borderRadius: 6,
              background: note._id === selectedId ? "#eef" : "transparent",
            }}
          >
            <div style={{ fontWeight: 600 }}>{note.title || "Untitled"}</div>
            <small style={{ color: "#666" }}>
              {note.subject && `${note.subject} · `}
              {new Date(note.updatedAt).toLocaleDateString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}