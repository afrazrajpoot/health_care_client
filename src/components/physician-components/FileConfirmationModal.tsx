// components/physician-components/FileConfirmationModal.tsx
import { X } from "lucide-react";

interface FileDetails {
  name: string;
  size: number;
  type: string;
}

interface FileConfirmationModalProps {
  showModal: boolean;
  files: File[];
  onConfirm: () => void;
  onCancel: () => void;
  onRemoveFile: (index: number) => void;
  formatSize?: (bytes: number) => string;
}

export default function FileConfirmationModal({
  showModal,
  files,
  onConfirm,
  onCancel,
  onRemoveFile,
  formatSize,
}: FileConfirmationModalProps) {
  if (!showModal) return null;

  const fileDetails = files.map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
  }));

  const isOverLimit = files.length > 5;

  // Default formatSize function if not provided
  const defaultFormatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatFileSize = formatSize || defaultFormatSize;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">Confirm Upload</h2>
        {isOverLimit ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800 font-semibold">
              ⚠️ Maximum 5 documents allowed
            </p>
            <p className="text-xs text-red-600 mt-1">
              Please remove {files.length - 5} file(s) to continue
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            The following files will be uploaded and processed:
          </p>
        )}
        {fileDetails.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No files selected
          </p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {fileDetails.map((file, index) => (
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
                      {formatFileSize(file.size)} •{" "}
                      {file.type || "Unknown type"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
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
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={fileDetails.length === 0 || isOverLimit}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Upload Files
          </button>
        </div>
      </div>
    </div>
  );
}