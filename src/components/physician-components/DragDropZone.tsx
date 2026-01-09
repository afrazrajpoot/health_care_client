// components/physician-components/DragDropZone.tsx
"use client";

import React, { useState, useCallback } from "react";
import { Upload, FileText } from "lucide-react";

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onClose?: () => void;
  isVisible?: boolean;
  disabled?: boolean;
}

export default function DragDropZone({
  onFilesSelected,
  onClose,
  isVisible = false,
  disabled = false,
}: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        handleClose();
      }
    },
    [isVisible, handleClose]
  );

  React.useEffect(() => {
    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isVisible, handleKeyDown]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);

      if (files.length > 5) {
        // Show error - too many files
        alert(
          "Maximum 5 documents allowed at once. Please select up to 5 files."
        );
        return;
      }

      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [disabled, onFilesSelected]
  );

  const acceptedTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
  const maxSize = 40 * 1024 * 1024; // 40MB

  const validateFiles = (files: File[]): File[] => {
    return files.filter((file) => {
      const isValidType = acceptedTypes
        .split(",")
        .some(
          (type) =>
            file.type === type.replace(".", "") ||
            file.name.toLowerCase().endsWith(type)
        );
      const isValidSize = file.size <= maxSize;
      return isValidType && isValidSize;
    });
  };

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [onFilesSelected]
  );

  if (!isVisible && !isDragOver) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${
          isDragOver
            ? "bg-blue-500/10 backdrop-blur-sm"
            : "bg-black/50 backdrop-blur-sm"
        }
        transition-all duration-200
      `}
      onClick={handleClose}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`
          border-2 border-dashed rounded-xl p-8 max-w-md w-full mx-4 text-center
          transition-all duration-200
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 bg-white"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          {isDragOver ? (
            <Upload className="w-12 h-12 text-blue-500" />
          ) : (
            <FileText className="w-12 h-12 text-gray-400" />
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2">
          {isDragOver ? "Drop files here" : "Drag & drop files"}
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          or use the Upload Document button
        </p>

        <div className="text-xs text-gray-500">
          <p>Supported formats: PDF, DOC, DOCX, JPG, PNG</p>
          <p>Maximum file size: 40MB</p>
          <p>Maximum 5 documents at a time</p>
        </div>
      </div>
    </div>
  );
}
