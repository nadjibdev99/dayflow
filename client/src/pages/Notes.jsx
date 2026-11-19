import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import NoteList from "../components/NoteList";
import NoteEditor from "../components/NoteEditor";
import useDebounce from "../hooks/useDebounce";
import useHotkeys from "../hooks/useHotkeys";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const titleRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchNotes = useCallback(async () => {
    try {
      setError("");
      const { data } = await api.get("/notes", {
        params: { search: debouncedSearch, subject },
      });
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
      // clear filters so the new note is visible in the list
      setSearch("");
      await fetchNotes();
      setTimeout(() => titleRef.current?.focus(), 0);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create note");
    }
  }, [subject, fetchNotes]);

  useHotkeys("n", newNote);

  // called by the editor after each successful auto-save
  const handleSaved = (saved) => {
    setNotes((prev) => {
      const rest = prev.filter((n) => n._id !== saved._id);
      return [saved, ...rest]; // most recently edited first
    });
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
      <div style={{ maxWidth: 1000, margin: "30px auto", padding: "0 16px" }}>
        <h1>Notes</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: "flex", gap: 20 }}>
            <NoteList
              notes={notes}
              selectedId={selectedId}
              search={search}
              onSearch={setSearch}
              subject={subject}
              onSubject={setSubject}
              subjects={subjects}
              onSelect={setSelectedId}
              onNew={newNote}
            />
            {selected ? (
              <NoteEditor
                key={selected._id}
                note={selected}
                onSaved={handleSaved}
                onDelete={handleDelete}
                titleRef={titleRef}
              />
            ) : (
              <p style={{ color: "#666" }}>Select a note or press N to create one.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}