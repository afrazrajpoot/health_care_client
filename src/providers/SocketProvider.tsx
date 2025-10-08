"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner"; // ✅ Import Sonner toast
import { useSession } from "next-auth/react"; // ✅ Import useSession for getting user from session
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // ✅ Import ShadCN Dialog components (adjust path as needed)

const SOCKET_URL = "http://localhost:8000";

type SocketContextType = {
  socket: any;
  taskStatus: any;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const { data: session, status } = useSession(); // ✅ Get session data

  // ✅ Modal state for invalid documents
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Invalid Document");
  const [modalDescription, setModalDescription] = useState("");

  useEffect(() => {
    // ✅ Wait for session to load before connecting
    if (status === "loading") {
      console.log("⏳ Session loading, waiting for socket connect...");
      return;
    }

    // ✅ If no session, don't connect (handle unauthenticated state as needed)
    if (!session) {
      console.log("No session found, skipping socket connection");
      if (socket) socket.disconnect(); // Clean up if previously connected
      return;
    }

    const userId = session.user?.id; // ✅ Extract user ID from session (adjust path if needed, e.g., session.user.id)
    console.log("🔑 Extracted userId from session:", userId); // ✅ Debug: Log userId to verify match with physician_id
    if (!userId) {
      console.log("No user ID in session, skipping socket connection");
      if (socket) socket.disconnect();
      return;
    }

    // Disconnect previous instance if exists
    if (socket) {
      socket.disconnect();
    }

    // ✅ Connect with auth data including user ID
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // ✅ Fallback to polling if WS fails
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        userId, // ✅ Pass user ID for backend authentication/room joining
      },
    });

    setSocket(socketInstance);

    // 🔥 Listen for connect event
    socketInstance.on("connect", () => {
      console.log(
        "✅ Socket connected with user ID:",
        userId,
        "Socket ID:",
        socketInstance.id
      );
      toast.info("Connected to real-time updates"); // Optional: User-facing connect toast
    });

    // 🔥 Listen for connection errors (key for debugging!)
    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connect error:", error);
      toast.error(`Connection failed: ${error.message || "Unknown error"}`);
    });

    // 🔥 Listen for disconnects
    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        toast.warning("Server disconnected—reconnecting...");
      }
    });

    // 🔥 Listen for task completion events
    socketInstance.on("task_complete", (data) => {
      console.log("✅ Task completed (received on client):", data);
      setTaskStatus(data);

      if (data.status === "ignored") {
        // ✅ Show modal for invalid documents
        setModalTitle("Invalid Document");
        setModalDescription(
          data.reason ||
            "This document could not be processed due to missing information."
        );
        setIsModalOpen(true);
      } else if (data.status === "success") {
        // 🪄 Construct a specific message for the toast
        const message = data?.filename
          ? `Document "${data.filename}" processed successfully! (ID: ${data.document_id})`
          : "Task completed successfully!";

        // 🪄 Show a global toast for success
        toast.success(message);
      } else if (data.status === "skipped") {
        // Optional: Handle skipped with toast
        toast.info(`Document "${data.filename}" skipped: ${data.reason}`);
      }
    });

    // 🔥 Listen for task errors (from backend)
    socketInstance.on("task_error", (data) => {
      console.error("❌ Task error (received on client):", data);
      toast.error(
        `Task failed for "${data.filename || "unknown"}": ${
          data.error || "Unknown error"
        }`
      );
    });

    // ✅ Cleanup on unmount or session change
    return () => {
      console.log("🧹 Cleaning up socket...");
      socketInstance.disconnect();
    };
  }, [status, session?.user?.id]); // ✅ Depend on session status and user.id specifically for re-auth

  // ✅ Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <SocketContext.Provider value={{ socket, taskStatus }}>
      {children}
      {/* ✅ Global Modal for Invalid Documents (centered by default in ShadCN) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">{modalTitle}</DialogTitle>
            <DialogDescription className="text-center">
              {modalDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext)!;
