import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type = "info", duration = 4000 }) => {
      const id = Date.now() + Math.random();
      const toast = { id, title, description, type };
      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto max-w-sm w-full">
            <div
              className={`rounded-lg shadow-lg border px-4 py-3 bg-white flex items-start justify-between space-x-3 ${
                toast.type === "success"
                  ? "border-green-200"
                  : toast.type === "error"
                  ? "border-red-200"
                  : "border-gray-200"
              }`}
            >
              <div>
                {toast.title && (
                  <div className="text-sm font-semibold text-gray-900">
                    {toast.title}
                  </div>
                )}
                {toast.description && (
                  <div className="mt-0.5 text-xs text-gray-600">
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-gray-400 hover:text-gray-600 text-sm leading-none"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};
