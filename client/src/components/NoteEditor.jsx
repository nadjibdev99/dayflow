import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

const SAVE_DELAY = 1000;

export default function NoteEditor({ note, onSaved, onDelete, titleRef }) {
  const [form, setForm] = useState({
    title: note.title,
    content: note.content,
    subject: note.subject,
  });
  const [status, setStatus] = useState("saved"); // saved | pending | saving | error

  const formRef = useRef(form);   // always the latest text
  const timerRef = useRef(null);  // the debounce timer
  const dirtyRef = useRef(false); // true when there are unsaved changes

  const save = async () => {
    clearTimeout(timerRef.current);
    if (!dirtyRef.current) return;

    dirtyRef.current = false;
    setStatus("saving");
    try {
      const { data } = await api.put(`/notes/${note._id}`, formRef.current);
      onSaved(data.note);
      // if the user typed again while saving, a new timer is already running
      if (!dirtyRef.current) setStatus("saved");
    } catch {
      dirtyRef.current = true; // keep the text, retry on the next change
      setStatus("error");
    }
  };

  // keep the latest save function available to the cleanup below
  const saveRef = useRef(save);
  saveRef.current = save;

  const handleChange = (e) => {
    const next = { ...formRef.current, [e.target.name]: e.target.value };
    formRef.current = next;
    setForm(next);

    dirtyRef.current = true;
    setStatus("pending");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveRef.current(), SAVE_DELAY);
  };

  // when this editor goes away (switching notes), save pending changes first
  useEffect(() => {
    return () => {
      if (dirtyRef.current) saveRef.current();
    };
  }, []);

  // warn if the user closes the tab with unsaved changes
  useEffect(() => {
    const warn = (e) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const statusText = {
    saved: "Saved ✓",
    pending: "Unsaved changes...",
    saving: "Saving...",
    error: "Error: not saved (will retry when you type)",
  }[status];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        ref={titleRef}
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        style={{ fontSize: 20, fontWeight: 600 }}
      />
      <input
        name="subject"
        value={form.subject}
        onChange={handleChange}
        placeholder="Subject (study, work, ideas...)"
      />
      <textarea
        name="content"
        value={form.content}
        onChange={handleChange}
        placeholder="Write your note..."
        style={{ minHeight: 350, resize: "vertical" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <small style={{ color: status === "error" ? "red" : "#666" }}>{statusText}</small>
        <button onClick={() => onDelete(note._id)}>Delete note</button>
      </div>
    </div>
  );
}