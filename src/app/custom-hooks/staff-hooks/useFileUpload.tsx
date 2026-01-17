import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/providers/SocketProvider";
import { toast } from "sonner";
import { useExtractDocumentsMutation } from "@/redux/staffApi";

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
              `All ${result.ignored_count} file${
                result.ignored_count > 1 ? "s were" : " was"
              } skipped. See details below.`
            );
          } else {
            setPaymentError(
              `${result.ignored_count} file${
                result.ignored_count > 1 ? "s" : ""
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
