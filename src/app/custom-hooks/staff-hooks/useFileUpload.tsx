import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/providers/SocketProvider";

export const useFileUpload = (mode: "wc" | "gm") => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const snapInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const { setActiveTask } = useSocket();

  const formatSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        const validFiles = files.filter((file) => {
          if (file.size > 40 * 1024 * 1024) {
            console.error(`File ${file.name} is too large (max 40MB)`);
            return false;
          }
          const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
          const allowedTypes = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
          if (!allowedTypes.includes(fileExtension)) {
            console.error(`File ${file.name} has unsupported format`);
            return false;
          }
          return true;
        });

        if (validFiles.length > 0) {
          setSelectedFiles(validFiles);
          setIsFileModalOpen(true);
        } else {
          console.error(
            "No valid files selected. Please check file types and size (max 40MB)."
          );
        }
      }
    },
    []
  );

  const clearPaymentError = useCallback(() => {
    console.log("🧹 Clearing payment error");
    setPaymentError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setPaymentError(null);

    const formDataUpload = new FormData();
    selectedFiles.forEach((file) => {
      formDataUpload.append("documents", file);
    });
    formDataUpload.append("mode", mode);

    try {
      console.log(
        `🚀 Starting upload for ${selectedFiles.length} files in mode: ${mode}`
      );

      // ✅ Determine physician ID based on role
      const user = session?.user;
      const physicianId =
        user?.role === "Physician"
          ? user?.id // if Physician, send their own ID
          : user?.physicianId || ""; // otherwise, send assigned physician’s ID

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.kebilo.com"
        }/api/extract-documents?physicianId=${physicianId}&userId=${user?.id || ""
        }`;

      console.log("🌐 API URL:", apiUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formDataUpload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `HTTP error! status: ${response.status}, details: ${errorText}`;
        console.error(errorMessage);

        setIsFileModalOpen(false);

        if (
          (response.status === 400 || response.status === 402) &&
          (errorText.toLowerCase().includes("limit exceeded") ||
            errorText.toLowerCase().includes("subscription inactive") ||
            errorText.toLowerCase().includes("upgrade your plan") ||
            errorText.toLowerCase().includes("no active subscription"))
        ) {
          console.log("🚨 Payment error detected, setting modal state");
          setPaymentError(errorText);
          return;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("📦 Upload response:", data);

      if (data.task_id) {
        setActiveTask(data.task_id, data.payload_count);
        console.log(`🎯 Tracking progress for task: ${data.task_id}`);
      } else {
        throw new Error("No task_id returned from server");
      }

      console.log(
        `✅ Started processing ${data.payload_count || 0
        } document(s) in ${mode.toUpperCase()} mode`
      );

      setIsFileModalOpen(false);
      setSelectedFiles([]);
      if (snapInputRef.current) {
        snapInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      setIsFileModalOpen(false);

      if (error.name === "AbortError") {
        setPaymentError("Request timeout. Please try again.");
      } else if (error.message.includes("Failed to fetch")) {
        setPaymentError(
          "Unable to connect to server. Please check:\n• Your internet connection\n• If the server is running\n• API URL: " +
          (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.kebilo.com")
        );
      } else {
        setPaymentError(`Upload failed: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, session?.user, setActiveTask, mode]);

  const handleCancel = useCallback(() => {
    setSelectedFiles([]);
    if (snapInputRef.current) {
      snapInputRef.current.value = "";
    }
    setIsFileModalOpen(false);
    setPaymentError(null);
  }, []);

  const handleSnap = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(e);
    },
    [handleFileChange]
  );

  return {
    selectedFiles,
    uploading,
    isFileModalOpen,
    snapInputRef,
    formatSize,
    handleFileChange,
    handleSubmit,
    handleCancel,
    handleSnap,
    setIsFileModalOpen,
    setSelectedFiles,
    paymentError,
    clearPaymentError,
  };
};
