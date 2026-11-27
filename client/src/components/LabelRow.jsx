import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { formatMinutes } from "../utils/date";

export default function LabelRow({ label, minutes, onRename }) {
  const [shown, setShown] = useState(label); // the name displayed right now
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [saving, setSaving] = useState(false);
  const cancelled = useRef(false);
  const busy = useRef(false);

  // if the parent sends fresh data, follow it
  useEffect(() => {
    setShown(label);
  }, [label]);

  const start = () => {
    cancelled.current = false;
    setValue(shown);
    setEditing(true);
  };

  const commit = async () => {
    if (busy.current || cancelled.current) return;
    const next = value.trim().toLowerCase();
    if (next === shown) {
      setEditing(false);
      return;
    }
    busy.current = true;
    setSaving(true);
    try {
      await onRename(shown, next);
      setShown(next); // update the row immediately
    } catch {
      // the Dashboard shows the error message
    } finally {
      busy.current = false;
      setSaving(false);
      setEditing(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      cancelled.current = true;
      setEditing(false);
    }
  };

  return (
    <div className="label-row">
      {editing ? (
        <input
          className="label-input"
          value={value}
          autoFocus
          maxLength={100}
          placeholder="Name this session…"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          disabled={saving}
          aria-label="Label name"
        />
      ) : (
        <button className="label-name" onClick={start} title="Click to rename">
          <span className={shown ? "" : "muted"}>{shown || "No label"}</span>
          <Icon name="edit" />
        </button>
      )}
      <strong>{formatMinutes(minutes)}</strong>
    </div>
  );
}