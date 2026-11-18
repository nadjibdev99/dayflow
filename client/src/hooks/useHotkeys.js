import { useEffect } from "react";

// Calls `callback` when `key` is pressed, unless the user is typing
export default function useHotkeys(key, callback) {
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        e.target.isContentEditable;

      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() === key) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback]);
}