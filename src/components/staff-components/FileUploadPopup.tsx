// components/staff-components/FileUploadPopup.tsx
import { X, AlertCircle } from "lucide-react";

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
  onClose: () => void;
  onUpload: () => void;
  onCancelFile: (index: number) => void;
  validateFileSize?: (file: File) => boolean; // Added prop for file size validation
}

export default function FileUploadPopup({
  showFilePopup,
  fileDetailsPopup,
  pendingFiles,
  uploading,
  isProcessing,
  onClose,
  onUpload,
  onCancelFile,
  validateFileSize,
}: FileUploadPopupProps) {
  if (!showFilePopup) return null;

  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  // Check for oversized files
  const oversizedFiles = pendingFiles.filter(file => {
    if (!validateFileSize) return false;
    return !validateFileSize(file);
  });

  const hasOversizedFiles = oversizedFiles.length > 0;
  const oversizedFileNames = oversizedFiles.map(file => file.name);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">File Details</h2>

        {/* Warning for oversized files */}
        {hasOversizedFiles && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium text-sm mb-1">
                  File size limit exceeded
                </p>
                <p className="text-amber-700 text-xs">
                  Maximum file size is 30MB. The following files exceed the limit:
                </p>
                <ul className="text-amber-700 text-xs mt-1 ml-4 list-disc">
                  {oversizedFileNames.map((name, index) => (
                    <li key={index} className="truncate">{name}</li>
                  ))}
                </ul>
                <p className="text-amber-700 text-xs mt-2">
                  Please remove these files or select smaller ones.
                </p>
              </div>
            </div>
          </div>
        )}

        {fileDetailsPopup.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No files selected
          </p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {fileDetailsPopup.map((file, index) => {
              const correspondingFile = pendingFiles[index];
              const isOversized = validateFileSize && correspondingFile
                ? !validateFileSize(correspondingFile)
                : false;

              return (
                <li
                  key={index}
                  className={`text-sm rounded-lg p-3 relative group ${isOversized ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium truncate ${isOversized ? 'text-red-800' : 'text-gray-900'}`}>
                          {file.name}
                        </p>
                        {isOversized && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Oversized
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isOversized ? 'text-red-700' : 'text-gray-500'}`}>
                        {formatFileSize(file.size)} • {file.type || "Unknown type"}
                        {isOversized && (
                          <span className="ml-2 font-medium">(Max: 30MB)</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCancelFile(index)}
                      className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${isOversized
                        ? 'text-red-400 hover:text-red-600 hover:bg-red-100'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Upload button status information */}
        {fileDetailsPopup.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {fileDetailsPopup.length} file{fileDetailsPopup.length !== 1 ? 's' : ''} selected
              </span>
              <span className="text-gray-900 font-medium">
                Total: {formatFileSize(fileDetailsPopup.reduce((total, file) => total + file.size, 0))}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onUpload}
            disabled={uploading || isProcessing || fileDetailsPopup.length === 0 || hasOversizedFiles}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            title={hasOversizedFiles ? "Remove oversized files to upload" : undefined}
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

        {hasOversizedFiles && (
          <p className="text-red-600 text-xs mt-3 text-center">
            Please remove all oversized files before uploading
          </p>
        )}
      </div>
    </div>
  );
}