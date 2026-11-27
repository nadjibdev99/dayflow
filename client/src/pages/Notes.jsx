import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Icon from "../components/Icon";
import NoteList from "../components/NoteList";
import NoteEditor from "../components/NoteEditor";
import useDebounce from "../hooks/useDebounce";
import useHotkeys from "../hooks/useHotkeys";

export default function Notes() {
  const [params] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(params.get("open"));
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const titleRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchNotes = useCallback(async () => {
    try {
      setError("");
      const { data } = await api.get("/notes", { params: { search: debouncedSearch, subject } });
      setNotes(data.notes);
      setSubjects(data.subjects);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load notes");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, subject]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const newNote = useCallback(async () => {
    try {
      const { data } = await api.post("/notes", { subject });
      setSelectedId(data.note._id);
      setSearch("");
      await fetchNotes();
      setTimeout(() => titleRef.current?.focus(), 0);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create note");
    }
  }, [subject, fetchNotes]);

  useHotkeys("n", newNote);

  const handleSaved = (saved) => {
    setNotes((prev) => [saved, ...prev.filter((n) => n._id !== saved._id)]);
    if (saved.subject && !subjects.includes(saved.subject)) {
      setSubjects((prev) => [...prev, saved.subject].sort());
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    try {
      await api.delete(`/notes/${id}`);
      setSelectedId(null);
      fetchNotes();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete note");
    }
  };

  const selected = notes.find((n) => n._id === selectedId);

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="page-header">
          <div>
            <h1>Notes</h1>
            <p>Press <kbd>N</kbd> to start a new note. Everything saves automatically.</p>
          </div>
          <button className="btn btn-primary" onClick={newNote}>
            <Icon name="plus" /> New note
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="skeleton" style={{ height: 240 }} />
        ) : (
          <div className={`notes-layout${selected ? " has-selection" : ""}`}>
            <aside className="card note-list-col">
              <NoteList
                notes={notes}
                selectedId={selectedId}
                search={search}
                onSearch={setSearch}
                subject={subject}
                onSubject={setSubject}
                subjects={subjects}
                onSelect={setSelectedId}
              />
            </aside>

            <section className="card note-editor-col">
              {selected ? (
                <NoteEditor
                  key={selected._id}
                  note={selected}
                  onSaved={handleSaved}
                  onDelete={handleDelete}
                  onBack={() => setSelectedId(null)}
                  titleRef={titleRef}
                />
              ) : (
                <div className="empty">Select a note, or create a new one.</div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}