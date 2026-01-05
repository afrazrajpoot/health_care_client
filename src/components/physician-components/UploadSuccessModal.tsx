// components/physician-components/UploadSuccessModal.tsx
import { CheckCircle, X } from "lucide-react";

interface UploadSuccessModalProps {
  showModal: boolean;
  onClose: () => void;
  fileCount: number;
}

export default function UploadSuccessModal({
  showModal,
  onClose,
  fileCount,
}: UploadSuccessModalProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Upload Successful!</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">
            {fileCount} file{fileCount !== 1 ? 's' : ''} uploaded successfully
          </p>
          <p className="text-sm text-gray-500">
            Your documents are now being processed. You'll be notified when analysis is complete.
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
