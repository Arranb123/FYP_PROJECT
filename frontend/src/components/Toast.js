// Iteration 4 - Toast Notification Component
// Provides better user feedback with auto-dismissing notifications

import React, { useEffect } from "react";

const Toast = ({ message, type = "info", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const bgColor = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-info"
  }[type] || "bg-info";

  return (
    <div 
      className={`toast show position-fixed top-0 end-0 m-3 ${bgColor} text-white`}
      role="alert"
      style={{ 
        zIndex: 9999,
        minWidth: "300px",
        animation: "slideInRight 0.3s ease-out"
      }}
    >
      <div className="toast-header bg-transparent text-white border-0">
        <strong className="me-auto">
          {type === "success" && "Success"}
          {type === "error" && "Error"}
          {type === "warning" && "Warning"}
          {type === "info" && "Info"}
        </strong>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onClose}
          aria-label="Close"
        ></button>
      </div>
      <div className="toast-body">
        {message}
      </div>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
