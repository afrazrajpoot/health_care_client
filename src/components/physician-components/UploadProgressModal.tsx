// components/physician-components/UploadProgressModal.tsx
import { Upload } from "lucide-react";

interface UploadProgressModalProps {
  showModal: boolean;
  fileCount: number;
}

export default function UploadProgressModal({
  showModal,
  fileCount,
}: UploadProgressModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Uploading Documents
          </h2>
          <p className="text-gray-600 mb-4">
            Uploading {fileCount} file{fileCount !== 1 ? 's' : ''} to server...
          </p>

          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Please wait while your documents are being processed.
          </p>
        </div>
      </div>
    </div>
  );
}
