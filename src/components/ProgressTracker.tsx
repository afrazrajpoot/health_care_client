// components/ProgressTracker.tsx
import { useSocket } from "@/providers/SocketProvider";
import React, { useEffect, useState } from "react";
// import { useSocket } from "@/contexts/SocketContext";

interface ProgressTrackerProps {
  onComplete?: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  onComplete,
}) => {
  const {
    progressData,
    isProcessing,
    clearProgress,
    activeTaskId,
    checkProgress,
  } = useSocket();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [pollCount, setPollCount] = useState(0); // DEBUG: Track poll calls
  const [lastPollTime, setLastPollTime] = useState(Date.now()); // Track last poll

  // Check localStorage on mount for persisted visibility
  useEffect(() => {
    const isOpen = localStorage.getItem("progressTrackerOpen");
    if (isOpen === "true") {
      setIsVisible(true);
    }
  }, []);

  // Save to localStorage when becoming visible
  useEffect(() => {
    if (isVisible) {
      localStorage.setItem("progressTrackerOpen", "true");
    }
  }, [isVisible]);

  // Force visibility if processing or data exists
  useEffect(() => {
    if (isProcessing || progressData) {
      setIsVisible(true);
      console.log("👁️ Forcing visibility - processing or data present"); // DEBUG
    }
  }, [isProcessing, progressData]);

  // Debug log for state changes
  useEffect(() => {
    console.log("🔍 ProgressTracker state update:", {
      activeTaskId,
      isProcessing,
      progressData,
      isVisible,
      pollCount,
      lastPollTime,
    });
  }, [
    activeTaskId,
    isProcessing,
    progressData,
    isVisible,
    pollCount,
    lastPollTime,
  ]);

  // Robust manual poll on mount if active - every 1s, with error handling
  useEffect(() => {
    if (activeTaskId && isProcessing) {
      console.log("⏰ Starting tracker polling for task:", activeTaskId); // DEBUG
      const interval = setInterval(async () => {
        setPollCount((prev) => {
          const newCount = prev + 1;
          console.log(
            `⏱️ Tracker poll #${newCount} at ${new Date().toLocaleTimeString()}`
          ); // DEBUG
          return newCount;
        });

        if (checkProgress) {
          try {
            const result = await checkProgress(activeTaskId);
            setLastPollTime(Date.now());
            console.log(
              "✅ Tracker poll success:",
              result
                ? {
                    status: result.status,
                    completed_steps: result.completed_steps,
                  }
                : "null"
            ); // DEBUG
          } catch (error) {
            console.error("❌ Tracker poll error:", error); // DEBUG: Catch fetch errors
          }
        }
      }, 1000); // Poll every 1s

      return () => {
        console.log("🛑 Clearing tracker interval"); // DEBUG
        clearInterval(interval);
      };
    }
  }, [activeTaskId, isProcessing, checkProgress]);

  // Handle completion: trigger onComplete callback, but do not auto-hide
  useEffect(() => {
    if (progressData?.status === "completed" && onComplete) {
      console.log("✅ Task completed - triggering onComplete callback"); // DEBUG
      onComplete();
      setDisplayProgress(100); // Force 100% on completion
      // No auto-hide here - keep visible until user closes
    }
  }, [progressData?.status, onComplete]);

  // Smooth progress animation
  useEffect(() => {
    if (progressData && isProcessing) {
      console.log("🎬 Starting animation for progress:", progressData.progress); // DEBUG
      setIsVisible(true);

      // Animate progress bar smoothly
      const targetProgress = progressData.progress || 0;
      const duration = 500; // ms
      const steps = 20;
      const stepTime = duration / steps;
      const increment = (targetProgress - displayProgress) / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setDisplayProgress((prev) => {
          const newProgress = prev + increment;
          if (currentStep >= steps) {
            clearInterval(timer);
            return targetProgress;
          }
          return newProgress;
        });
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [progressData?.progress, isProcessing, displayProgress]);

  // Auto-hide after 30s if stuck (safety) - but only if not completed
  useEffect(() => {
    if (
      isProcessing &&
      pollCount > 30 &&
      progressData?.status !== "completed"
    ) {
      // After 30 polls (~30s)
      console.log("⏰ Auto-hiding after 30 polls - task may be stuck"); // DEBUG
      setIsVisible(false);
      clearProgress();
    }
  }, [pollCount, isProcessing, clearProgress, progressData?.status]);

  const handleManualRefresh = () => {
    if (activeTaskId) {
      console.log("🔄 Manual refresh for task:", activeTaskId); // DEBUG
      if (checkProgress) {
        checkProgress(activeTaskId);
      }
    }
  };

  const handleClose = () => {
    console.log("✕ Closing progress tracker"); // DEBUG
    setIsVisible(false);
    localStorage.removeItem("progressTrackerOpen");
    setTimeout(() => clearProgress(), 300);
  };

  if (!isVisible) {
    if (isProcessing) {
      console.log("⚠️ Visible=false but isProcessing=true - forcing visible"); // DEBUG
      return (
        <div className="fixed top-4 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right-5 duration-300">
          <p>Loading progress... (Task started, waiting for update)</p>
          <button onClick={handleManualRefresh} className="text-xs">
            Refresh
          </button>
        </div>
      ); // Show loading if processing but no data
    }
    return null;
  }

  const {
    current_file = "",
    status,
    processed_count = 0,
    total_files = 1,
    failed_files = [],
    current_step = 0,
  } = progressData || {};

  console.log("📊 Rendering with data:", {
    current_file,
    status,
    processed_count,
    total_files,
    failed_files,
    current_step,
  }); // DEBUG

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
    <div className="fixed top-4 right-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-right-5 duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-800">
            Document Processing
          </h3>
          <span className="text-sm">{getStatusIcon()}</span>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Progress Bar with Animation */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{getStatusText()}</span>
          <span className="font-semibold">{Math.round(displayProgress)}%</span>
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

        {/* Task ID for debugging */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div
            className="text-xs text-gray-500 truncate"
            title={activeTaskId || ""}
          >
            Task: {activeTaskId?.substring(0, 8)}...
          </div>
        </div>
      </div>

      {/* DEBUG: Raw state dump (remove in production) */}
      <details className="mt-2 p-1 bg-gray-50 rounded text-xs">
        <summary>
          Debug State (Polls: {pollCount}, Last Poll:{" "}
          {new Date(lastPollTime).toLocaleTimeString()})
        </summary>
        <pre className="text-xs overflow-auto max-h-20">
          {JSON.stringify(
            { progressData, isProcessing, activeTaskId, displayProgress },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
};
