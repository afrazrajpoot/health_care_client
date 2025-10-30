// components/ProgressTracker.tsx
import { useSocket } from "@/providers/SocketProvider";
import React, { useEffect, useState } from "react";

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
  } = useSocket();

  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayQueueProgress, setDisplayQueueProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState(Date.now());
  const [viewMode, setViewMode] = useState<"task" | "queue">("task");
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Check localStorage on mount for persisted visibility
  useEffect(() => {
    const isOpen = localStorage.getItem("progressTrackerOpen");
    const hasActiveProgress = isProcessing || progressData || queueProgressData;

    console.log("🔍 Mount check:", {
      isOpen,
      hasActiveProgress,
      isProcessing,
      progressData,
      queueProgressData,
    });

    // Show if explicitly open OR if there's active processing
    if (isOpen === "true" || hasActiveProgress) {
      console.log("👁️ Setting visible on mount");
      setIsVisible(true);
    }

    // Auto-detect view mode: prefer queue if available
    if (queueProgressData) {
      setViewMode("queue");
    }
  }, [isProcessing, progressData, queueProgressData]);

  // Save to localStorage when becoming visible
  useEffect(() => {
    if (isVisible) {
      localStorage.setItem("progressTrackerOpen", "true");
      console.log("💾 Saved visibility to localStorage");
    }
  }, [isVisible]);

  // Force visibility if processing or data exists
  useEffect(() => {
    if (isProcessing || progressData || queueProgressData) {
      console.log("👁️ Forcing visibility - processing or data present");
      setIsVisible(true);
    }
  }, [isProcessing, progressData, queueProgressData]);

  // Auto-switch to queue view when queue data is available
  useEffect(() => {
    if (queueProgressData && viewMode === "task") {
      setViewMode("queue");
    }
  }, [queueProgressData, viewMode]);

  // Debug log for state changes
  useEffect(() => {
    console.log("🔍 ProgressTracker state update:", {
      activeTaskId,
      activeQueueId,
      isProcessing,
      progressData,
      queueProgressData,
      isVisible,
      viewMode,
      pollCount,
      lastPollTime,
    });
  }, [
    activeTaskId,
    activeQueueId,
    isProcessing,
    progressData,
    queueProgressData,
    isVisible,
    viewMode,
    pollCount,
    lastPollTime,
  ]);

  // Robust manual polling
  useEffect(() => {
    if ((activeTaskId || activeQueueId) && isProcessing) {
      console.log("⏰ Starting tracker polling for:", {
        activeTaskId,
        activeQueueId,
      });
      const interval = setInterval(async () => {
        setPollCount((prev) => {
          const newCount = prev + 1;
          console.log(
            `⏱️ Tracker poll #${newCount} at ${new Date().toLocaleTimeString()}`
          );
          return newCount;
        });

        try {
          if (activeTaskId && checkProgress) {
            const result = await checkProgress(activeTaskId);
            console.log(
              "✅ Task poll success:",
              result ? "data received" : "null"
            );
          }

          if (activeQueueId && checkQueueProgress) {
            const result = await checkQueueProgress(activeQueueId);
            console.log(
              "✅ Queue poll success:",
              result ? "data received" : "null"
            );
          }

          setLastPollTime(Date.now());
        } catch (error) {
          console.error("❌ Tracker poll error:", error);
        }
      }, 1000);

      return () => {
        console.log("🛑 Clearing tracker interval");
        clearInterval(interval);
      };
    }
  }, [
    activeTaskId,
    activeQueueId,
    isProcessing,
    checkProgress,
    checkQueueProgress,
  ]);

  // Handle completion and auto-close
  useEffect(() => {
    const isCompleted =
      progressData?.status === "completed" ||
      queueProgressData?.status === "completed";

    if (isCompleted) {
      console.log("✅ Processing completed - triggering onComplete callback");

      // Call the onComplete callback first
      if (onComplete) {
        onComplete();
      }

      // Set progress to 100%
      setDisplayProgress(100);
      setDisplayQueueProgress(100);

      // Auto-close after a short delay (2 seconds)
      console.log("⏰ Setting auto-close timer");
      const timer = setTimeout(() => {
        console.log("🕒 Auto-closing progress tracker");
        handleClose();
      }, 2000);

      setAutoCloseTimer(timer);
    }

    // Cleanup timer on unmount or when completion status changes
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [progressData?.status, queueProgressData?.status, onComplete]);

  // Smooth progress animation for task
  useEffect(() => {
    if (progressData && isProcessing && viewMode === "task") {
      console.log(
        "🎬 Starting task animation for progress:",
        progressData.progress
      );
      const targetProgress = progressData.progress || 0;
      animateProgress(targetProgress, setDisplayProgress);
    }
  }, [progressData?.progress, isProcessing, viewMode]);

  // Smooth progress animation for queue
  useEffect(() => {
    if (queueProgressData && isProcessing && viewMode === "queue") {
      console.log(
        "🎬 Starting queue animation for progress:",
        queueProgressData.overall_progress
      );
      const targetProgress = queueProgressData.overall_progress || 0;
      animateProgress(targetProgress, setDisplayQueueProgress);
    }
  }, [queueProgressData?.overall_progress, isProcessing, viewMode]);

  // Helper function for smooth progress animation
  const animateProgress = (
    targetProgress: number,
    setter: (value: number) => void
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
      setter((prev) => {
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
    console.log("🔄 Manual refresh for:", { activeTaskId, activeQueueId });
    if (activeTaskId && checkProgress) {
      checkProgress(activeTaskId);
    }
    if (activeQueueId && checkQueueProgress) {
      checkQueueProgress(activeQueueId);
    }
  };

  const handleClose = () => {
    console.log("✕ Closing progress tracker");
    setIsVisible(false);
    localStorage.removeItem("progressTrackerOpen");

    // Clear any pending auto-close timer
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }

    // Clear progress data after a short delay to allow animation
    setTimeout(() => clearProgress(), 300);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "task" ? "queue" : "task");
  };

  // Don't hide if there's active processing, even if isVisible is false
  if (!isVisible && !isProcessing && !progressData && !queueProgressData) {
    return null;
  }

  // Show loading state if processing but no progress data yet
  if (!progressData && !queueProgressData && isProcessing) {
    return (
      <div className="fixed top-4 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right-5 duration-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Document Processing
          </h3>
          <button
            onClick={handleClose}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
            title="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-600">Loading progress...</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div className="h-2 rounded-full bg-blue-500 animate-pulse"></div>
        </div>
        {(activeTaskId || activeQueueId) && (
          <div className="mt-2 text-xs text-gray-500 truncate">
            {activeQueueId
              ? `Queue: ${activeQueueId.substring(0, 8)}...`
              : `Task: ${activeTaskId?.substring(0, 8)}...`}
          </div>
        )}
      </div>
    );
  }

  // Render task view
  const renderTaskView = () => {
    const {
      current_file = "",
      status,
      processed_count = 0,
      total_files = 1,
      failed_files = [],
      current_step = 0,
    } = progressData || {};

    const getStatusColor = () => {
      switch (status) {
        case "processing":
          return "bg-blue-500";
        case "completed":
          return failed_files.length > 0 ? "bg-yellow-500" : "bg-green-500";
        case "failed":
          return "bg-red-500";
        default:
          return "bg-gray-500";
      }
    };

    const getStatusText = () => {
      switch (status) {
        case "processing":
          return "Processing documents...";
        case "completed":
          return failed_files.length > 0
            ? "Processing completed with warnings"
            : "Processing completed!";
        case "failed":
          return "Processing failed";
        default:
          return "Unknown status";
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case "processing":
          return "🔄";
        case "completed":
          return failed_files.length > 0 ? "⚠️" : "✅";
        case "failed":
          return "❌";
        default:
          return "❓";
      }
    };

    return (
      <>
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{getStatusText()}</span>
            <span className="font-semibold">
              {Math.round(displayProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Progress Details */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Progress:</span>
            <span className="font-medium">
              {current_step}/{total_files} files
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Processed:</span>
            <span className="font-medium text-green-600">
              {processed_count} successful
            </span>
          </div>

          {failed_files.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Failed:</span>
              <span className="font-medium text-red-600">
                {failed_files.length} files
              </span>
            </div>
          )}

          {/* Current File */}
          {current_file && status === "processing" && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
              <div className="font-medium text-xs">Currently processing:</div>
              <div className="truncate text-xs mt-1">{current_file}</div>
            </div>
          )}

          {/* Failed Files List */}
          {failed_files.length > 0 && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
              <div className="font-medium text-xs mb-1">
                ⚠️ {failed_files.length} file(s) failed:
              </div>
              <ul className="text-xs space-y-1 max-h-20 overflow-y-auto custom-scrollbar">
                {failed_files.map((file, index) => (
                  <li key={index} className="truncate" title={file}>
                    • {file}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completion Message */}
          {status === "completed" && (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                failed_files.length > 0
                  ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                  : "bg-green-50 border border-green-200 text-green-800"
              }`}
            >
              {failed_files.length > 0
                ? `Processed ${processed_count} out of ${total_files} files. ${failed_files.length} files failed.`
                : `✅ Successfully processed all ${total_files} files!`}
            </div>
          )}
        </div>
      </>
    );
  };

  // Render queue view
  const renderQueueView = () => {
    const {
      overall_progress = 0,
      total_tasks = 0,
      completed_tasks = 0,
      failed_tasks = 0,
      active_tasks = 0,
      status,
    } = queueProgressData || {};

    const getStatusColor = () => {
      switch (status) {
        case "active":
          return "bg-blue-500";
        case "completed":
          return failed_tasks > 0 ? "bg-yellow-500" : "bg-green-500";
        default:
          return "bg-gray-500";
      }
    };

    const getStatusText = () => {
      switch (status) {
        case "active":
          return "Processing queue...";
        case "completed":
          return failed_tasks > 0
            ? "Queue completed with warnings"
            : "Queue completed!";
        default:
          return "Unknown status";
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case "active":
          return "🔄";
        case "completed":
          return failed_tasks > 0 ? "⚠️" : "✅";
        default:
          return "❓";
      }
    };

    return (
      <>
        {/* Queue Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{getStatusText()}</span>
            <span className="font-semibold">
              {Math.round(displayQueueProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
              style={{ width: `${displayQueueProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Queue Progress Details */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Tasks:</span>
            <span className="font-medium">{total_tasks}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Completed:</span>
            <span className="font-medium text-green-600">
              {completed_tasks} tasks
            </span>
          </div>

          {active_tasks > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Active:</span>
              <span className="font-medium text-blue-600">
                {active_tasks} tasks
              </span>
            </div>
          )}

          {failed_tasks > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Failed:</span>
              <span className="font-medium text-red-600">
                {failed_tasks} tasks
              </span>
            </div>
          )}

          {/* Completion Message */}
          {status === "completed" && (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                failed_tasks > 0
                  ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                  : "bg-green-50 border border-green-200 text-green-800"
              }`}
            >
              {failed_tasks > 0
                ? `Processed ${completed_tasks} out of ${total_tasks} tasks. ${failed_tasks} tasks failed.`
                : `✅ Successfully processed all ${total_tasks} tasks!`}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right-5 duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-800">
            {viewMode === "queue" ? "Queue Processing" : "Document Processing"}
          </h3>
          <span className="text-sm">
            {viewMode === "queue"
              ? queueProgressData?.status === "active"
                ? "🔄"
                : queueProgressData?.failed_tasks
                ? "⚠️"
                : "✅"
              : progressData?.status === "processing"
              ? "🔄"
              : progressData?.failed_files?.length
              ? "⚠️"
              : "✅"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* View Toggle Button */}
          {progressData && queueProgressData && (
            <button
              onClick={toggleViewMode}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
              title={`Switch to ${
                viewMode === "queue" ? "task" : "queue"
              } view`}
            >
              {viewMode === "queue" ? "📄" : "📊"}
            </button>
          )}
          <button
            onClick={handleManualRefresh}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
            title="Refresh progress"
          >
            🔄
          </button>
          <button
            onClick={handleClose}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {viewMode === "queue" ? renderQueueView() : renderTaskView()}

      {/* Task/Queue ID for debugging */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div
          className="text-xs text-gray-500 truncate"
          title={
            viewMode === "queue" ? activeQueueId || "" : activeTaskId || ""
          }
        >
          {viewMode === "queue" ? "Queue" : "Task"}:{" "}
          {(viewMode === "queue" ? activeQueueId : activeTaskId)?.substring(
            0,
            8
          )}
          ...
        </div>
      </div>

      {/* DEBUG: Raw state dump (remove in production) */}
      {/* <details className="mt-2 p-1 bg-gray-50 rounded text-xs">
        <summary>
          Debug State (Polls: {pollCount}, View: {viewMode}, Last Poll:{" "}
          {new Date(lastPollTime).toLocaleTimeString()})
        </summary>
        <pre className="text-xs overflow-auto max-h-20">
          {JSON.stringify(
            {
              progressData,
              queueProgressData,
              isProcessing,
              activeTaskId,
              activeQueueId,
              displayProgress,
              displayQueueProgress,
            },
            null,
            2
          )}
        </pre>
      </details> */}
    </div>
  );
};
