import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/providers/SocketProvider";
import { toast } from "sonner";
import { useExtractDocumentsMutation } from "@/redux/pythonApi";

export const useFileUpload = (mode: "wc" | "gm") => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [ignoredFiles, setIgnoredFiles] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const snapInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const { setActiveTask, startTwoPhaseTracking, clearProgress } = useSocket();
  const [extractDocumentsMutation] = useExtractDocumentsMutation();

  const formatSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }, []);

  const clearPaymentError = useCallback(() => {
    setPaymentError(null);
    setIgnoredFiles([]);
  }, []);

  const clearUploadError = useCallback(() => {
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
        const user = session?.user;
        const physicianId =
          user?.role === "Physician"
            ? user?.id
            : user?.physicianId || "";
        const result = await extractDocumentsMutation({
          physicianId,
          userId: user?.id || "",
          formData: formDataUpload
        }).unwrap();
        if (result.ignored && result.ignored.length > 0) {
          if (!result.task_id) {
            clearProgress();
          }
          setIgnoredFiles(result.ignored);
          if (!result.task_id && result.payload_count === 0) {
            setPaymentError(
              `All ${result.ignored_count} file${result.ignored_count > 1 ? "s were" : " was"
              } skipped. See details below.`
            );
          } else {
            setPaymentError(
              `${result.ignored_count} file${result.ignored_count > 1 ? "s" : ""
              } could not be uploaded. See details below.`
            );
          }
          setSelectedFiles([]);
          if (snapInputRef.current) {
            snapInputRef.current.value = "";
          }
          if (!result.task_id) {
            return;
          }
        }
        if (result.upload_task_id && result.task_id) {
          startTwoPhaseTracking(
            result.upload_task_id,
            result.task_id,
            result.payload_count
          );
        } else if (result.task_id) {
          setActiveTask(result.task_id, result.payload_count);
        } else {
          if (!result.ignored || result.ignored.length === 0) {
            throw new Error("No files were processed. Please try again.");
          }
          return;
        }
        setSelectedFiles([]);
        if (snapInputRef.current) {
          snapInputRef.current.value = "";
        }
      } catch (error: any) {
        console.error("❌ Upload error:", error);
        setUploadError(`Upload failed: ${error.message || "Unknown error"}`);
        clearProgress();
      } finally {
        setUploading(false);
      }
    },
    [session?.user, setActiveTask, mode, startTwoPhaseTracking, clearProgress, extractDocumentsMutation]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        setSelectedFiles(files);
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

  return {
    selectedFiles,
    uploading,
    snapInputRef,
    formatSize,
    handleFileChange,
    handleSnap,
    handleCancel,
    setSelectedFiles,
    paymentError,
    clearPaymentError,
    ignoredFiles,
    uploadError,
    clearUploadError,
    removeFile,
    submitFiles, // Exposed for direct API call from popup
  };
};