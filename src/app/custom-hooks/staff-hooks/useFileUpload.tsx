import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/providers/SocketProvider";
import { toast } from "sonner";

export const useFileUpload = (mode: "wc" | "gm") => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [ignoredFiles, setIgnoredFiles] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const snapInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const { setActiveTask, startTwoPhaseTracking } = useSocket();

  const formatSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }, []);

  const clearPaymentError = useCallback(() => {
    console.log("🧹 Clearing payment error");
    setPaymentError(null);
    setIgnoredFiles([]);
  }, []);

  const clearUploadError = useCallback(() => {
    console.log("🧹 Clearing upload error");
    setUploadError(null);
  }, []);

  const submitFiles = useCallback(
    async (filesToSubmit: File[]) => {
      if (filesToSubmit.length === 0) return;

      setUploading(true);
      setPaymentError(null);
      setUploadError(null);

      const formDataUpload = new FormData();
      filesToSubmit.forEach((file) => {
        formDataUpload.append("documents", file);
      });
      formDataUpload.append("mode", mode);

      try {
        console.log(
          `🚀 Starting upload for ${filesToSubmit.length} files in mode: ${mode}`
        );

        // ✅ Determine physician ID based on role
        const user = session?.user;
        const physicianId =
          user?.role === "Physician"
            ? user?.id // if Physician, send their own ID
            : user?.physicianId || ""; // otherwise, send assigned physician’s ID

        const apiUrl = `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.doclatch.com"
        }/api/documents/extract-documents?physicianId=${physicianId}&userId=${
          user?.id || ""
        }`;

        console.log("🌐 API URL:", apiUrl);

        // Create AbortController but DON'T set a timeout
        // The upload endpoint returns immediately with task IDs
        // Progress tracking happens separately via polling
        const controller = new AbortController();

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            // ✅ Add Authorization header using fastapi_token from session
            Authorization: `Bearer ${user?.fastapi_token}`,
          },
          body: formDataUpload,
          signal: controller.signal,
        });

        // No timeout to clear since we removed it
        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          const errorMessage = `HTTP error! status: ${response.status}, details: ${errorText}`;
          console.error(errorMessage);

          // Don't show modal for document limit errors - skip these errors
          if (
            (response.status === 400 || response.status === 402) &&
            (errorText.toLowerCase().includes("limit exceeded") ||
              errorText.toLowerCase().includes("subscription inactive") ||
              errorText.toLowerCase().includes("upgrade your plan") ||
              errorText.toLowerCase().includes("no active subscription"))
          ) {
            console.log(
              "🚨 Document limit error detected, but not showing modal"
            );
            return;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        // Check if there are ignored files
        if (data.ignored && data.ignored.length > 0) {
          console.log(`⚠️ ${data.ignored_count} file(s) were ignored`);
          setIgnoredFiles(data.ignored);
          setPaymentError(
            `${data.ignored_count} file${
              data.ignored_count > 1 ? "s" : ""
            } could not be uploaded. See details below.`
          );
          setSelectedFiles([]);
          if (snapInputRef.current) {
            snapInputRef.current.value = "";
          }
          return;
        }

        // Check if we have both upload_task_id and task_id for two-phase tracking
        if (data.upload_task_id && data.task_id) {
          // Use two-phase tracking
          startTwoPhaseTracking(data.upload_task_id, data.task_id);
          console.log(
            `🎯 Starting two-phase tracking - Upload: ${data.upload_task_id}, Processing: ${data.task_id}`
          );
        } else if (data.task_id) {
          // Fallback to single-phase tracking
          setActiveTask(data.task_id, data.payload_count);
          console.log(`🎯 Tracking progress for task: ${data.task_id}`);
        } else {
          throw new Error("No task_id returned from server");
        }

        console.log(
          `✅ Started processing ${
            data.payload_count || 0
          } document(s) in ${mode.toUpperCase()} mode`
        );

        setSelectedFiles([]);
        if (snapInputRef.current) {
          snapInputRef.current.value = "";
        }
      } catch (error: any) {
        console.error("❌ Upload error:", error);

        if (error.name === "AbortError") {
          setUploadError("Request timeout. Please try again.");
        } else if (error.message.includes("Failed to fetch")) {
          setUploadError(
            "Unable to connect to server. Please check:\n• Your internet connection\n• If the server is running\n• API URL: " +
              (process.env.NEXT_PUBLIC_API_BASE_URL ||
                "https://api.doclatch.com")
          );
        } else {
          setUploadError(`Upload failed: ${error.message}`);
        }
      } finally {
        setUploading(false);
      }
    },
    [session?.user, setActiveTask, mode, startTwoPhaseTracking]
  );

  const handleSubmit = useCallback(async () => {
    await submitFiles(selectedFiles);
  }, [selectedFiles, submitFiles]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      // Check if more than 10 files selected
      if (files.length > 10) {
        toast.error("Maximum 10 files allowed", {
          description: `You selected ${files.length} files. Please select up to 10 files only.`,
          duration: 4000,
        });
        if (snapInputRef.current) {
          snapInputRef.current.value = "";
        }
        return;
      }

      if (files.length > 0) {
        const validFiles = files.filter((file) => {
          if (file.size > 40 * 1024 * 1024) {
            console.error(`File ${file.name} is too large (max 40MB)`);
            toast.error(`File too large: ${file.name}`, {
              description: "Maximum file size is 40MB",
            });
            return false;
          }
          const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
          const allowedTypes = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
          if (!allowedTypes.includes(fileExtension)) {
            console.error(`File ${file.name} has unsupported format`);
            toast.error(`Unsupported format: ${file.name}`, {
              description: "Allowed formats: PDF, DOCX, JPG, JPEG, PNG",
            });
            return false;
          }
          return true;
        });

        if (validFiles.length > 0) {
          setSelectedFiles(validFiles);
          // Auto-submit immediately without showing modal
          setTimeout(() => {
            submitFiles(validFiles);
          }, 0);
        } else {
          console.error(
            "No valid files selected. Please check file types and size (max 40MB)."
          );
          toast.error("No valid files selected", {
            description: "Please check file types and size (max 40MB)",
          });
        }
      }
    },
    [submitFiles]
  );

  const handleCancel = useCallback(() => {
    setSelectedFiles([]);
    if (snapInputRef.current) {
      snapInputRef.current.value = "";
    }
    setPaymentError(null);
    setIgnoredFiles([]);
    setUploadError(null);
  }, []);

  const removeFile = useCallback((indexToRemove: number) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  }, []);

  const handleSnap = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(e);
    },
    [handleFileChange]
  );

  // Add submitFiles to dependencies in handleFileChange
  // Update the handleFileChange callback to include submitFiles in deps

  return {
    selectedFiles,
    uploading,
    snapInputRef,
    formatSize,
    handleFileChange,
    handleSubmit,
    handleCancel,
    handleSnap,
    setSelectedFiles,
    paymentError,
    clearPaymentError,
    ignoredFiles,
    uploadError,
    clearUploadError,
    removeFile,
  };
};
