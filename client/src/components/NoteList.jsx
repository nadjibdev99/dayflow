import Icon from "./Icon";

export default function NoteList({ notes, selectedId, search, onSearch, subject, onSubject, subjects, onSelect }) {
  return (
    <>
      <div className="note-filters">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search notes…"
          aria-label="Search notes"
        />
        <select value={subject} onChange={(e) => onSubject(e.target.value)} aria-label="Subject">
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {notes.length === 0 && <div className="empty">No notes yet.</div>}

      <ul className="note-items">
        {notes.map((note) => (
          <li
            key={note._id}
            className={`note-item${note._id === selectedId ? " is-active" : ""}`}
            onClick={() => onSelect(note._id)}
          >
            <div className="note-item-title">
              {note.isPinned && <Icon name="pin" />}
              {note.title || "Untitled"}
            </div>
            {note.content && <div className="note-item-preview">{note.content.slice(0, 80)}</div>}
            <div className="note-item-meta">
              {note.subject && `${note.subject} · `}
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}