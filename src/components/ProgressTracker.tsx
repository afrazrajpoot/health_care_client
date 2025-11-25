// components/ProgressTracker.tsx
import { useSocket } from "@/providers/SocketProvider";
import React, { useEffect, useState } from "react";
import { FileText, FolderOpen, Check, Sparkles, X } from "lucide-react";

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

  // File types for animation
  const fileTypes = ["PDF", "PNG", "JPG", "DICOM", "PDF"];

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

      // Auto-close after a short delay (3 seconds for animation)
      console.log("⏰ Setting auto-close timer");
      const timer = setTimeout(() => {
        console.log("🕒 Auto-closing progress tracker");
        handleClose();
      }, 3000);

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

  // Don't render if not visible and no active processing
  if (!isVisible && !isProcessing && !progressData && !queueProgressData) {
    return null;
  }

  // Get current progress for animation
  const currentProgress =
    viewMode === "queue" ? displayQueueProgress : displayProgress;
  const uploadCount = Math.floor((currentProgress / 100) * 5);

  // Show loading state if processing but no progress data yet
  if (!progressData && !queueProgressData && isProcessing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
          {/* Background Gradient Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-400/20 to-teal-500/20 rounded-full blur-3xl -z-0" />

          {/* Header */}
          <div className="relative z-10 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              Uploading Medical Records
            </h3>
            <p className="text-sm text-gray-500">
              AI is parsing your documents...
            </p>
          </div>

          {/* Loading Animation */}
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
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

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative z-10 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {viewMode === "queue"
              ? "Processing Queue"
              : "Uploading Medical Records"}
          </h3>
          <p className="text-sm text-gray-500">
            {isProcessing
              ? "AI is parsing your documents..."
              : "Processing completed!"}
          </p>
        </div>

        {/* Animation Area */}
        <div className="relative h-64 mb-6">
          {/* Floating Files */}
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: `${10 + index * 18}%`,
                animation: `floatToFolder 4s ease-in-out ${
                  index * 0.8
                }s infinite`,
                opacity: index < uploadCount ? 1 : 0.3,
              }}
            >
              <div
                className={`bg-white rounded-lg shadow-lg p-3 border-2 ${
                  index < uploadCount ? "border-cyan-500" : "border-cyan-100"
                }`}
              >
                <FileText
                  className={`w-8 h-8 ${
                    index < uploadCount ? "text-cyan-500" : "text-gray-300"
                  }`}
                />
                <span className="text-xs font-medium text-gray-600 mt-1 block">
                  {fileTypes[index]}
                </span>
              </div>
            </div>
          ))}

          {/* Central Folder */}
          <div className="absolute left-1/2 bottom-8 transform -translate-x-1/2">
            <div className="relative">
              {/* Glow Effect */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl blur-xl opacity-40 animate-pulse"
                style={{ width: "120px", height: "120px", margin: "-10px" }}
              />

              {/* Folder Container */}
              <div className="relative bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl p-6 shadow-xl">
                <FolderOpen
                  className="w-16 h-16 text-white"
                  strokeWidth={1.5}
                />

                {/* AI Sparkle */}
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg">
                  <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                </div>

                {/* Processing Waves */}
                {isProcessing && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="absolute inset-0 border-2 border-white rounded-2xl"
                        style={{
                          animation: `wave 2s ease-out ${i * 0.5}s infinite`,
                          opacity: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* File Counter Badge */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-4 py-1 shadow-lg border-2 border-cyan-100">
                <span className="text-sm font-bold text-cyan-600">
                  {uploadCount}/5
                </span>
              </div>
            </div>
          </div>

          {/* Success Particles */}
          {!isProcessing &&
            [...Array(6)].map((_, i) => (
              <div
                key={`particle-${i}`}
                className="absolute w-1.5 h-1.5 bg-teal-400 rounded-full"
                style={{
                  left: "50%",
                  top: "70%",
                  animation: `particle-burst 2s ease-out ${i * 0.2}s infinite`,
                  opacity: 0,
                }}
              />
            ))}
        </div>

        {/* Progress Info */}
        <div className="relative z-10 space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {isProcessing
                ? "Extracting critical findings..."
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
                {progressData?.processed_count || 0} of{" "}
                {progressData?.total_files || 0} files processed
                {progressData?.failed_files?.length
                  ? ` (${progressData.failed_files.length} failed)`
                  : ""}
              </>
            )}
          </div>
        </div>

        {/* Processed Items */}
        <div className="relative z-10 bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-semibold text-gray-700">
              Processed Data
            </span>
          </div>

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
        @keyframes floatToFolder {
          0% {
            transform: translateY(-100px) translateX(-20px) rotate(-5deg)
              scale(0.8);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: translateY(100px) translateX(80px) rotate(5deg)
              scale(0.9);
            opacity: 1;
          }
          70% {
            transform: translateY(140px) translateX(120px) rotate(0deg)
              scale(0.5);
            opacity: 0.5;
          }
          100% {
            transform: translateY(150px) translateX(130px) rotate(0deg)
              scale(0.2);
            opacity: 0;
          }
        }
        @keyframes wave {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes particle-burst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(
                calc(var(--x, 0) * 40px),
                calc(var(--y, 0) * -40px)
              )
              scale(0);
            opacity: 0;
          }
        }
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
        div[style*="particle-burst"]:nth-child(1) {
          --x: -1;
          --y: 1;
        }
        div[style*="particle-burst"]:nth-child(2) {
          --x: 1;
          --y: 1;
        }
        div[style*="particle-burst"]:nth-child(3) {
          --x: -0.5;
          --y: 1.5;
        }
        div[style*="particle-burst"]:nth-child(4) {
          --x: 0.5;
          --y: 1.5;
        }
        div[style*="particle-burst"]:nth-child(5) {
          --x: 0;
          --y: 1.8;
        }
        div[style*="particle-burst"]:nth-child(6) {
          --x: 0;
          --y: 1.2;
        }
      `}</style>
    </div>
  );
};
