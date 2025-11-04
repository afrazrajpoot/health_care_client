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

// Backend progress data interfaces
interface BackendProgressData {
  task_id: string;
  total_steps: number;
  completed_steps: number;
  progress_percentage: number;
  current_file: string;
  status: "processing" | "completed" | "failed";
  processed_files: string[];
  failed_files: string[];
  current_step: number;
  current_file_progress?: number;
  queue_id?: string;
}

// NEW: Queue progress data from backend
interface BackendQueueProgressData {
  queue_id: string;
  user_id: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  active_tasks: number;
  overall_progress: number;
  status: "active" | "completed";
  start_time: string;
  end_time?: string;
}

// Frontend ProgressData (mapped for UI)
interface ProgressData {
  task_id: string;
  progress: number;
  current_file: string;
  status: "processing" | "completed" | "failed";
  processed_count: number;
  total_files: number;
  successful_count: number;
  failed_files: string[];
  current_step: number;
  queue_id?: string;
}

// NEW: Frontend Queue Progress Data
interface QueueProgressData {
  queue_id: string;
  overall_progress: number;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  active_tasks: number;
  status: "active" | "completed";
  start_time: string;
  end_time?: string;
}

// Storage interface for persisting progress
interface StoredProgress {
  progressData: ProgressData | null;
  queueProgressData: QueueProgressData | null;
  activeTaskId: string | null;
  activeQueueId: string | null;
  isProcessing: boolean;
  timestamp: number;
}

type SocketContextType = {
  socket: Socket | null;
  taskStatus: any;

  // Progress tracking
  progressData: ProgressData | null;
  queueProgressData: QueueProgressData | null;
  activeTaskId: string | null;
  activeQueueId: string | null;
  isProcessing: boolean;

  // Progress actions
  setActiveTask: (
    taskId: string,
    totalFiles?: number,
    filenames?: string[],
    queueId?: string
  ) => void;
  setActiveQueue: (queueId: string) => void;
  clearProgress: () => void;
  checkProgress: (taskId: string) => Promise<BackendProgressData | null>;
  checkQueueProgress: (queueId: string) => Promise<QueueProgressData | null>;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const { data: session, status } = useSession();

  // Progress tracking state
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [queueProgressData, setQueueProgressData] =
    useState<QueueProgressData | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Invalid Document");
  const [modalDescription, setModalDescription] = useState("");
  const [skipModalData, setSkipModalData] = useState<{
    open: boolean;
    filename: string;
    reason: string;
  }>({
    open: false,
    filename: "",
    reason: "",
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queuePollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Storage keys
  const STORAGE_KEYS = {
    PROGRESS: "progress_tracker_state",
    TASK_ID: "active_task_id",
    QUEUE_ID: "active_queue_id",
    PROCESSING: "is_processing",
  };

  // Load persisted progress state on mount
  useEffect(() => {
    const loadPersistedProgress = () => {
      try {
        const storedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        const storedTaskId = localStorage.getItem(STORAGE_KEYS.TASK_ID);
        const storedQueueId = localStorage.getItem(STORAGE_KEYS.QUEUE_ID);
        const storedProcessing = localStorage.getItem(STORAGE_KEYS.PROCESSING);

        console.log("📦 Loading persisted progress state:", {
          storedProgress: !!storedProgress,
          storedTaskId,
          storedQueueId,
          storedProcessing,
        });

        if (storedProgress) {
          const parsedProgress: StoredProgress = JSON.parse(storedProgress);

          // Check if the stored progress is not too old (e.g., within last 1 hour)
          const isRecent =
            Date.now() - parsedProgress.timestamp < 60 * 60 * 1000;

          if (isRecent) {
            console.log("🔄 Restoring progress state from localStorage");
            setProgressData(parsedProgress.progressData);
            setQueueProgressData(parsedProgress.queueProgressData);
            setActiveTaskId(parsedProgress.activeTaskId);
            setActiveQueueId(parsedProgress.activeQueueId);
            setIsProcessing(parsedProgress.isProcessing);

            // If still processing, restart polling
            if (parsedProgress.isProcessing) {
              if (parsedProgress.activeTaskId) {
                console.log("🔄 Restarting task polling for persisted task");
                startProgressPolling(parsedProgress.activeTaskId);
              }
              if (parsedProgress.activeQueueId) {
                console.log("🔄 Restarting queue polling for persisted queue");
                startQueueProgressPolling(parsedProgress.activeQueueId);
              }
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
          queueProgressData,
          activeTaskId,
          activeQueueId,
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

        if (activeQueueId) {
          localStorage.setItem(STORAGE_KEYS.QUEUE_ID, activeQueueId);
        } else {
          localStorage.removeItem(STORAGE_KEYS.QUEUE_ID);
        }

        localStorage.setItem(STORAGE_KEYS.PROCESSING, isProcessing.toString());

        console.log("💾 Progress state saved to localStorage:", {
          hasProgressData: !!progressData,
          hasQueueProgressData: !!queueProgressData,
          activeTaskId,
          activeQueueId,
          isProcessing,
        });
      } catch (error) {
        console.error("❌ Error saving progress state:", error);
      }
    };

    saveProgressState();
  }, [
    progressData,
    queueProgressData,
    activeTaskId,
    activeQueueId,
    isProcessing,
  ]);

  // Clear persisted progress from localStorage
  const clearPersistedProgress = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.TASK_ID);
      localStorage.removeItem(STORAGE_KEYS.QUEUE_ID);
      localStorage.removeItem(STORAGE_KEYS.PROCESSING);
      console.log("🧹 Persisted progress cleared from localStorage");
    } catch (error) {
      console.error("❌ Error clearing persisted progress:", error);
    }
  };

  // Map backend data to frontend ProgressData
  const mapToProgressData = (
    backendData: BackendProgressData
  ): ProgressData => {
    const successful_count = backendData.processed_files?.length || 0;
    const failed_count = backendData.failed_files?.length || 0;
    const total_files = backendData.total_steps || 1;
    const completed_steps = backendData.completed_steps || 0;

    // Include skipped files in progress calculation
    const effectiveProgress = Math.min(
      ((successful_count + failed_count) / total_files) * 100,
      100
    );

    let mappedStatus = backendData.status as
      | "processing"
      | "completed"
      | "failed";
    let mappedProgress = backendData.progress_percentage || effectiveProgress;

    // Force 100% if all files are processed (successfully or not)
    if (
      completed_steps >= total_files ||
      successful_count + failed_count >= total_files
    ) {
      mappedProgress = 100;
      mappedStatus = "completed";
      console.log("🔧 Mapping: All files processed - forcing 100%");
    }

    const mapped = {
      task_id: backendData.task_id,
      progress: Math.round(mappedProgress),
      current_file: backendData.current_file || "",
      status: mappedStatus,
      processed_count: completed_steps,
      total_files: total_files,
      successful_count,
      failed_files: backendData.failed_files || [],
      current_step: backendData.current_step || 0,
      queue_id: backendData.queue_id,
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

  // NEW: Map backend queue data to frontend QueueProgressData
  const mapToQueueProgressData = (
    backendData: BackendQueueProgressData
  ): QueueProgressData => {
    return {
      queue_id: backendData.queue_id,
      overall_progress: backendData.overall_progress || 0,
      total_tasks: backendData.total_tasks || 0,
      completed_tasks: backendData.completed_tasks || 0,
      failed_tasks: backendData.failed_tasks || 0,
      active_tasks: backendData.active_tasks || 0,
      status: backendData.status,
      start_time: backendData.start_time,
      end_time: backendData.end_time,
    };
  };

  // Manual progress checking
  const checkProgress = async (taskId: string) => {
    console.log("🔍 Starting checkProgress for task:", taskId);
    try {
      const response = await fetch(
        `${SOCKET_URL}/api/agent/progress/${taskId}`
      );
      console.log("📡 Fetch response status:", response.status);
      if (response.ok) {
        const rawBackendProgress = await response.json();
        console.log(
          `📊 Raw polled backend data for ${taskId}:`,
          rawBackendProgress
        );

        const mappedProgress = mapToProgressData(rawBackendProgress);
        console.log("📊 Setting new progressData:", mappedProgress);

        // Force stop if all processed
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
          setProgressData(mappedProgress);
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

  // NEW: Manual queue progress checking
  const checkQueueProgress = async (queueId: string) => {
    console.log("🔍 Starting checkQueueProgress for queue:", queueId);
    try {
      const response = await fetch(
        `${SOCKET_URL}/api/queue-progress/${queueId}`
      );
      console.log("📡 Queue fetch response status:", response.status);
      if (response.ok) {
        const rawBackendQueueProgress = await response.json();
        console.log(
          `📊 Raw polled queue data for ${queueId}:`,
          rawBackendQueueProgress
        );

        if (rawBackendQueueProgress.status === "success") {
          const mappedQueueProgress = mapToQueueProgressData(
            rawBackendQueueProgress
          );
          console.log("📊 Setting new queueProgressData:", mappedQueueProgress);
          setQueueProgressData(mappedQueueProgress);

          // Check if queue is completed
          if (mappedQueueProgress.status === "completed") {
            console.log("🏁 Queue completed - stopping polling");
            setIsProcessing(false);
            stopQueueProgressPolling();
            toast.success(
              `✅ Queue processing complete! ${mappedQueueProgress.completed_tasks}/${mappedQueueProgress.total_tasks} tasks completed`
            );
          }

          return mappedQueueProgress;
        }
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Queue poll failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Full queue poll error:", error);
    }
    return null;
  };

  // Progress polling
  const startProgressPolling = (taskId: string) => {
    console.log(`🔄 Starting task polling for: ${taskId}`);
    stopProgressPolling();

    let tickCount = 0;
    pollingIntervalRef.current = setInterval(async () => {
      tickCount++;
      console.log(
        `⏱️ Task poll tick #${tickCount} for ${taskId} | Active: ${
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
            `🛑 Task poll stopping: ${progress?.status || "full completion"}`
          );
          stopProgressPolling();
        }
      } else {
        console.log(
          `🛑 Task poll mismatch - stopping (active: ${activeTaskId}, expected: ${taskId}, processing: ${isProcessing})`
        );
        stopProgressPolling();
      }
    }, 500);

    // Initial poll
    checkProgress(taskId);
  };

  // NEW: Queue progress polling
  const startQueueProgressPolling = (queueId: string) => {
    console.log(`🔄 Starting queue polling for: ${queueId}`);
    stopQueueProgressPolling();

    let tickCount = 0;
    queuePollingIntervalRef.current = setInterval(async () => {
      tickCount++;
      console.log(
        `⏱️ Queue poll tick #${tickCount} for ${queueId} | Active: ${
          activeQueueId === queueId
        } | Processing: ${isProcessing}`
      );
      if (activeQueueId === queueId && isProcessing) {
        const queueProgress = await checkQueueProgress(queueId);
        if (!queueProgress || queueProgress.status === "completed") {
          console.log(
            `🛑 Queue poll stopping: ${queueProgress?.status || "no data"}`
          );
          stopQueueProgressPolling();
        }
      } else {
        console.log(
          `🛑 Queue poll mismatch - stopping (active: ${activeQueueId}, expected: ${queueId}, processing: ${isProcessing})`
        );
        stopQueueProgressPolling();
      }
    }, 1000); // Queue polling can be less frequent

    // Initial poll
    checkQueueProgress(queueId);
  };

  const stopProgressPolling = () => {
    if (pollingIntervalRef.current) {
      console.log("🛑 Clearing task polling interval");
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const stopQueueProgressPolling = () => {
    if (queuePollingIntervalRef.current) {
      console.log("🛑 Clearing queue polling interval");
      clearInterval(queuePollingIntervalRef.current);
      queuePollingIntervalRef.current = null;
    }
  };

  // Progress actions
  const setActiveTask = (
    taskId: string | null,
    totalFiles?: number,
    filenames?: string[],
    queueId?: string
  ) => {
    if (!taskId) {
      console.log("🧹 Clearing task");
      setActiveTaskId(null);
      setIsProcessing(false);
      setProgressData(null);
      stopProgressPolling();
      clearPersistedProgress();
      return;
    }

    console.log(
      `🎯 Setting active task: ${taskId}, total: ${
        totalFiles || "unknown"
      }, queue: ${queueId || "none"}`
    );
    setActiveTaskId(taskId);
    if (queueId) {
      setActiveQueueId(queueId);
    }
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
      queue_id: queueId,
    };
    console.log("📊 Initial progressData:", initialData);
    setProgressData(initialData);

    startProgressPolling(taskId);

    // Also start queue polling if queue ID is provided
    if (queueId) {
      startQueueProgressPolling(queueId);
    }
  };

  // NEW: Set active queue
  const setActiveQueue = (queueId: string) => {
    console.log(`🎯 Setting active queue: ${queueId}`);
    setActiveQueueId(queueId);
    setIsProcessing(true);
    startQueueProgressPolling(queueId);
  };

  const clearProgress = () => {
    console.log("🧹 Manual clear progress");
    setActiveTaskId(null);
    setActiveQueueId(null);
    setIsProcessing(false);
    setProgressData(null);
    setQueueProgressData(null);
    stopProgressPolling();
    stopQueueProgressPolling();
    clearPersistedProgress();
  };

  // Modal handlers
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSkipModalClose = () => {
    setSkipModalData((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    return () => {
      stopProgressPolling();
      stopQueueProgressPolling();
    };
  }, []);

  // Socket.IO connection
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

      // Check persisted task/queue status after reconnect
      if (activeTaskId && isProcessing) {
        console.log("🔄 Checking persisted task status after reconnect");
        checkProgress(activeTaskId);
      }
      if (activeQueueId && isProcessing) {
        console.log("🔄 Checking persisted queue status after reconnect");
        checkQueueProgress(activeQueueId);
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

      // Check persisted task/queue status after reconnection
      if (activeTaskId && isProcessing) {
        console.log("🔄 Checking persisted task status after reconnect");
        checkProgress(activeTaskId);
      }
      if (activeQueueId && isProcessing) {
        console.log("🔄 Checking persisted queue status after reconnect");
        checkQueueProgress(activeQueueId);
      }
    });

    // Application events
    socketInstance.on("batch_started", (data: any) => {
      console.log("📦 Batch started via Socket.IO:", data);

      if (data.task_id && data.user_id === userId) {
        setActiveTask(
          data.task_id,
          data.total_files,
          data.filenames,
          data.queue_id
        );
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

          // Force stop if all processed
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

    // NEW: Queue progress event
    socketInstance.on("queue_progress", (data: BackendQueueProgressData) => {
      console.log("📊 Queue progress update via Socket.IO:", data);

      if (data.user_id === userId) {
        const mappedQueueProgress = mapToQueueProgressData(data);
        console.log(
          "📊 Socket setting queueProgressData:",
          mappedQueueProgress
        );
        setQueueProgressData(mappedQueueProgress);

        // Update active queue if not set
        if (!activeQueueId && data.queue_id) {
          setActiveQueueId(data.queue_id);
        }

        // Check if queue is completed
        if (mappedQueueProgress.status === "completed") {
          console.log("🏁 Queue completed via socket");
          setIsProcessing(false);
          stopQueueProgressPolling();
          toast.success(
            `✅ Queue processing complete! ${mappedQueueProgress.completed_tasks}/${mappedQueueProgress.total_tasks} tasks completed`
          );
        }
      }
    });

    // NEW: Document skipped event handler
    socketInstance.on("document_skipped", (data: any) => {
      console.log("⏭️ Document skipped event:", data);

      if (data.user_id === userId) {
        // Show modal
        setSkipModalData({
          open: true,
          filename: data.filename,
          reason: data.reason || "Document was already processed",
        });

        // Also show toast
        toast.warning(`Document skipped: ${data.filename}`, {
          description: data.reason,
          duration: 3000,
        });

        // Update progress data if we have an active task
        if (activeTaskId && progressData) {
          setProgressData((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              failed_files: [...prev.failed_files, data.filename],
              processed_count: prev.processed_count + 1,
              // Recalculate progress
              progress: Math.round(
                ((prev.processed_count + 1) / prev.total_files) * 100
              ),
            };
          });
        }

        // Also update queue progress if available
        if (activeQueueId && queueProgressData) {
          setQueueProgressData((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              failed_tasks: prev.failed_tasks + 1,
              completed_tasks: prev.completed_tasks + 1,
              overall_progress: Math.round(
                ((prev.completed_tasks + 1) / prev.total_tasks) * 100
              ),
            };
          });
        }
      }
    });

    socketInstance.on("task_complete", (data: any) => {
      console.log("🏁 Task complete event via Socket.IO:", data);
      setTaskStatus(data);

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
        checkProgress(data.task_id);
      }
    });

    socketInstance.on("task_error", (data) => {
      console.error("❌ Task error:", data);
      toast.error(`Task failed: ${data.error || "Unknown error"}`);
      setIsProcessing(false);
      stopProgressPolling();
      stopQueueProgressPolling();
    });

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up socket connection");
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [status, session?.user?.id, activeTaskId, activeQueueId, isProcessing]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        taskStatus,
        progressData,
        queueProgressData,
        activeTaskId,
        activeQueueId,
        isProcessing,
        setActiveTask,
        setActiveQueue,
        clearProgress,
        checkProgress,
        checkQueueProgress,
      }}
    >
      {children}

      {/* Document Skipped Modal */}
      <Dialog open={skipModalData.open} onOpenChange={handleSkipModalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center text-yellow-600">
              ⚠️ Document Skipped
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">
                  {skipModalData.filename}
                </p>
                <p className="text-gray-600">{skipModalData.reason}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSkipModalClose}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
            >
              Continue Processing
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing modal for other purposes */}
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
