"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

// Backend progress data interface (matches API/Redis response)
interface BackendProgressData {
  task_id: string;
  total_steps: number;
  completed_steps: number;
  progress_percentage: number;
  current_file: string;
  status: "processing" | "completed" | "failed";
  processed_files: string[]; // Successful files
  failed_files: string[];
  current_step: number;
  current_file_progress?: number; // Optional
  // ... other fields as needed
}

// Frontend ProgressData (mapped for UI)
interface ProgressData {
  task_id: string;
  progress: number; // percentage
  current_file: string;
  status: "processing" | "completed" | "failed";
  processed_count: number; // completed_steps (total processed including failed)
  total_files: number; // total_steps
  successful_count: number; // len(processed_files)
  failed_files: string[];
  current_step: number;
}

// Storage interface for persisting progress
interface StoredProgress {
  progressData: ProgressData | null;
  activeTaskId: string | null;
  isProcessing: boolean;
  timestamp: number;
}

type SocketContextType = {
  socket: Socket | null;
  taskStatus: any;
  // Progress tracking
  progressData: ProgressData | null;
  activeTaskId: string | null;
  isProcessing: boolean;
  // Progress actions
  setActiveTask: (
    taskId: string,
    totalFiles?: number,
    filenames?: string[]
  ) => void;
  clearProgress: () => void;
  checkProgress: (taskId: string) => Promise<BackendProgressData | null>; // Expose for manual calls
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const { data: session, status } = useSession();

  // Progress tracking state - initialize from localStorage
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Invalid Document");
  const [modalDescription, setModalDescription] = useState("");

  // Storage keys
  const STORAGE_KEYS = {
    PROGRESS: "progress_tracker_state",
    TASK_ID: "active_task_id",
    PROCESSING: "is_processing",
  };

  // Load persisted progress state on mount
  useEffect(() => {
    const loadPersistedProgress = () => {
      try {
        const storedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        const storedTaskId = localStorage.getItem(STORAGE_KEYS.TASK_ID);
        const storedProcessing = localStorage.getItem(STORAGE_KEYS.PROCESSING);

        console.log("📦 Loading persisted progress state:", {
          storedProgress: !!storedProgress,
          storedTaskId,
          storedProcessing,
        });

        if (storedProgress) {
          const parsedProgress: StoredProgress = JSON.parse(storedProgress);

          // Check if the stored progress is not too old (e.g., within last 1 hour)
          const isRecent =
            Date.now() - parsedProgress.timestamp < 60 * 60 * 1000; // 1 hour

          if (isRecent && parsedProgress.progressData) {
            console.log("🔄 Restoring progress state from localStorage");
            setProgressData(parsedProgress.progressData);
            setActiveTaskId(parsedProgress.activeTaskId);
            setIsProcessing(parsedProgress.isProcessing);

            // If still processing, restart polling
            if (parsedProgress.isProcessing && parsedProgress.activeTaskId) {
              console.log("🔄 Restarting polling for persisted task");
              startProgressPolling(parsedProgress.activeTaskId);
            }
          } else {
            console.log("🧹 Clearing stale progress data");
            clearPersistedProgress();
          }
        }
      } catch (error) {
        console.error("❌ Error loading persisted progress:", error);
        clearPersistedProgress();
      }
    };

    loadPersistedProgress();
  }, []);

  // Save progress state to localStorage whenever it changes
  useEffect(() => {
    const saveProgressState = () => {
      try {
        const stateToSave: StoredProgress = {
          progressData,
          activeTaskId,
          isProcessing,
          timestamp: Date.now(),
        };

        localStorage.setItem(
          STORAGE_KEYS.PROGRESS,
          JSON.stringify(stateToSave)
        );

        // Also save individual items for redundancy
        if (activeTaskId) {
          localStorage.setItem(STORAGE_KEYS.TASK_ID, activeTaskId);
        } else {
          localStorage.removeItem(STORAGE_KEYS.TASK_ID);
        }

        localStorage.setItem(STORAGE_KEYS.PROCESSING, isProcessing.toString());

        console.log("💾 Progress state saved to localStorage:", {
          hasProgressData: !!progressData,
          activeTaskId,
          isProcessing,
        });
      } catch (error) {
        console.error("❌ Error saving progress state:", error);
      }
    };

    saveProgressState();
  }, [progressData, activeTaskId, isProcessing]);

  // Clear persisted progress from localStorage
  const clearPersistedProgress = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.TASK_ID);
      localStorage.removeItem(STORAGE_KEYS.PROCESSING);
      console.log("🧹 Persisted progress cleared from localStorage");
    } catch (error) {
      console.error("❌ Error clearing persisted progress:", error);
    }
  };

  // ENHANCED Map backend data to frontend ProgressData with force 100% if all processed
  const mapToProgressData = (
    backendData: BackendProgressData
  ): ProgressData => {
    const successful_count = backendData.processed_files?.length || 0;
    const total_files = backendData.total_steps || 1;
    const completed_steps = backendData.completed_steps || 0;

    let mappedStatus = backendData.status as
      | "processing"
      | "completed"
      | "failed";
    let mappedProgress = backendData.progress_percentage || 0;

    // SIMPLE CALCULATION: If all files are processed, force 100%
    if (completed_steps >= total_files) {
      mappedProgress = 100;
      mappedStatus = "completed";
      console.log("🔧 Mapping: All files processed - forcing 100%");
    }
    // If backend percentage is 0 but we have progress, calculate it
    else if (mappedProgress === 0 && completed_steps > 0) {
      // Base progress from completed files + current file progress
      const baseProgress = (completed_steps / total_files) * 100;
      const currentFileProgress =
        (backendData.current_file_progress || 0) * (1 / total_files);
      mappedProgress = Math.min(99, baseProgress + currentFileProgress);
      console.log(
        `🔧 Calculated progress: ${completed_steps}/${total_files} files + ${backendData.current_file_progress}% current = ${mappedProgress}%`
      );
    }

    const mapped = {
      task_id: backendData.task_id,
      progress: Math.round(mappedProgress), // Round to whole number
      current_file: backendData.current_file || "",
      status: mappedStatus,
      processed_count: completed_steps,
      total_files: total_files,
      successful_count,
      failed_files: backendData.failed_files || [],
      current_step: backendData.current_step || 0,
    };

    console.log("🔄 Mapped progress:", {
      original: backendData.progress_percentage,
      calculated: mappedProgress,
      final: mapped.progress,
      completed_steps,
      total_files,
      status: mapped.status,
    });

    return mapped;
  };

  // Manual progress checking - ENHANCED with force in set
  const checkProgress = async (taskId: string) => {
    console.log("🔍 Starting checkProgress for task:", taskId);
    try {
      const response = await fetch(`${SOCKET_URL}/api/progress/${taskId}`);
      console.log("📡 Fetch response status:", response.status);
      if (response.ok) {
        const rawBackendProgress = await response.json();
        console.log(
          `📊 Raw polled backend data for ${taskId}:`,
          rawBackendProgress
        );

        const mappedProgress = mapToProgressData(rawBackendProgress);
        console.log("📊 Setting new progressData:", mappedProgress);

        // EXTRA FORCE: If processed_count >= total_files, ensure 100% and stop processing
        if (mappedProgress.processed_count >= mappedProgress.total_files) {
          console.log("🔧 Poll forcing final state");
          const finalMapped = {
            ...mappedProgress,
            progress: 100,
            status: "completed" as const,
          };
          setProgressData(finalMapped);
          setIsProcessing(false);
          stopProgressPolling();
          toast.success(
            `✅ Processing complete! ${mappedProgress.successful_count}/${mappedProgress.total_files} files processed`
          );
        } else {
          setProgressData(mappedProgress); // Normal set
        }

        console.log("📊 setProgressData called successfully");

        if (
          rawBackendProgress.status === "completed" ||
          rawBackendProgress.status === "failed"
        ) {
          console.log(
            `🛑 Poll detected end status: ${rawBackendProgress.status}`
          );
          setIsProcessing(false);
          stopProgressPolling();

          if (rawBackendProgress.status === "completed") {
            toast.success(
              `✅ Processing completed! ${rawBackendProgress.completed_steps}/${rawBackendProgress.total_steps} files processed`
            );
          } else {
            toast.error(
              `❌ Processing failed for ${rawBackendProgress.failed_files.length} files`
            );
          }
        }

        return rawBackendProgress;
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Poll failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Full poll error:", error);
    }
    return null;
  };

  // Progress polling - faster at 500ms
  const startProgressPolling = (taskId: string) => {
    console.log(`🔄 Starting polling for task: ${taskId}`);
    stopProgressPolling();

    let tickCount = 0;
    pollingIntervalRef.current = setInterval(async () => {
      tickCount++;
      console.log(
        `⏱️ Provider poll tick #${tickCount} for ${taskId} | Active: ${
          activeTaskId === taskId
        } | Processing: ${isProcessing}`
      );
      if (activeTaskId === taskId && isProcessing) {
        const progress = await checkProgress(taskId);
        if (
          !progress ||
          progress.status === "completed" ||
          progress.status === "failed" ||
          progress.completed_steps >= progress.total_steps
        ) {
          console.log(
            `🛑 Provider stopping poll: ${
              progress?.status || "full completion"
            }`
          );
          stopProgressPolling();
        }
      } else {
        console.log(
          `🛑 Provider mismatch - stopping (active: ${activeTaskId}, expected: ${taskId}, processing: ${isProcessing})`
        );
        stopProgressPolling();
      }
    }, 500); // Faster: 500ms

    // Initial poll
    checkProgress(taskId);
  };

  const stopProgressPolling = () => {
    if (pollingIntervalRef.current) {
      console.log("🛑 Provider clearing polling interval");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Progress actions - initial with successful_count
  const setActiveTask = (
    taskId: string | null,
    totalFiles?: number,
    filenames?: string[]
  ) => {
    if (!taskId) {
      console.log("🧹 Provider clearing task");
      setActiveTaskId(null);
      setIsProcessing(false);
      setProgressData(null);
      stopProgressPolling();
      clearPersistedProgress(); // Clear storage when manually clearing
      return;
    }

    console.log(
      `🎯 Provider setting active task: ${taskId}, total: ${
        totalFiles || "unknown"
      }`
    );
    setActiveTaskId(taskId);
    setIsProcessing(true);

    // Initial state from batch_started
    const initialData = {
      task_id: taskId,
      progress: 0,
      current_file: "Starting...",
      status: "processing" as const,
      processed_count: 0,
      total_files: totalFiles || 1,
      successful_count: 0,
      failed_files: [],
      current_step: 0,
    };
    console.log("📊 Provider initial progressData:", initialData);
    setProgressData(initialData);

    startProgressPolling(taskId);
  };

  const clearProgress = () => {
    console.log("🧹 Provider manual clear progress");
    setActiveTaskId(null);
    setIsProcessing(false);
    setProgressData(null);
    stopProgressPolling();
    clearPersistedProgress(); // Clear storage when manually clearing
  };

  useEffect(() => {
    return () => {
      stopProgressPolling();
    };
  }, []);

  // Socket.IO connection with better error handling
  useEffect(() => {
    if (status === "loading") {
      console.log("⏳ Session loading, waiting...");
      return;
    }

    if (!session?.user?.id) {
      console.log("No user session, skipping socket connection");
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const userId = session.user.id;
    console.log("🔑 Setting up socket connection for user:", userId);

    // Disconnect previous socket if exists
    if (socket) {
      console.log("🔄 Reconnecting socket...");
      socket.disconnect();
    }

    // Create new socket connection
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        userId: userId,
      },
    });

    setSocket(socketInstance);

    // Connection events
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected successfully:", socketInstance.id);

      // Manually join user room after connection
      socketInstance.emit("join", `user_${userId}`, (response: any) => {
        if (response?.status === "joined") {
          console.log(`✅ Joined room: ${response.room}`);
        } else {
          console.log("⚠️ Join response:", response);
        }
      });

      // If we have a persisted active task, check its status
      if (activeTaskId && isProcessing) {
        console.log("🔄 Checking persisted task status after reconnect");
        checkProgress(activeTaskId);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        console.log("🔄 Server disconnected, will try to reconnect...");
      }
    });

    socketInstance.on("reconnect", (attempt) => {
      console.log(`🔄 Socket reconnected after ${attempt} attempts`);

      // Re-join room after reconnection
      socketInstance.emit("join", `user_${userId}`, (response: any) => {
        console.log("Re-join response:", response);
      });

      // Check persisted task status after reconnection
      if (activeTaskId && isProcessing) {
        console.log("🔄 Checking persisted task status after reconnect");
        checkProgress(activeTaskId);
      }
    });

    socketInstance.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Attempting to reconnect (${attempt})...`);
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("❌ Socket reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed");
    });

    // Application events - ENHANCED progress_update with force
    socketInstance.on("batch_started", (data: any) => {
      console.log("📦 Batch started via Socket.IO:", data);

      if (data.task_id && data.user_id === userId) {
        // Pass total_files and filenames from socket data
        setActiveTask(data.task_id, data.total_files, data.filenames);
        toast.info(`Started processing ${data.total_files || 1} document(s)`);
      }
    });

    socketInstance.on(
      "progress_update",
      (data: { task_id: string; progress: BackendProgressData }) => {
        console.log("📊 Progress update via Socket.IO:", data);

        if (data.task_id === activeTaskId && data.progress) {
          const mappedProgress = mapToProgressData(data.progress);
          console.log("📊 Socket setting progressData:", mappedProgress);
          setProgressData(mappedProgress);

          // ENHANCED: Force stop if all processed
          if (mappedProgress.processed_count >= mappedProgress.total_files) {
            console.log("🎉 Socket forcing final state");
            setIsProcessing(false);
            stopProgressPolling();
            toast.success(
              `✅ Processing complete! ${mappedProgress.successful_count}/${mappedProgress.total_files} files processed`
            );
          }
        }
      }
    );

    socketInstance.on("task_complete", (data: any) => {
      console.log("🏁 Task complete event via Socket.IO:", data);
      setTaskStatus(data);

      // Additional handling for task_complete event
      if (data.task_id === activeTaskId && data.status === "completed") {
        console.log("🎉 task_complete event triggered 100% handling");
        const summary = data.summary || {};
        toast.success(
          `✅ Batch processing complete! ${summary.successful || 0}/${
            summary.total_files || 0
          } files processed`
        );
        setIsProcessing(false);
        stopProgressPolling();
        // Optional: Force final poll to sync
        checkProgress(data.task_id);
      }
    });

    socketInstance.on("task_error", (data) => {
      console.error("❌ Task error:", data);
      toast.error(`Task failed: ${data.error || "Unknown error"}`);
      setIsProcessing(false);
      stopProgressPolling();
    });

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up socket connection");
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [status, session?.user?.id, activeTaskId, isProcessing]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        taskStatus,
        progressData,
        activeTaskId,
        isProcessing,
        setActiveTask,
        clearProgress,
        checkProgress,
      }}
    >
      {children}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">{modalTitle}</DialogTitle>
            <DialogDescription className="text-center whitespace-pre-line">
              {modalDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
