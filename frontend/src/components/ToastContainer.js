// Iteration 4 - Toast Container Component
// Manages multiple toast notifications
// ref: React toast notifications - https://www.youtube.com/watch?v=8KB3DHI-QbM 
// ref: React useState hook - https://react.dev/reference/react/useState

import React, { useState, useCallback } from "react";
import Toast from "./Toast";

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  // Function to add a toast (can be called from anywhere via context or props)
  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  // Function to remove a toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Expose addToast globally for easy access
  React.useEffect(() => {
    window.showToast = addToast;
    return () => {
      delete window.showToast;
    };
  }, [addToast]);

  return (
    <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999 }}>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ marginBottom: "10px" }}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
