import { useState, useRef, useCallback } from "react";

export const useCopyToClipboard = ({
  documentData,
}: {
  documentData: any | null;
}) => {
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const timersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleCopy = useCallback(async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, []);

  const handleSectionCopy = useCallback(
    async (sectionId: string, snapshotIndex?: number) => {
      let text = "";
      // Original switch logic for building text...
      if (!text) return;

      await handleCopy(text, sectionId);

      if (timersRef.current[sectionId]) {
        clearTimeout(timersRef.current[sectionId]);
        delete timersRef.current[sectionId];
      }

      setCopied((prev) => ({ ...prev, [sectionId]: true }));

      timersRef.current[sectionId] = setTimeout(() => {
        setCopied((prev) => {
          const newCopied = { ...prev };
          delete newCopied[sectionId];
          return newCopied;
        });
        delete timersRef.current[sectionId];
      }, 2000);
    },
    [documentData, handleCopy]
  );

  return { copied, handleSectionCopy };
};
