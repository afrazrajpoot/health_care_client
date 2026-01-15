import { useState, useRef, useCallback } from "react";

// Response type for upload API
interface IgnoredFile {
  filename: string;
  reason: string;
  existing_file?: string;
  document_id?: string;
}

interface UploadResponse {
  upload_task_id?: string;
  task_id?: string | null;
  payload_count: number;
  ignored?: IgnoredFile[];
  ignored_count?: number;
  remaining_parses?: number;
}

export const useFileUpload = (
  session: any,
  mode: "wc" | "gm" = "wc"
) => {
  const [files, setFiles] = useState<File[]>([]);
  const [ignoredFiles, setIgnoredFiles] = useState<IgnoredFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setIgnoredFiles([]);
      setUploadError(null);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });
    formData.append("mode", mode);

    try {
      setUploadError(null);
      setIgnoredFiles([]);

      // ✅ Determine physician ID based on role (same as staff dashboard)
      const user = session?.user;
      const physicianId =
        user?.role === "Physician"
          ? user?.id // if Physician, send their own ID
          : user?.physicianId || ""; // otherwise, send assigned physician's ID

      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.doclatch.com"
      }/api/documents/extract-documents?physicianId=${physicianId}&userId=${
        user?.id || ""
      }`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.fastapi_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", errorText);
        setUploadError(`Upload failed: ${errorText}`);
        return;
      }

      const data: UploadResponse = await response.json();
      
      // Handle ignored files - set state for modal display
      if (data.ignored && data.ignored.length > 0) {
        setIgnoredFiles(data.ignored);
        
        // If all files were ignored (no processing task created)
        if (!data.task_id && data.payload_count === 0) {
          const errorMsg = `All ${data.ignored_count} file${data.ignored_count !== 1 ? "s were" : " was"} skipped. See details below.`;
          setUploadError(errorMsg);
        } else {
          // Some files processed, some ignored
          const errorMsg = `${data.ignored_count} file${data.ignored_count !== 1 ? "s" : ""} could not be uploaded. See details below.`;
          setUploadError(errorMsg);
        }
      }

      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      console.error("❌ Network error uploading files:", err);
      const errorMsg = err instanceof Error ? err.message : "Network error";
      setUploadError(errorMsg);
    }
  }, [files, session, mode]);

  const resetFiles = useCallback(() => {
    setFiles([]);
    setIgnoredFiles([]);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return { 
    files, 
    fileInputRef, 
    handleFileSelect, 
    handleUpload, 
    resetFiles,
    ignoredFiles,
    uploadError,
  };
};