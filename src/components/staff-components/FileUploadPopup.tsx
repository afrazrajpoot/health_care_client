// components/staff-components/FileUploadPopup.tsx
import { X } from "lucide-react";
import { useFileUpload } from "../../app/custom-hooks/staff-hooks/useFileUpload";
import { useRef } from "react";

interface FileDetails {
  name: string;
  size: number;
  type: string;
}

interface FileUploadPopupProps {
  showFilePopup: boolean;
  fileDetailsPopup: FileDetails[];
  pendingFiles: File[];
  uploading: boolean;
  isProcessing: boolean;
  snapInputRef: React.RefObject<HTMLInputElement>;
  onClose: () => void;
  onUpload: () => void;
  onCancelFile: (index: number) => void;
}

export default function FileUploadPopup({
  showFilePopup,
  fileDetailsPopup,
  pendingFiles,
  uploading,
  isProcessing,
  snapInputRef,
  onClose,
  onUpload,
  onCancelFile,
}: FileUploadPopupProps) {
  if (!showFilePopup) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">File Details</h2>
        {fileDetailsPopup.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No files selected
          </p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {fileDetailsPopup.map((file, index) => (
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
                  <button
                    type="button"
                    onClick={() => onCancelFile(index)}
                    className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onUpload}
            disabled={uploading || isProcessing || fileDetailsPopup.length === 0}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(uploading || isProcessing) ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {uploading ? "Uploading..." : isProcessing ? "Processing..." : "Uploading..."}
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}