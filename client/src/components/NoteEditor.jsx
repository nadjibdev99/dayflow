import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import Icon from "./Icon";

const SAVE_DELAY = 1000;

export default function NoteEditor({ note, onSaved, onDelete, onBack, titleRef }) {
  const [form, setForm] = useState({
    title: note.title,
    content: note.content,
    subject: note.subject,
  });
  const [status, setStatus] = useState("saved"); // saved | pending | saving | error

  const formRef = useRef(form);
  const timerRef = useRef(null);
  const dirtyRef = useRef(false);

  const save = async () => {
    clearTimeout(timerRef.current);
    if (!dirtyRef.current) return;

    dirtyRef.current = false;
    setStatus("saving");
    try {
      const { data } = await api.put(`/notes/${note._id}`, formRef.current);
      onSaved(data.note);
      if (!dirtyRef.current) setStatus("saved");
    } catch {
      dirtyRef.current = true;
      setStatus("error");
    }
  };

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

  // leaving this note (or the page) saves pending changes first
  useEffect(() => {
    return () => {
      if (dirtyRef.current) saveRef.current();
    };
  }, []);

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

  const togglePin = async () => {
    try {
      const { data } = await api.put(`/notes/${note._id}`, { isPinned: !note.isPinned });
      onSaved(data.note);
    } catch {
      setStatus("error");
    }
  };

  const statusText = {
    saved: "Saved",
    pending: "Unsaved changes…",
    saving: "Saving…",
    error: "Not saved. Will retry when you type",
  }[status];

  return (
    <div className="editor">
      <div className="editor-top">
        <button className="btn back-btn" onClick={onBack}>← Notes</button>
      </div>

      <input
        ref={titleRef}
        className="bare note-title"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Untitled"
        aria-label="Title"
      />
      <input
        className="bare note-subject"
        name="subject"
        value={form.subject}
        onChange={handleChange}
        placeholder="Add a subject (study, work, ideas…)"
        aria-label="Subject"
      />
      <textarea
        className="bare note-body"
        name="content"
        value={form.content}
        onChange={handleChange}
        placeholder="Start writing…"
        aria-label="Content"
      />

      <div className="editor-bar">
        <span className={`save-status ${status}`}>{statusText}</span>
        <span style={{ display: "flex", gap: 6 }}>
          <button className="btn" onClick={togglePin}>
            <Icon name="pin" /> {note.isPinned ? "Unpin" : "Pin"}
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(note._id)} aria-label="Delete note" title="Delete note">
            <Icon name="trash" />
          </button>
        </span>
      </div>
    </div>
  );
}