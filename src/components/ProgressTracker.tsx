// components/ProgressTracker.tsx
import { useSocket } from "@/providers/SocketProvider";
import React, { useEffect, useState, useMemo } from "react";
import {
  Check,
  X,
  Minimize2,
  Maximize2,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import DocLatchAnimation from "./DocLatchAnimation";
import { toast } from "sonner";

// File item status types
interface FileItemStatus {
  filename: string;
  status: "pending" | "processing" | "success" | "failed";
  message?: string;
}

interface ProgressTrackerProps {
  onComplete?: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  onComplete,
}) => {
  const {
    progressData,
    queueProgressData,
    isProcessing,
    clearProgress,
    activeTaskId,
    activeQueueId,
    checkProgress,
    checkQueueProgress,
    currentPhase,
    combinedProgress,
  } = useSocket();

  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayQueueProgress, setDisplayQueueProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState(Date.now());
  const [viewMode, setViewMode] = useState<"task" | "queue">("task"); // Default to task mode
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Check localStorage on mount for persisted visibility and minimized state
  useEffect(() => {
    // Only show if there's actual active processing, not just because localStorage says so
    const hasActiveProgress =
      isProcessing && (progressData || queueProgressData);

    // Check if it was explicitly maximized before (default to minimized)
    const wasMaximized =
      localStorage.getItem("progressTrackerMinimized") === "false";

    // ONLY show if there's ACTIVE processing with data
    if (hasActiveProgress) {
      setIsVisible(true);
      // Always default to minimized (small top-right modal) on first load
      setIsMinimized(true);
      localStorage.setItem("progressTrackerOpen", "true");
      localStorage.setItem("progressTrackerMinimized", "true");
    } else {
      // Clear stale localStorage on mount if no active processing

      localStorage.removeItem("progressTrackerOpen");
      localStorage.removeItem("progressTrackerMinimized");
      setIsVisible(false);
      setIsMinimized(true);
    }
  }, []); // Run only once on mount

  // Show modal only when processing starts (not on every state change)
  useEffect(() => {
    // Only show if isProcessing becomes true AND we have data
    if (isProcessing && (progressData || queueProgressData)) {
      setIsVisible(true);
      // Always start minimized for new uploads
      setIsMinimized(true);
      localStorage.setItem("progressTrackerOpen", "true");
      localStorage.setItem("progressTrackerMinimized", "true");

      // Dismiss any existing toast notifications when progress modal opens
      toast.dismiss();
    }
    // Don't hide automatically - let completion logic or manual close handle that
  }, [isProcessing, progressData, queueProgressData]);

  // Auto-switch to queue view when queue data is available
  useEffect(() => {
    if (queueProgressData && !progressData) {
      // Only switch to queue if we don't have task data
      setViewMode("queue");
    } else if (progressData && !queueProgressData) {
      // Switch to task if we have task data but no queue data
      setViewMode("task");
    }
  }, [queueProgressData, progressData]);

  // Robust manual polling - stops at 100%
  useEffect(() => {
    // Check if we should stop polling
    const taskComplete =
      progressData?.progress_percentage === 100 ||
      progressData?.status === "completed" ||
      progressData?.status === "upload_complete";
    const queueComplete =
      queueProgressData?.overall_progress === 100 ||
      queueProgressData?.status === "completed";

    if (
      (activeTaskId || activeQueueId) &&
      isProcessing &&
      !taskComplete &&
      !queueComplete
    ) {
      const interval = setInterval(async () => {
        setPollCount((prev) => {
          const newCount = prev + 1;

          return newCount;
        });

        try {
          if (activeTaskId && checkProgress) {
            const result = await checkProgress(activeTaskId);

            // Stop polling if we reach 100%
            if (
              result?.progress_percentage === 100 ||
              result?.status === "completed" ||
              (result?.status as any) === "upload_complete"
            ) {
              clearInterval(interval);
            }
          }

          if (activeQueueId && checkQueueProgress) {
            const result = await checkQueueProgress(activeQueueId);

            // Stop polling if we reach 100%
            if (
              result?.overall_progress === 100 ||
              result?.status === "completed"
            ) {
              clearInterval(interval);
            }
          }

          setLastPollTime(Date.now());
        } catch (error) {
          console.error("❌ Tracker poll error:", error);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    } else if (taskComplete || queueComplete) {
      console.log("✅ Progress complete, stopping polling");
    }
  }, [
    activeTaskId,
    activeQueueId,
    isProcessing,
    checkProgress,
    checkQueueProgress,
    progressData?.progress_percentage,
    progressData?.status,
    queueProgressData?.overall_progress,
    queueProgressData?.status,
  ]);

  // Handle completion and auto-close
  useEffect(() => {
    // STRICT completion check - ONLY close when progress_percentage is 100 AND status is completed
    const progressComplete = progressData?.progress_percentage === 100;
    const statusCompleted = progressData?.status === "completed";

    // Check task completion
    const isCompleted = statusCompleted && progressComplete;

    // Check queue completion
    const queueCompleted =
      queueProgressData?.overall_progress === 100 &&
      queueProgressData?.status === "completed";

    if ((isCompleted || queueCompleted) && !autoCloseTimer) {
      // Set progress to 100%
      setDisplayProgress(100);
      setDisplayQueueProgress(100);

      const timer = setTimeout(() => {
        // Call the onComplete callback just before closing
        if (onComplete) {
          onComplete();
        }

        handleClose();
      }, 2000); // 2 second delay to show completion

      setAutoCloseTimer(timer);
    }

    // Cleanup timer on unmount or when completion status changes
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    progressData?.status,
    progressData?.progress_percentage,
    currentPhase,
    queueProgressData?.status,
    queueProgressData?.overall_progress,
    // Don't include autoCloseTimer to prevent clearing the timer
  ]);

  // Smooth progress animation for task
  useEffect(() => {
    if (progressData) {
      // Use progress_percentage from API response
      const targetProgress =
        progressData.progress_percentage || progressData.progress || 0;

      animateProgress(targetProgress, setDisplayProgress);
    }
  }, [progressData?.progress_percentage, progressData?.progress]);

  // Smooth progress animation for queue
  useEffect(() => {
    if (queueProgressData) {
      const targetProgress = queueProgressData.overall_progress || 0;
      animateProgress(targetProgress, setDisplayQueueProgress);
    }
  }, [queueProgressData?.overall_progress]);

  // Helper function for smooth progress animation
  const animateProgress = (
    targetProgress: number,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const duration = 500;
    const steps = 20;
    const stepTime = duration / steps;
    const currentProgress =
      setter === setDisplayProgress ? displayProgress : displayQueueProgress;
    const increment = (targetProgress - currentProgress) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setter((prev: number) => {
        const newProgress = prev + increment;
        if (currentStep >= steps) {
          clearInterval(timer);
          return targetProgress;
        }
        return newProgress;
      });
    }, stepTime);

    return () => clearInterval(timer);
  };

  const handleManualRefresh = () => {
    if (activeTaskId && checkProgress) {
      checkProgress(activeTaskId);
    }
    if (activeQueueId && checkQueueProgress) {
      checkQueueProgress(activeQueueId);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsMinimized(true);
    localStorage.removeItem("progressTrackerOpen");
    localStorage.removeItem("progressTrackerMinimized");

    // Clear any pending auto-close timer
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }

    // Clear progress data immediately to prevent re-showing
    clearProgress();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    localStorage.setItem("progressTrackerMinimized", "true");
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    localStorage.removeItem("progressTrackerMinimized");
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "task" ? "queue" : "task");
  };

  // Compute file items with real-time status from successful_items and failed_items
  const fileItems = useMemo((): FileItemStatus[] => {
    if (!progressData) return [];

    const filenames = (progressData as any)?.filenames || [];
    const successfulItems = progressData.successful_items || [];
    const failedItems = progressData.failed_items || [];
    const currentFile = progressData.current_file || "";

    // Create a map of known statuses
    const statusMap = new Map<string, FileItemStatus>();

    // Add successful items
    successfulItems.forEach((item) => {
      statusMap.set(item.filename, {
        filename: item.filename,
        status: "success",
        message: item.message,
      });
    });

    // Add failed items
    failedItems.forEach((item) => {
      statusMap.set(item.filename, {
        filename: item.filename,
        status: "failed",
        message: item.message,
      });
    });

    // Build the final list from filenames array (or from status maps if filenames is empty)
    if (filenames.length > 0) {
      return filenames.map((filename: string): FileItemStatus => {
        if (statusMap.has(filename)) {
          return statusMap.get(filename)!;
        }
        // Check if this is the currently processing file
        if (
          currentFile &&
          filename
            .toLowerCase()
            .includes(currentFile.toLowerCase().replace(" - Processing...", ""))
        ) {
          return {
            filename,
            status: "processing",
            message: "Processing...",
          };
        }
        return {
          filename,
          status: "pending",
        };
      });
    }

    // If no filenames array, build from successful and failed items
    const allItems: FileItemStatus[] = [
      ...successfulItems.map((item) => ({
        filename: item.filename,
        status: "success" as const,
        message: item.message,
      })),
      ...failedItems.map((item) => ({
        filename: item.filename,
        status: "failed" as const,
        message: item.message,
      })),
    ];

    return allItems;
  }, [progressData]);

  // Calculate pending count
  const pendingCount = useMemo(() => {
    const successful = progressData?.successful_items?.length || 0;
    const failed = progressData?.failed_items?.length || 0;
    const total = progressData?.total_files || progressData?.total_steps || 0;
    return Math.max(0, total - (successful + failed));
  }, [progressData]);

  // Don't render if not visible OR if there's no active processing
  if (!isVisible || (!isProcessing && !progressData && !queueProgressData)) {
    return null;
  }

  // Get current progress for animation
  const currentProgress = currentPhase
    ? combinedProgress // Use combined progress when two-phase tracking is active
    : viewMode === "queue"
    ? displayQueueProgress
    : displayProgress;

  // Get progress counts for display - use actual file count from filenames
  const processedCount =
    viewMode === "queue"
      ? queueProgressData?.completed_tasks || 0
      : progressData?.completed_steps || 0;
  const totalCount =
    viewMode === "queue"
      ? queueProgressData?.total_tasks || 0
      : (progressData as any)?.filenames?.length ||
        progressData?.total_steps ||
        1;

  // Minimized floating view - shows in top-right corner
  if (isMinimized) {
    return (
      <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 duration-300">
        <div
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 min-w-[220px] cursor-pointer hover:shadow-xl transition-shadow"
          onClick={handleMaximize}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 flex-1">
              {/* Animated spinner/progress circle */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${currentProgress * 0.975} 100`}
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient
                      id="progressGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  {Math.round(currentProgress)}%
                </span>
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">
                  {isProcessing ? "Processing..." : "Complete"}
                </div>
                <div className="text-[10px] text-gray-500">
                  {processedCount}/{totalCount} files
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMaximize();
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                title="Expand"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Pulsing indicator when processing */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <div
                className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <div
                className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading state if processing but no progress data yet
  if (!progressData && !queueProgressData && isProcessing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
          {/* Background Gradient Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-teal-500/20 rounded-full blur-3xl -z-0" />

          {/* Minimize Button */}
          <button
            onClick={handleMinimize}
            className="absolute top-4 right-4 z-20 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="relative z-10 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              {currentPhase === "upload"
                ? "Uploading Documents"
                : currentPhase === "processing"
                ? "Processing Documents"
                : "Uploading Documents"}
            </h3>
            <p className="text-sm text-gray-500">
              {currentPhase === "upload"
                ? "Validating and saving files..."
                : currentPhase === "processing"
                ? "Extracting data with AI..."
                : "DocLatch processing your documents..."}
            </p>
          </div>

          {/* DocLatch Animation */}
          <div className="flex items-center justify-center">
            <DocLatchAnimation
              text={
                currentPhase === "upload"
                  ? "Validating & Uploading Files..."
                  : currentPhase === "processing"
                  ? "Extracting Data → Updating Dashboard…"
                  : "Processing Documents…"
              }
              width={170}
              height={150}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render animated modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
      {/* Popup Container */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        {/* Background Gradient Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-teal-500/20 rounded-full blur-3xl -z-0" />

        {/* Action Buttons - Minimize & Close */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="relative z-10 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {viewMode === "queue" ? "Processing Queue" : "Uploading Documents"}
          </h3>
          <p className="text-sm text-gray-500">
            {isProcessing
              ? "DocLatch is processing your documents..."
              : "Processing completed!"}
          </p>
        </div>

        {/* Animation Area */}
        <div className="relative mb-6">
          <DocLatchAnimation
            text={
              isProcessing
                ? currentPhase === "upload"
                  ? "Validating & Uploading Files..."
                  : currentPhase === "processing"
                  ? "Extracting Data → Updating Dashboard…"
                  : "Processing Documents…"
                : "Processing Complete ✓"
            }
            width={200}
            height={180}
          />
        </div>

        {/* Progress Info */}
        <div className="relative z-10 space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {isProcessing
                ? "Extracting documents..."
                : "Extraction completed!"}
            </span>
            {isProcessing && (
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full transition-all duration-1000"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Progress Details */}
          <div className="text-xs text-gray-600 text-center">
            {viewMode === "queue" ? (
              <>
                {queueProgressData?.completed_tasks || 0} of{" "}
                {queueProgressData?.total_tasks || 0} tasks completed
                {queueProgressData?.failed_tasks
                  ? ` (${queueProgressData.failed_tasks} failed)`
                  : ""}
              </>
            ) : (
              <>
                {progressData?.successful_items?.length || 0} of{" "}
                {progressData?.total_files || progressData?.total_steps || 1}{" "}
                files completed
                {progressData?.failed_items?.length
                  ? ` • ${progressData.failed_items.length} failed`
                  : ""}
                {pendingCount > 0 ? ` • ${pendingCount} pending` : ""}
              </>
            )}
          </div>

          {/* Phase Indicator - Show only when two-phase tracking is active */}
          {currentPhase && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`w-2 h-2 rounded-full ${
                  currentPhase === "upload"
                    ? "bg-cyan-500 animate-pulse"
                    : "bg-green-500"
                }`}
              />
              <span className="text-xs text-gray-500">Upload</span>

              <div className="w-8 h-px bg-gray-300" />

              <div
                className={`w-2 h-2 rounded-full ${
                  currentPhase === "processing"
                    ? "bg-cyan-500 animate-pulse"
                    : currentPhase === "upload"
                    ? "bg-gray-300"
                    : "bg-green-500"
                }`}
              />
              <span className="text-xs text-gray-500">Processing</span>
            </div>
          )}
        </div>

        {/* File Processing Status List */}
        <div className="relative z-10 bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700">
                File Status
              </span>
            </div>
            {fileItems.length > 0 && (
              <span className="text-xs text-gray-500">
                {progressData?.successful_items?.length || 0}/{fileItems.length}{" "}
                done
              </span>
            )}
          </div>

          {fileItems.length > 0 ? (
            <div className="space-y-2">
              {fileItems.map((item, index) => (
                <div
                  key={`${item.filename}-${index}`}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 transition-all duration-300"
                  title={item.message || item.filename}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {item.status === "success" && (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                    )}
                    {item.status === "failed" && (
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      </div>
                    )}
                    {item.status === "processing" && (
                      <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                        <Loader2 className="w-3 h-3 text-cyan-600 animate-spin" />
                      </div>
                    )}
                    {item.status === "pending" && (
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Filename */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {item.filename}
                    </p>
                    {item.message && item.status === "failed" && (
                      <p className="text-[10px] text-red-500 truncate">
                        {item.message}
                      </p>
                    )}
                  </div>

                  {/* Status Label */}
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      item.status === "success"
                        ? "bg-green-100 text-green-700"
                        : item.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : item.status === "processing"
                        ? "bg-cyan-100 text-cyan-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.status === "success"
                      ? "Done"
                      : item.status === "failed"
                      ? "Error"
                      : item.status === "processing"
                      ? "Processing"
                      : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {["Lab Results", "Vitals", "Diagnoses", "Medications"].map(
                (item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs text-gray-600 opacity-0"
                    style={{
                      animation: `fadeInSlide 0.5s ease-out ${
                        0.5 + index * 0.15
                      }s forwards`,
                    }}
                  >
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                    {item}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="relative z-10 mt-6 flex justify-between items-center">
          {/* View Toggle */}
          {progressData && queueProgressData && (
            <button
              onClick={toggleViewMode}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              {viewMode === "queue"
                ? "View Task Details"
                : "View Queue Progress"}
            </button>
          )}

          {/* Manual Refresh */}
          {isProcessing && (
            <button
              onClick={handleManualRefresh}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
