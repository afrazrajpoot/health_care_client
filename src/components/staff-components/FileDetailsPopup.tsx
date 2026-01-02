import React from "react";
import { X } from "lucide-react";
import { FileDetails } from "@/components/staff-components/types";

interface FileDetailsPopupProps {
  isOpen: boolean;
  files: FileDetails[];
  uploading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onRemoveFile?: (index: number) => void;
}

const FileDetailsPopup: React.FC<FileDetailsPopupProps> = ({
  isOpen,
  files,
  uploading,
  onCancel,
  onConfirm,
  onRemoveFile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">File Details</h2>
        {files.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No files selected
          </p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {files.map((file, index) => (
              <li
                key={index}
                className="text-sm bg-gray-50 rounded-lg p-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {(file.size / 1024).toFixed(2)} KB •{" "}
                      {file.type || "Unknown type"}
                    </p>
                  </div>
                  {onRemoveFile && (
                    <button
                      type="button"
                      onClick={() => onRemoveFile(index)}
                      className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={uploading || files.length === 0}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileDetailsPopup;
