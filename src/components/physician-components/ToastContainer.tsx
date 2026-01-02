import React from "react";

interface ToastContainerProps {
  toasts: { id: number; message: string; type: "success" | "error" }[];
}

export const ToastContainer = React.memo<ToastContainerProps>(({ toasts }) => (
  <div className="fixed top-4 right-4 space-y-2 z-50">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`p-4 rounded-lg shadow-lg text-white ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        } animate-in slide-in-from-top-2 duration-300`}
      >
        {toast.message}
      </div>
    ))}
  </div>
));