import { useState, useRef, useCallback } from "react";

export const useFileUpload = (
  session: any,
  mode: "wc" | "gm" = "wc"
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
    formData.append("mode", mode);

    try {


      // ✅ Determine physician ID based on role (same as staff dashboard)
      const user = session?.user;
      const physicianId =
        user?.role === "Physician"
          ? user?.id // if Physician, send their own ID
          : user?.physicianId || ""; // otherwise, send assigned physician's ID

      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
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
        return;
      }

      const data = await response.json();
   


      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      console.error("❌ Network error uploading files:", err);
    }
  }, [files, session, mode]);

  const resetFiles = useCallback(() => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return { files, fileInputRef, handleFileSelect, handleUpload, resetFiles };
};