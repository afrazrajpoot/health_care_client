import { useState, useRef, useCallback } from "react";

export const useFileUpload = (
  addToast: (msg: string, type: "success" | "error") => void,
  session: any,
  startTwoPhaseTracking: any
) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });
    try {
      const response = await fetch("/api/extract-documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.user?.fastapi_token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        addToast(`Failed to queue files: ${errorText}`, "error");
        return;
      }
      const data = await response.json();
      if (data.upload_task_id && data.task_id) {
        startTwoPhaseTracking(data.upload_task_id, data.task_id);
        addToast(
          `Started processing ${files.length} document(s) with two-phase tracking`,
          "success"
        );
      } else {
        const taskIds = data.task_ids || [];
        files.forEach((file, index) => {
          const taskId = taskIds[index] || "unknown";
          addToast(
            `File "${file.name}" successfully queued for processing. Task ID: ${taskId}`,
            "success"
          );
        });
      }
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      addToast("Network error uploading files", "error");
    }
  }, [files, session, startTwoPhaseTracking, addToast]);

  const resetFiles = useCallback(() => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return { files, fileInputRef, handleFileSelect, handleUpload, resetFiles };
};