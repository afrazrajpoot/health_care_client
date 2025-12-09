// hooks/useProgress.ts
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";

interface ProgressData {
  task_id: string;
  progress: number;
  current_file: string;
  status: "processing" | "completed" | "failed";
  processed_count: number;
  total_files: number;
  failed_files: string[];
  current_step: number;
}

interface UseProgressProps {
  taskId: string | null;
  userId?: string;
  onComplete?: (data: ProgressData) => void;
  onError?: (error: string) => void;
}

export const useProgress = ({
  taskId,
  userId,
  onComplete,
  onError,
}: UseProgressProps) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!taskId) return;

    // Initialize socket connection
    const newSocket = io(
      process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000",
      {
        transports: ["websocket", "polling"],
        auth: {
          token: session?.user?.fastapi_token,
        },
      }
    );

    newSocket.on("connect", () => {
      setIsConnected(true);
      setError(null);
      console.log("Connected to progress server");

      // Join user room if userId provided
      if (userId) {
        newSocket.emit("join", `user_${userId}`);
      }
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from progress server");
    });

    newSocket.on("connect_error", (err) => {
      setError(`Connection failed: ${err.message}`);
      console.error("Socket connection error:", err);
    });

    // Listen for progress updates
    newSocket.on("progress_update", (data: ProgressData) => {
      if (data.task_id === taskId) {
        setProgress(data);
        setError(null);

        // Call onComplete when processing is done
        if (data.status === "completed" && onComplete) {
          onComplete(data);
        }
      }
    });

    // Listen for batch start
    newSocket.on("batch_started", (data: { task_id: string }) => {
      if (data.task_id === taskId) {
        console.log("Batch started:", data.task_id);
        setError(null);
      }
    });

    // Listen for task completion
    newSocket.on("task_complete", (data: any) => {
      console.log("Task completed:", data);
    });

    // Listen for task errors
    newSocket.on("task_error", (data: any) => {
      if (data.task_id === taskId) {
        setError(`Processing error: ${data.error}`);
        if (onError) onError(data.error);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [taskId, userId, onComplete, onError, session?.user?.fastapi_token]);

  // Function to manually check progress (fallback)
  const checkProgress = useCallback(async () => {
    if (!taskId || !session?.user?.fastapi_token) {
      console.warn("Task ID or FastAPI token not available for progress check");
      return;
    }

    try {
      const response = await fetch(
<<<<<<< HEAD
        `${process.env.NEXT_PUBLIC_PYTHON_API_URL || "https://api.kebilo.com"
=======
        `${
          process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:8000"
>>>>>>> 5c0a3a6 (set the ui)
        }/api/agent/progress/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.fastapi_token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch progress");
      }
      const progressData = await response.json();
      setProgress(progressData);
      setError(null);
    } catch (error) {
      const errorMsg = `Failed to fetch progress: ${error}`;
      setError(errorMsg);
      console.error(errorMsg);
    }
  }, [taskId, session?.user?.fastapi_token]);

  return {
    progress,
    isConnected,
    error,
    checkProgress,
  };
};
