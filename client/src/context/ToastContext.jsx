import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  // show("Task deleted", { label: "Undo", onClick: () => ... })
  const show = useCallback((message, action) => {
    clearTimeout(timer.current);
    setToast({ message, action, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {toast && (
        <div className="toast" role="status" key={toast.id}>
          <span>{toast.message}</span>
          {toast.action && (
            <button
              className="toast-action"
              onClick={() => {
                toast.action.onClick();
                dismiss();
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}